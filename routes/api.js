'use strict';

var _ = require('lodash');
var cuid = require('cuid');
var Promise = require('rsvp').Promise;
var Tosr0x = require('tosr0x').Tosr0x;
var CMDS = ['on', 'off', 'refreshStates', 'temperature', 'version', 'voltage'];

var ctl;
var mutex = {
	guid: null,
	timeout: 0
};
var connected = false;

var APIError = function (status, message) {
	this.message = message;
	this.status = status;
};
APIError.prototype = Error.prototype;

var initTimeout = 0;
var init = exports.init = function (port, options) {
	clearTimeout(initTimeout);
	Tosr0x.create(port, options).then(function (c) {
		ctl = c;
	})
	.catch(function () {
		// retry !!
		initTimeout = setTimeout(init, 2000, port, options);
	});
};

var validCtl = exports.ctl = function () {
	return (new Promise(function (res, rej) {
		process.nextTick(function () {
			if (!ctl) {
				return rej(new APIError(500, 'controller not found'));
			}
			res(ctl);
		});
	}));
};

var lock = exports.lock = function (timeout) {
	return (new Promise(function (res, rej) {
		process.nextTick(function () {
			if (!!mutex.guid) {
				return rej(new APIError(503, 'already locked'));
			}
			mutex.guid = cuid.slug();
			mutex.timeout = setTimeout(function() {
				mutex.guid = null;
			}, timeout || 1000);
			res(mutex);
		});
	}));
};

var unlock = exports.unlock = function (guid) {
	if (!guid) {
		return false;
	}
	if (guid !== mutex.guid) {
		return false;
	}
	clearTimeout(mutex.timeout);
	mutex.guid = null;
	return true;
};

var open = exports.open = function () {
	return (new Promise(function (res, rej) {
		process.nextTick(function () {
			if (connected) {
				res(ctl);
			} else {
				res(ctl.open().then(function () {
					console.log('Connection opened');
					connected = true;
				}));
			}
		});
	}));
};

var validParam = function (cmd, param) {
	return (new Promise(function (res, rej) {
		process.nextTick(function () {
			if (!_.contains(CMDS, cmd)) {
				return rej(new APIError(400, 'unknown command'));
			}
			if (cmd === 'on' || cmd === 'off') {
				if (!param) {
					return rej(new APIError(400, 'param required'));
				}
			}
			res(cmd, param);
		});
	}));
};

exports.http = function (req, res) {
	var ret = null;
	var mutex = null;
	var start = new Date();
	var timeConnect = start;
	var timeParam = start;
	lock()
	.then(function (m) {
		mutex = m;
		return validCtl();
	})
	.then(function () {
		return validParam(req.params.cmd, req.params.param);
	})
	.then(function () {
		timeParam = new Date();
		return open();
	})
	.then(function () {
		timeConnect = new Date();
		return ctl[req.params.cmd](parseInt(req.params.param, 10) || 0);
	})
	.then(function (val) {
		ret = val;
	})
	.then(function () {
		var end = new Date();
		res.status(200).json({
			ok: true,
			data: ret,
			time: end - start,
			timeConnect: timeConnect - start,
			timeParam: timeParam - start
		});
	})
	.catch(function (err) {
		res.status(err.status || 500).json({error: err.message});
	})
	.finally(function () {
		unlock(mutex.guid);
	});
};