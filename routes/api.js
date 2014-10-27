'use strict';

var _ = require('lodash');
var Promise = require('rsvp').Promise;
var Tosr0x = require('tosr0x').Tosr0x;
var CMDS = ['on', 'off', 'state', 'toggle', 'temp', 'version', 'voltage'];

module.exports = function (req, res) {
	res.json({ok:true});
};