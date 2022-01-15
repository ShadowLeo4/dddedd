// WIP
export const protocols = ['http:','https:'];

export class RewriteURL {
	constructor(tomp){
		this.tomp = tomp;
	}
	wrap(url, key){
		const og = new URL(url);
		const protoi = protocols.indexOf(og.protocol);
		if(protoi == -1)throw new RangeError(`Unsupported protocol '${og.protocol}'`);
		const protobyte = String.fromCharCode(protoi);
		const field = encodeURIComponent(this.tomp.codec.wrap(og.host, key)) + '/' + protobyte + this.tomp.codec.wrap(og.pathname + og.search, key);
		
		return field;
	}
	unwrap(url, key){
		const slash = url.indexOf('/');
		const host = this.tomp.codec.unwrap(decodeURIComponent(url.slice(0, slash)), key);
		const protocol = protocols[url.charCodeAt(slash + 1)];
		const path = this.tomp.codec.unwrap(decodeURIComponent(url.slice(slash + 2)), key);
		
		// console.log(`${url} =>`, { host, protocol, path });
		return `${protocol}//${host}${path}`;
	}
};