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

var APIError = function (status, message) {
	this.message = message;
	this.status = status;
};
APIError.prototype = Error.prototype;

var error = function(status, message) {
	var err = new Error(message);
	err.status = status;
	return err;
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

var cmd = exports.cmd = function (cmd, param) {
	return (new Promise(function (res) {
		if (!ctl) {
			throw new APIError(500, 'controller not found');
		}
		if (!_.contains(CMDS, cmd)) {
			throw new APIError(400, 'unknown command');
		}
		if (cmd === 'on' || cmd === 'off') {
			if (!param) {
				throw new APIError(400, 'param required');
			}
			param = parseInt(param, 10) || 0;
		} else {
			param = null;
		}
		res();
	}))
	.then(function () {
		return ctl.open()
	})
	.then(function () {
		return ctl[cmd](param);
	})
	.then(function () {
		return ctl.close();
	});
};

exports.http = function (req, res) {
	cmd(req.params.cmd, req.params.param)
	.then(function (ret) {
		res.status(200).json({
			ok: true,
			data: ret
		});
	})
	.catch(function (err) {
		res.status(err.status || 500).json({error: err.message});
	});
};