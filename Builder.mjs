import webpack from 'webpack';
import Events from 'node:events';
import { dirname, join } from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class Builder {
	get_errors(error, stats){
		const errors = [];
		
		if(error){
			errors.push(error);
		}
		
		if(typeof stats == 'object' && stats !== undefined && stats !== null){
			for(let error of stats.compilation.errors){
				if(error?.module){
					errors.push(`${error.module?.request}: ${error}`);
				}else{
					errors.push(error);
				}
			}
		}

		return errors;
	}
	webpacks = [];
	constructor(output){
		this.webpacks.push(webpack({
			mode: 'development',
			devtool: 'source-map',
			entry: {
				client: join(__dirname, 'Client', 'entry.mjs'),
				worker: join(__dirname, 'Worker', 'entry.mjs'),
			},
			context: __dirname,
			output: {
				path: output,
				filename: '[name].js',
			},
		}));
		
		this.webpacks.push(webpack({
			mode: 'development',
			devtool: 'source-map',
			entry: join(__dirname, 'Bootstrapper', 'Bootstrapper.mjs'),
			context: __dirname,
			output: {
				library: 'TOMPBoot',
			    libraryTarget: 'umd',
				libraryExport: 'default',
				path: output,
				filename: 'bootstrapper.js',
			},
		}));
		
	}
	build(){
		return Promise.all(this.webpacks.map(webpack => new Promise((resolve, reject) => {
			webpack.run((error, stats) => {
				const errors = this.get_errors(error, stats);
	
				if(errors.length){
					reject(errors);
				}else{
					resolve();
				}
			});
		})));
	}
	watch(){
		const emitter = new Events();
		
		const watch = Promise.all(this.webpacks.map(webpack => new Promise(resolve => setTimeout(() => {
			resolve(webpack.watch({}, (error, stats) => {
				const errors = this.get_errors(error, stats);
	
				if(errors.length){
					emitter.emit('error', errors);
				}else{
					emitter.emit('bulit');
				}
			}));
		}))));

		emitter.stop = async () => {
			(await watch).close();
		};

		return emitter;
	}
};