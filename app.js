var express = require('express');

var app = express();

// Enable sessions
require('./lib/session')(app);

// Body parser
app.use(require('body-parser').urlencoded({
  extended: true
}));

// Prerender for SEO
app.use(require('prerender-node'));

// Middleware to add GH user to request object
app.use(require('./lib/github_user_middleware'));

// Referral links
app.use(function(req, res, next) {
  if (req.query.ref) {
    req.session.ref = req.query.ref;
  }
  next();
});


// SPA
app.use(express.static('dist/'));

if (process.env.NODE_ENV === 'development') {
  app.use(require('morgan')('dev'));
}

// Ghetto error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.send('Error');
});

// Routes
require('./lib/routes')(app);

// Bind to port
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Listening on port ' + port);
});
