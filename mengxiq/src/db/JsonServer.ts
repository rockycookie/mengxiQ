import { v4 as uuidv4 } from 'uuid';
import { ToDoItem } from '../model/ToDoItem';

const db_url = 'http://localhost:8002';

export async function listQueuesDb(includeDeleted: boolean = false) {
  const queues = await (await fetch(db_url + '/queues/')).json();
  const filteredQueues = includeDeleted ? queues : queues.filter((q: any) => !q.isDeleted);
  // Sort by displayOrder (or by creation order if displayOrder is missing)
  return filteredQueues.sort((a: any, b: any) => {
    const orderA = a.displayOrder !== undefined ? a.displayOrder : 999999;
    const orderB = b.displayOrder !== undefined ? b.displayOrder : 999999;
    return orderA - orderB;
  });
}

export async function listDeletedQueuesDb() {
  const queues = await (await fetch(db_url + '/queues/')).json();
  return queues.filter((q: any) => q.isDeleted);
}

export async function createQueueDb(qname: string, description: string = ''): Promise<any> {
  // Get current queues to determine the next displayOrder
  const queues = await listQueuesDb(true);
  const maxOrder = queues.length > 0
    ? Math.max(...queues.map((q: any) => q.displayOrder !== undefined ? q.displayOrder : 0))
    : -1;

  const newQueue = {
    id: uuidv4(),
    name: qname,
    items: [],
    isDeleted: false,
    deletedAt: undefined,
    displayOrder: maxOrder + 1,
    description: description
  };
  await fetch(
    db_url + '/queues/',
    {
      method: 'POST',
      body: JSON.stringify(newQueue),
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return newQueue;
}

export async function getQueueDb(qid: string) {
  if (qid === '') { return undefined; }
  return await (await fetch(db_url + '/queues/' + qid)).json();
}

export async function addItemDb(qid: string, item: ToDoItem) {
  if (qid === '') { return; }
  const q = await getQueueDb(qid);
  if (q.items === null) {
    q.items = [item];
  } else {
    q.items.push(item);
  }
  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'PUT',
      body: JSON.stringify(q),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function deleteItemDb(qid: string, itemId: string) {
  if (qid === '') { return; }
  const q = await getQueueDb(qid);
  if (q.items === null) {
    return;
  } else {
    q.items = q.items.filter((item: any) => (item.id !== itemId));
  }
  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'PUT',
      body: JSON.stringify(q),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function updateItemDb(qid: string, updatedItem: ToDoItem) {
  if (qid === '') { return; }
  const q = await getQueueDb(qid);
  if (q.items === null) {
    return;
  } else {
    q.items = q.items.map((item: any) =>
      item.id === updatedItem.id ? updatedItem : item
    );
  }
  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'PUT',
      body: JSON.stringify(q),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function softDeleteQueueDb(qid: string) {
  if (qid === '') { return; }
  const q = await getQueueDb(qid);
  if (!q) { return; }

  q.isDeleted = true;
  q.deletedAt = Date.now();

  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'PUT',
      body: JSON.stringify(q),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function restoreQueueDb(qid: string) {
  if (qid === '') { return; }
  const q = await getQueueDb(qid);
  if (!q) { return; }

  q.isDeleted = false;
  q.deletedAt = undefined;

  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'PUT',
      body: JSON.stringify(q),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function permanentDeleteQueueDb(qid: string) {
  if (qid === '') { return; }

  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function updateQueueOrderDb(queueIds: string[]) {
  // Update displayOrder for each queue based on the array index
  const queues = await listQueuesDb(true);
  const updates = queueIds.map(async (qid, index) => {
    const queue = queues.find((q: any) => q.id === qid);
    if (queue) {
      queue.displayOrder = index;
      await fetch(
        db_url + '/queues/' + qid,
        {
          method: 'PUT',
          body: JSON.stringify(queue),
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });

  await Promise.all(updates);
}

export async function updateQueueDb(qid: string, updates: { name?: string; description?: string }) {
  if (qid === '') { return; }
  const q = await getQueueDb(qid);
  if (!q) { return; }

  if (updates.name !== undefined) {
    q.name = updates.name;
  }
  if (updates.description !== undefined) {
    q.description = updates.description;
  }

  await fetch(
    db_url + '/queues/' + qid,
    {
      method: 'PUT',
      body: JSON.stringify(q),
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
