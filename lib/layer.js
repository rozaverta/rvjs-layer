import { Element, StyleSheets, Evn, Style, ClassName } from "rvjs-dom";
import { request, cancel } from "rvjs-animate";
import Es6Promise from "es6-promise";
import Scrollbar from './measure-scrollbar';
import Component from "./component";
import ComponentHistory from "./component-history";
import {Log} from "rvjs-tools";

if( typeof Promise === "undefined" )
{
	var Promise = Es6Promise.Promise
}

const Noop = () => {};

const privates = ["load", "reload", "blur", "focus", "update", "fade", "close", "init", "save"];
const KeyCodes = {
	// '*': 'navigate',
	13: 'enter',
	27: 'escape',
	32: 'space',
	37: 'left', // leftRight
	38: 'up', // upDown
	39: 'right',
	40: 'down'
};

const KeyCodesAll = Object.keys(KeyCodes).map(code => KeyCodes[code]);

const EvnAlias = {
	leftRight: ['left', 'right'],
	upDown: ['up', 'down'],
	navigate: KeyCodesAll
};

const IgnoreTarget = ['TEXTAREA', 'INPUT', 'SELECT', 'A', 'BUTTON'];

let Wait = [];
let IsInit = false;
let IsInitComplete = false;
let Reg = {};
let Initable = {};
let Singleton = {};
let Keys = [];
let InitKeys = [];
let HtmlLayer = null, HtmlBackground = null, Html = null;
let Layers = [];
let IsOpen = false;
let IsWait = false;
let IsNotWait = false;
let Off = Noop;
let WinEvents = {};
let Uid = 1;

let Props = {
	delay: 300,
	classNamePrefix: "layer-",
	dialogClassName: "",
	escape: true,
	nativeStyles: true
};

function DidComplete(result)
{
	IsWait = false;
	if( Wait.length ) {
		Wait.shift()();
	}
	return result
}

function DidCompleteError(e)
{
	IsWait = false;
	if( Wait.length ) {
		Wait.shift()();
	}
	throw e;
}

function NotWait()
{
	let not = IsNotWait;
	IsNotWait = false;
	return () => {
		if( not ) {
			throw new Error("Wait progress")
		}
	};
}

/**
 * @return {string}
 */
function GetClassName(name)
{
	return Props.classNamePrefix + name;
}

/**
 * @return {boolean}
 */
function IsContentEditable(e)
{
	let src = e.target;
	if( src && src.nodeName )
	{
		if( IgnoreTarget.indexOf(src.nodeName.toUpperCase()) > -1 )
		{
			return true
		}

		while(src)
		{
			if( src.contentEditable === 'true' ) return true;
			else if( src.contentEditable === 'inherit' ) src = src.parentNode;
			else break;
		}
	}

	return false
}

function Call(instance, func, ...evn)
{
	if( typeof instance[func] !== "function" ) {
		return func === 'reload' ? Call(instance, 'load', ...evn) : void 0
	}
	else if( !evn.length && ~privates.indexOf(func) ) {
		evn = [HtmlLayer]
	}

	return instance[func].apply(instance, evn)
}

function Dispatch(event)
{
	let app = Props.app || false;
	if( app && typeof app.dispatch === "function" ) {
		app.dispatch(event)
	}
}

let DepthShowAnimate = 0;

function DepthTick()
{
	DepthShowAnimate = 0;

	let i = Layers.length - 1,
		pref = " " + Props.classNamePrefix,
		wrapClassName = Props.classNamePrefix + 'content',
		className,
		layer,
		last = i,
		depth;

	for( ; i >= 0; i-- ) {
		depth = last - i;
		layer = Layers[i];
		layer.hidden = depth >= 3;
		className = wrapClassName + pref + (layer.hidden ? 'hidden' : 'show');
		if( depth < 4 ) className += pref + "index-" + (depth + 1);
		if( depth > 0 && depth < 3 ) className += pref + "blur";
		if( Props.dialogClassName ) className += " " + Props.dialogClassName;

		layer.element.className = className;
	}

	if( last > -1 ) {
		HtmlDataSet(Layers[last].name);
	}
}

function Depth()
{
	DepthShowAnimate && cancel(DepthShowAnimate);
	DepthShowAnimate = request(DepthTick)
}

function HtmlDataSet(name)
{
	let data = Html.dataset;
	if(data) {
		if(name) data.layerName = name;
		else delete data.layerName;
	}
	else if(name) {
		Html.setAttribute("data-layer-name", name)
	}
	else {
		Html.removeAttribute("data-layer-name")
	}
}

function CreateElement( className )
{
	return Element.create({
		className: GetClassName(className),
		style: {
			opacity: 0,
			display: 'none'
		},
		events: {
			click(e) {
				let target = e.target;
				target && target.dataset.closable === 'true' && Layer.back()
			}
		},
		data: {
			closable: true
		},
		parent: document.body
	})
}

/**
 * @return {boolean}
 */
function IsFunction(value)
{
	return typeof value === 'function'
}

function Ready()
{
	if(Props.nativeStyles) {
		let styles = {},
			layer = '.' + GetClassName('dialog'),
			background = '.' + GetClassName('background'),
			wrap = '.' + GetClassName('content'),
			index = wrap + '.' + GetClassName('index-'),
			scroll = Scrollbar();

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
			StyleSheets(styles);
		}
		catch(e) {}
	}

	Html = document.documentElement;
	HtmlBackground = CreateElement('background');
	HtmlLayer = CreateElement('dialog');
	IsInit = true;
}

function ChangeOpacity(show, element, complete)
{
	if( Props.delay < 1 ) {
		complete()
	}

	else {
		let delay = Props.delay,
			end = Date.now() + delay,
			tick = () => {
				let now = Date.now();
				if( now > end ) {
					Style(element, 'opacity', show ? 1 : 0);
					complete()
				}
				else {
					let val = (end - now)/delay;
					if(show) {
						val = 1 - val;
					}

					Style(element, 'opacity', (val * 100 >> 0)/100);
					request(tick)
				}
			};

		request(tick)
	}
}

function Fade(fade)
{
	let length = Layers.length;

	while(fade > -1 && fade < length) {
		if(Call(Layers[fade++].instance, "fade") === false) {
			throw new Error(`Current layer controller aborted operation`)
		}
	}
}

// payload

function CreatePayload(data, layer)
{
	if( !data.id ) {
		data.id = layer.id
	}

	Object.defineProperty(data, 'close', {
		value() {
			LayerDestroy(layer, true, DidComplete)
		}
	});

	Object.defineProperty(data, 'element', {
		get() {
			return layer.element
		}
	});

	if(layer.history) {
		Object.defineProperty(data, 'history', {
			value: layer.history
		});
	}

	return data
}

// history

function UpdateHistory(instance, data)
{
	if( data !== null ) {
		let found = LayerFound(instance, 'instance', null);
		if( found > -1 ) {
			let payload = CreatePayload(Object.assign({}, data), Layers[found]);
			try {
				IsWait = true;
				LayerLoadHistory(instance, payload);
				return payload
			}
			catch(e) {
				Log(e)
			}
			finally {
				DidComplete()
			}
		}
	}
}

function CreateHistory(instance)
{
	let history = instance.history,
		valid = () => ! IsWait && Layers[Layers.length - 1] === instance;

	return {
		get length()
		{
			return history.length
		},

		get index()
		{
			return history.index
		},

		forEach(func)
		{
			history.forEach(func)
		},

		forward()
		{
			if( valid() ) {
				UpdateHistory(instance, history.forward())
			}
		},

		back()
		{
			if( valid() ) {
				UpdateHistory(instance, history.back())
			}
		},

		go(index)
		{
			if( valid() ) {
				UpdateHistory(instance, history.go(index))
			}
		},

		replace(data)
		{
			if( valid() ) {
				let copy = UpdateHistory(instance, data);
				if(copy) {
					history.replace(copy)
				}
			}
		},

		push(data)
		{
			if( valid() ) {
				let copy = UpdateHistory(instance, data);
				if(copy) {
					history.push(copy)
				}
			}
		},

		clear()
		{
			history.clear()
		}
	}
}

// layer functions

function LayerInit(name, data)
{
	WinEvents[name] = {};
	let CopyOf = {},
		Evn = WinEvents[name];

	Object.keys(KeyCodes).forEach(code => {
		name = KeyCodes[code];
		if( IsFunction(data[name]) ) {
			Evn[name] = data[name]
		}
	});

	Object.keys(EvnAlias).forEach(code => {
		if( IsFunction(data[code]) )
		{
			EvnAlias[code].forEach(name => {
				if( !Evn[name] ) {
					Evn[name] = data[code]
				}
			})
		}
	});

	if( ! Evn.escape && (data.escape === true || Props.escape && data.escape !== false) ) {
		Evn.escape = Layer.back
	}

	// copy data object, ignore event flag and callback

	Object.keys(data).forEach(key => {
		if( KeyCodesAll.indexOf(key) < 0 && ! EvnAlias[key] ) {
			CopyOf[key] = data[key]
		}
	});

	return CopyOf
}

function LayerLoadHistory(instance, payload)
{
	let found = LayerFound(instance, "instance", null);

	// not found
	if( found < 0 ) {
		throw new Error("Layer not found")
	}

	let layer = Layers[found],
		name = layer.name;

	// check update
	if(Call(instance, "update", payload) === false) {
		throw new Error(`Layer controller '${name}' cannot be updated`)
	}

	Call(instance, "reload", layer.element, payload);

	// update
	layer.id = payload.id;
	layer.payload = payload;

	Dispatch({
		type: "layer_load",
		name,
		reload: true,
		history: true,
		payload
	})
}

function LayerPreload(name, data, resolve, reject)
{
	if( IsWait ) {
		throw new Error(`Load in progress`)
	}

	let single = CheckSingleton(name, data.id),
		instance = null;

	IsWait = true;
	data = Object.assign({}, data); // copy

	if( typeof name === 'object' ) {
		Object.assign(data, name);
		name = data.name || ''
	}

	if( ! Layer.loaded(name) ) {
		throw new Error(`Layer controller '${name}' not found`)
	}

	// check global init
	if( ! IsInitComplete ) {
		Layer.init()
	}

	if( ! IsInit ) {
		throw new Error(`Global html container is not loaded`)
	}

	let found = LayerFound(name, "name", single ? data.id : null);

	Fade(found > -1 ? found + 1 : Layers.length - 1);

	// init layer
	if( single ) {
		instance = found > -1 ? Layers[found].instance : new Reg[name](LayerInit(name, Initable[name]), name)
	}
	else {
		if( InitKeys.indexOf(name) < 0 ) {
			InitKeys.push(name);
			let init = LayerInit(name, Initable[name]);

			if( typeof Reg[name] === "function" ) {
				Reg[name] = new Reg[name](init, name)
			}
			else {
				Call(Reg[name], "init", init, name)
			}
		}
		instance = Reg[name]
	}

	// not found
	if( found < 0 ) {

		// create auto id
		if( ! data.id ) {
			data.id = 'layer_' + name + "_" + Math.floor(Math.random()*10000000)
		}

		// check focus
		if(Call(instance, "focus", data) === false) {
			throw new Error(`Layer controller '${name}' cannot be focused`)
		}
	}
	else {

		// assign old id
		if( ! data.id ) {
			data.id = Layers[found].id;
		}

		// check update
		if(Call(instance, "update", data) === false) {
			throw new Error(`Layer controller '${name}' cannot be updated`)
		}
	}

	LayerOpen(() => {
		try {
			LayerLoad(name, instance, data, resolve)
		}
		catch(e) {
			reject(e)
		}
	});
}

function LayerLoad(name, instance, data, complete)
{
	let found = LayerFound(instance, 'instance', null),
		wait = 'opacity',
		cur = null, // current layer
		reload = found > -1, // reload layer
		renewed = ! reload,
		history = instance instanceof ComponentHistory;

	if(history) {
		let h = instance.history;
		if(renewed && h.length > 0) {
			h.go(h.length - 1)
		}
		if(renewed || instance.save(data, cur.payload) !== true) {
			h.replace(data)
		}
		else {
			h.push(data)
		}
	}

	// reload | update

	if(reload) {
		cur = Layers[found];

		// update id
		cur.id = data.id;

		// change stack
		if(found !== Layers.length - 1) {
			Layers.splice(found, 1);
			Layers.push(cur);
			Depth();
			wait = 'timeout'
		}
		else {
			wait = 'none'
		}
	}
	else {
		cur = {
			id: data.id,
			uid: Uid ++,
			name,
			hidden: false,
			singleton: Singleton[name],
			instance,
			element: Element.create({ parent: HtmlLayer, data: {closable: 'true'}, style: {opacity: 0} })
		};

		if(history) {
			cur.history = CreateHistory(instance)
		}

		Layers.push(cur);
		Depth();
	}

	cur.payload = CreatePayload(data, cur);

	try {
		Call(instance, reload ? "reload" : "load", cur.element, cur.payload);
	}
	catch(e) {Log(e)}

	Dispatch({
		type: "layer_load",
		name,
		reload,
		history: false,
		payload: cur.payload
	});

	let c = () => {
		complete(cur.payload)
	};

	if( wait === 'opacity' ) {
		ChangeOpacity(true, cur.element, c)
	}
	else if( wait === 'timeout' ) {
		setTimeout(c, Props.delay || 0)
	}
	else {
		c()
	}
}

/**
 * @return {number}
 */
function LayerFound(value, type, id)
{
	// found layer
	for(let i = 0, length = Layers.length; i < length; i++) {
		if(Layers[i][type] === value && (!id || Layers[i].id === id)) {
			return i
		}
	}

	return -1
}

function LayerDestroy(layer, blur, complete)
{
	if(IsWait) {
		Wait.push(() => {
			LayerDestroy(layer, blur, complete)
		});
		return
	}

	let {name, instance} = layer;

	if(layer.killed || blur && Call(instance, "blur") === false) {
		return
	}

	IsWait = true;
	if(blur) {
		complete = DidComplete;
	}

	layer.killed = true;

	Dispatch({
		type: "layer_unload",
		name,
		payload: layer.payload
	});

	let index = LayerFound(layer.uid, 'uid', null), // found index
		close = () => {
			try {
				Call(instance, "close", layer.element, layer.payload);

				if( typeof Props.garbage === "function" ) {
					try {
						Props.garbage( layer.element, layer.name, layer.id )
					}
					catch(e) {Log(e)}
				}

				HtmlLayer.removeChild( layer.element );
			}
			catch(e) {Log(e)}

			if(Layers.length) {
				complete()
			}
			else {
				LayerClose(complete)
			}
		};

	// layer not found

	if( index < 0 ) {
		if(blur) {
			return complete()
		}
		else {
			throw new Error(`Layer not found on stack`)
		}
	}

	// inject

	Layers.splice(index, 1);
	Depth();

	// hidden element ?

	if( layer.hidden ) {
		close()
	}
	else {
		ClassName.remove(layer.element, GetClassName('show'));
		Props.delay > 0 && request(() => {
			ClassName.add(layer.element, GetClassName('destroy'))
		});
		ChangeOpacity(false, layer.element, close);
	}
}

function LayerBack(complete)
{
	if( Layers.length < 1 ) {
		return complete()
	}

	let layer = Layers[Layers.length - 1],
		{name, instance} = layer;

	if( layer.killed ) {
		throw new Error(`Layer controller '${name}' did kill`)
	}

	if( Call(instance, "blur") === false ) {
		throw new Error(`Layer controller '${name}' cannot be closed (blur fail)`)
	}

	LayerDestroy(layer, false, complete)
}

function LayerOpen(complete)
{
	if( IsOpen )
	{
		complete()
	}
	else if( ! IsOpen )
	{
		ClassName.add(Html, GetClassName('open'));
		ClassName.add([HtmlLayer, HtmlBackground], GetClassName('opened'));
		Element.css('body', {overflow: 'hidden'});
		HtmlLayer.style.display = 'block';
		HtmlBackground.style.display = 'block';
		ChangeOpacity(true, HtmlBackground, Noop);
		ChangeOpacity(true, HtmlLayer, Noop);
		request(() => {
			IsOpen = true;

			Dispatch({
				type: "layer_open"
			});

			complete();
		});

		Off();

		Evn.on(
			"keyup",
			e => {
				let evn = WinEvents[Layer.name || ''],
					code = e.keyCode || 0;

				if( ! IsWait && evn && KeyCodes[code] )
				{
					code = KeyCodes[code];
					evn[code] && ! IsContentEditable(e) && evn[code](code, e) !== false && e.preventDefault()
				}
			},
			remove => {
				Off = () => {
					remove();
					Off = Noop
				}
			})
	}
}

function LayerClose(complete)
{
	if( IsOpen )
	{
		Off();
		ChangeOpacity(false, HtmlBackground, Noop);
		ChangeOpacity(false, HtmlLayer, () => {

			HtmlDataSet('');
			ClassName.remove(Html, GetClassName('open'));
			ClassName.remove([HtmlLayer, HtmlBackground], GetClassName('opened'));
			Element.css('body', {overflow: ''});
			HtmlLayer.style.display = 'none';
			HtmlBackground.style.display = 'none';

			IsOpen = false;

			Dispatch({
				type: "layer_close"
			});

			complete();
		})
	}
	else
	{
		complete()
	}
}

function CheckSingleton(name, id) {
	if( Singleton[name] && ! id ) {
		throw new Error(`Layer controller '${name}' is singleton and must use the id property`)
	}
	return Singleton[name]
}

const Layer =
{
	get name()
	{
		let index = Layers.length;
		return index > 0 && IsOpen ? Layers[index-1].name : null
	},

	get isOpened()
	{
		return IsOpen && Layers.length > 0
	},

	get isWait()
	{
		return IsWait
	},

	get depth()
	{
		return Layers.length
	},

	init(props = {})
	{
		if( !IsInitComplete )
		{
			IsInitComplete = true;
			if( typeof props === 'object' && props !== null ) {
				Object.assign(Props, props);
			}

			Evn.ready(Ready)
		}

		return Layer
	},

	register(name, object, data)
	{
		if( Keys.indexOf(name) < 0 )
		{
			Keys.push(name);
			Reg[name] = object;
			Initable[name] = data || {};
			Singleton[name] = typeof object === "function" && object.singleton === true;
		}

		return Layer
	},

	loaded(name)
	{
		return Keys.indexOf(name) > -1
	},

	fire(name, ...args)
	{
		name = String(name);
		if(Layer.isOpened && privates.indexOf(name) < 0) {
			return Call(Layers[Layers.length-1].instance, name, ...args)
		}
	},

	notWait()
	{
		IsNotWait = true;
		return Layer
	},

	open(name, data)
	{
		let not = NotWait();

		return new Promise((resolve, reject) => {
			if(IsWait) {
				not();
				Wait.push(() => {
					try {
						LayerPreload(name, data || {}, resolve, reject)
					}
					catch(e) {
						reject(e)
					}
				})
			}
			else {
				LayerPreload(name, data || {}, resolve, reject)
			}
		}).then(DidComplete, DidCompleteError);
	},

	toggle(name, data = {}, data_match = [])
	{
		let not = NotWait(),
			t = (resolve, reject) => {
				let single = CheckSingleton(name, data.id),
					found = LayerFound(name, 'name', single ? data.id : null),
					end = Layers.length - 1,
					open = false;

				if(found < 0 || found !== end) {
					open = true
				}
				else if(data_match.length) {
					for( let i = 0, layer = Layers[found], length = data_match.length, key; i < length; i++ ) {
						key = data_match[i];
						if(data[key] !== layer.payload[key]) {
							open = true;
							break;
						}
					}
				}

				if( open ) {
					LayerPreload(name, data, resolve, reject)
				}
				else if( Call(Layers[found].instance, "blur") === false ) {
					throw new Error(`Layer controller '${name}' cannot be closed (blur fail)`)
				}
				else {
					LayerDestroy(Layers[found], false, resolve)
				}
			};

		return new Promise((resolve, reject) => {
			if(IsWait) {
				not();
				Wait.push(() => {
					try {
						t(resolve, reject)
					}
					catch(e) {
						reject(e)
					}
				})
			}
			else {
				t(resolve, reject)
			}
		}).then(DidComplete, DidCompleteError);
	},

	focus(name, id = null)
	{
		let not = NotWait(),
			f = complete => {
				let single = CheckSingleton(name, id),
					found = LayerFound(name, 'name', single ? id : null), // found layer
					end = Layers.length - 1;

				if(found < 0) {
					throw new Error(`Layer is not opened`)
				}

				let layer = Layers[found],
					c = () => {
						complete(layer.payload)
					};

				if(found === end) {
					c()
				}
				else {
					Fade(found + 1);

					Layers.splice(found, 1);
					Layers.push(layer);
					Depth();
					IsWait = true;
					setTimeout(c, Props.delay || 0)
				}
			};

		return new Promise((resolve, reject) => {
			if(IsWait) {
				not();
				Wait.push(() => {
					try {
						f(resolve)
					}
					catch(e) {
						reject(e)
					}
				})
			}
			else {
				f(resolve)
			}
		}).then(DidComplete, DidCompleteError);
	},

	back()
	{
		let not = NotWait();
		return new Promise((resolve, reject) => {
			if(! Layer.isOpened) {
				resolve()
			}
			else if(IsWait) {
				not();
				Wait.push(() => {
					try {
						LayerBack(resolve)
					}
					catch(e) {
						reject(e)
					}
				})
			}
			else {
				LayerBack(resolve)
			}
		}).then(DidComplete, DidCompleteError);
	},

	closeDialog(name, id = null)
	{
		let not = NotWait(),
			f = complete => {
				let single = CheckSingleton(name, id),
					found = LayerFound(name, 'name', single ? id : null);

				if(found < 0) {
					complete()
				}
				else {
					LayerDestroy(Layers[found], true, complete)
				}
			};

		return new Promise((resolve, reject) => {
			if(IsWait) {
				not();
				Wait.push(() => {
					try {
						f(resolve)
					}
					catch(e) {
						reject(e)
					}
				})
			}
			else {
				f(resolve)
			}
		}).then(DidComplete, DidCompleteError);
	},

	close()
	{
		let not = NotWait(),
			end = func => {
				if( Layers.length ) {
					LayerBack(() => {
						IsWait = false;
						end(func)
					})
				}
				else {
					func()
				}
			};

		return new Promise((resolve, reject) => {
			if(! Layer.isOpened) {
				resolve()
			}
			else if(IsWait) {
				not();
				Wait.push(() => {
					try {
						end(resolve)
					}
					catch(e) {
						reject(e)
					}
				})
			}
			else {
				end(resolve)
			}
		}).then(DidComplete, DidCompleteError);
	}
};

export { Component, ComponentHistory };
export default Layer;