import QueueItem from "./QueueItem";
import { useState } from 'react';
import { TextInput } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

function Queue() {
	const [items, setItems] = useState([]);
	const [curDescription, setCurDescription] = useState("");

	function handleAddItem() {
		const newItems = items.slice();
		newItems.push({description: curDescription, link: "link", priority: "priority", id: uuidv4()});
		setItems(newItems);
	}

	function deleteItem(id) {
		// console.log("deleteItem function called with id: " + id);
		const newItems = items.filter(e => e.id !== id).slice();
		// console.log("new items: ");
		// console.log(newItems);
		setItems(newItems);
	}

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
			<div style={{width: '90%'}}>
				<span style={{width: '10%'}}>Description</span>
				<TextInput 
					multiline={true}
					numberOfLines={5}
					style={{width: '90%'}}
					onChangeText={text => setCurDescription(text)}
					placeholder="Enter item description"
				/>
			</div>
			<div style={{width: '90%'}}>
				<button
					style={{width: '65%'}}
					onClick={handleAddItem}
				>
					Add item
				</button>
				<button style={{width: '35%'}}>Hide</button>
			</div>

			<table style={{'margin-top': '15px'}}>
				{items.map(function(d){
         	return <QueueItem
						description={d.description}
						link={d.link}
						priority={d.priority}
						deletFuncion={() => deleteItem(d.id)}
					/>
       	})}
			</table>
		</div>
	);
}

export default Queue;
