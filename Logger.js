export const LOG_TRACE = 0;
export const LOG_DEBUG = 1;
export const LOG_INFO = 2;
export const LOG_WARN = 3;
export const LOG_ERROR = 4;
export const LOG_SILENT = 5;

const trace = /*#__PURE__*/ console.trace.bind(console);
const debug = /*#__PURE__*/ console.debug.bind(console);
const info = /*#__PURE__*/console.info.bind(console);
const warn = /*#__PURE__*/ console.warn.bind(console);
const error = /*#__PURE__*/ console.error.bind(console);

export default class Logger {
	levels = ['trace','debug','info','warn','error','silent'];
	constructor(loglevel){
		this.loglevel = loglevel;
	}
	trace(...args){
		if(this.loglevel <= LOG_TRACE)trace('[TOMP]', ...args);
	}
	debug(...args){
		if(this.loglevel <= LOG_DEBUG)debug('[TOMP]', ...args);
	}
	info(...args){
		if(this.loglevel <= LOG_INFO)info('[TOMP]', ...args);
	}
	warn(...args){
		if(this.loglevel <= LOG_WARN)warn('[TOMP]', ...args);
	}
	error(...args){
		if(this.loglevel <= LOG_ERROR)error('[TOMP]', ...args);
	}
};
