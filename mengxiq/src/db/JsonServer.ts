

const db_url = "http://localhost:8000"

export async function getQueue(qid: string) {
  return await (await fetch(db_url + "/queues/" + qid)).json();
}
