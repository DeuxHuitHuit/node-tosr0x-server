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

var init = exports.init = function (port, options) {
	create(port, options).then(function (c) {
		ctl = c;
	})
	.catch(function () {
		// retry !!
		setTimeout(init, 2000, port, options);
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
	lock()
	.then(function (m) {
		mutex = m;
		return validCtl();
	})
	.then(function () {
		return validParam(req.params.cmd, req.params.param);
	})
	.then(function () {
		return ctl.open()
	})
	.then(function () {
		return ctl[req.params.cmd](parseInt(req.params.param, 10) || 0);
	})
	.then(function (val) {
		ret = val;
		return ctl.close();
	})
	.then(function () {
		res.status(200).json({
			ok: true,
			data: ret
		});
	})
	.catch(function (err) {
		res.status(err.status || 500).json({error: err.message});
	})
	.finally(function () {
		if (!!ctl) {
			ctl.closeImmediate();
		}
		unlock();
	});
};