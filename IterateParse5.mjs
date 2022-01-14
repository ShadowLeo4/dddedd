export class Parse5Context {
	root = false;
	attached = false;
	constructor(node, parent, root){
		this.node = node;

		if(parent instanceof Parse5Context){
			this.parent = parent;
			this.attached = true;
		}else if(!root){
			throw new TypeError(`New parent isnt an instance of Parse5Context.`);
		}

		if(root == true)this.root = true;
	}
	get type(){
		return this.node.nodeName;
	}
	// returns new context if this node is attached and in parent, false otherwise
	insert_before(node){
		if(this.root)throw new RangeError('Cannot insert before the root.');
		else if(!this.attached)throw new RangeError('Cannot insert before a detached node.');

		let place = this.parent.node.childNodes.indexOf(this.node);
		if(place == -1) return false;
		this.parent.node.childNodes.splice(place, 0, node);
		return new Parse5Context(node, this.parent);
	}
	// returns new context if this node is attached and in parent, false otherwise
	insert_after(node){
		if(this.root)throw new RangeError('Cannot insert after the root.');
		else if(!this.attached)throw new RangeError('Cannot insert after a detached node.');
		
		let place = this.parent.node.childNodes.indexOf(this.node);
		if(place == -1) return false;
		this.parent.node.childNodes.splice(place + 1, 0, node);
		return new Parse5Context(node, this.parent);
	}
	// returns new context if this node is attached and in parent, false otherwise
	replace_with(node){
		if(this.root)throw new RangeError('Cannot replace the root.');
		else if(!this.attached)throw new RangeError('Cannot replace a detached node.');
		
		let place = this.parent.node.childNodes.indexOf(this.node);
		if(place == -1) return false;
		this.parent.node.childNodes.splice(place, 0, node);
		this.attached = false;
		delete this.parent;
		return new Parse5Context(node, this.parent);
	}
	append(node){
		this.node.childNodes.push(node);
		return new Parse5Context(node, this);
	}
	// appends this to a context
	// returns true if successful, false otherwise
	// exception if context isnt an instance of Parse5Context
	attach(context){
		if(this.attached)throw new RangeError('Cannot attach an already attached node. Call .detach() first.');
		
		if(!(context instanceof Parse5Context)) throw new TypeError(`New parent isnt an instance of Parse5Context.`);
		this.parent = context;
		this.parent.append(this.node);
		return true;
	}
	// returns true if this node was detached from the parent, false otherwise
	detach(){
		if(this.root)throw new RangeError('Cannot detach the root.');
		if(!this.attached)throw new RangeError('Cannot detach an already detached node. Call .attach(context) first.');
		let place = this.parent.node.childNodes.indexOf(this.node);
		if(place == -1) return false;
		this.parent.node.childNodes.splice(place, 1, node);
		this.attached = false;
		delete this.parent;
		return true;
	}
};

export class Parse5Iterator {
	constructor(ast){
		this.stack = [new Parse5Context(ast, undefined, true)];
	}
	next(){
		if(!this.stack.length) return { value: undefined, done: true };
		
		const context = this.stack.pop();

		if(Array.isArray(context.node.childNodes)) {
			// insert new contexts in reverse order
			// not cloning arrays then reversing in the interest of optimization
			let start = this.stack.length - 1,
				length = context.node.childNodes.length;
			
			for(let node of context.node.childNodes){
				this.stack[start + length--] = new Parse5Context(node, context);
			}
		}

		return { value: context, done: false };
	}
	[Symbol.iterator](){
		return this;
	}
}