import { Rewrite } from '../Rewrite.mjs';
import { global } from '../../Global.mjs';
import { global_client } from '../../RewriteJS.mjs';
import { getOwnPropertyDescriptors, mirror_attributes, Reflect, wrap_function } from '../RewriteUtil.mjs';

export class WindowRewrite extends Rewrite {
	restricted = new WeakMap();
	same_origin(window){
		return window[global_client].base.toOrigin() === this.client.base.toOrigin();
	}
	restrict_function(target){
		const restricted = () => {};
		
		restricted.toString = () => {
			return this.client.native.left + this.client.native.right;
		};

		Reflect.defineProperty(restricted, 'name', {
			value: '',
			writable: false,
			enumerable: false,
			configurable: true,
		});
		
		Reflect.defineProperty(restricted, 'length', {
			value: target.length,
			writable: false,
			enumerable: false,
			configurable: true,
		});
		
		return wrap_function(restricted, (r, that, args) => {
			return Reflect.apply(target, that, args);
		});
	}
/*
{
	const parent_keys = Reflect.ownKeys(parent);
	const parent_location_keys = Reflect.ownKeys(parent.location);
	const similar = [];

	for(let key of parent_keys){
		if(parent_location_keys.includes(key)){
			similar.push(key);
		}
	}

	console.log(similar);
}
*/
	unknown = ['then', Symbol.toStringTag, Symbol.hasInstance, Symbol.isConcatSpreadable];
	restrict_object(object){
		Reflect.setPrototypeOf(object, null);

		for(let unknown of this.unknown){
			Reflect.defineProperty(object, unknown, {
				value: undefined,
				writable: false,
				enumerable: false,
				configurable: false,
			});	
		}
		
		for(let name of Reflect.ownKeys(object)){
			const descriptor = Reflect.getOwnPropertyDescriptor(object, name);

			if(!descriptor?.configurable)continue;

			if('value' in descriptor){
				descriptor.writable = false;
				if(typeof descriptor.value === 'function'){
					this.restrict_function(descriptor.value);
				}
			}
			
			if('get' in descriptor && typeof descriptor.get === 'function'){
				descriptor.get = this.restrict_function(descriptor.get);
			}
			
			if('set' in descriptor && typeof descriptor.set === 'function'){
				descriptor.set = this.restrict_function(descriptor.set);
			}

			Reflect.defineProperty(object, name, descriptor);
		}
		
		const proxy = new Proxy(object, {
			get: (target, prop, receiver) => {
				const descriptor = Reflect.getOwnPropertyDescriptor(object, prop);
				
				if(!(prop in object) || !('value' in descriptor) && typeof descriptor.get !== 'function'){
					this.restrict();
				}

				return Reflect.get(target, prop, receiver);
			},
			set: (target, prop, value) => {
				const descriptor = Reflect.getOwnPropertyDescriptor(object, prop);

				if(!(prop in object) || typeof descriptor.set !== 'function'){
					this.restrict();
				}

				return Reflect.set(target, prop, value);
			},
			defineProperty: (target, prop, descriptor) => {
				this.restrict();
				/*if(!(prop in object)){
					this.restrict();
				}

				return Reflect.defineProperty(target, prop, descriptor);*/
			},
			getOwnPropertyDescriptor: (target, prop, descriptor) => {
				if(!(prop in object)){
					this.restrict();
				}

				return Reflect.getOwnPropertyDescriptor(target, prop, descriptor);
			},
			setPrototypeOf: (target, prop, descriptor) => {
				this.restrict();	
			},
		});

		return proxy;
	}
	postMessage(targetWindow, message, targetOrigin, transfer){
		// console.assert(this.restricted.has(targetWindow), 'Unknown target:', targetWindow);
		if(!this.restricted.has(targetWindow)){
			throw new TypeError('Illegal invocation');	
		}

		const window = this.restricted.get(targetWindow);

		window.dispatchEvent(new MessageEvent('message', {
			data: message,
			origin: this.client.base.toOrigin(),
			source: global,
		}));
	}
	restrict(){
		throw new DOMException(`Blocked a frame with "${this.client.base.toOrigin()}" from accessing a cross-origin frame.`)
	}
	new_restricted(window){
		const that = this;

		const location = {
			replace(url){
				window.location.replace(that.client.tomp.html.serve(new URL(url, that.client.base), that.client.base));
			},
			set href(url){
				window.location.href = that.client.tomp.html.serve(new URL(url, that.client.base), that.client.base);
			},
		};

		const restricted_location = this.restrict_object(location);

		let restricted;
		
		const target = {
			'0': global,
			get top(){
				return this.restrict_window(window.top);
			},
			get parent(){
				return this.restrict_window(window.parent);
			},
			get opener(){
				return this.restrict_window(window.opener);
			},
			get self(){
				return this.restrict_window(window);
			},
			get frames(){
				return this.restrict_window(window);
			},
			get window(){
				return this.restrict_window(window);
			},
			blur(){
				window.blur();
			},
			focus(){
				window.focus();
			},
			close(){
				window.close();
			},
			get closed(){
				return window.closed;
			},
			get length(){
				return window.length;
			},
			get location(){
				return restricted_location;
			},
			set location(url){
				window.location.href = that.client.tomp.html.serve(new URL(url, that.client.base), that.client.base);
			},
			postMessage: function(...args){
				if(args.length < 1){
					throw new TypeError(`Failed to execute 'postMessage' on 'Window': 1 argument required, but only ${args.length} present.`);
				}
		
				return that.postMessage(this, ...args);
			},
		};
		
		restricted = this.restrict_object(target);

		return restricted;
	}
	restrict_window(window){
		if(!(global_client in window)){
			return null;
		}

		if(this.client.window.same_origin(window)){
			return window;
		}
		
		if(!this.restricted.has(window)){
			const restricted = this.new_restricted(window);
			
			this.restricted.set(window, restricted);
			this.restricted.set(restricted, window);
		}

		return this.restricted.get(window);
	}
};