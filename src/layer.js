"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.ComponentHistory = exports.Component = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _rvjsDom = require("rvjs-dom");

var _rvjsAnimate = require("rvjs-animate");

var _es6Promise = require("es6-promise");

var _es6Promise2 = _interopRequireDefault(_es6Promise);

var _measureScrollbar = require("./measure-scrollbar");

var _measureScrollbar2 = _interopRequireDefault(_measureScrollbar);

var _component = require("./component");

var _component2 = _interopRequireDefault(_component);

var _componentHistory = require("./component-history");

var _componentHistory2 = _interopRequireDefault(_componentHistory);

var _log = require("./log");

var _log2 = _interopRequireDefault(_log);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

if (typeof Promise === "undefined") {
	var Promise = _es6Promise2.default.Promise;
}

var Noop = function Noop() {};

var privates = ["load", "reload", "blur", "focus", "update", "fade", "close", "init", "save"];
var KeyCodes = {
	// '*': 'navigate',
	13: 'enter',
	27: 'escape',
	32: 'space',
	37: 'left', // leftRight
	38: 'up', // upDown
	39: 'right',
	40: 'down'
};

var KeyCodesAll = Object.keys(KeyCodes).map(function (code) {
	return KeyCodes[code];
});

var EvnAlias = {
	leftRight: ['left', 'right'],
	upDown: ['up', 'down'],
	navigate: KeyCodesAll
};

var IgnoreTarget = ['TEXTAREA', 'INPUT', 'SELECT', 'A', 'BUTTON'];

var Wait = [];
var IsInit = false;
var IsInitComplete = false;
var Reg = {};
var Initable = {};
var Keys = [];
var InitKeys = [];
var HtmlLayer = null,
    HtmlBackground = null,
    Html = null;
var Layers = [];
var IsOpen = false;
var IsWait = false;
var IsNotWait = false;
var _Off = Noop;
var WinEvents = {};
var Uid = 1;

var Props = {
	delay: 300,
	classNamePrefix: "layer-",
	escape: true,
	nativeStyles: true
};

function DidComplete(result) {
	IsWait = false;
	if (Wait.length) {
		Wait.shift()();
	}
	return result;
}

function DidCompleteError(e) {
	IsWait = false;
	if (Wait.length) {
		Wait.shift()();
	}
	throw e;
}

function NotWait() {
	var not = IsNotWait;
	IsNotWait = false;
	return function () {
		if (not) {
			throw new Error("Wait progress");
		}
	};
}

/**
 * @return {string}
 */
function GetClassName(name) {
	return Props.classNamePrefix + name;
}

/**
 * @return {boolean}
 */
function IsContentEditable(e) {
	var src = e.target;
	if (src && src.nodeName) {
		if (IgnoreTarget.indexOf(src.nodeName.toUpperCase()) > -1) {
			return true;
		}

		while (src) {
			if (src.contentEditable === 'true') return true;else if (src.contentEditable === 'inherit') src = src.parentNode;else break;
		}
	}

	return false;
}

function Call(name, func) {
	for (var _len = arguments.length, evn = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
		evn[_key - 2] = arguments[_key];
	}

	var layer = Reg[name] || {};

	if (typeof layer[func] !== "function") {
		return func === 'reload' ? Call.apply(undefined, [name, 'load'].concat(_toConsumableArray(evn))) : void 0;
	} else if (!evn.length && ~privates.indexOf(name)) {
		evn = [HtmlLayer];
	}

	return layer[func].apply(layer, evn);
}

function Dispatch(event) {
	var app = Props.app || false;
	if (app && typeof app.dispatch === "function") {
		app.dispatch(event);
	}
}

var DepthShowAnimate = 0;

function DepthTick() {
	DepthShowAnimate = 0;

	var i = Layers.length - 1,
	    pref = " " + Props.classNamePrefix,
	    wrapClassName = Props.classNamePrefix + 'content',
	    className = void 0,
	    layer = void 0,
	    last = i,
	    depth = void 0;

	for (; i >= 0; i--) {
		depth = last - i;
		layer = Layers[i];
		layer.hidden = depth >= 3;
		className = wrapClassName + pref + (layer.hidden ? 'hidden' : 'show');
		if (depth < 4) className += pref + "index-" + (depth + 1);
		if (depth > 0 && depth < 3) className += pref + "blur";

		layer.element.className = className;
	}

	if (last > -1) {
		HtmlDataSet(Layers[last].name);
	}
}

function Depth() {
	DepthShowAnimate && (0, _rvjsAnimate.cancel)(DepthShowAnimate);
	DepthShowAnimate = (0, _rvjsAnimate.request)(DepthTick);
}

function HtmlDataSet(name) {
	var data = Html.dataset;
	if (data) {
		if (name) data.layerName = name;else delete data.layerName;
	} else if (name) {
		Html.setAttribute("data-layer-name", name);
	} else {
		Html.removeAttribute("data-layer-name");
	}
}

function CreateElement(className) {
	return _rvjsDom.Element.create({
		className: GetClassName(className),
		style: {
			opacity: 0,
			display: 'none'
		},
		events: {
			click: function click(e) {
				var target = e.target;
				target && target.dataset.closable === 'true' && Layer.back();
			}
		},
		data: {
			closable: true
		},
		parent: document.body
	});
}

/**
 * @return {boolean}
 */
function IsFunction(value) {
	return typeof value === 'function';
}

function Ready() {
	if (Props.nativeStyles) {
		var styles = {},
		    layer = '.' + GetClassName('dialog'),
		    background = '.' + GetClassName('background'),
		    wrap = '.' + GetClassName('content'),
		    index = wrap + '.' + GetClassName('index-'),
		    scroll = (0, _measureScrollbar2.default)();

		styles[layer + ', ' + background] = 'position:fixed;top:0;left:0;bottom:0;width:100%;height:100%;min-height:100vh;';
		styles[background] = 'z-index:1000;background:rgba(0,0,0,.7);';
		styles[layer] = 'z-index:1100;overflow:auto;';
		styles[wrap] = 'position:absolute;top:0;left:0;width:100%;z-index:100;';
		styles[index + 4] = 'z-index:100;';
		styles[index + 3] = 'z-index:200;';
		styles[index + 2] = 'z-index:300;';
		styles[index + 1] = 'z-index:400;';
		styles[wrap + '.' + GetClassName('hidden')] = 'opacity:0 !important;visibility:hidden;';
		styles[wrap + '.' + GetClassName('blur')] = 'opacity:.5 !important;filter:blur(10px);';
		styles[layer + " > " + wrap] = 'transition:.3s opacity,.3s visibility,.3s filter';
		styles[':root'] = '--scroll-bar-size:' + scroll + 'px';

		try {
			(0, _rvjsDom.StyleSheets)(styles);
		} catch (e) {}
	}

	Html = document.documentElement;
	HtmlBackground = CreateElement('background');
	HtmlLayer = CreateElement('dialog');
	IsInit = true;
}

function ChangeOpacity(show, element, complete) {
	if (Props.delay < 1) {
		complete();
	} else {
		var delay = Props.delay,
		    end = Date.now() + delay,
		    tick = function tick() {
			var now = Date.now();
			if (now > end) {
				(0, _rvjsDom.Style)(element, 'opacity', show ? 1 : 0);
				complete();
			} else {
				var val = (end - now) / delay;
				if (show) {
					val = 1 - val;
				}

				(0, _rvjsDom.Style)(element, 'opacity', (val * 100 >> 0) / 100);
				(0, _rvjsAnimate.request)(tick);
			}
		};

		(0, _rvjsAnimate.request)(tick);
	}
}

function Fade(fade) {
	var length = Layers.length;

	while (fade > -1 && fade < length) {
		if (Call(Layers[fade++].name, "fade") === false) {
			throw new Error("Current layer controller aborted operation");
		}
	}
}

// payload

function CreatePayload(data, layer) {
	if (!data.id) {
		data.id = layer.id;
	}

	Object.defineProperty(data, 'close', {
		value: function value() {
			LayerDestroy(layer, true, DidComplete);
		}
	});

	Object.defineProperty(data, 'element', {
		get: function get() {
			return layer.element;
		}
	});

	if (layer.history) {
		Object.defineProperty(data, 'history', {
			value: layer.history
		});
	}

	return data;
}

// history

function UpdateHistory(name, data) {
	if (data !== null) {
		var found = LayerFound(name, 'name');
		if (found > -1) {
			var payload = CreatePayload(Object.assign({}, data), Layers[found]);
			try {
				IsWait = true;
				LayerLoadHistory(name, payload);
				return payload;
			} catch (e) {
				(0, _log2.default)(e);
			} finally {
				DidComplete();
			}
		}
	}
}

function CreateHistory(name) {
	var history = Reg[name].history,
	    valid = function valid() {
		return !IsWait && Layer.name === name;
	};

	return {
		get length() {
			return history.length;
		},

		get index() {
			return history.index;
		},

		forEach: function forEach(func) {
			history.forEach(func);
		},
		forward: function forward() {
			if (valid()) {
				UpdateHistory(name, history.forward());
			}
		},
		back: function back() {
			if (valid()) {
				UpdateHistory(name, history.back());
			}
		},
		go: function go(index) {
			if (valid()) {
				UpdateHistory(name, history.go(index));
			}
		},
		replace: function replace(data) {
			if (valid()) {
				var copy = UpdateHistory(name, data);
				if (copy) {
					history.replace(copy);
				}
			}
		},
		push: function push(data) {
			if (valid()) {
				var copy = UpdateHistory(name, data);
				if (copy) {
					history.push(copy);
				}
			}
		},
		clear: function clear() {
			history.clear();
		}
	};
}

// layer functions

function LayerInit(name, data) {
	WinEvents[name] = {};
	var CopyOf = {},
	    Evn = WinEvents[name];

	Object.keys(KeyCodes).forEach(function (code) {
		name = KeyCodes[code];
		if (IsFunction(data[name])) {
			Evn[name] = data[name];
		}
	});

	Object.keys(EvnAlias).forEach(function (code) {
		if (IsFunction(data[code])) {
			EvnAlias[code].forEach(function (name) {
				if (!Evn[name]) {
					Evn[name] = data[code];
				}
			});
		}
	});

	if (!Evn.escape && (data.escape === true || Props.escape && data.escape !== false)) {
		Evn.escape = Layer.back;
	}

	// copy data object, ignore event flag and callback

	Object.keys(data).forEach(function (key) {
		if (KeyCodesAll.indexOf(key) < 0 && !EvnAlias[key]) {
			CopyOf[key] = data[key];
		}
	});

	return CopyOf;
}

function LayerLoadHistory(name, payload) {
	var found = LayerFound(name, "name");

	// not found
	if (found < 0) {
		throw new Error("Layer not found");
	}

	// check update
	else if (Call(name, "update", payload) === false) {
			throw new Error("Layer controller '" + name + "' cannot be updated");
		}

	var layer = Layers[found];

	Call(name, "reload", layer.element, payload);

	// update
	layer.id = payload.id;
	layer.payload = payload;

	Dispatch({
		type: "layer_load",
		name: name,
		reload: true,
		history: true,
		payload: payload
	});
}

function LayerPreload(name, data, resolve, reject) {
	if (IsWait) {
		throw new Error("Load in progress");
	}

	IsWait = true;
	data = Object.assign({}, data); // copy

	if ((typeof name === "undefined" ? "undefined" : _typeof(name)) === 'object') {
		Object.assign(data, name);
		name = data.name || '';
	}

	if (!Layer.loaded(name)) {
		throw new Error("Layer controller '" + name + "' not found");
	}

	// check global init
	if (!IsInitComplete) {
		Layer.init();
	}

	if (!IsInit) {
		throw new Error("Global html container is not loaded");
	}

	var found = LayerFound(name, "name");

	Fade(found > -1 ? found + 1 : Layers.length - 1);

	// init layer
	if (InitKeys.indexOf(name) < 0) {
		InitKeys.push(name);
		var init = LayerInit(name, Initable[name]);

		if (typeof Reg[name] === "function") {
			Reg[name] = new Reg[name](init, name);
		} else {
			Call(name, "init", init, name);
		}
	}

	// not found
	if (found < 0) {

		// create auto id
		if (!data.id) {
			data.id = 'layer_' + name + "_" + Math.floor(Math.random() * 10000000);
		}

		// check focus
		if (Call(name, "focus", data) === false) {
			throw new Error("Layer controller '" + name + "' cannot be focused");
		}
	} else {

		// assign old id
		if (!data.id) {
			data.id = Layers[found].id;
		}

		// check update
		if (Call(name, "update", data) === false) {
			throw new Error("Layer controller '" + name + "' cannot be updated");
		}
	}

	LayerOpen(function () {
		try {
			LayerLoad(name, data, resolve);
		} catch (e) {
			reject(e);
		}
	});
}

function LayerLoad(name, data, complete) {
	var found = LayerFound(name, 'name'),
	    wait = 'opacity',
	    cur = null,
	    // current layer
	reload = found > -1,
	    // reload layer
	renewed = !reload,
	    component = Reg[name],
	    history = component instanceof _componentHistory2.default;

	if (history) {
		var h = component.history;
		if (renewed && h.length > 0) {
			h.go(h.length - 1);
		}
		if (renewed || component.save(data, cur.payload) !== true) {
			h.replace(data);
		} else {
			h.push(data);
		}
	}

	// reload | update

	if (reload) {
		cur = Layers[found];

		// update id
		cur.id = data.id;

		// change stack
		if (found !== Layers.length - 1) {
			Layers.splice(found, 1);
			Layers.push(cur);
			Depth();
			wait = 'timeout';
		} else {
			wait = 'none';
		}
	} else {
		cur = {
			id: data.id,
			uid: Uid++,
			name: name,
			hidden: false,
			element: _rvjsDom.Element.create({ parent: HtmlLayer, data: { closable: 'true' }, style: { opacity: 0 } })
		};

		if (history) {
			cur.history = CreateHistory(name);
		}

		Layers.push(cur);
		Depth();
	}

	cur.payload = CreatePayload(data, cur);

	try {
		Call(name, reload ? "reload" : "load", cur.element, cur.payload);
	} catch (e) {
		(0, _log2.default)(e);
	}

	Dispatch({
		type: "layer_load",
		name: name,
		reload: reload,
		history: false,
		payload: cur.payload
	});

	var c = function c() {
		console.log("complete open", cur, cur.payload);
		complete(cur.payload);
	};

	if (wait === 'opacity') {
		ChangeOpacity(true, cur.element, c);
	} else if (wait === 'timeout') {
		setTimeout(c, Props.delay || 0);
	} else {
		c();
	}
}

/**
 * @return {number}
 */
function LayerFound(value, type) {
	// found layer
	for (var i = 0, length = Layers.length; i < length; i++) {
		if (Layers[i][type] === value) {
			return i;
		}
	}

	return -1;
}

function LayerDestroy(layer, blur, complete) {
	if (IsWait) {
		Wait.push(function () {
			LayerDestroy(layer, blur, complete);
		});
		return;
	}

	var name = layer.name;

	if (layer.killed || blur && Call(name, "blur") === false) {
		return;
	}

	IsWait = true;
	if (blur) {
		complete = DidComplete;
	}

	layer.killed = true;

	Dispatch({
		type: "layer_unload",
		name: name,
		payload: layer.payload
	});

	var index = LayerFound(layer.uid, 'uid'),
	    // found index
	close = function close() {
		try {
			Call(name, "close", layer.element, layer.payload);

			if (typeof Props.garbage === "function") {
				try {
					Props.garbage(layer.element, layer.name);
				} catch (e) {
					(0, _log2.default)(e);
				}
			}

			HtmlLayer.removeChild(layer.element);
		} catch (e) {
			(0, _log2.default)(e);
		}

		if (Layers.length) {
			complete();
		} else {
			LayerClose(complete);
		}
	};

	// layer not found

	if (index < 0) {
		if (blur) {
			return complete();
		} else {
			throw new Error("Layer not found on stack");
		}
	}

	// inject

	Layers.splice(index, 1);
	Depth();

	// hidden element ?

	if (layer.hidden) {
		close();
	} else {
		_rvjsDom.ClassName.remove(layer.element, GetClassName('show'));
		Props.delay > 0 && (0, _rvjsAnimate.request)(function () {
			_rvjsDom.ClassName.add(layer.element, GetClassName('destroy'));
		});
		ChangeOpacity(false, layer.element, close);
	}
}

function LayerBack(complete) {
	if (Layers.length < 1) {
		return complete();
	}

	var layer = Layers[Layers.length - 1],
	    name = layer.name;

	if (layer.killed) {
		throw new Error("Layer controller '" + name + "' did kill");
	}

	if (Call(name, "blur") === false) {
		throw new Error("Layer controller '" + name + "' cannot be closed (blur fail)");
	}

	LayerDestroy(layer, false, complete);
}

function LayerOpen(complete) {
	if (IsOpen) {
		complete();
	} else if (!IsOpen) {
		_rvjsDom.ClassName.add(Html, GetClassName('open'));
		_rvjsDom.ClassName.add([HtmlLayer, HtmlBackground], GetClassName('opened'));
		_rvjsDom.Element.css('body', { overflow: 'hidden' });
		HtmlLayer.style.display = 'block';
		HtmlBackground.style.display = 'block';
		ChangeOpacity(true, HtmlBackground, Noop);
		ChangeOpacity(true, HtmlLayer, Noop);
		(0, _rvjsAnimate.request)(function () {
			IsOpen = true;

			Dispatch({
				type: "layer_open"
			});

			complete();
		});

		_Off();

		_rvjsDom.Evn.on("keyup", function (e) {
			var evn = WinEvents[Layer.name || ''],
			    code = e.keyCode || 0;

			if (!IsWait && evn && KeyCodes[code]) {
				code = KeyCodes[code];
				evn[code] && !IsContentEditable(e) && evn[code](code, e) !== false && e.preventDefault();
			}
		}, function (remove) {
			_Off = function Off() {
				remove();
				_Off = Noop;
			};
		});
	}
}

function LayerClose(complete) {
	if (IsOpen) {
		_Off();
		ChangeOpacity(false, HtmlBackground, Noop);
		ChangeOpacity(false, HtmlLayer, function () {

			HtmlDataSet('');
			_rvjsDom.ClassName.remove(Html, GetClassName('open'));
			_rvjsDom.ClassName.remove([HtmlLayer, HtmlBackground], GetClassName('opened'));
			_rvjsDom.Element.css('body', { overflow: '' });
			HtmlLayer.style.display = 'none';
			HtmlBackground.style.display = 'none';

			IsOpen = false;

			Dispatch({
				type: "layer_close"
			});

			complete();
		});
	} else {
		complete();
	}
}

var Layer = {
	get name() {
		var index = Layers.length;
		return index > 0 && IsOpen ? Layers[index - 1].name : null;
	},

	get isOpened() {
		return IsOpen && Layers.length > 0;
	},

	get isWait() {
		return IsWait;
	},

	get depth() {
		return Layers.length;
	},

	init: function init() {
		var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		if (!IsInitComplete) {
			IsInitComplete = true;
			if ((typeof props === "undefined" ? "undefined" : _typeof(props)) === 'object' && props !== null) {
				Object.assign(Props, props);
			}

			_rvjsDom.Evn.ready(Ready);
		}

		return Layer;
	},
	register: function register(name, object, data) {
		if (Keys.indexOf(name) < 0) {
			Keys.push(name);
			Reg[name] = object;
			Initable[name] = data || {};
		}

		return Layer;
	},
	loaded: function loaded(name) {
		return Keys.indexOf(name) > -1;
	},
	fire: function fire(name) {
		name = String(name);
		if (Layer.isOpened && privates.indexOf(name) < 0) {
			for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
				args[_key2 - 1] = arguments[_key2];
			}

			return Call.apply(undefined, [Layer.name, name].concat(args));
		}
	},
	notWait: function notWait() {
		IsNotWait = true;
		return Layer;
	},
	open: function open(name, data) {
		var not = NotWait();

		return new Promise(function (resolve, reject) {
			if (IsWait) {
				not();
				Wait.push(function () {
					try {
						LayerPreload(name, data || {}, resolve, reject);
					} catch (e) {
						reject(e);
					}
				});
			} else {
				LayerPreload(name, data || {}, resolve, reject);
			}
		}).then(DidComplete, DidCompleteError);
	},
	toggle: function toggle(name) {
		var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var data_match = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

		var not = NotWait(),
		    t = function t(resolve, reject) {

			var found = LayerFound(name, 'name'),
			    end = Layers.length - 1,
			    open = false;

			if (found < 0 || found !== end) {
				open = true;
			} else if (data_match.length) {
				for (var i = 0, layer = Layers[found], length = data_match.length, key; i < length; i++) {
					key = data_match[i];
					if (data[key] !== layer.payload[key]) {
						open = true;
						break;
					}
				}
			}

			if (open) {
				LayerPreload(name, data, resolve, reject);
			} else if (Call(name, "blur") === false) {
				throw new Error("Layer controller '" + name + "' cannot be closed (blur fail)");
			} else {
				LayerDestroy(Layers[found], false, resolve);
			}
		};

		return new Promise(function (resolve, reject) {
			if (IsWait) {
				not();
				Wait.push(function () {
					try {
						t(resolve, reject);
					} catch (e) {
						reject(e);
					}
				});
			} else {
				t(resolve, reject);
			}
		}).then(DidComplete, DidCompleteError);
	},
	focus: function focus(name) {
		var not = NotWait(),
		    f = function f(complete) {
			var found = LayerFound(name, 'name'),
			    // found layer
			end = Layers.length - 1;

			if (found < 0) {
				throw new Error("Layer is not opened");
			}

			var layer = Layers[found],
			    c = function c() {
				complete(layer.payload);
			};

			if (found === end) {
				c();
			} else {
				Fade(found + 1);

				Layers.splice(found, 1);
				Layers.push(layer);
				Depth();
				IsWait = true;
				setTimeout(c, Props.delay || 0);
			}
		};

		return new Promise(function (resolve, reject) {
			if (IsWait) {
				not();
				Wait.push(function () {
					try {
						f(resolve);
					} catch (e) {
						reject(e);
					}
				});
			} else {
				f(resolve);
			}
		}).then(DidComplete, DidCompleteError);
	},
	back: function back() {
		var not = NotWait();
		return new Promise(function (resolve, reject) {
			if (!Layer.isOpened) {
				resolve();
			} else if (IsWait) {
				not();
				Wait.push(function () {
					try {
						LayerBack(resolve);
					} catch (e) {
						reject(e);
					}
				});
			} else {
				LayerBack(resolve);
			}
		}).then(DidComplete, DidCompleteError);
	},
	close: function close() {
		var not = NotWait(),
		    end = function end(func) {
			if (Layers.length) {
				LayerBack(function () {
					IsWait = false;
					end(func);
				});
			} else {
				func();
			}
		};

		return new Promise(function (resolve, reject) {
			if (!Layer.isOpened) {
				resolve();
			} else if (IsWait) {
				not();
				Wait.push(function () {
					try {
						end(resolve);
					} catch (e) {
						reject(e);
					}
				});
			} else {
				end(resolve);
			}
		}).then(DidComplete, DidCompleteError);
	}
};

exports.Component = _component2.default;
exports.ComponentHistory = _componentHistory2.default;
exports.default = Layer;