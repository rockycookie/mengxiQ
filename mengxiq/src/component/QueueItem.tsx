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
  
  // Get priority styling
  const getPriorityStyle = (priorityId: string) => {
    const styles: { [key: string]: string } = {
      'do_it_now': 'border-red-500 priority-do-it-now',
      'important_doable': 'border-orange-500 priority-important-doable',
      'low_hanging_fruit': 'border-yellow-500 priority-low-hanging-fruit',
      'moon_shooting': 'border-blue-500 priority-moon-shooting',
      'select_priority': 'border-gray-300 priority-select',
    };
    return styles[priorityId] || 'border-gray-300';
  };

  const priorityDisplay = priorityLevelMap.get(props.priorityId)?.display || "Unknown";
  const borderColor = getPriorityStyle(props.priorityId);

  return (
    <div className={`bg-white shadow-md rounded-lg p-4 mb-3 border-l-4 ${borderColor.split(' ')[0]} hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <p className="text-gray-800 mb-2 whitespace-pre-wrap break-words">{props.description}</p>
          {props.link && (
            <a 
              href={props.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 hover:underline"
            >
              🔗 Reference Link
            </a>
          )}
        </div>
        <span className={`priority-badge ${borderColor.split(' ')[1]} shrink-0`}>
          {priorityDisplay}
        </span>
      </div>
      
      <div className="mt-3 flex gap-2 flex-wrap">
        <button 
          onClick={props.reportFuncion}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium flex items-center gap-1"
        >
          ✓ Done
        </button>
        <button 
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium"
        >
          ✏️ Edit
        </button>
        <button 
          onClick={props.deleteFuncion}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium flex items-center gap-1"
        >
          ✕ Delete
        </button>
      </div>
    </div>
  );
}

export default QueueItem;
