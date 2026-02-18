import { useState, useEffect } from 'react';
import { listDeletedQueuesDb, restoreQueueDb, permanentDeleteQueueDb } from '../db/JsonServer';
import { PriorityQueue } from '../model/PriorityQueue';

function DeletedQueues(): JSX.Element {
  const [deletedQueues, setDeletedQueues] = useState<PriorityQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDeletedQueues();
  }, []);

  async function loadDeletedQueues() {
    try {
      setLoading(true);
      const result = await listDeletedQueuesDb();
      setDeletedQueues(result);
      setError(null);
    } catch (err) {
      setError('Failed to load deleted queues. Please make sure the JSON server is running.');
      console.error('Error loading deleted queues:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestoreQueue(qid: string) {
    try {
      await restoreQueueDb(qid);
      // Reload the list after restoring
      await loadDeletedQueues();
    } catch (err) {
      console.error('Error restoring queue:', err);
      alert('Failed to restore queue. Please try again.');
    }
  }

  async function handlePermanentDelete(qid: string, qname: string) {
    if (window.confirm(
      `⚠️ PERMANENT DELETE WARNING ⚠️\n\n` +
      `Are you sure you want to PERMANENTLY delete "${qname}"?\n\n` +
      `This action CANNOT be undone. All items in this queue will be lost forever.\n\n` +
      `Click OK to permanently delete, or Cancel to keep it.`
    )) {
      try {
        await permanentDeleteQueueDb(qid);
        // Reload the list after deleting
        await loadDeletedQueues();
      } catch (err) {
        console.error('Error permanently deleting queue:', err);
        alert('Failed to delete queue. Please try again.');
      }
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-md p-12">
          <p className="text-gray-500 text-lg">Loading deleted queues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 rounded-lg shadow-md p-12">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">🗑️ Deleted Queues</h2>
          <p className="text-sm text-gray-600 mt-1">
            Restore queues that were previously deleted
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {deletedQueues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No deleted queues found</p>
              <p className="text-gray-400 text-sm mt-2">
                Queues you delete will appear here for restoration
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedQueues.map((queue) => (
                <div
                  key={queue.id}
                  className="flex items-center justify-between bg-gray-50 px-4 py-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">
                      {queue.name}
                    </h3>
                    {queue.deletedAt && (
                      <p className="text-sm text-gray-500 mt-1">
                        Deleted on: {formatDate(queue.deletedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRestoreQueue(queue.id)}
                      className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors duration-150 flex items-center gap-2"
                    >
                      <span>↺</span>
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(queue.id, queue.name)}
                      className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-150 flex items-center gap-2"
                      title="Permanently delete this queue"
                    >
                      <span>🗑️</span>
                      <span>Delete Forever</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeletedQueues;
