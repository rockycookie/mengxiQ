import { ReportDisplayItem } from '../model/ReportDisplayItem';

interface QueueFilterProps {
  uniqueQueues: string[];
  selectedQueues: Set<string>;
  items: ReportDisplayItem[];
  onToggleQueue: (queueName: string) => void;
  onToggleAll: () => void;
  className?: string;
}

function QueueFilter({ uniqueQueues, selectedQueues, items, onToggleQueue, onToggleAll, className }: QueueFilterProps): JSX.Element | null {
  if (uniqueQueues.length === 0) return null;

  return (
    <div className={className}>
      <div className="mb-2">
        <label className="text-sm font-medium text-gray-700">
          📋 Filter by Queue:
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onToggleAll}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${selectedQueues.size === 0 || selectedQueues.size === uniqueQueues.length
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          {(selectedQueues.size === 0 || selectedQueues.size === uniqueQueues.length) ? '✓ ' : ''}All Queues ({items.length})
        </button>
        {uniqueQueues.map((queue) => {
          const count = items.filter(item => item.qname === queue).length;
          const isSelected = selectedQueues.size > 0 && selectedQueues.has(queue);
          return (
            <button
              key={queue}
              onClick={() => onToggleQueue(queue)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${isSelected
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {isSelected ? '✓ ' : ''}{queue} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QueueFilter;
