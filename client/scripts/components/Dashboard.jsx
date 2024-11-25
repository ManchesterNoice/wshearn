var $ = require('jquery');
var config = require('../../../config.js');
var React = require('react');

var Follower = require('./Follower.jsx');

// Quick fix
if (!window.location.origin) {
  window.location.origin = window.location.protocol+"//"+window.location.host;
}

var Dashboard = React.createClass({
  getInitialState: function() {
    return {
      privilege: {
        referrals: 0,
        count: config.baseFollowers,
      },
      cap: 0,
      following: []
    };
  },

  componentDidMount: function() {
    this.updateMe();
  },

  follow: function() {
    $.post('/follow/' + this.props.user.login, function(res) {
      this.updateMe();
    }.bind(this));
  },

  updateMe: function() {
    $.get('/me', function(res) {
      this.setState(res);
    }.bind(this));
  },

  selectReferLink: function() {
    $('#referLink').focus(function() {
      this.select();
    });
  },

  render: function() {
    var peopleCt = this.state.privilege.referrals;
    var people = peopleCt === 1 ? (peopleCt + ' person') : (peopleCt + ' people');

    var followerList;
    if (this.state.following.length === 0) {
      followerList = <p>Nobody is following you from this website. Click the "Get Followers" button to get some followers!</p>;
    } else {
      followerList = this.state.following.map(function(follower) {
        return <Follower follower={follower} />;
      });
    }

    var getFollowers;
    if (!this.state.amount) {
      if (this.state.cap && this.state.following.length === this.state.cap) {
        getFollowers = <p>You have reached the maximum amount of followers. Refer some friends to increase your limit!</p>;
      } else {
        getFollowers = <p>There aren't enough users on the website to get you more followers. Refer your friends to increase your follower count!</p>
      }
    } else {
      getFollowers = (
        <div>
          <p>You can get <strong>{this.state.amount}</strong> more follower{this.state.amount === 1 ? '' : 's'} by clicking the button below!</p>
          <button id="getFollowers" className="btn btn-primary btn-lg" onClick={this.follow}>Get Followers</button>
        </div>
      );
    }

    return (
      <div>
        <div className="row">
          <div className="col-md-12 text-center">
            <p>Hi {this.props.user.login}!</p>
            {getFollowers}
            <a className="btn btn-danger" href="/logout">Logout</a>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <h2>Referrals</h2>
            <p>You've referred {people}. For each person you get to sign up using your referral link, you'll get <strong>{config.referralBonus}</strong> more followers!</p>
            <h3>Your referral link</h3>
            <input id="referLink" type="text" className="form-control" value={window.location.origin + '/?ref=' + this.props.user.login} readOnly={true} onFocus={this.selectReferLink} />
            <h2>Cap</h2>
            <p>You can get up to <strong>{this.state.cap}</strong> total followers. You currently have <strong>{this.state.following.length}</strong>. Refer some friends to raise this limit!</p>
          </div>
          <div className="col-md-8">
            <h2>People following you</h2>
            <p>Below are the people following you as a result of joining this website.</p>
            {followerList}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Dashboard;
