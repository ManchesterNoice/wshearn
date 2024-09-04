var React = require('react');

var Login = React.createClass({
  render: function() {
    var loginLink = '/login' + (this.props.ref ? '?ref=' + this.props.ref : '');
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <p>Sign in to GitHub to start!</p>
            <a className="btn btn-primary btn-lg" href={loginLink}>
              Login with GitHub
            </a>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <h2>How it works</h2>
            <p>Ever wondered <strong>how to get more GitHub followers</strong>? <strong>GitHub Followers</strong> uses your OAuth2 token from GitHub's API to follow other users registered with our website. In return, we use those tokens to have them follow you back.</p>
          </div>
          <div className="col-md-4">
            <h2>Is this allowed? Is it safe?</h2>
            <p><strong>Absolutely yes.</strong> The GitHub terms of service only state that you are responsible for all activity that occurs under your account. Because all we ask for is the <code>user:follow</code> permission, we can't do anything malicious with your account. In fact, the source code to this website is available <a href="https://github.com/simplyianm/githubfollowers">here</a>!</p>
          </div>
          <div className="col-md-4">
            <h2>Can I unfollow users I've automatically followed?</h2>
            <p><strong>Yes, but you'll get unfollowed.</strong> This app depends on having legitimate, non-botted people following each other, so breaking the trust destroys our service. We'll remove all our followers from your account if we find you doing this.</p>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Login;
