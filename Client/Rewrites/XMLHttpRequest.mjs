import { Rewrite } from '../Rewrite.mjs';
import { global } from '../../Global.mjs';
import { wrap_function, Reflect } from '../RewriteUtil.mjs';
import { EventTarget_on, TargetConstant, DOMObjectConstructor, mirror_class } from '../NativeUtil.mjs';

export class XMLHttpRequestRewrite extends Rewrite {
	global = global.XMLHttpRequest;
	global_target = global.XMLHttpRequestEventTarget;
	work(){
		const instances = new WeakSet();
		const real = Symbol();
		const that = this;

		class XMLHttpRequestEventTargetProxy extends EventTarget {
			constructor(key){
				if(key === real){
					super();
					instances.add(this);
				}else{
					throw new TypeError(`Illegal constructor`);
				}
			}
		};

		const decoder = new TextDecoder('utf-8');

		const XMLHttpRequestResponseType = ['', 'arraybuffer', 'blob', 'document', 'json', 'text', 'moz-chunked-arraybuffer', 'ms-stream'];

		const UNSENT = 0;
		const OPENED = 1;
		const HEADERS_RECEIVED = 2;
		const LOADING = 3;
		const DONE = 4;
		
		class XMLHttpRequestProxy extends XMLHttpRequestEventTargetProxy {
			constructor(){
				super(real);
			}
			#headers = new Headers();
			#response_headers = new Headers();
			#method = '';
			#url = '';
			#async = false;
			#username = undefined;
			#password = undefined;
			#responseType = '';
			#readyState = UNSENT;
			#responseURL = '';
			#responseXML = null;
			#response = new Uint8Array();
			#dispatch_readyState(){
				if(!this.async && this.#readyState !== DONE){
					return;
				}

				this.dispatchEvent(new Event('readystatechange'));
			}
			get #loading_or_done(){
				return this.#readyState === LOADING || this.#readyState === DONE;
			}
			get #is_text(){
				return this.#responseType === '' || this.#responseType === 'text';
			}
			get responseText(){
				if(!this.#is_text){
					throw new DOMException(`Failed to read the 'responseText' property from 'XMLHttpRequest': The value is only accessible if the object's 'responseType' is '' or 'text' (was '${this.#responseType}').`)
				}

				return decoder.decode(this.#response);
			}
			get responseXML(){
				return this.#responseXML;
			}
			get responseType(){
				return this.#responseType;
			}
			set responseType(value){
				if(this.#loading_or_done){
					throw new DOMException(`Failed to set the 'responseType' property on 'XMLHttpRequest': The response type cannot be set if the object's state is LOADING or DONE.`);
				}else if(!this.#async){
					throw new DOMException(`Failed to set the 'responseType' property on 'XMLHttpRequest': The response type cannot be changed for synchronous requests made from a document.`)
				}

				if(!XMLHttpRequestResponseType.includes(value)){
					console.warn(`The provided value 'test' is not a valid enum value of type XMLHttpRequestResponseType.`);
					return;
				}

				this.#responseType = value;
				return value;
			}
			get readyState(){
				return this.#readyState;
			}
			get responseURL(){
				return this.#responseURL;
			}
			get response(){
				if(this.#is_text){
					return this.responseText;
				}else if(this.#responseType === 'arraybuffer'){
					return this.#response.buffer;
				}else if(this.#responseType === 'document'){
					return this.#responseXML;
				}

				return this.#response;
			}
			#on_headers(error, response){
				this.#readyState = HEADERS_RECEIVED;
				this.#responseURL = response.url;
				this.#response_headers = response.headers;
				this.#dispatch_readyState();

				this.#readyState = LOADING;
				this.#dispatch_readyState();

				/*
				// chrome doesn't dispatch loadstart
				this.dispatchEvent(new ProgressEvent('loadstart', {
					total: response.headers.get('content-length') || 1000
				}));
				*/
			}
			#on_done(error, response, buffer){
				this.#readyState = DONE;
				this.#response = buffer;

				this.#dispatch_readyState();

				this.dispatchEvent(new ProgressEvent('load', {
					total: response.headers.get('content-length') || 1000
				}));

				this.dispatchEvent(new ProgressEvent('loadend', {
					total: response.headers.get('content-length') || 1000
				}));
			}
			#fetch(url, init){
				if(this.#async){
					Reflect.apply(that.client.request.global_fetch, global, [ url, init ]).then(async response => {
						this.#on_headers(undefined, response);
						const buffer = await response.arrayBuffer();
						this.#on_done(undefined, response, buffer);
					}).catch(error => this.#on_done(error));	
				}else{
					const response = that.client.sync.fetch(url, init);
					this.#on_headers(undefined, response);
					this.#on_done(undefined, response, response.rawArrayBuffer);
				}
			}
			open(method, url, async, username, password){
				this.#readyState = OPENED;
				this.#method = String(method);
				
				this.#url = String(url);
				
				if(async){
					this.#async = true;
				}else{
					this.#async = false;
				}

				if(username){
					this.#username = String(password);
				}else{
					this.#username = undefined;
				}
				
				if(password){
					this.#password = String(password);
				}else{
					this.#password = undefined;
				}
				
				// this.#dispatch_readyState();
			}
			setRequestHeader(header, value){
				if(this.#readyState !== OPENED){
					throw new DOMException(`Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.`);
				}

				// behavior is equal to append
				this.#headers.append(header, value);
			}
			send(body){
				this.#readyState = OPENED;

				this.#fetch(that.client.tomp.binary.serve(new URL(this.#url, that.client.base), that.client.base), {
					method: this.#method,
					headers: this.#headers,
				});
			}
			getResponseHeader(header){
				return this.#response_headers.get(header);
			}
			getAllResponseHeaders(){
				let result = '';

				for(let [ header, value ] of this.#response_headers){
					result += `${header}: ${value}\r\n`;
				}

				return result;
			}
		};

		XMLHttpRequestProxy = DOMObjectConstructor(XMLHttpRequestProxy);
		XMLHttpRequestEventTargetProxy = DOMObjectConstructor(XMLHttpRequestEventTargetProxy);

		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'abort');
		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'error');
		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'load');
		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'loadend');
		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'loadstart');
		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'progress');
		EventTarget_on(XMLHttpRequestEventTargetProxy.prototype, 'timeout');

		EventTarget_on(XMLHttpRequestProxy.prototype, 'readystatechange');
		TargetConstant(XMLHttpRequestProxy, 'UNSENT', UNSENT);
		TargetConstant(XMLHttpRequestProxy, 'OPENED', OPENED);
		TargetConstant(XMLHttpRequestProxy, 'HEADERS_RECEIVED', HEADERS_RECEIVED);
		TargetConstant(XMLHttpRequestProxy, 'LOADING', LOADING);
		TargetConstant(XMLHttpRequestProxy, 'DONE', DONE);

		mirror_class(this.global, XMLHttpRequestProxy, instances);
		mirror_class(this.global_target, XMLHttpRequestEventTargetProxy, instances);

		global.XMLHttpRequest = XMLHttpRequestProxy;
		global.XMLHttpRequestEventTarget = XMLHttpRequestEventTargetProxy;
	}
};