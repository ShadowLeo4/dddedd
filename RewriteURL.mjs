import messages from './Messages.mjs';

// WIP
export const protocols =     ['http:','https:'];
export const default_ports = [80     ,443     ];

export class ParsedRewrittenURL {
	toString(){
		return `${this.protocol}//${this.host}${this.path}`;
	}
};

export class RewriteURL {
	constructor(tomp){
		this.tomp = tomp;
	}
	wrap(url, service){
		url = url.toString();

		const og = new URL(url);
		const protoi = protocols.indexOf(og.protocol);
		var port = parseInt(og.port);
		if(isNaN(port))port = default_ports[protoi];
		
		// android-app, ios-app, mailto, many other non-browser protocols
		if(protoi == -1)return url; // throw new RangeError(`Unsupported protocol '${og.protocol}'`);
		if(isNaN(port))throw new URIError(`Unknown default port for protocol: '${og.protocol}'`);

		const field = ((port << 4) + protoi).toString(16) + '/' + encodeURIComponent(og.pathname + og.search) + og.hash;
		return this.tomp.directory + service + '/' + og.host + '/' + field;
	}
	// only called in send.js get_data
	unwrap(field){
		field = field.toString();
		
		const hosti = field.indexOf('/', 1);
		const host = field.slice(1, hosti);
		
		const metai = field.indexOf('/', hosti + 1);
		
		const meta = parseInt(field.slice(hosti + 1, metai), 16);

		const port = meta >> 4;
		const protocol = protocols[meta & 0xF];

		const path = decodeURIComponent(field.slice(metai + 1));
		
		return Object.setPrototypeOf({
			protocol,
			path,
			port,
			host,
		}, ParsedRewrittenURL.prototype);
	}
	get_attributes(url){
		url = url.toString();

		const path = url.slice(this.tomp.directory.length);
		
		const si = path.indexOf('/', 1);
		
		/*if(si == -1 || qi == -1){
			throw { message: messages['error.badurl'] };
		}*/

		const result = {
			service: si == -1 ? path : path.slice(0, si),
			field: si == -1 ? '/' : path.slice(si),
		};

		return result
	}
	unwrap_ez(url){
		// cut all characters before the prefix, get the field, unwrap
		const cut = url.slice(url.indexOf(this.tomp.directory));
		const { field } = this.get_attributes(cut);

		return this.unwrap(field).toString();
	}
};