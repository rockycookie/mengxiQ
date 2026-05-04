// Unified type for displaying both report items and queue items
export type ReportDisplayItem = {
  type: 'completed' | 'in-progress';
  description: string;
  link: string;
  priorityId: string;
  priority: string;
  createdAt: number;
  create_time: string;
  qname: string;
  qid: string;
  id: string; // ID from ReportItem or ToDoItem (always required)
  reportedAt?: number; // Only for completed items
  itemId?: string; // Only for in-progress items (original ToDoItem id)
  modifiedAt?: number; // Only for in-progress items
  modified_time?: string; // Only for in-progress items (display format)
};
