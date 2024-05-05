import QueueItem from "./QueueItem";
import { useState, useEffect } from 'react';
import { TextInput } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { priorityLevelMap, priorityLevelMapKeys } from "../model/Priority"
import { addItemDb, deleteItemDb, getQueueDb } from "../db/JsonServer";
import { ToDoItem } from "../model/ToDoItem";

function Queue(
  props: {qid: string}
): JSX.Element {
  const [items, setItems] = useState<ToDoItem[]>([]);
  const [curDescription, setCurDescription] = useState<string>("");
  const [curLink, setCurLink] = useState("");
  const [curPriorityId, setCurPriorityId] = useState("select_priority");

  const sortAlg = (a: ToDoItem, b: ToDoItem) => {
    let cmp = priorityLevelMap.get(b.priorityId)!.rank - priorityLevelMap.get(a.priorityId)!.rank;
    if (cmp !== 0) {
      return cmp;
    } else {
      return a.created_time - b.created_time;
    }
  }

  useEffect(() => {
    console.log("Fetching queue info for: " + props.qid);
    getQueueDb(props.qid)
      .then((result) => {
        // console.log(result);
        if (result !== null) {
          result.items.sort(sortAlg)
          setItems(result.items);
        }
      });
  }, [props.qid]);

  function handleAddItem() {
    const newItems = items.slice();
    const newItem = new ToDoItem(
      curDescription,
      curLink,
      uuidv4(),
      Date.now(),
      curPriorityId,
    );
    newItems.push(newItem);
    newItems.sort(sortAlg);

    setItems(newItems);
    addItemDb(props.qid, newItem);
  }

  function deleteItem(itemId: string) {
    // console.log("deleteItem function called with id: " + id);
    const newItems = items.filter(e => e.id !== itemId).slice();
    // console.log("new items: ");
    // console.log(newItems);
    setItems(newItems);

    // Remove from DB
    deleteItemDb(props.qid, itemId);
  }

  return (
    <div>
      <table>
        <tr>
          <td>
            Link: <input onChange={(e) => setCurLink(e.target.value)} style={{ width: '500px' }} />
          </td>
          <td>
            <select onChangeCapture={(e: React.ChangeEvent<HTMLSelectElement>) => setCurPriorityId(e.target.value)}>
              {
                priorityLevelMapKeys.map(function (id) {
                  return <option value={id} key={id}>{priorityLevelMap.get(id)!.display}</option>
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
