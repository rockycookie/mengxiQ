import { useState, useEffect } from 'react';
import { createQueueDb, listQueuesDb } from '../db/JsonServer';

function Header({setQid}) {

  const [curCreateQueueName, setCurCreateQueueName] = useState("");
  const [queues, setQueues] = useState([]);
  const [curDisplayQueueId, setCurDisplayQueueId] = useState(null);
  const [triggerRerender, setTriggerRerender] = useState(0);

  useEffect(() => {
    listQueuesDb().then(result => {
      setQueues(result);
      if (result.length > 0) {
        if (curDisplayQueueId === null) {
          setQid(result[0].id);
        } else {
          setQid(curDisplayQueueId);
        }
      }
    });
  }, [curDisplayQueueId, triggerRerender]);

  function handleQueueCreation() {
    createQueueDb(curCreateQueueName)
      .then(() => {
        setTriggerRerender(triggerRerender + 1);
        listQueuesDb().then(result => {
          setQueues(result);
        });
      });
  }

	return (
		<div>
			<table>
				<tr>
					<td>Current Queue Name</td>
					<td>
						<select onChange={(e) => setCurDisplayQueueId(e.target.value)}>
              {queues.map(function (e) {
                return <option value={e.id}>{e.name}</option>
              })}
						</select>
					</td>
					<td>
            <input onChange={e => setCurCreateQueueName(e.target.value)} />
            <button onClick={handleQueueCreation}>Create New Queue</button>
          </td>
				</tr>
			</table>
		</div>
	);
}

export default Header;
