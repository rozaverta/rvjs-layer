"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _log = require("./log");

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Component = function () {
	function Component() {
		_classCallCheck(this, Component);
	}

	_createClass(Component, [{
		key: "load",
		value: function load(html) {
			var text = "load function must be overloaded";

			if (!html.firstChild && typeof document !== 'undefined') {

				var st = html.style;

				st.padding = "20px";
				st.background = "white";
				st.border = "3px solid #900";
				st.fontSize = "20px";

				html.appendChild(document.createTextNode(text));
			} else {
				(0, _log2.default)(new Error(text));
			}
		}
	}, {
		key: "blur",
		value: function blur() {
			return true;
		}
	}, {
		key: "focus",
		value: function focus() {
			return true;
		}
	}, {
		key: "update",
		value: function update() {
			return true;
		}
	}, {
		key: "fade",
		value: function fade() {
			return true;
		}
	}, {
		key: "close",
		value: function close() {}
	}]);

	return Component;
}();

exports.default = Component;