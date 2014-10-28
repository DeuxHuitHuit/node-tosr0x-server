'use strict';

var _ = require('lodash');

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
	var ret = {
		temp: 'N/A',
		voltage: 'N/A',
		version: 'N/A',
		states: {},
	};
	var ctl;

	req.api.lock()
	.then(function () {
		return req.api.ctl();
	})
	.then(function (c) {
		ctl = c;
		return ctl.open();
	})
	.then(function () {
		return ctl.voltage();
	})
	.then(function (val) {
		ret.voltage = val + ' V';
		return ctl.version();
	})
	.then(function (val) {
		ret.version = val;
		return ctl.refreshStates();
	})
	.then(function (val) {
		console.log(val);
		ret.states = val;
		var renderer = render('index.html', ret);
		renderer(req, res);
	})
	.then(function () {
		return ctl.close();
	})
	.catch(function (err) {
		var renderer = render('index.html', _.assign(ret, {
			error: err
		}));
		renderer(req, res);
	})
	.finally(function () {
		if (!!ctl) {
			ctl.closeImmediate();
		}
	});
};