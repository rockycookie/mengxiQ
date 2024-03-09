
function QueueItem({ description, link, priority, deletFuncion }) {
	return (
		<tr>
			<td>{description}</td>
			<td>{link}</td>
			<td>{priority}</td>
			<td>
				<button>Edit</button>
				<button onClick={deletFuncion}>Done/Delete</button>
			</td>
		</tr>
	);
}

export default QueueItem;
