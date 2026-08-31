import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ReportItem, getReportDb, current_report_id, removeReportItemDb } from '../db/ReportJsonServer';
import { listQueuesDb, getQueueDb, addItemDb } from '../db/JsonServer';
import { ToDoItem } from '../model/ToDoItem';
import { priorityLevelMap } from '../model/Priority';
import { ReportDisplayItem } from '../model/ReportDisplayItem';
import { loadReportsToSearch, searchReports, checkSearchHealth, getIndexStats, SearchDocument } from '../db/MeilisearchService';
import { getHostname } from '../utils';

function FullTextSearch(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ReportDisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHealth, setSearchHealth] = useState<boolean>(false);
  const [indexStats, setIndexStats] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    checkHealth();
    loadIndexStats();
  }, []);

  async function checkHealth() {
    const isHealthy = await checkSearchHealth();
    setSearchHealth(isHealthy);
  }

  async function loadIndexStats() {
    const stats = await getIndexStats();
    setIndexStats(stats);
  }

  async function handleLoadReports() {
    try {
      setLoadingData(true);
      setError(null);

      // Check if search engine is available
      const isHealthy = await checkSearchHealth();
      if (!isHealthy) {
        setError('Meilisearch is not available. Please make sure it is running on port 8011.');
        return;
      }

      const searchDocuments: SearchDocument[] = [];

      // Get all report items from JSON server
      const reportData = await getReportDb(current_report_id);
      if (reportData && reportData.items) {
        reportData.items.forEach(item => {
          // Ensure all fields are valid strings and sanitize ID for Meilisearch
          // Meilisearch IDs can only contain: a-z A-Z 0-9 - _
          const originalId = String(item.id || '');
          const sanitizedId = originalId.replace(/[^a-zA-Z0-9\-_]/g, '_'); // Replace invalid chars with underscore
          if (originalId !== sanitizedId) {
            console.log('Report item original ID:', originalId);
            console.log('  -> Sanitized to:', sanitizedId);
          }

          searchDocuments.push({
            id: sanitizedId,
            description: String(item.description || ''),
            link: String(item.link || ''),
          });
        });
      }

      // Get all queue items from all queues
      const queues = await listQueuesDb();
      for (const queue of queues) {
        const fullQueue = await getQueueDb(queue.id);
        if (fullQueue && fullQueue.items) {
          fullQueue.items.forEach((item: any) => {
            // Ensure all fields are valid strings and sanitize ID for Meilisearch
            // Meilisearch IDs can only contain: a-z A-Z 0-9 - _
            const originalId = String(item.id || '');
            const sanitizedId = originalId.replace(/[^a-zA-Z0-9\-_]/g, '_'); // Replace invalid chars with underscore
            if (originalId !== sanitizedId) {
              console.log('Queue item original ID:', originalId);
              console.log('  -> Sanitized to:', sanitizedId);
            }
            
            searchDocuments.push({
              id: sanitizedId,
              description: String(item.description || ''),
              link: String(item.link || ''),
            });
          });
        }
      }

      if (searchDocuments.length === 0) {
        setError('No items found to load.');
        return;
      }

      // Load to Meilisearch
      await loadReportsToSearch(searchDocuments);

      // Refresh stats
      await loadIndexStats();
      
      alert(`Successfully loaded ${searchDocuments.length} items to search engine!`);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items to search engine. Please check the console for details.');
    } finally {
      setLoadingData(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      // Check if search engine is available
      const isHealthy = await checkSearchHealth();
      if (!isHealthy) {
        setError('Meilisearch is not available. Please make sure it is running on port 8011.');
        setSearchResults([]);
        return;
      }

      // Get search results (just IDs, description, link)
      const searchDocs = await searchReports(searchQuery, 50);
      
      // Build a map of all items (both report and queue items)
      const itemsMap = new Map<string, ReportDisplayItem>();

      // Fetch all report items
      const reportData = await getReportDb(current_report_id);
      if (reportData && reportData.items) {
        reportData.items.forEach((item: ReportItem) => {
          const displayItem: ReportDisplayItem = {
            type: 'completed',
            description: item.description,
            link: item.link,
            priorityId: item.priorityId,
            priority: item.priority,
            createdAt: item.createdAt,
            create_time: item.create_time,
            qname: item.qname,
            qid: item.qid,
            id: item.id,
            reportedAt: item.reportedAt,
            startDate: item.startDate || null,
            deadline: item.deadline || null,
          };
          itemsMap.set(item.id, displayItem);
        });
      }

      // Fetch all queue items
      const queues = await listQueuesDb();
      for (const queue of queues) {
        const fullQueue = await getQueueDb(queue.id);
        if (fullQueue && fullQueue.items) {
          for (const item of fullQueue.items) {
            const priority = priorityLevelMap.get(item.priorityId);
            const modifiedTime = item.modified_time || item.created_time;
            const displayItem: ReportDisplayItem = {
              type: 'in-progress',
              description: item.description,
              link: item.link,
              priorityId: item.priorityId,
              priority: priority ? priority.display : 'Unknown',
              createdAt: item.created_time,
              create_time: new Date(item.created_time).toLocaleString(),
              qname: queue.name,
              qid: queue.id,
              id: item.id,
              modifiedAt: modifiedTime,
              modified_time: new Date(modifiedTime).toLocaleString(),
              startDate: item.startDate || null,
              deadline: item.deadline || null,
            };
            itemsMap.set(item.id, displayItem);
          }
        }
      }

      // Map search results to full DisplayItems
      const fullResults = searchDocs
        .map(doc => itemsMap.get(doc.id))
        .filter((item): item is ReportDisplayItem => item !== undefined);
      
      setSearchResults(fullResults);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to search. Please check if Meilisearch is running and data is loaded.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearSearch() {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setError(null);
  }

  async function undoReportItem(item: ReportDisplayItem) {
    if (item.type !== 'completed' || !item.reportedAt) {
      return;
    }

    try {
      const queue = await getQueueDb(item.qid);
      if (!queue) {
        alert(`Queue "${item.qname}" no longer exists. Cannot undo this item.`);
        return;
      }

      const now = Date.now();
      const todoItem = new ToDoItem(
        item.description,
        item.link,
        item.id,
        item.createdAt,
        item.priorityId,
        now,
        item.startDate || null,
        item.deadline || null
      );

      await addItemDb(item.qid, todoItem);

      const reportItem: ReportItem = {
        description: item.description,
        link: item.link,
        priorityId: item.priorityId,
        priority: item.priority,
        createdAt: item.createdAt,
        create_time: item.create_time,
        qname: item.qname,
        qid: item.qid,
        reportedAt: item.reportedAt,
        id: item.id,
        startDate: item.startDate || null,
        deadline: item.deadline || null,
      };
      await removeReportItemDb(current_report_id, reportItem);

      setSearchResults(prev => prev.filter(r => r.id !== item.id));
    } catch (err) {
      console.error('Error undoing report item:', err);
      alert('Failed to undo report item. Please try again.');
    }
  }

  function getPriorityColor(priority: string): string {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('do it now')) return 'bg-red-50 text-red-700 border-red-300';
    if (priorityLower.includes('important doable')) return 'bg-orange-50 text-orange-700 border-orange-300';
    if (priorityLower.includes('low-hanging fruit') || priorityLower.includes('low hanging fruit')) return 'bg-yellow-50 text-yellow-700 border-yellow-300';
    if (priorityLower.includes('moon shooting')) return 'bg-blue-50 text-blue-700 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }

  function formatDate(timestamp: number): string {
    const year = Math.floor(timestamp / 10000);
    const month = Math.floor((timestamp % 10000) / 100);
    const day = timestamp % 100;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div className="p-6">
      {/* Header with Load Button */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🔍 Full-Text Search</h2>
            <p className="text-sm text-gray-600 mt-1">
              Search through all items (reports and queues) using Meilisearch
            </p>
          </div>
          <button
            onClick={handleLoadReports}
            disabled={loadingData || !searchHealth}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-150 ${
              loadingData || !searchHealth
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
            }`}
          >
            {loadingData ? '⏳ Loading...' : '📤 Load Items to Search'}
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${searchHealth ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-gray-600">
              Search Engine: {searchHealth ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {indexStats && (
            <div className="text-gray-600">
              📊 Indexed Documents: {indexStats.numberOfDocuments || 0}
            </div>
          )}
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for reports..."
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors duration-150"
            disabled={loading || !searchHealth}
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim() || !searchHealth}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-150 ${
              loading || !searchQuery.trim() || !searchHealth
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? '⏳ Searching...' : '🔍 Search'}
          </button>
          {hasSearched && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-150 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">⚠️ {error}</p>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h3>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-12 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">
                {loading ? 'Searching...' : 'No results found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status Badge with Queue Name */}
                      <div className="mb-2 flex items-center gap-2">
                        {result.type === 'in-progress' ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">
                            🔄 IN PROGRESS
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
                            ✅ DONE
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-md">
                          📋 {result.qname}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="text-lg text-gray-800 mb-2 prose prose-base max-w-full overflow-x-auto">
                        <ReactMarkdown
                          components={{
                            a: ({ node: _node, ...props }) => (
                              <a
                                {...props}
                                className="text-blue-600 hover:text-blue-800 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                            code: ({ node: _node, ...props }) => (
                              <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-all max-w-full inline-block" />
                            ),
                            pre: ({ node: _node, ...props }) => (
                              <pre {...props} className="bg-gray-100 p-3 rounded overflow-x-auto my-2 whitespace-pre max-w-full" />
                            )
                          }}
                        >
                          {result.description}
                        </ReactMarkdown>
                      </div>

                      {/* Link */}
                      {result.link && (
                        <div className="mb-3">
                          <a
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                          >
                            🔗 Ref Link: {getHostname(result.link)}
                          </a>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>
                          🕒 {result.type === 'in-progress' ? 'Updated' : 'Created'}: {result.type === 'in-progress' ? result.modified_time : result.create_time}
                        </span>
                        {result.type === 'completed' && result.reportedAt && (
                          <span>
                            📅 Reported: {formatDate(result.reportedAt)}
                          </span>
                        )}
                        {result.startDate && (
                          <span>📅 Start: {result.startDate}</span>
                        )}
                        {result.deadline && (
                          <span>⏰ Deadline: {result.deadline}</span>
                        )}
                      </div>
                    </div>

                    {/* Priority Badge and Undo Button */}
                    <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                      <div className={`px-4 py-2 rounded-lg border-2 ${getPriorityColor(result.priority)} font-semibold text-sm text-center min-w-[100px]`}>
                        {result.priority}
                      </div>
                      {result.type === 'completed' && (
                        <button
                          onClick={() => undoReportItem(result)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-150 font-medium text-sm"
                          title="Return item back to queue"
                        >
                          ↩️ Undo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!hasSearched && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Getting Started</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>First, make sure Meilisearch is running (check the status indicator above)</li>
            <li>Click "Load Items to Search" to index all report items and queue items</li>
            <li>Then use the search bar to find items by keywords</li>
            <li>Search is instant and supports fuzzy matching</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default FullTextSearch;
