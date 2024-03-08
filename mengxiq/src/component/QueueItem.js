
function QueueItem({ description, link, priority }) {
	return (
		<tr>
			<td>{description}</td>
			<td>{link}</td>
			<td>{priority}</td>
			<td>
				<button>Edit</button>
				<button>Done/Delete</button>
			</td>
		</tr>
	);
}

export default QueueItem;
