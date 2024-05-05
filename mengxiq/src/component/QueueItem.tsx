import { priorityLevelMap } from "../model/Priority"

function QueueItem(
  props: {
    description: string,
    link: string,
    priorityId: string,
    deleteFuncion: () => void,
    reportFuncion: () => void,
  }
): JSX.Element {
  return (
    <tr>
      <td>{props.description}</td>
      <td><a href={props.link} target="_blank" rel="noopener noreferrer">reference link</a></td>
      <td>{priorityLevelMap.get(props.priorityId)?.display}</td>
      <td>
        <button>Edit</button>
        <button className="btn-report-queue-item" onClick={props.reportFuncion}>Done/Report</button>
        <button className="btn-delete-queue-item" onClick={props.deleteFuncion}>Delete</button>
      </td>
    </tr>
  );
}

export default QueueItem;
