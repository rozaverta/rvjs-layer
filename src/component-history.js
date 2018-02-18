"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _component = require("./component");

var _component2 = _interopRequireDefault(_component);

var _history = require("./history");

var _history2 = _interopRequireDefault(_history);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ComponentHistory = function (_Component) {
	_inherits(ComponentHistory, _Component);

	function ComponentHistory(data) {
		_classCallCheck(this, ComponentHistory);

		var _this = _possibleConstructorReturn(this, (ComponentHistory.__proto__ || Object.getPrototypeOf(ComponentHistory)).call(this, data));

		_this.history = new _history2.default();
		return _this;
	}

	_createClass(ComponentHistory, [{
		key: "save",
		value: function save(newData, oldData) {
			return newData.id !== oldData.id;
		}
	}]);

	return ComponentHistory;
}(_component2.default);

exports.default = ComponentHistory;