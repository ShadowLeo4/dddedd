import { Client } from './Client.mjs';
import { HistoryRewrite } from './Rewrites/History.mjs';
import { HTMLRewrite } from './Rewrites/HTML.mjs';
import { StorageRewrite } from './Rewrites/Storage.mjs';

export class PageClient extends Client {
	static type = 'page';
	constructor(config){
		super(config);

		new HistoryRewrite(this).work();
		new StorageRewrite(this).work();
		new HTMLRewrite(this).work();
	}
};