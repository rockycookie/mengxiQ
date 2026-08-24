import { useState } from 'react';
import { ToDoItem } from '../model/ToDoItem';
import { priorityLevelMap } from '../model/Priority';
import { isEncryptedFormat } from '../utils/encryption';

function DeadlineTimeline(props: { items: ToDoItem[] }): JSX.Element | null {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const itemsWithDeadline = props.items.filter(item => item.deadline);
  if (itemsWithDeadline.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);

  // Find the earliest start date across all items (fallback: today)
  const allStartDates = props.items
    .map(item => item.startDate)
    .filter((d): d is string => !!d);
  const fallbackStart = allStartDates.length > 0
    ? allStartDates.sort()[0]
    : today;

  // Compute each bar's effective start and deadline
  const bars = itemsWithDeadline.map(item => ({
    item,
    start: item.startDate || fallbackStart,
    end: item.deadline!,
  }));

  // Overall timeline range
  const timelineStart = new Date(
    Math.min(...bars.map(b => new Date(b.start).getTime()), new Date(today).getTime())
  );
  const timelineEnd = new Date(
    Math.max(...bars.map(b => new Date(b.end).getTime()), new Date(today).getTime())
  );

  // Add 1-day padding on each side
  const rangeStartMs = timelineStart.getTime() - 86400000;
  const rangeEndMs = timelineEnd.getTime() + 86400000;
  const totalMs = rangeEndMs - rangeStartMs;
  if (totalMs <= 0) return null;

  const toPercent = (dateStr: string) => {
    return ((new Date(dateStr).getTime() - rangeStartMs) / totalMs) * 100;
  };

  const todayPercent = ((Date.now() - rangeStartMs) / totalMs) * 100;

  // Generate tick marks — roughly 5-7 ticks
  const ticks: string[] = [];
  const totalDays = Math.round(totalMs / 86400000);
  const step = Math.max(1, Math.round(totalDays / 6));
  for (let i = 0; i <= totalDays; i += step) {
    const d = new Date(rangeStartMs + i * 86400000);
    ticks.push(d.toISOString().slice(0, 10));
  }
  // Ensure last date is included
  const lastTick = new Date(rangeEndMs).toISOString().slice(0, 10);
  if (ticks[ticks.length - 1] !== lastTick) ticks.push(lastTick);

  const priorityColors: Record<string, string> = {
    'do_it_now': 'bg-red-400',
    'important_doable': 'bg-orange-400',
    'low_hanging_fruit': 'bg-yellow-400',
    'moon_shooting': 'bg-blue-400',
    'select_priority': 'bg-gray-400',
  };

  const firstLine = (s: string) => s.split('\n')[0];
  const truncate = (s: string, max: number) =>
    s.length > max ? s.slice(0, max - 1) + '…' : s;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Deadline Timeline</h3>

      <div className="relative">
        {/* Bars */}
        <div className="space-y-2 mb-6">
          {bars.map(({ item, start, end }) => {
            const left = toPercent(start);
            const right = toPercent(end);
            const width = Math.max(right - left, 0.5);
            const isOverdue = end < today;
            const barColor = isOverdue ? 'bg-red-600' : (priorityColors[item.priorityId] || 'bg-gray-400');
            const label = isEncryptedFormat(item.description) ? '🔒 Encrypted' : firstLine(item.description);
            const priority = priorityLevelMap.get(item.priorityId)?.display || '';

            return (
              <div key={item.id}>
                <div className="flex items-center gap-2" style={{ minHeight: '28px' }}>
                  <div className="relative flex-1" style={{ height: '24px' }}>
                    <div
                      className={`absolute top-0 h-full rounded ${barColor} opacity-80 hover:opacity-100 transition-opacity cursor-pointer overflow-hidden`}
                      style={{ left: `${left}%`, width: `${width}%`, minWidth: '4px' }}
                      title={`${label}\n${priority}\n${start} → ${end}${isOverdue ? ' (overdue)' : ''}`}
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium whitespace-nowrap">
                        {label}
                      </span>
                    </div>
                  </div>
                </div>
                {expandedId === item.id && (
                  <div className="text-xs text-gray-700 bg-gray-50 rounded px-3 py-1 mt-1 mb-1 break-words">
                    {label} — {item.startDate ? `${start} → ` : '→ '}{end}{isOverdue ? ' (overdue)' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* X-axis */}
        <div className="relative h-6 border-t border-gray-300 mt-1">
          {/* Today marker */}
          {todayPercent >= 0 && todayPercent <= 100 && (
            <div
              className="absolute top-0 w-px bg-red-500"
              style={{ left: `${todayPercent}%`, height: '100%' }}
            >
              <span className="absolute -top-4 -translate-x-1/2 text-[10px] text-red-500 font-semibold whitespace-nowrap">
                today
              </span>
            </div>
          )}
          {ticks.map((tick) => {
            const pct = toPercent(tick);
            if (pct < 0 || pct > 100) return null;
            return (
              <div key={tick} className="absolute" style={{ left: `${pct}%` }}>
                <div className="w-px h-2 bg-gray-400" />
                <span className="absolute top-2 -translate-x-1/2 text-[10px] text-gray-500 whitespace-nowrap">
                  {tick.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DeadlineTimeline;
