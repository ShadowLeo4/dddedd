import { RewriteURL } from './RewriteURL.mjs';
import { RewriteJS } from './RewriteJS.mjs';
import { RewriteCSS } from './RewriteCSS.mjs';
import { RewriteHTML } from './RewriteHTML.mjs';
import { RewriteForm } from './RewriteForm.mjs';
import { RewriteBinary } from './RewriteBinary.mjs';
import { Logger } from './Logger.mjs';
import { CodecInterface, PlainCodec, XORCodec, RC4Codec } from './Codec.mjs';

const codecs = [ PlainCodec, XORCodec, RC4Codec ];

export class TOMP {
	toJSON(){
		return {
			codec: codecs.indexOf(this.wrap),
			prefix: this.prefix,
			noscript: this.noscript,
		};
	}
	prefix = '/tomp/';
	codec = PlainCodec;
	loglevel = 0;
	noscript = false;
	constructor(config){
		if(typeof config.prefix == 'string'){
			this.prefix = config.prefix;
		}

		if(typeof config.codec == 'number'){
			config.codec = codecs[config.codec];
		}

		if(config.codec instanceof CodecInterface.constructor){
			this.codec = config.codec;
		}

		if(typeof config.loglevel == 'number'){
			this.loglevel = true;
		}

		if(config.noscript == true){
			this.noscript = config.noscript;
		}

		this.log = new Logger(this);
		this.url = new RewriteURL(this);
		this.js = new RewriteJS(this);
		this.css = new RewriteCSS(this);
		this.html = new RewriteHTML(this);
		this.binary = new RewriteBinary(this);
		this.form = new RewriteForm(this);
	}
};