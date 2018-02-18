"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = Log;
var Production = false;

try {
	Production = process.env.NODE_ENV === 'production';
} catch (e) {}

function Log(e) {
	if (!Production) {
		console.log("Layer error >>", e);
	}
}