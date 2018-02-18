
import Component from "./component";
import History from "./history";

export default class ComponentHistory extends Component
{
	constructor(data)
	{
		super(data);
		this.history = new History();
	}

	save(newData, oldData) {
		return newData.id !== oldData.id
	}
}