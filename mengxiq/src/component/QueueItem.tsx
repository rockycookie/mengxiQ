import { priorityLevelMap } from "../model/Priority"

function QueueItem(
  props: {
    description: string,
    link: string,
    priorityId: string,
    deleteFuncion: () => void
  }
): JSX.Element {
  return (
    <tr>
      <td>{props.description}</td>
      <td><a href={props.link} target="_blank" rel="noopener noreferrer">reference link</a></td>
      <td>{priorityLevelMap.get(props.priorityId)?.display}</td>
      <td>
        <button>Edit</button>
        <button onClick={props.deleteFuncion}>Done/Delete</button>
      </td>
    </tr>
  );
}

export default QueueItem;
