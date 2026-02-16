import { useState, useEffect } from 'react';
import { Report as ReportType, ReportItem, getReportDb, current_report_id } from '../db/ReportJsonServer';

function Report(): JSX.Element {
  const [report, setReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');

  useEffect(() => {
    loadReport();
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
    // Otherwise, go back 1 day (yesterday)
    const daysToSubtract = dayOfWeek === 1 ? 4 : 1;
    
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

  function getFilteredItems(): ReportItem[] {
    if (!report || !report.items) return [];
    
    if (activeTab === 'recent') {
      const lastWorkDay = getLastWorkDayTimestamp();
      const today = getTodayTimestamp();
      return report.items.filter(item => 
        item.reportedAt >= lastWorkDay && item.reportedAt <= today
      );
    }
    
    return report.items;
  }

  const filteredItems = getFilteredItems();

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
                    onClick={() => setActiveTab('recent')}
                    className={`px-4 py-3 font-medium text-sm transition-all duration-150 border-b-2 ${
                    activeTab === 'recent'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                    }`}
                >
                    Since last workday ({filteredItems.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 font-medium text-sm transition-all duration-150 border-b-2 ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                All Items ({report.items.length})
              </button>
            </div>
          </div>

          {/* Report Items */}
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">No items found for this filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item: ReportItem, index: number) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Description */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {item.description}
                    </h3>

                    {/* Queue Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">
                        📋 Queue: <span className="font-medium">{item.qname}</span>
                      </span>
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
                          🔗 {item.link}
                        </a>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>
                        🕒 Created: {item.create_time}
                      </span>
                      <span>
                        📅 Reported: {formatDate(item.reportedAt)}
                      </span>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default Report;
