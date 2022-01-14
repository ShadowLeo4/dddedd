import {parse} from 'acorn';
import {generate} from 'escodegen';
import {AcornIterator} from './IterateAcorn.mjs';

export const global_client = 'tompc$';

export class RewriteJS {
	constructor(tomp){
		this.tomp = tomp;
	}
	wrap(code, url, key){
		const ast = parse(code, { ecmaVersion: 2020 });
		// unload from memory
		// code = null;

		for(let ctx of new AcornIterator(ast)){
			// console.log(ctx);
			switch(ctx.type){
				case'VariableDeclaration':

					// console.log(ctx.parent);
					if(ctx.parent.node == ast){
						console.log('top level var', ctx.like);
					}

					break;
			}
		}

		code = generate({
			type: 'WithStatement',
			object: {
				type: 'MemberExpression',
				object: {
					type: 'Identifier',
					name: global_client,
				},
				property: {
					type: 'Identifier',
					name: 'with',	
				},
				computed: false,
			},
			body: {
				type: 'BlockStatement',
				body: ast.body,
			},
		});
		return code;
	}
	unwrap(code, url, key){
		code = Buffer.from(code);
		return code.slice(12 + global_client.length, -1);
	}
	serve(url, key){
		return `${this.tomp.prefix}js/${encodeURIComponent(this.tomp.codec.wrap(url, key))}`
	}
};


/*
** determine if the code is within a scope
** if its top level, make all let call x.define.let()
** example
with(x.ctx){
	// let variable = false;
	window.variable = false;

	// let win = this;
	window.win = x.window
}
*/