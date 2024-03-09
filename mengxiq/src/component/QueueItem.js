
function QueueItem({ description, link, priority, deleteFuncion }) {
	return (
		<tr>
			<td>{description}</td>
			<td><a href={link}>{link}</a></td>
			<td>{priority}</td>
			<td>
				<button>Edit</button>
				<button onClick={deleteFuncion}>Done/Delete</button>
			</td>
		</tr>
	);
}

export default QueueItem;
