import QueueItem from "./QueueItem";

function Queue() {
	const items = [
		{description: "Ask Ann for task1, this is a very very very long description", link: "https://abd.talk.com", priority: "Do it now"},
		{description: "Spike why B happened", link: "https://abd.talk.com", priority: "Moon shooting"}
	]
	return (
		<div>
			<table>
				<tr>
					<td>Link: <input style={{width: '500px'}}/></td>
					<td>
						<select>
							<option>Do it now</option>
							<option>Important doable</option>
							<option>Low-hanging fruit</option>
							<option>Moon shooting</option>
						</select>
					</td>
				</tr>
			</table>
			<div class="input-group" style={{width: '90%', height: '200px'}}>
				<span class="input-group-text">Description</span>
				<textarea class="form-control" aria-label="With textarea"></textarea>
			</div>
			<div style={{width: '90%'}}>
				<button style={{width: '65%'}}>Add item</button>
				<button style={{width: '35%'}}>Hide</button>
			</div>
			<table style={{'margin-top': '15px'}}>
				{items.map(function(d){
         	return <QueueItem
						description={d.description}
						link={d.link}
						priority={d.priority}
					/>
       	})}
			</table>
		</div>
	);
}

export default Queue;
