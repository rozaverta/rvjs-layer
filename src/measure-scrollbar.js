'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = MeasureScrollbar;

var _rvjsDom = require('rvjs-dom');

var init = false,
    width = 0;

/**
 * @return {number}
 */
function MeasureScrollbar() {
	if (!init) {
		var body = typeof document !== 'undefined' && document.body;
		if (body) {
			init = true;
			var div1 = _rvjsDom.Element.create({ style: { width: 100, height: 100, overflow: 'auto', position: 'absolute', top: -500, left: 0 }, parent: body }),
			    div2 = _rvjsDom.Element.create({ style: { height: 200, position: 'relative' }, parent: div1 });

			width = 100 - div2.offsetWidth;
			body.removeChild(div1);
		}
	}

	return width;
}