import { global } from '../Global.mjs';

export const function_strings = new Map();

export const getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors.bind(Object);

// reflect functions may be updated during runtime
export const Reflect = {
	apply: global.Reflect.apply.bind(global.Reflect),
	construct: global.Reflect.construct.bind(global.Reflect),
	defineProperty: global.Reflect.defineProperty.bind(global.Reflect),
	deleteProperty: global.Reflect.deleteProperty.bind(global.Reflect),
	get: global.Reflect.get.bind(global.Reflect),
	getOwnPropertyDescriptor: global.Reflect.getOwnPropertyDescriptor.bind(global.Reflect),
	getPrototypeOf: global.Reflect.getPrototypeOf.bind(global.Reflect),
	isExtensible: global.Reflect.isExtensible.bind(global.Reflect),
	ownKeys: global.Reflect.ownKeys.bind(global.Reflect),
	preventExtensions: global.Reflect.preventExtensions.bind(global.Reflect),
	set: global.Reflect.set.bind(global.Reflect),
	setPrototypeOf: global.Reflect.setPrototypeOf.bind(global.Reflect),
};

export function mirror_attributes(from, to){
	function_strings.set(to, from.toString());
	Object.defineProperty(to, 'length', Object.getOwnPropertyDescriptor(from, 'length'));
	Object.defineProperty(to, 'name', Object.getOwnPropertyDescriptor(from, 'name'));
	return to;
};

const error_reporting = false;

function report_error(err){
	console.log('Caught error in wrapper:\n', err);
}

export function wrap_function(fn, wrap, construct){
	const wrapped = 'prototype' in fn ? function attach(...args){
		if(!error_reporting){
			return wrap(fn, this, args);
		}else try{
			return wrap(fn, this, args);
		}catch(err){
			report_error(err);
		}
	} : {
		attach(...args) {
			if(!error_reporting){
				return wrap(fn, this, args);
			}else try{
				return wrap(fn, this, args);
			}catch(err){
				report_error(err);
			}
		},
	}['attach'];
	
	mirror_attributes(fn, wrapped);
	
	if (!!construct) {
		wrapped.prototype = fn.prototype;
		wrapped.prototype.constructor = wrapped; 
	};

	return wrapped
};

export const native_proxies = new WeakMap();

export function resolve_native(proxy/*?*/){
	if(native_proxies.has(proxy))return native_proxies.get(proxy);
	else return proxy;
}

function pick_target(first, second, prop){
	if(prop in first){
		return first;
	}

	return second;
}

export function proxy_multitarget(first, second){
	return {
		get(_, prop, receiver){
			return Reflect.get(pick_target(first, second, prop), prop, receiver);
		},
		set(_, prop, value){
			return Reflect.set(pick_target(first, second, prop), prop, value);	
		},
		has(_, prop){
			return Reflect.has(pick_target(first, second, prop), prop);	
		},
		getOwnPropertyDescriptor(_, prop){
			const desc = Reflect.getOwnPropertyDescriptor(pick_target(first, second, prop), prop);
			Reflect.defineProperty(_, prop, desc);
			return desc;
		},
		defineProperty(_, prop, desc){
			Reflect.defineProperty(_, prop, desc);
			return Reflect.defineProperty(pick_target(first, second, prop), prop, desc);
		},
		deleteProperty(_, prop, descriptor){
			return Reflect.deleteProperty(pick_target(first, second, prop), prop, descriptor);
		},
	};
}

export function bind_natives(target){
	for(let prop in target){
		const desc = Object.getOwnPropertyDescriptor(target, prop);

		if(!desc?.configurable)continue;

		let changed = false;

		if(typeof desc.value == 'function'){
			desc.value = wrap_function(desc.value, (target, that, args) => {
				return Reflect.apply(target, resolve_native(that), args);
			});

			changed = true;
		}

		if(typeof desc.get == 'function'){
			desc.get = wrap_function(desc.get, (target, that, args) => {
				return Reflect.apply(target, resolve_native(that), args);
			});

			changed = true;
		}

		if(typeof desc.set == 'function'){
			desc.set = wrap_function(desc.set, (target, that, args) => {
				return Reflect.apply(target, resolve_native(that), args);
			});

			changed = true;
		}

		if(changed){
			Object.defineProperty(target, prop, desc);
		}
	}
}

// bind_natives(EventTarget.prototype);