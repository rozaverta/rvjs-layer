'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var History = function () {
	function History() {
		_classCallCheck(this, History);

		var self = this;
		self.history = [];
		self.index = -1;
		Object.defineProperty(self, 'length', {
			get: function get() {
				return self.history.length;
			}
		});
	}

	_createClass(History, [{
		key: 'forEach',
		value: function forEach(func) {
			this.history.forEach(func);
		}
	}, {
		key: 'forward',
		value: function forward() {
			var s = this;
			return s.index + 1 < s.length ? s.history[++s.index] : null;
		}
	}, {
		key: 'back',
		value: function back() {
			var s = this;
			return s.index > 0 ? s.history[--s.index] : null;
		}
	}, {
		key: 'go',
		value: function go(index) {
			index = index >> 0;
			var s = this;
			if (index >= 0 && index < s.length && _typeof(s.history[index])) {
				s.index = index;
				return s.history[index];
			}
			return null;
		}
	}, {
		key: 'replace',
		value: function replace(data) {
			var s = this;
			if (s.index > -1) {
				s.history[s.index] = Object.assign({}, data);
			} else {
				s.push(data);
			}
		}
	}, {
		key: 'push',
		value: function push(data) {
			var s = this;
			s.history = s.index > -1 ? s.history.splice(0, s.index + 1) : [];
			s.history.push(Object.assign({}, data));
			s.index = s.length - 1;
		}
	}, {
		key: 'clear',
		value: function clear() {
			var s = this;
			s.index = -1;
			s.history = [];
		}
	}]);

	return History;
}();

exports.default = History;