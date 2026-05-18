import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQueueDb, listQueuesDb, softDeleteQueueDb, listDeletedQueuesDb, updateQueueOrderDb, updateQueueDb } from '../db/JsonServer';
import { PriorityQueue } from '../model/PriorityQueue';
import packageJson from '../../package.json';
import PassphraseButton from './PassphraseButton';

function Header(
  props: {
    setQid: (id: string) => void,
    triggerQueueReload: () => void
  }
): JSX.Element {

  const { setQid, triggerQueueReload } = props;
  const navigate = useNavigate();
  const [curCreateQueueName, setCurCreateQueueName] = useState('');
  const [curCreateQueueDescription, setCurCreateQueueDescription] = useState('');
  const [queues, setQueues] = useState<PriorityQueue[]>([]);
  const [deletedQueues, setDeletedQueues] = useState<PriorityQueue[]>([]);
  const [curDisplayQueueId, setCurDisplayQueueId] = useState<string | null>(null);
  const [triggerRerender, setTriggerRerender] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedQueueId, setDraggedQueueId] = useState<string | null>(null);
  const [dragOverQueueId, setDragOverQueueId] = useState<string | null>(null);
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [editQueueName, setEditQueueName] = useState('');
  const [editQueueDescription, setEditQueueDescription] = useState('');

  useEffect(() => {
    listQueuesDb().then(result => {
      setQueues(result);
      if (result.length > 0) {
        if (curDisplayQueueId === null) {
          setQid(result[0].id);
          setCurDisplayQueueId(result[0].id);
        } else {
          setQid(curDisplayQueueId);
        }
      }
    });

    listDeletedQueuesDb().then(result => {
      setDeletedQueues(result);
    });
  }, [curDisplayQueueId, triggerRerender, setQid]);

  function handleQueueCreation() {
    if (!curCreateQueueName.trim()) {
      alert('Please enter a queue name');
      return;
    }

    createQueueDb(curCreateQueueName, curCreateQueueDescription)
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
        setCurCreateQueueName('');
        setCurCreateQueueDescription('');
        setShowCreateForm(false);
      });
  }

  function handleQueueSwitch(qid: string) {
    setCurDisplayQueueId(qid);
  }

  function handleDeleteQueue(qid: string, qname: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${qname}"? You can restore it later from deleted queues.`)) {
      softDeleteQueueDb(qid).then(() => {
        // If the deleted queue was selected, switch to the first available queue
        if (curDisplayQueueId === qid) {
          listQueuesDb().then(result => {
            if (result.length > 0) {
              setCurDisplayQueueId(result[0].id);
            } else {
              setCurDisplayQueueId(null);
              props.setQid('');
            }
          });
        }
        setTriggerRerender(triggerRerender + 1);
      });
    }
  }

  function handleDragStart(qid: string, event: React.DragEvent) {
    setDraggedQueueId(qid);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.currentTarget.innerHTML);
    // Add a slight opacity to the dragged element
    (event.currentTarget as HTMLElement).style.opacity = '0.4';
  }

  function handleDragEnd(event: React.DragEvent) {
    (event.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedQueueId(null);
    setDragOverQueueId(null);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(qid: string, event: React.DragEvent) {
    event.preventDefault();
    if (draggedQueueId && draggedQueueId !== qid) {
      setDragOverQueueId(qid);
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    // Only clear if we're actually leaving the element
    // The Problem: onDragLeave has a quirk - it fires not just when leaving the parent element, but also when entering child elements (like the button inside the tab div). This causes flickering.
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverQueueId(null);
    }
  }

  function handleDrop(targetQid: string, event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedQueueId || draggedQueueId === targetQid) {
      setDragOverQueueId(null);
      return;
    }

    // Reorder the queues array
    const draggedIndex = queues.findIndex(q => q.id === draggedQueueId);
    const targetIndex = queues.findIndex(q => q.id === targetQid);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newQueues = [...queues];
      const [removed] = newQueues.splice(draggedIndex, 1);
      newQueues.splice(targetIndex, 0, removed);

      setQueues(newQueues);

      // Update the order in the database
      const queueIds = newQueues.map(q => q.id);
      updateQueueOrderDb(queueIds);
    }

    setDragOverQueueId(null);
    setDraggedQueueId(null);
  }

  function handleEditQueue(qid: string, qname: string, qdescription: string, event: React.MouseEvent) {
    event.stopPropagation();
    setEditingQueueId(qid);
    setEditQueueName(qname);
    setEditQueueDescription(qdescription || '');
  }

  function handleSaveQueueEdit() {
    if (!editQueueName.trim()) {
      alert('Queue name cannot be empty');
      return;
    }

    if (editingQueueId) {
      updateQueueDb(editingQueueId, {
        name: editQueueName,
        description: editQueueDescription
      }).then(() => {
        setTriggerRerender(triggerRerender + 1);
        triggerQueueReload();
        setEditingQueueId(null);
        setEditQueueName('');
        setEditQueueDescription('');
      });
    }
  }

  function handleCancelQueueEdit() {
    setEditingQueueId(null);
    setEditQueueName('');
    setEditQueueDescription('');
  }

  return (
    <div className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* App Title */}
        <div className="py-4 border-b border-gray-200">
          <div className="flex items-end gap-3">
            <h1 className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-150"
              onClick={() => navigate('/')}
            >
              📋 MengxiQ
            </h1>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              v{packageJson.version}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Prioritize, record, and forget quickly</p>
        </div>

        {/* Queue Tabs */}
        <div className="py-3">
          {/* Actions Row */}
          <div className="flex items-center gap-2 mb-3">
            {/* Create Queue Button */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all duration-150 whitespace-nowrap"
              >
                ➕ New Queue
              </button>
            ) : (
              <div className="flex flex-col gap-2 bg-green-50 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={curCreateQueueName}
                    onChange={e => setCurCreateQueueName(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleQueueCreation()}
                    placeholder="Queue name..."
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={curCreateQueueDescription}
                    onChange={e => setCurCreateQueueDescription(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleQueueCreation()}
                    placeholder="Description (optional)..."
                    className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1"
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
                      setCurCreateQueueName('');
                      setCurCreateQueueDescription('');
                    }}
                    className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors duration-150 text-sm font-medium"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Report Navigation Button */}
            <button
              onClick={() => navigate('/report')}
              className="px-4 py-2 rounded-lg font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all duration-150 whitespace-nowrap"
            >
              📊 Reports
            </button>

            {/* Passphrase Button */}
            <PassphraseButton />

            {/* Deleted Queues Button */}
            {deletedQueues.length > 0 && (
              <button
                onClick={() => navigate('/deleted')}
                className="px-4 py-2 rounded-lg font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-all duration-150 whitespace-nowrap"
              >
                🗑️ Deleted ({deletedQueues.length})
              </button>
            )}
          </div>

          {/* Queue Tabs Row */}
          <div className="flex items-center gap-2 overflow-x-auto mb-2">
            {queues.map((queue) => (
              <div
                key={queue.id}
                draggable
                onDragStart={(e) => handleDragStart(queue.id, e)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={(e) => handleDragEnter(queue.id, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(queue.id, e)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all duration-150 cursor-move ${curDisplayQueueId === queue.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${dragOverQueueId === queue.id && draggedQueueId !== queue.id
                    ? 'border-2 border-blue-400 border-dashed'
                    : ''
                  }`}
              >
                <button
                  onClick={() => handleQueueSwitch(queue.id)}
                  className="whitespace-nowrap"
                >
                  {queue.name}
                </button>
                <button
                  onClick={(e) => handleEditQueue(queue.id, queue.name, queue.description || '', e)}
                  className={`text-xs hover:opacity-70 transition-opacity ${curDisplayQueueId === queue.id ? 'text-white' : 'text-blue-600'
                    }`}
                  title="Edit queue"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => handleDeleteQueue(queue.id, queue.name, e)}
                  className={`text-xs hover:opacity-70 transition-opacity ${curDisplayQueueId === queue.id ? 'text-white' : 'text-red-600'
                    }`}
                  title="Delete queue"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Edit Queue Modal */}
          {editingQueueId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCancelQueueEdit}>
              <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Queue</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Queue Name</label>
                    <input
                      type="text"
                      value={editQueueName}
                      onChange={e => setEditQueueName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSaveQueueEdit()}
                      placeholder="Queue name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                    <textarea
                      value={editQueueDescription}
                      onChange={e => setEditQueueDescription(e.target.value)}
                      placeholder="Queue description..."
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancelQueueEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-150 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveQueueEdit}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-150 font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
