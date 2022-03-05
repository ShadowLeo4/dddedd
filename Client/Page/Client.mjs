import global from '../global.mjs';
import Client from '../Client.mjs';
import { SyncClient } from '../SyncClient.mjs';
import { Reflect } from '../RewriteUtil.mjs';
import HistoryRewrite from './Rewrites/History.mjs';
import DOMRewrite from './Rewrites/DOM.mjs';
import StorageRewrite from './Rewrites/Storage.mjs';
import DOMCookieRewrite from './Rewrites/DOMCookie.mjs';
import PageRequestRewrite from './Rewrites/PageRequest.mjs';
import IFrameRewrite from './Rewrites/IFrame.mjs';
import WindowRewrite from './Rewrites/Window.mjs';

export default class PageClient extends Client {
	static type = 'page';
	#baseURI_desc = Reflect.getOwnPropertyDescriptor(Node.prototype, 'baseURI');
	get #baseURI(){
		return Reflect.apply(this.#baseURI_desc.get, document, []);
	}
	get base(){
		return this.tomp.url.parse_url(this.tomp.url.unwrap_ez(this.#baseURI));
	}
	get host(){
		return this.tomp.url.parse_url(this.#baseURI);
	}
	constructor(config){
		super(config);
		
		for(let node of document.querySelectorAll('[data-is-tomp]')){
			node.remove();
		}

		this.sync = new SyncClient(this);
		this.history = new HistoryRewrite(this);
		this.storage = new StorageRewrite(this);
		this.dom = new DOMRewrite(this);
		this.cookie = new DOMCookieRewrite(this);
		this.page_request = new PageRequestRewrite(this);
		this.window = new WindowRewrite(this);
		this.iframe = new IFrameRewrite(this);

		this.work_modules();
	}
	work_modules(){
		super.work_modules();
		
		this.sync.work();
		this.window.work();
		this.iframe.work();
		this.history.work();
		this.storage.work();
		this.dom.work();
		this.cookie.work();
		this.page_request.work();

		delete global.CookieStore;
		delete global.cookieStore;
		delete global.CookieStoreManager;
		delete global.CookieChangeEvent;
		delete global.ServiceWorker;
		delete global.ServiceWorkerContainer;
		delete global.ServiceWorkerRegistration;
		delete Navigator.prototype.serviceWorker;
	}
};