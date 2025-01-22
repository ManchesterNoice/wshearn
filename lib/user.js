var P = require('bluebird');
var async = require('async');
var config = require('../config');
var newGithub = require('./new_github');
var users = require('./db').get('users');
P.promisifyAll(users);

/**
 * Makes a user object from their login
 */
function makeUser(login) {
  return users.findOneAsync({
    login: login
  }).then(function(model) {
    return makeUserFromModel(model);
  });
}

/**
 * Makes a user object from their DB model
 */
function makeUserFromModel(model) {
  return new User(model.login, newGithub(model.token), model);
}

/**
 * Constructor for our user class
 */
function User(login, github, model) {
  this.login = login;
  this.github = github;
  this.model = model;
}

/**
 * Checks if the user is following the given username.
 */
User.prototype.isFollowing = function(other) {
  var getFollowUser = P.promisify(this.github.user.getFollowUser, this.github);
  return new P(function(resolve) {
    getFollowUser({
      user: other
    }).then(function(res) {
      return resolve(null, true);
    }, function(res) {
      return resolve(null, false);
    });
  });
};

/**
 * Follow a user.
 *
 * @param other String login username
 */
User.prototype.follow = function(other) {
  return this.isFollowing(other).bind(this).then(function(following) {
    if (following) return false;

    var followUser = P.promisify(this.github.user.followUser, this.github.user);
    return followUser({
      user: other
    });
  }).then(function(res) {
    if (!res) return false;
    return users.updateAsync({
      login: other
    }, {
      $addToSet: {
        followedBy: this.login
      }
    });
  });
};

/**
 * Make a user unfollow someone. Both params must be GH API instances.
 *
 * @param user GH API instance
 * @param other String login username
 */
User.prototype.unfollow = function(other) {
  return isFollowing(other).bind(this).then(function(following) {
    if (!following) return false;

    var unfollowUser = P.promisify(this.github.user.unFollowUser, this.github.user);
    return unfollowUser({
      user: other
    });
  }).then(function(res) {
    if (!res) return false;
    return users.updateAsync({
      login: other
    }, {
      $pull: {
        followedBy: this.login
      }
    });
  });
};

/**
 * Adds an amount of followers to a user.
 *
 * @param amount - Use '-1' to add as many as possible. It will add as many followers as possible.
 */
User.prototype.addFollowers = function(amount) {
  var thiz = this;
  return users.findAsync({
    login: {
      $ne: this.login
    }
  }).bind(this).then(function(docs) {

    return new P(function(resolve) {
      var sum = 0;
      async.eachSeries(docs, function(otherModel, done) {
        // Ignore if same as user
        if (amount !== -1 && sum >= amount) return done();

        // Otherwise follow
        var otherUser = makeUserFromModel(otherModel);
        return otherUser.follow(thiz.login).then(function(res) {
          if (res) sum++;
          done();
        });

      }.bind(this), function() {
        resolve(sum);
      });

    }).bind(this);

  }).then(function(sum) {
    return {
      follows: sum,
      amount: amount
    };
  });

};

/**
 * Checks the amount of followers this user is supposed to have.
 * @param login The login of the user (username)
 * @param cb(err, privilege)
 */
User.prototype.checkPrivilege = function() {
  var count = config.baseFollowers;
  return users.countAsync({
    ref: this.login
  }).then(function(ct) {
    count += ct * config.referralBonus;
    return {
      count: count,
      referrals: ct
    };
  });
};

/**
 * Gets all of the users that the user hasn't been followed by.
 * This is a pretty expensive operation as it makes a lot of GH api requests.
 */
User.prototype.findNotFollowedBy = function() {
  var thiz = this;

  // Get followers of user
  var followedBy = this.model.followedBy || [];

  // Find users where their login isn't one of those followedBy
  return users.findAsync({
    login: {
      $nin: followedBy,
      $ne: this.login
    }
  }).then(function(dbNotFollowing) {
    return new P(function(resolve, reject) {
      if (!dbNotFollowing) return;

      // These are the users that are not following in the DB.
      var notFollowing = [];
      async.each(dbNotFollowing, function(userObj, done) {
        if (this.login === userObj.login) return done(); // Skip if same user

        var other = makeUserFromModel(userObj);
        other.isFollowing(thiz.login).then(function(res) {
          if (!res) {
            notFollowing.push(other.login);
          }
          done();
        });

      }, function(err) {
        if (err) return reject(err);
        resolve(notFollowing);
      });
    });
  });
};

User.prototype.getFollowing = function() {
  return users.findAsync({
    followedBy: this.login
  });
};

User.prototype.summary = function() {
  return P.props({
    privilege: this.checkPrivilege(),
    following: this.getFollowing(),
    notFollowedBy: this.findNotFollowedBy()
  }).bind(this).then(function(res) {

    var followerCt = this.model.followedBy ? this.model.followedBy.length : 0;
    var remaining = res.privilege.count - followerCt;
    var amount = Math.min(res.notFollowedBy.length, remaining);
    if (amount < 0) amount = 0;

    return {
      privilege: res.privilege,
      following: res.following,
      amount: amount,
      remaining: remaining,
      followerCt: followerCt,
      user: this.model
    };

  });
};

module.exports = {
  fromLogin: makeUser,
  fromModel: makeUserFromModel
};
