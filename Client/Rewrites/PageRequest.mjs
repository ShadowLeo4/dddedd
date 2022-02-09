import { Rewrite } from '../Rewrite.mjs';
import { global } from '../../Global.mjs';
import { wrap_function, Reflect } from '../RewriteUtil.mjs';

const beacon_protocols = ['http:','https:'];

export class PageRequestRewrite extends Rewrite {
	xml_data = new WeakMap();
	handle_xml_request(xml, data, body){
		if(data.async){
			
		}
	}
	xml_on_response(response){

	}
	work(){
		global.open = wrap_function(global.open, (target, that, [ url, tar, features ]) => {
			url = new URL(url, this.location.proxy);
			url = this.client.tomp.html.serve(url, this.client.base);
			return Reflect.apply(target, that, [ url, tar, features ]);
		});

		global.URL.createObjectURL = wrap_function(global.URL.createObjectURL, (target, that, args) => {
			let result = Reflect.apply(target, that, args);
			result = result.replace(this.client.location.global.origin, this.client.location.proxy.origin);
			return result;
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
		
		XMLHttpRequest.prototype.open = wrap_function(XMLHttpRequest.prototype.open, (target, that, [method, url, async, username, password]) => {
			const data = {
				headers: {},
				url,
				method,
				async,
				username,
				password,
			};
			
			Reflect.setPrototypeOf(data.headers, null);
			
			this.xml_data.set(that, data);
			
			url = this.client.tomp.binary.serve(new URL(url, this.client.base), this.client.base);
			return Reflect.apply(target, that, [ method, url, async, username, password ]);
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