
function Header({setQid}) {
	return (
		<div>
			<table>
				<tr>
					<td>Current Queue Name</td>
					<td>
						<select onChange={(e) => setQid(e.target.value)}>
							<option value="4153459b-4080-49ac-815a-f5ba7274ccd8">P2</option>
							<option value="4153459b-4080-49ac-815a-f5ba7274ccd1">DevOps</option>
							{/* <option>Feature request</option>
							<option>Lunch and learn</option>
							<option>Spike</option> */}
						</select>
					</td>
					<td><button>Create New Queue</button></td>
				</tr>
			</table>
		</div>
	);
}

export default Header;
