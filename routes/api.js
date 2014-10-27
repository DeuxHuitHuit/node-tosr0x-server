'use strict';

var _ = require('lodash');
var Promise = require('rsvp').Promise;
var Tosr0x = require('tosr0x').Tosr0x;
var CMDS = ['on', 'off', 'refreshStates', 'temperature', 'version', 'voltage'];

var ctl;

var create = function (port, options) {
	if (!port) {
		return Tosr0x.fromPortScan(); // TODO: put options when available
	} else {
		return new Promise(function (res) {
			res(new Tosr0x(port, options));
		});
	}
};

var init = exports.init = function (port, options) {
	create(port, options).then(function (c) {
		ctl = c;
	})
	.catch(function () {
		// retry !!
		setTimeout(init, 2000, port, options);
	});
};

exports.http = function (req, res) {
	if (!ctl) {
		res.status(500).json({error: 'controller not found'});
		return;
	}
	var cmd = req.params.cmd;
	var param = req.params.param;
	if (!_.contains(CMDS, cmd)) {
		res.status(400).json({error: 'unknown command'});
		return;
	}
	if (cmd === 'on' || cmd === 'off') {
		if (!param) {
			res.status(400).json({error: 'param required'});
			return;
		}
		param = parseInt(param, 10) || 0;
	} else {
		param = null;
	}
	ctl.open()
	.then(function () {
		return ctl[cmd](param);
	})
	.then(function (ret) {
		res.status(200).json({
			ok:true,
			data: ret
		});
	})
	.catch(function (err) {
		res.status(500).json({error: err.toString()});
	}).finally(function () {
		ctl.closeImmediate();
	});
};