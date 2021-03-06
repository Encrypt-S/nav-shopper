var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken');
var fs = require('fs');
const http = require('http');
const https = require('https');
const pem = require('pem');
const config = require('config');

var apiRouter = require('./routes/api');

var app = express();

if (process.env.NODE_ENV == 'development') process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const ssl = {
  key: fs.readFileSync('keys/' + config.ssl.key),
  cert: fs.readFileSync('keys/' + config.ssl.cert),
  requestCert: false,
  rejectUnauthorized: false
}

const httpsServer = https.createServer(ssl, app);

httpsServer.listen(config.ssl.port, (err) => {
	console.log('HTTPS Server running on port ' + config.ssl.port, err);
});


app.use (function (req, res, next) {
    if (req.protocol === 'https') {
        console.log(req.protocol, req.secure);
        next();
    } else {
        console.log('redirected');
        var port = (config.ssl.port == 443) ? '' : ':' + config.ssl.port;
        var hostname = req.headers.host.split(':')[0]
        var host = hostname + port
        res.redirect('https://' + host + req.url);
    }
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
