Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let node_buffer = require("node:buffer");
let node_stream = require("node:stream");
let plugin_error = require("plugin-error");
plugin_error = __toESM(plugin_error, 1);
let pug = require("pug");
//#region src/gpug.ts
function gpug(options = {}) {
	return new node_stream.Transform({
		objectMode: true,
		transform(file, _enc, cb) {
			if (file.isNull()) return cb(null, file);
			if (file.isStream()) return cb(new plugin_error.default("gpug", "Streams are not supported"));
			if (!file.isBuffer()) return cb(new plugin_error.default("gpug", "Unsupported file contents type", { fileName: file.path }));
			const opts = {
				...options,
				filename: file.path
			};
			const locals = {
				...opts.data,
				...file.data
			};
			try {
				const compiled = (0, pug.compile)(file.contents.toString("utf8"), opts)(locals);
				file.contents = node_buffer.Buffer.from(compiled);
				file.extname = ".html";
				cb(null, file);
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				cb(new plugin_error.default("gpug", error, {
					fileName: file.path,
					showStack: true
				}));
			}
		}
	});
}
//#endregion
exports.gpug = gpug;
