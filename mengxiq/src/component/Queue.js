import QueueItem from "./QueueItem";
import { useState, useEffect } from 'react';
import { TextInput } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { priorityLevelMap, priorityLevelMapKeys } from "./Common"

function Queue() {
  const [items, setItems] = useState([]);
  const [curDescription, setCurDescription] = useState("");
  const [curLink, setCurLink] = useState("");
  const [curPriorityId, setCurPriorityId] = useState("select_priority");

  useEffect(() => {
    // Fetch from DB
    fetch("http://localhost:8000/items")
      .then(res => res.json())
      .then((result) => {
        console.log(result);
        if (result.length > 0) {
          setItems(result);
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

    // Store to DB
    fetch(
      "http://localhost:8000/items",
      {
        method: "POST",
        body: JSON.stringify(newItem),
        headers: {"Content-Type": "application/json"},
      }
    )
  }

  function deleteItem(id) {
    // console.log("deleteItem function called with id: " + id);
    const newItems = items.filter(e => e.id !== id).slice();
    // console.log("new items: ");
    // console.log(newItems);
    setItems(newItems);

    // Remove from DB
    fetch(
      "http://localhost:8000/items/" + id,
      {method: "DELETE"}
    )
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
                  return <option value={id}>{priorityLevelMap[id].display}</option>
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

      <table style={{ 'margin-top': '15px' }}>
        {items.map(function (d) {
          return <QueueItem
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
