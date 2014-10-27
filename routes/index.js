'use strict';

var render = function (file) {
	return function (req, res) {
		res.render(file, {
			package: req.package,
			config: req.config
		});
	};
};

exports.index = render('index.html');
exports.about = render('about.html');
