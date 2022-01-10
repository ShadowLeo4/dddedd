import fs from 'fs';

import { Fetch } from './Fetch.mjs';
import { DecompressResponse } from './HTTPUtil.mjs'
import { MapHeaderNames, ObjectFromRawHeaders } from './HeaderUtil.mjs'
import { CompilationPath } from './Compiler.mjs';

// todo: cache
export async function SendScript(server, request, response){
	try{
		const handle = await fs.promises.open(CompilationPath, 'r');
		
		const { size } = await handle.stat();
		
		const buffer = Buffer.alloc(size);
		
		const { bytesRead } = await handle.read(buffer, 0, buffer.byteLength, 0);
		
		handle.close();

		if(bytesRead < buffer.byteLength)server.tomp.log.error('Error reading file');
		
		let script = buffer.toString();
		
		script = script.replace(/client_information/g, JSON.stringify([
			server.tomp,
			server.get_key(request),
		]));

		var send = Buffer.from(script);
	}catch(err){
		if(err.code == 'ENOENT'){
			return void server.send_json(response, 500, { message: server.messages['generic.error.notready'] });
		}else{
			server.tomp.log.error('Error reading backend compilation:', err);
			return void server.send_json(response, 500, { message: server.messages['generic.exception.request'] });
		}
	}
	
	response.writeHead(200, {
		'content-type': 'application/javascript',
		'content-length': send.byteLength,
	});
	response.write(send);
	response.end();
}

export async function SendBinary(server, server_request, server_response, field){
	const url = server.tomp.wrap.unwrap(decodeURIComponent(field), server.get_key(server_request));
			
	const request_headers = {...server_request.headers};
	request_headers.host = url.host;
	const response = await Fetch(server_request, request_headers, url);
	
	server_response.writeHead(response.statusCode, headers);
	stream.pipe(server_response);
}

export async function SendHTML(server, server_request, server_response, field){
	const key = server.get_key(server_request);
	const url = server.tomp.wrap.unwrap(decodeURIComponent(field), key);
	
	const request_headers = {...server_request.headers};
	MapHeaderNames(ObjectFromRawHeaders(server_request.rawHeaders), request_headers);

	const response = await Fetch(server_request, request_headers, url);
	const send = Buffer.from(server.tomp.html.wrap((await DecompressResponse(response)).toString(), key));
	const response_headers = Object.setPrototypeOf({...response.headers}, null);

	server.tomp.log.debug(url, response_headers);

	delete response_headers['x-frame-options'];
	response_headers['content-length'] = send.byteLength;
	delete response_headers['transfer-encoding'];
	delete response_headers['content-encoding'];
	delete response_headers['x-content-encoding'];
	
	MapHeaderNames(ObjectFromRawHeaders(response.rawHeaders), response_headers);
	server_response.writeHead(response.statusCode, response_headers);
	server_response.write(send);
	server_response.end();
}