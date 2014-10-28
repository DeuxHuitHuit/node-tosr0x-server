'use strict';

var _ = require('lodash');
var RSVP = require('rsvp');

var render = function (file, values) {
	values = values || {};
	return function (req, res) {
		res.render(file, _.assign({
			package: req.package,
			config: req.config
		}, values));
	};
};

exports.about = render('about.html');

exports.index = function (req, res) {
	RSVP.hash({
		temp: req.api.cmd('temperature'),
		voltage: req.api.cmd('voltage'),
		version: req.api.cmd('version'),
		states: req.api.cmd('refreshStates')
	}).then(function (ret) {
		var renderer = render('index.html', ret);
		renderer(req, res);
	})
	.catch(function (err) {
		var renderer = render('index.html', {
			temp: 'N/A',
			voltage: 'N/A',
			version: 'N/A',
			states: {},
			error: err
		});
		renderer(req, res);
	});
};