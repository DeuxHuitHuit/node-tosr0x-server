'use strict';

var pkg = require('./package.json');
var _ = require('lodash');
var path = require('path');
var yargs = require('yargs');
var argv = yargs
	.usage('Usage: $0 [opts]')
	.help('h')
	.alias('h', ['?', 'help'])
	.version(pkg.version + '\n', 'version')
	.describe('p', 'The usb port uri to use. Leave empty to use port scan')
	.alias('p', 'usbport')
	.describe('n', 'The number of relays on the board')
	.alias('n', 'relayCount')
	.defaults('n', 2)
	.boolean('v')
	.describe('v', 'Enables verbose mode (for debug only)')
	.alias('v', 'verbose')
	.describe('ip', 'The IP address to bind the server to')
	.defaults('ip', 'localhost')
	.describe('port', 'The IP port to bind the server to')
	.defaults('port', 3000)
	.argv;
var config = {
	port: argv.p,
	relayCount: argv.n
};

var favicon = require('connect-favicons');
var express = require('express');
var errorHandler = require('express-error-handler');
var nunjucks = require('nunjucks');
var router = express.Router();
var routes = require('./routes');
var api = require('./routes/api');
var app = express(); // create the Express object
var viewsPath = path.resolve(__dirname, 'views');

process.title = pkg.title;

// dev only
if (argv.v) {
	app.use(express.logger('dev'));
	console.log('Environnment: %s', app.get('env'));
}

// app wide vars
app.set('ip', process.env.IP || argv.ip);
app.set('port', process.env.PORT || argv.port);

// template engine
nunjucks.configure(viewsPath, {
	autoescape: true,
	express: app
});

// add less mime type
// from: http://stackoverflow.com/questions/7109732/express-setting-content-type-based-on-path-file
express.static.mime.define({'text/plain': ['less']});

// middleware
app.use(favicon());
app.use(function setData(req, res, next) {
	req.package = pkg;
	req.config = config;
	req.api = api;
	next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(errorHandler());

// app routes
router.get('/', routes.index);
router.get('/about', routes.about);
router.get('/api/kill', api.kill);
router.post('/api/:cmd', api.http);
router.post('/api/:cmd/:param', api.http);
app.use('/', router);

// init api
api.init(argv.p, {
	debug: argv.v,
	relayCount: argv.n
});

// start the server
app.listen(app.get('port'), function _serverStarted() {
	console.log("Tosr0x Express server listening on " + app.get('ip') + " on port " + app.get('port'));
	console.log("Views are served from " + viewsPath);
});
