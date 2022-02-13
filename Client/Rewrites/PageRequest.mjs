import { Rewrite } from '../Rewrite.mjs';
import { global } from '../../Global.mjs';
import { wrap_function, Reflect, getOwnPropertyDescriptors } from '../RewriteUtil.mjs';

const beacon_protocols = ['http:','https:'];

const is_tomp = 'tompc$from_tomp';

export class PageRequestRewrite extends Rewrite {
	work(){
		global.open = wrap_function(global.open, (target, that, [ url, tar, features ]) => {
			url = new URL(url, this.client.base);
			url = this.client.tomp.html.serve(url, this.client.base);
			return Reflect.apply(target, that, [ url, tar, features ]);
		});

		global.postMessage = wrap_function(global.postMessage, (target, that, [ data, target_origin, transfer ]) => {
			const message = {
				[is_tomp]: true,
				data,
				target_origin,
				origin: this.client.base.toOrigin(),
			};

			return Reflect.apply(target, that, [ message, this.client.host.toOrigin(), transfer ]);
		});

		const message_data = new WeakMap();

		global.addEventListener('message', 	event => {
			if(typeof event.data === 'object' && event.data !== undefined && event.data[is_tomp]){
				message_data.set(event, event.data);
			}
		});

		const { data, origin } = getOwnPropertyDescriptors(MessageEvent.prototype);
		
		Reflect.defineProperty(MessageEvent.prototype, 'origin', {
			configurable: true,
			enumerable: true,
			get: wrap_function(origin.get, (target, that, args) => {
				if(message_data.has(that)){
					return message_data.get(that).origin;
				}

				return Reflect.apply(target, that, args);
			}),
		});

		Reflect.defineProperty(MessageEvent.prototype, 'data', {
			configurable: true,
			enumerable: true,
			get: wrap_function(data.get, (target, that, args) => {
				if(message_data.has(that)){
					return message_data.get(that).data;
				}

				return Reflect.apply(target, that, args);
			}),
		});

		AudioWorklet.prototype.addModule = wrap_function(AudioWorklet.prototype.addModule, (target, that, [ url, options ]) => {
			url = new URL(url, this.client.base);
			url = this.client.tomp.js.serve(url, this.client.base);
			// not a worker, worklet
			// worklets dont contain location etc
			// todo: rewrite MessageEvent.prototype.origin inside worklet
			return Reflect.apply(target, that, [ url, options ]);
		});

		Navigator.prototype.sendBeacon = wrap_function(Navigator.prototype.sendBeacon, (target, that, [url, data]) => {
			if(that != navigator)throw new TypeError('Illegal invocation');	
			
			url = new URL(url, this.client.base);
			
			if(!beacon_protocols.includes(url.protocol)){
				throw new TypeError(`Failed to execute 'sendBeacon' on 'Navigator': Beacons are only supported over HTTP(S).`);
			}

			url = this.client.tomp.binary.serve(url, this.client.base);
			return Reflect.apply(target, that, [url, data]);
		});
		
		/*XMLHttpRequest.prototype.setRequestHeader = wrap_function(XMLHttpRequest.prototype.setRequestHeader, (target, that, [header, value]) => {
			value = String(value);
			
			if(!that instanceof XMLHttpRequest){
				throw new TypeError('Illegal Invocation');
			}

			if(this.xml_data.has(that)){
				const data = this.xml_data.get(that);
				data.headers[header] = value;
				// if data is undefined, xmlhttprequest likely isnt open and therefore cant have any headers set
			}else{
				Reflect.apply(target, that, [header, value]);
				throw new Error('An unknown error occured');
			}
		});

		XMLHttpRequest.prototype.send = wrap_function(XMLHttpRequest.prototype.send, (target, that, [body]) => {
			if(this.xml_data.has(that)){
				const data = this.xml_data.get(that);

				data.headers['x-tomp-impl-names'] = JSON.stringify(Reflect.ownKeys(data.headers));

				data.body = body;

				this.handle_xml_request(that, data);
			}else{
				Reflect.apply(target, that, [body]);
				throw new Error('An unknown error occured');
			}
		});*/
	}
};