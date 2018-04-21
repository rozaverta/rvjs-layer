import {Log} from "rvjs-tools";

export default class Component
{
	load(html) {
		let text = "load function must be overloaded";

		if(!html.firstChild && typeof document !== 'undefined' ) {

			let st = html.style;

			st.padding = "20px";
			st.background = "white";
			st.border = "3px solid #900";
			st.fontSize = "20px";

			html.appendChild(
				document.createTextNode(text)
			)
		}
		else {
			Log(new Error(text))
		}
	}

	blur() { return true }
	focus() { return true }
	update() { return true }
	fade() { return true }
	close() {}
}