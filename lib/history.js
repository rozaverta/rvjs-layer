export default class History
{
	constructor()
	{
		let self = this;
		self.history = [];
		self.index = -1;
		Object.defineProperty(self, 'length', {
			get() {
				return self.history.length
			}
		})
	}

	forEach(func)
	{
		this.history.forEach(func)
	}

	forward()
	{
		let s = this;
		return s.index + 1 < s.length ? s.history[++s.index] : null
	}

	back()
	{
		let s = this;
		return s.index > 0 ? s.history[--s.index] : null
	}

	go(index)
	{
		index = index >> 0;
		let s = this;
		if(index >= 0 && index < s.length && typeof s.history[index]) {
			s.index = index;
			return s.history[index]
		}
		return null
	}

	replace(data)
	{
		let s = this;
		if(s.index > -1) {
			s.history[s.index] = Object.assign({}, data)
		}
		else {
			s.push(data)
		}
	}

	push(data)
	{
		let s = this;
		s.history = (s.index > -1 ? s.history.splice(0, s.index + 1) : []);
		s.history.push(Object.assign({}, data));
		s.index = s.length - 1;
	}

	clear()
	{
		let s = this;
		s.index = -1;
		s.history = [];
	}
}