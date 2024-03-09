
function Header() {
	return (
		<div>
			<table>
				<tr>
					<td>Current Queue Name</td>
					<td>
						<select>
							<option>P2</option>
							<option>DevOps</option>
							<option>Feature request</option>
							<option>Lunch and learn</option>
							<option>Spike</option>
						</select>
					</td>
					<td><button>Create New Queue</button></td>
				</tr>
			</table>
		</div>
	);
}

export default Header;
