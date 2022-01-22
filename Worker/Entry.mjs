import { Server } from './Server.mjs';

const params = new URLSearchParams(location.search);
const config = JSON.parse(params.get('config'));
config.directory = new URL('.', location).pathname;
const server = new Server(config);

self.addEventListener('install', event => {
	server.tomp.log.debug('Installed');
});

self.addEventListener('fetch', event => {
	const {request} = event;
	
	if(server.request(event))return; // handled 
});

self.addEventListener('activate', event => {
	server.tomp.log.debug('Now ready to handle fetches');
});

self.addEventListener('push', event => {
	server.tomp.log.debug('Push', event.request.url);
});