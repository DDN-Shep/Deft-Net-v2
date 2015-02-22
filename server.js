var express  = require('express'),
    session  = require('express-session'),
    passport = require('passport'),
    local    = require('passport-local'),
    stylus   = require('stylus'),
    logger   = require('morgan'),
    favicon  = require('serve-favicon'),
    parser   = {
	    cookie: require('cookie-parser'),
	    body: require('body-parser')
    },
    env      = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var routes = {
	api: {
		account: require('./server/routes/api/account'),
		user: require('./server/routes/api/user')
	},
	index: require('./server/routes/index'),
	account: require('./server/routes/account'),
	portfolio: {
		codepen: require('./server/routes/codepen')
	}
};

var config = require('./config')[env],
    db     = require('./server/data/db')(config),
    auth   = require('./server/auth/authenticate'),
    app    = express();

app.set('views', config.path.views);
app.set('view engine', config.engine);

app.use(stylus.middleware(config.path.public));
app.use(express.static(config.path.public));
app.use(favicon(config.path.icon));
app.use(logger(config.log));
app.use(parser.body.json());
app.use(parser.body.urlencoded({extended: false}));
app.use(parser.cookie());
app.use(session({
    secret: '{Deft-Net | Andrew Sheppard}',
    saveUninitialized: true,
    resave: true
}));

passport.use(new local.Strategy(auth.authenticateUser));

passport.serializeUser(function(user, next) {
	next(null, user.username);
});

passport.deserializeUser(function(key, next) {
    var module = {
        user: require('./server/data/modules/user')
    };

    module.user.findUser(key, function(error, user) {
		if (error) next(error, false);
		else next(null, user);
	});
});

app.use(passport.initialize());
app.use(passport.session());

//app.all('*', function(req, res, next) {
//    res.header("Access-Control-Allow-Origin", "*");
//    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//    next();
//});

app.use('/', routes.index);
app.use('/account', routes.account);
app.use('/portfolio/codepen', routes.portfolio.codepen);

app.use('/api/account', routes.api.account);
app.use('/api/user', routes.api.user);

//app.use('*', function(req, res, next)
//{
//    // 404
//});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// development error handler, will print stack-trace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('shared/error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler, no stack-traces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('shared/error', {
		message: err.message,
		error: {}
	});
});

var server = app.listen(config.port, function() {
	var host = server.address().address,
	    port = server.address().port;

	console.log('Listening on http://%s:%s', host, port);
});

module.exports = app;
