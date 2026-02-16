import { useState, useEffect } from 'react';
import { createQueueDb, listQueuesDb } from '../db/JsonServer';
import { PriorityQueue } from '../model/PriorityQueue';

function Header(
  props: {
    setQid: (id: string) => void
  }
): JSX.Element {

  const [curCreateQueueName, setCurCreateQueueName] = useState("");
  const [queues, setQueues] = useState<PriorityQueue[]>([]);
  const [curDisplayQueueId, setCurDisplayQueueId] = useState<string | null>(null);
  const [triggerRerender, setTriggerRerender] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    listQueuesDb().then(result => {
      setQueues(result);
      if (result.length > 0) {
        if (curDisplayQueueId === null) {
          props.setQid(result[0].id);
          setCurDisplayQueueId(result[0].id);
        } else {
          props.setQid(curDisplayQueueId);
        }
      }
    });
  }, [curDisplayQueueId, triggerRerender]);

  function handleQueueCreation() {
    if (!curCreateQueueName.trim()) {
      alert("Please enter a queue name");
      return;
    }
    
    createQueueDb(curCreateQueueName)
      .then(() => {
        setTriggerRerender(triggerRerender + 1);
        listQueuesDb().then(result => {
          setQueues(result);
          // Auto-select newly created queue
          const newQueue = result.find((q: PriorityQueue) => q.name === curCreateQueueName);
          if (newQueue) {
            setCurDisplayQueueId(newQueue.id);
          }
        });
        setCurCreateQueueName("");
        setShowCreateForm(false);
      });
  }

  function handleQueueSwitch(qid: string) {
    setCurDisplayQueueId(qid);
  }

  return (
    <div className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* App Title */}
        <div className="py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">📋 MengxiQ</h1>
          <p className="text-sm text-gray-600 mt-1">Prioritize, record, and forget quickly</p>
        </div>

        {/* Queue Tabs */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto">
          {queues.map((queue) => (
            <button
              key={queue.id}
              onClick={() => handleQueueSwitch(queue.id)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-all duration-150 whitespace-nowrap ${
                curDisplayQueueId === queue.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {queue.name}
            </button>
          ))}
          
          {/* Create Queue Button */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 rounded-t-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-150 whitespace-nowrap"
            >
              ➕ New Queue
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
              <input
                type="text"
                value={curCreateQueueName}
                onChange={e => setCurCreateQueueName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleQueueCreation()}
                placeholder="Queue name..."
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleQueueCreation}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-150 text-sm font-medium"
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCurCreateQueueName("");
                }}
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors duration-150 text-sm font-medium"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
