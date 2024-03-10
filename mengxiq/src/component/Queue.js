import QueueItem from "./QueueItem";
import { useState, useEffect } from 'react';
import { TextInput } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { priorityLevelMap, priorityLevelMapKeys } from "./Common"
import { addItemDb, deleteItemDb, getQueueDb } from "../db/JsonServer";

function Queue({qid}) {
  const queue_url = "http://localhost:8000/queues/" + qid
  const [items, setItems] = useState([]);
  const [curDescription, setCurDescription] = useState("");
  const [curLink, setCurLink] = useState("");
  const [curPriorityId, setCurPriorityId] = useState("select_priority");

  useEffect(() => {
    getQueueDb(qid)
      .then((result) => {
        console.log(result);
        if (result !== null) {
          setItems(result.items);
        }
      });
  }, []);

  function handleAddItem() {
    const newItems = items.slice();
    const newItem = {
      description: curDescription,
      link: curLink,
      id: uuidv4(),
      created_time: Date.now(),
      priorityId: curPriorityId
    }
    newItems.push(newItem);
    newItems.sort((a, b) => {
      let cmp = priorityLevelMap[b.priorityId].rank - priorityLevelMap[a.priorityId].rank;
      if (cmp !== 0) {
        return cmp;
      } else {
        return a.created_time - b.created_time;
      }
    })
    setItems(newItems);

    addItemDb(qid, newItem);
  }

  function deleteItem(itemId) {
    // console.log("deleteItem function called with id: " + id);
    const newItems = items.filter(e => e.id !== itemId).slice();
    // console.log("new items: ");
    // console.log(newItems);
    setItems(newItems);

    // Remove from DB
    deleteItemDb(qid, itemId);
  }

  return (
    <div>
      <table>
        <tr>
          <td>
            Link: <input onChange={(e) => setCurLink(e.target.value)} style={{ width: '500px' }} />
          </td>
          <td>
            <select onChangeCapture={(e) => setCurPriorityId(e.target.value)}>
              {
                priorityLevelMapKeys.map(function (id) {
                  return <option value={id} key={id}>{priorityLevelMap[id].display}</option>
                })
              }
            </select>
          </td>
        </tr>
      </table>
      <div style={{ width: '90%' }}>
        <span style={{ width: '10%' }}>Description</span>
        <TextInput
          multiline={true}
          numberOfLines={5}
          style={{ width: '90%' }}
          onChangeText={text => setCurDescription(text)}
          placeholder="Enter item description"
        />
      </div>
      <div style={{ width: '90%' }}>
        <button
          style={{ width: '65%' }}
          onClick={handleAddItem}
        >
          Add item
        </button>
        <button style={{ width: '35%' }}>Hide</button>
      </div>

      <table style={{ 'marginTop': '15px' }}>
        {items.map(function (d) {
          return <QueueItem
            key={d.id}
            description={d.description}
            link={d.link}
            priorityId={d.priorityId}
            deleteFuncion={() => deleteItem(d.id)}
          />
        })}
      </table>
    </div>
  );
}

export default Queue;
