import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Report as ReportType, ReportItem, getReportDb, current_report_id, removeReportItemDb } from '../db/ReportJsonServer';
import { listQueuesDb, addItemDb, getQueueDb } from '../db/JsonServer';
import { priorityLevelMap } from '../model/Priority';
import { PriorityQueue } from '../model/PriorityQueue';
import { ToDoItem } from '../model/ToDoItem';
import { ReportDisplayItem } from '../model/ReportDisplayItem';
import { getHostname } from '../utils';
import FullTextSearch from './FullTextSearch';

function Report(): JSX.Element {
  const [report, setReport] = useState<ReportType | null>(null);
  const [queues, setQueues] = useState<PriorityQueue[]>([]);
  const [inProgressItems, setInProgressItems] = useState<ReportDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'today' | 'search'>('recent');
  const [selectedQueues, setSelectedQueues] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadReport();
    loadQueues();
    loadInProgressItems();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      const reportData = await getReportDb(current_report_id);
      setReport(reportData);
      setError(null);
    } catch (err) {
      setError('Failed to load report. Please make sure the JSON server is running.');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadQueues() {
    try {
      const queuesData = await listQueuesDb();
      setQueues(queuesData);
    } catch (err) {
      console.error('Error loading queues:', err);
    }
  }

  async function loadInProgressItems() {
    try {
      const queuesData = await listQueuesDb();
      const allInProgressItems: ReportDisplayItem[] = [];

      // Iterate through all queues and their items
      for (const queue of queuesData) {
        const fullQueue = await getQueueDb(queue.id);
        if (fullQueue && fullQueue.items) {
          for (const item of fullQueue.items) {
            // Convert ToDoItem to DisplayItem
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
              itemId: item.id,
              modifiedAt: modifiedTime,
              modified_time: new Date(modifiedTime).toLocaleString()
            };
            allInProgressItems.push(displayItem);
          }
        }
      }

      setInProgressItems(allInProgressItems);
    } catch (err) {
      console.error('Error loading in-progress items:', err);
    }
  }

  async function undoReportItem(item: ReportDisplayItem) {
    // Only completed items can be undone
    if (item.type !== 'completed' || !item.reportedAt) {
      return;
    }

    try {
      // Check if the original queue still exists
      const queue = await getQueueDb(item.qid);

      if (!queue) {
        alert(`Queue "${item.qname}" no longer exists. Cannot undo this item.`);
        return;
      }

      // Convert DisplayItem back to ToDoItem
      const now = Date.now();
      const todoItem = new ToDoItem(
        item.description,
        item.link,
        item.id!, // Use report id (always expect it to exist)
        item.createdAt,
        item.priorityId,
        now // Set modified_time to now when undoing
      );

      // Add back to the original queue
      await addItemDb(item.qid, todoItem);

      // Remove from report - need to convert back to ReportItem for removal
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
        id: item.id!
      };
      await removeReportItemDb(current_report_id, reportItem);

      // Reload the report to reflect changes
      await loadReport();

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

  function getLastWorkDayTimestamp(): number {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // If today is Monday (1), go back to Thursday (4 days ago) as I do not do report analysis on Friday nor weekend
    // If today is Sunday (0), go back 3 days to Thursday
    // If today is Saturday (6), go back 2 days to Thursday
    // Otherwise, go back 1 day (yesterday)
    let daysToSubtract: number;
    switch (dayOfWeek) {
      case 1: // Monday
        daysToSubtract = 4;
        break;
      case 0: // Sunday
        daysToSubtract = 3;
        break;
      case 6: // Saturday
        daysToSubtract = 2;
        break;
      default: // Tuesday-Friday
        daysToSubtract = 1;
        break;
    }

    const lastWorkDay = new Date(today);
    lastWorkDay.setDate(today.getDate() - daysToSubtract);

    return lastWorkDay.getFullYear() * 10000 +
      (lastWorkDay.getMonth() + 1) * 100 +
      lastWorkDay.getDate();
  }

  function getTodayTimestamp(): number {
    const today = new Date();
    return today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();
  }

  function getPriorityRank(priorityId: string): number {
    const priority = priorityLevelMap.get(priorityId);
    return priority ? priority.rank : 0;
  }

  function getUniqueQueues(): string[] {
    if (!report || !report.items) return [];

    // Get date-filtered items to check which queues have items
    const itemsToCheck = getDateFilteredItems();

    // Get unique queue names from date-filtered items (only queues with items)
    const reportQueueNames = new Set(itemsToCheck.map(item => item.qname));
    const activeQueueNames = new Set(queues.map(q => q.name));

    // First, add queues that exist in the queues list (in displayOrder)
    const orderedQueues = queues
      .filter(q => reportQueueNames.has(q.name))
      .map(q => q.name);

    // Then, add any queue names from report that don't exist in queues list (likely deleted)
    const deletedQueues = Array.from(reportQueueNames)
      .filter(qname => !activeQueueNames.has(qname))
      .sort();

    return [...orderedQueues, ...deletedQueues];
  }

  function convertReportItemToDisplayItem(item: ReportItem): ReportDisplayItem {
    return {
      type: 'completed',
      description: item.description,
      link: item.link,
      priorityId: item.priorityId,
      priority: item.priority,
      createdAt: item.createdAt,
      create_time: item.create_time,
      qname: item.qname,
      qid: item.qid,
      reportedAt: item.reportedAt,
      id: item.id
    };
  }

  function getDateFilteredItems(): ReportDisplayItem[] {
    let reportItems: ReportDisplayItem[] = [];
    let inProgressFiltered: ReportDisplayItem[] = [];

    if (report && report.items) {
      reportItems = report.items.map(convertReportItemToDisplayItem);
    }

    // Apply date filter based on active tab
    if (activeTab === 'recent') {
      const lastWorkDay = getLastWorkDayTimestamp();
      const today = getTodayTimestamp();

      reportItems = reportItems.filter(item =>
        item.reportedAt && item.reportedAt >= lastWorkDay && item.reportedAt <= today
      );

      // Filter in-progress items by modification time
      inProgressFiltered = inProgressItems.filter(item => {
        // Convert modified_time timestamp to YYYYMMDD format for comparison
        const modifiedDate = new Date(item.modifiedAt || item.createdAt);
        const modifiedYYYYMMDD = modifiedDate.getFullYear() * 10000 +
          (modifiedDate.getMonth() + 1) * 100 +
          modifiedDate.getDate();
        return modifiedYYYYMMDD >= lastWorkDay && modifiedYYYYMMDD <= today;
      });
    } else if (activeTab === 'today') {
      const today = getTodayTimestamp();

      reportItems = reportItems.filter(item => item.reportedAt === today);

      // Filter in-progress items modified today
      inProgressFiltered = inProgressItems.filter(item => {
        const modifiedDate = new Date(item.modifiedAt || item.createdAt);
        const modifiedYYYYMMDD = modifiedDate.getFullYear() * 10000 +
          (modifiedDate.getMonth() + 1) * 100 +
          modifiedDate.getDate();
        return modifiedYYYYMMDD === today;
      });
    } else {
      // 'all' tab - no date filtering for report items, but don't show in-progress in "all"
      inProgressFiltered = [];
    }

    return [...reportItems, ...inProgressFiltered];
  }

  function getFilteredItems(): ReportDisplayItem[] {
    let filtered = getDateFilteredItems();

    // Apply queue filter
    if (selectedQueues.size > 0) {
      filtered = filtered.filter(item => selectedQueues.has(item.qname));
    }

    // Sort by priority (high to low), then by creation time (old to new)
    return filtered.sort((a, b) => {
      const priorityDiff = getPriorityRank(b.priorityId) - getPriorityRank(a.priorityId);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // When priority is the same, sort by creation time (old to new)
      return a.createdAt - b.createdAt;
    });
  }

  function getPaginatedItems(): ReportDisplayItem[] {
    const filtered = getFilteredItems();

    // Apply pagination to all tabs
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  function handleTabChange(tab: 'all' | 'recent' | 'today' | 'search') {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when switching tabs
  }

  function toggleQueue(queueName: string) {
    const newSelection = new Set(selectedQueues);
    if (newSelection.has(queueName)) {
      newSelection.delete(queueName);
    } else {
      newSelection.add(queueName);
    }
    setSelectedQueues(newSelection);
    setCurrentPage(1); // Reset to first page when changing queue
  }

  function toggleAllQueues() {
    if (selectedQueues.size === uniqueQueues.length) {
      // If all are selected, deselect all
      setSelectedQueues(new Set());
    } else {
      // Otherwise, select all
      setSelectedQueues(new Set(uniqueQueues));
    }
    setCurrentPage(1);
  }

  const uniqueQueues = getUniqueQueues();
  const dateFilteredItems = getDateFilteredItems();
  const filteredItems = getFilteredItems();
  const paginatedItems = getPaginatedItems();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Calculate recent items count for tab display
  const recentItemsCount = (() => {
    const lastWorkDay = getLastWorkDayTimestamp();
    const today = getTodayTimestamp();

    let count = 0;

    // Count completed items
    if (report && report.items) {
      count += report.items.filter(item =>
        item.reportedAt >= lastWorkDay && item.reportedAt <= today
      ).length;
    }

    // Count in-progress items
    count += inProgressItems.filter(item => {
      const modifiedDate = new Date(item.modifiedAt || item.createdAt);
      const modifiedYYYYMMDD = modifiedDate.getFullYear() * 10000 +
        (modifiedDate.getMonth() + 1) * 100 +
        modifiedDate.getDate();
      return modifiedYYYYMMDD >= lastWorkDay && modifiedYYYYMMDD <= today;
    }).length;

    return count;
  })();

  // Calculate today items count for tab display
  const todayItemsCount = (() => {
    const today = getTodayTimestamp();

    let count = 0;

    // Count completed items
    if (report && report.items) {
      count += report.items.filter(item => item.reportedAt === today).length;
    }

    // Count in-progress items
    count += inProgressItems.filter(item => {
      const modifiedDate = new Date(item.modifiedAt || item.createdAt);
      const modifiedYYYYMMDD = modifiedDate.getFullYear() * 10000 +
        (modifiedDate.getMonth() + 1) * 100 +
        modifiedDate.getDate();
      return modifiedYYYYMMDD === today;
    }).length;

    return count;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">Loading report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-red-50 rounded-lg shadow-md p-12 text-center">
            <p className="text-red-600 text-lg">⚠️ {error}</p>
            <button
              onClick={loadReport}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report || !report.items || report.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 {report?.name || 'Report'}</h2>
            <p className="text-gray-500 text-lg">No items in this report yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-8">
            <h1 className="text-3xl font-bold">📊 {report.name}</h1>
            <p className="text-blue-100 mt-2">Total Items: {report.items.length}</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-2 px-6">
              <button
                onClick={() => handleTabChange('recent')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-150 border-b-2 ${activeTab === 'recent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
              >
                Since Last Workday ({recentItemsCount})
              </button>
              <button
                onClick={() => handleTabChange('today')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-150 border-b-2 ${activeTab === 'today'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
              >
                Today ({todayItemsCount})
              </button>
              <button
                onClick={() => handleTabChange('all')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-150 border-b-2 ${activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
              >
                All Items ({report.items.length})
              </button>
              <button
                onClick={() => handleTabChange('search')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-150 border-b-2 ${activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
              >
                🔍 Full-Text Search
              </button>
            </div>
          </div>

          {/* Search Tab Content */}
          {activeTab === 'search' ? (
            <FullTextSearch />
          ) : (
            <>
              {/* Queue Filters */}
              {uniqueQueues.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      📋 Filter by Queue:
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* All Queues Toggle */}
                    <button
                      onClick={toggleAllQueues}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${selectedQueues.size === 0 || selectedQueues.size === uniqueQueues.length
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {(selectedQueues.size === 0 || selectedQueues.size === uniqueQueues.length) ? '✓ ' : ''}All Queues ({dateFilteredItems.length})
                    </button>

                    {/* Individual Queue Cards */}
                    {uniqueQueues.map((queue) => {
                      const count = dateFilteredItems.filter(item => item.qname === queue).length;
                      const isSelected = selectedQueues.size > 0 && selectedQueues.has(queue);
                      return (
                        <button
                          key={queue}
                          onClick={() => toggleQueue(queue)}
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
              )}

              {/* Report Items */}
              {paginatedItems.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500 text-lg">No items found for this filter.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {paginatedItems.map((item: ReportDisplayItem, index: number) => (
                      <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Status Badge with Queue Name */}
                            <div className="mb-2 flex items-center gap-2">
                              {item.type === 'in-progress' ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md">
                                  🔄 IN PROGRESS
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md">
                                  ✅ DONE
                                </span>
                              )}
                              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-md">
                                📋 {item.qname}
                              </span>
                            </div>

                            {/* Description */}
                            <div className="text-lg text-gray-800 mb-2 prose prose-base max-w-full overflow-x-auto">
                              <ReactMarkdown
                                components={{
                                  a: ({ node: _node, ...props }) => (
                                    <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
                                  ),
                                  code: ({ node: _node, ...props }) => (
                                    <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono break-all max-w-full inline-block" />
                                  ),
                                  pre: ({ node: _node, ...props }) => (
                                    <pre {...props} className="bg-gray-100 p-3 rounded overflow-x-auto my-2 whitespace-pre max-w-full" />
                                  )
                                }}
                              >
                                {item.description}
                              </ReactMarkdown>
                            </div>

                            {/* Link */}
                            {item.link && (
                              <div className="mb-3">
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                >
                                  🔗 Ref Link: {getHostname(item.link)}
                                </a>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <span>
                                🕒 Updated: {item.type === 'in-progress' ? item.modified_time : item.create_time}
                              </span>
                              {item.type === 'completed' && item.reportedAt && (
                                <span>
                                  📅 Reported: {formatDate(item.reportedAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Priority Badge and Undo Button */}
                          <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                            <div className={`px-4 py-2 rounded-lg border-2 ${getPriorityColor(item.priority)} font-semibold text-sm text-center min-w-[100px]`}>
                              {item.priority}
                            </div>
                            {item.type === 'completed' && (
                              <button
                                onClick={() => undoReportItem(item)}
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

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${currentPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                          >
                            ← Previous
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                              // Show first page, last page, current page, and pages around current
                              const showPage = page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1);

                              const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                (page === currentPage + 2 && currentPage < totalPages - 2);

                              if (showEllipsis) {
                                return <span key={page} className="px-2 text-gray-400">...</span>;
                              }

                              if (!showPage) return null;

                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                    }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${currentPage === totalPages
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}            </>
          )}        </div>
      </div>
    </div>
  );
}

export default Report;
