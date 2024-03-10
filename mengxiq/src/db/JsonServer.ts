

const db_url = "http://localhost:8000"

export async function listQueuesDb() {
  return await (await fetch(db_url + "/queues/")).json();
}

export async function getQueueDb(qid: string) {
  if (qid === "") { return undefined; }
  return await (await fetch(db_url + "/queues/" + qid)).json();
}

export async function addItemDb(qid: string, item: object) {
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
