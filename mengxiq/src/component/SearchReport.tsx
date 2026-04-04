import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ReportItem, getReportDb, current_report_id } from '../db/ReportJsonServer';
import { listQueuesDb, getQueueDb } from '../db/JsonServer';
import { priorityLevelMap } from '../model/Priority';
import { getHostname } from '../utils';

// Extended type to track all searchable items
type SearchableItem = {
    type: 'completed' | 'in-progress';
    description: string;
    link: string;
    priorityId: string;
    priority: string;
    createdAt: number;
    create_time: string;
    qname: string;
    qid: string;
    reportedAt?: number; // Only for completed items
    itemId?: string; // Only for in-progress items (original ToDoItem id)
    modifiedAt?: number; // Only for in-progress items
    modified_time?: string; // Only for in-progress items (display format)
};

function SearchReport(): JSX.Element {
    const [allItems, setAllItems] = useState<SearchableItem[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadAllItems();
    }, []);

    async function loadAllItems() {
        try {
            setLoading(true);
            const items: SearchableItem[] = [];

            // Load completed items from report
            const reportData = await getReportDb(current_report_id);
            if (reportData && reportData.items) {
                const completedItems = reportData.items.map((item: ReportItem): SearchableItem => ({
                    type: 'completed',
                    description: item.description,
                    link: item.link,
                    priorityId: item.priorityId,
                    priority: item.priority,
                    createdAt: item.createdAt,
                    create_time: item.create_time,
                    qname: item.qname,
                    qid: item.qid,
                    reportedAt: item.reportedAt
                }));
                items.push(...completedItems);
            }

            // Load in-progress items from all queues
            const queuesData = await listQueuesDb();
            for (const queue of queuesData) {
                const fullQueue = await getQueueDb(queue.id);
                if (fullQueue && fullQueue.items) {
                    for (const item of fullQueue.items) {
                        const priority = priorityLevelMap.get(item.priorityId);
                        const modifiedTime = item.modified_time || item.created_time;
                        const inProgressItem: SearchableItem = {
                            type: 'in-progress',
                            description: item.description,
                            link: item.link,
                            priorityId: item.priorityId,
                            priority: priority ? priority.display : 'Unknown',
                            createdAt: item.created_time,
                            create_time: new Date(item.created_time).toLocaleString(),
                            qname: queue.name,
                            qid: queue.id,
                            itemId: item.id,
                            modifiedAt: modifiedTime,
                            modified_time: new Date(modifiedTime).toLocaleString()
                        };
                        items.push(inProgressItem);
                    }
                }
            }

            setAllItems(items);
            setError(null);
        } catch (err) {
            setError('Failed to load items. Please make sure the JSON server is running.');
            console.error('Error loading items:', err);
        } finally {
            setLoading(false);
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

    function getPriorityRank(priorityId: string): number {
        const priority = priorityLevelMap.get(priorityId);
        return priority ? priority.rank : 0;
    }

    function getFilteredItems(): SearchableItem[] {
        if (!searchTerm.trim()) {
            return [];
        }

        const searchLower = searchTerm.toLowerCase();
        return allItems.filter(item =>
            item.description.toLowerCase().includes(searchLower)
        ).sort((a, b) => {
            // Sort by priority (high to low), then by creation time (old to new)
            const priorityDiff = getPriorityRank(b.priorityId) - getPriorityRank(a.priorityId);
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return a.createdAt - b.createdAt;
        });
    }

    function getPaginatedItems(): SearchableItem[] {
        const filtered = getFilteredItems();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    }

    function handleSearchChange(value: string) {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when search changes
    }

    const filteredItems = getFilteredItems();
    const paginatedItems = getPaginatedItems();
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    if (loading) {
        return (
            <div className="p-12 text-center">
                <p className="text-gray-500 text-lg">Loading search data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center">
                <p className="text-red-600 text-lg">⚠️ {error}</p>
                <button
                    onClick={loadAllItems}
                    className="mt-4 px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Search Box */}
            <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
                <div className="max-w-2xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔍 Search by Description:
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Enter keywords to search..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                        autoFocus
                    />
                    {searchTerm && (
                        <p className="mt-2 text-sm text-gray-600">
                            Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} matching "{searchTerm}"
                        </p>
                    )}
                </div>
            </div>

            {/* Search Results */}
            {!searchTerm.trim() ? (
                <div className="p-12 text-center">
                    <p className="text-gray-500 text-lg">Enter a search term to find items</p>
                    <p className="text-gray-400 text-sm mt-2">Search across all completed and in-progress items</p>
                </div>
            ) : paginatedItems.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-gray-500 text-lg">No items found matching "{searchTerm}"</p>
                    <p className="text-gray-400 text-sm mt-2">Try different keywords</p>
                </div>
            ) : (
                <>
                    <div className="divide-y divide-gray-200">
                        {paginatedItems.map((item: SearchableItem, index: number) => (
                            <div key={`${item.type}-${index}`} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
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
                                        <div className="text-lg text-gray-800 mb-2 prose prose-base max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    a: ({ node: _node, ...props }) => (
                                                        <a {...props} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" />
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

                                    {/* Priority Badge */}
                                    <div className="flex-shrink-0">
                                        <div className={`px-4 py-2 rounded-lg border-2 ${getPriorityColor(item.priority)} font-semibold text-sm text-center min-w-[100px]`}>
                                            {item.priority}
                                        </div>
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
            )}
        </div>
    );
}

export default SearchReport;
