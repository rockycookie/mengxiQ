import { priorityLevelMap } from "./Common"

function QueueItem({ description, link, priorityId, deleteFuncion }) {
  return (
    <tr>
      <td>{description}</td>
      <td><a href={link}>{link}</a></td>
      <td>{priorityLevelMap[priorityId].display}</td>
      <td>
        <button>Edit</button>
        <button onClick={deleteFuncion}>Done/Delete</button>
      </td>
    </tr>
  );
}

export default QueueItem;
