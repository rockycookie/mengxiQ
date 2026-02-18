import { v4 as uuidv4 } from 'uuid';
import { ToDoItem } from '../model/ToDoItem';

const db_url = "http://localhost:8002"

export async function listQueuesDb(includeDeleted: boolean = false) {
  const queues = await (await fetch(db_url + "/queues/")).json();
  if (includeDeleted) {
    return queues;
  }
  return queues.filter((q: any) => !q.isDeleted);
}

export async function listDeletedQueuesDb() {
  const queues = await (await fetch(db_url + "/queues/")).json();
  return queues.filter((q: any) => q.isDeleted);
}

export async function createQueueDb(qname: string): Promise<any> {
  const newQueue = {
    id: uuidv4(),
    name: qname,
    items: [],
    isDeleted: false,
    deletedAt: undefined
  };
  await fetch(
    db_url + "/queues/",
    {
      method: "POST",
      body: JSON.stringify(newQueue),
      headers: {"Content-Type": "application/json"},
    }
  )
  return newQueue;
}

export async function getQueueDb(qid: string) {
  if (qid === "") { return undefined; }
  return await (await fetch(db_url + "/queues/" + qid)).json();
}

export async function addItemDb(qid: string, item: ToDoItem) {
  if (qid === "") { return; }
  const q = await getQueueDb(qid);
  if (q.items === null) {
    q.items = [item];
  } else {
    q.items.push(item);
  }
  await fetch(
    db_url + "/queues/" + qid,
    {
      method: "PUT",
      body: JSON.stringify(q),
      headers: {"Content-Type": "application/json"},
    }
  )
}

export async function deleteItemDb(qid: string, itemId: string) {
  if (qid === "") { return; }
  const q = await getQueueDb(qid);
  if (q.items === null) {
    return;
  } else {
    q.items = q.items.filter((item: any) => (item.id !== itemId));
  }
  await fetch(
    db_url + "/queues/" + qid,
    {
      method: "PUT",
      body: JSON.stringify(q),
      headers: {"Content-Type": "application/json"},
    }
  )
}

export async function updateItemDb(qid: string, updatedItem: ToDoItem) {
  if (qid === "") { return; }
  const q = await getQueueDb(qid);
  if (q.items === null) {
    return;
  } else {
    q.items = q.items.map((item: any) => 
      item.id === updatedItem.id ? updatedItem : item
    );
  }
  await fetch(
    db_url + "/queues/" + qid,
    {
      method: "PUT",
      body: JSON.stringify(q),
      headers: {"Content-Type": "application/json"},
    }
  )
}

export async function softDeleteQueueDb(qid: string) {
  if (qid === "") { return; }
  const q = await getQueueDb(qid);
  if (!q) { return; }
  
  q.isDeleted = true;
  q.deletedAt = Date.now();
  
  await fetch(
    db_url + "/queues/" + qid,
    {
      method: "PUT",
      body: JSON.stringify(q),
      headers: {"Content-Type": "application/json"},
    }
  )
}

export async function restoreQueueDb(qid: string) {
  if (qid === "") { return; }
  const q = await getQueueDb(qid);
  if (!q) { return; }
  
  q.isDeleted = false;
  q.deletedAt = undefined;
  
  await fetch(
    db_url + "/queues/" + qid,
    {
      method: "PUT",
      body: JSON.stringify(q),
      headers: {"Content-Type": "application/json"},
    }
  )
}

export async function permanentDeleteQueueDb(qid: string) {
  if (qid === "") { return; }
  
  await fetch(
    db_url + "/queues/" + qid,
    {
      method: "DELETE",
      headers: {"Content-Type": "application/json"},
    }
  )
}
