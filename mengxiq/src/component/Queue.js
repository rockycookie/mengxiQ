import QueueItem from "./QueueItem";

function Queue() {
	const items = [
		{description: "Ask Ann for task1", link: "https://abd.talk.com", priority: "Do it now"},
		{description: "Spike why B happened", link: "https://abd.talk.com", priority: "Moon shooting"}
	]
	return (
		<div>
			<table>
				<tr>
					<td><button style={{width: '100%'}}>Add item</button></td>
					<td>Description: <input/></td>
					<td>Link: <input/></td>
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
			<table>
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
