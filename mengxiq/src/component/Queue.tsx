import QueueItem from './QueueItem';
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { priorityLevelMap, priorityLevelMapKeys } from '../model/Priority';
import { addItemDb, deleteItemDb, getQueueDb, updateItemDb } from '../db/JsonServer';
import { ToDoItem } from '../model/ToDoItem';
import { ReportItem, addReportItemDb, current_report_id } from '../db/ReportJsonServer';

function Queue(
  props: { qid: string }
): JSX.Element {
  const [items, setItems] = useState<ToDoItem[]>([]);
  const [curDescription, setCurDescription] = useState<string>('');
  const [curLink, setCurLink] = useState('');
  const [curPriorityId, setCurPriorityId] = useState('select_priority');
  const [qname, setQname] = useState<string>('');
  const [showForm, setShowForm] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const sortAlg = (a: ToDoItem, b: ToDoItem) => {
    let cmp = priorityLevelMap.get(b.priorityId)!.rank - priorityLevelMap.get(a.priorityId)!.rank;
    if (cmp !== 0) {
      return cmp;
    } else {
      // Sort by most recent modification first
      return (b.modified_time || b.created_time) - (a.modified_time || a.created_time);
    }
  };

  const sortReportAlg = (a: ReportItem, b: ReportItem) => {
    /* Sort by:
        1. Reported date --> so that we group report items for each day
        2. Queue name
        3. Priority
    */
    if (a.reportedAt === b.reportedAt) {
      if (a.qname === b.qname) {
        // higher/larger comes first
        return priorityLevelMap.get(b.priorityId)!.rank - priorityLevelMap.get(a.priorityId)!.rank;
      } else {
        // Don't care, just ensure grouping by queue names
        return a.qname.localeCompare(b.qname);
      }
    } else {
      return b.reportedAt - a.reportedAt; // later/larger comes first
    }
  };

  useEffect(() => {
    // console.log("Fetching queue info for: " + props.qid);
    getQueueDb(props.qid)
      .then((result) => {
        // console.log(result);
        if (result !== null) {
          result.items.sort(sortAlg);
          setItems(result.items);
          setQname(result.name);
        }
      });
  }, [props.qid]);

  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    autoResizeTextarea(descriptionRef.current);
  }, [curDescription]);

  function handleAddItem() {
    if (!curDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    if (curPriorityId === 'select_priority') {
      alert('Please select a priority');
      return;
    }

    const newItems = items.slice();
    const now = Date.now();
    const newItem = new ToDoItem(
      curDescription,
      curLink,
      uuidv4(),
      now,
      curPriorityId,
      now
    );
    newItems.push(newItem);
    newItems.sort(sortAlg);

    setItems(newItems);
    addItemDb(props.qid, newItem);

    // Reset form
    setCurDescription('');
    setCurLink('');
    setCurPriorityId('select_priority');
  }

  function deleteItem(itemId: string) {
    // Find the item to get its description
    const item = items.find(e => e.id === itemId);
    const itemDescription = item ? item.description : 'this item';

    // Warn user that deletion is not recoverable
    const confirmed = window.confirm(
      `⚠️ This item will be permanently deleted and cannot be recovered.\n\nItem: ${itemDescription}\n\nAre you sure you want to delete this item?`
    );

    if (!confirmed) {
      return; // User cancelled, don't delete
    }

    // console.log("deleteItem function called with id: " + id);
    const newItems = items.filter(e => e.id !== itemId).slice();
    // console.log("new items: ");
    // console.log(newItems);
    setItems(newItems);

    // Remove from DB
    deleteItemDb(props.qid, itemId);
  }

  function reportItem(itemId: string) {
    const item = items.filter(e => e.id === itemId)[0];
    const newItems = items.filter(e => e.id !== itemId).slice();
    setItems(newItems);

    // Report to DB
    addReportItemDb(
      current_report_id,
      new ReportItem(
        item.description,
        item.link,
        item.priorityId,
        priorityLevelMap.get(item.priorityId)!.display,
        item.created_time,
        new Date(item.created_time).toLocaleString(),
        qname,
        props.qid,
      ),
      sortReportAlg
    );
    // Remove from DB
    deleteItemDb(props.qid, itemId);
  }

  function updateItem(itemId: string, description: string, link: string, priorityId: string) {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = new ToDoItem(
          description,
          link,
          item.id,
          item.created_time,
          priorityId,
          Date.now()
        );
        updateItemDb(props.qid, updatedItem);
        return updatedItem;
      }
      return item;
    });
    updatedItems.sort(sortAlg);
    setItems(updatedItems);
    setEditingItemId(null);
  }

  // Get priority button styling
  const getPriorityButtonClass = (pid: string) => {
    if (curPriorityId === pid) {
      const activeClasses: { [key: string]: string } = {
        'do_it_now': 'bg-red-500 text-white border-red-600',
        'important_doable': 'bg-orange-500 text-white border-orange-600',
        'low_hanging_fruit': 'bg-yellow-500 text-white border-yellow-600',
        'moon_shooting': 'bg-blue-500 text-white border-blue-600',
      };
      return activeClasses[pid] || '';
    }
    return 'bg-white text-gray-700 border-gray-300 hover:border-gray-400';
  };

  // Get item count by priority
  const getItemCountByPriority = (pid: string) => {
    return items.filter(item => item.priorityId === pid).length;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Quick Add Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Quick Capture</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {showForm ? '▼ Hide' : '▶ Show'}
          </button>
        </div>

        {showForm && (
          <div className="space-y-4">
            {/* Priority Selection - Quick Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {priorityLevelMapKeys.filter(id => id !== 'select_priority').map((id) => (
                  <button
                    key={id}
                    onClick={() => setCurPriorityId(id)}
                    className={`px-4 py-3 rounded-md border-2 font-medium transition-all duration-150 ${getPriorityButtonClass(id)}`}
                  >
                    {priorityLevelMap.get(id)!.display}
                    {getItemCountByPriority(id) > 0 && (
                      <span className="ml-2 text-xs">({getItemCountByPriority(id)})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                ref={descriptionRef}
                value={curDescription}
                onChange={e => setCurDescription(e.target.value)}
                placeholder="Enter item description..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
                rows={8}
              />
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference Link (optional)</label>
              <input
                type="text"
                value={curLink}
                onChange={e => setCurLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddItem}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-150 shadow-sm"
              >
                ➕ Add Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Items Summary */}
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Items ({items.length})
        </h3>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">🎉 Queue is empty!</p>
          <p className="text-gray-400 text-sm mt-2">Add your first item above to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(function (d) {
            return <QueueItem
              key={d.id}
              description={d.description}
              link={d.link}
              priorityId={d.priorityId}
              isEditing={editingItemId === d.id}
              onEdit={() => setEditingItemId(d.id)}
              onCancelEdit={() => setEditingItemId(null)}
              onSaveEdit={(desc, link, priority) => updateItem(d.id, desc, link, priority)}
              deleteFuncion={() => deleteItem(d.id)}
              reportFuncion={() => reportItem(d.id)}
            />;
          })}
        </div>
      )}
    </div>
  );
}

export default Queue;
