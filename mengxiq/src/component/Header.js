import { useState, useEffect } from 'react';
import { listQueuesDb } from '../db/JsonServer';

function Header({setQid}) {

  const [curCreateQueueName, setCurCreateQueueName] = useState("");
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    listQueuesDb().then(result => {
      setQueues(result);
      if (result !== null) {
        setQid(result[0].id);
      }
    });
  }, []);

	return (
		<div>
			<table>
				<tr>
					<td>Current Queue Name</td>
					<td>
						<select onChange={(e) => setQid(e.target.value)}>
              {queues.map(function (e) {
                return <option value={e.id}>{e.name}</option>
              })}
						</select>
					</td>
					<td>
            <input onChange={e => setCurCreateQueueName(e.target.value)} />
            <button>Create New Queue</button>
          </td>
				</tr>
			</table>
		</div>
	);
}

export default Header;
