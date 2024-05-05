import { v4 as uuidv4 } from 'uuid';
import { priorityLevelMap } from '../model/Priority';

const db_url = "http://localhost:8001";

export const current_report_id = "7ce7c617-82ab-4fa0-8cfd-051c02751862";

export class Report {
  constructor(
    public id: string,
    public name: string,
    public items: ReportItem[],
  ) { }
}

export class ReportItem {
  reportedAt: number
  constructor(
    public description: string,
    public link: string,
    public priorityId: string,
    public priority: string,
    public createdAt: number,
    public create_time: string,
    public qname: string,
    public qid: string,
  ) {
    this.reportedAt = Date.now()
  }
}

export async function listReportsDb() {
  return await (await fetch(db_url + "/reports/")).json();
}

export async function createReportDb(rname: string): Promise<Report> {
  const newReport = new Report(uuidv4(), rname, []);
  await fetch(
    db_url + "/reports/",
    {
      method: "POST",
      body: JSON.stringify(newReport),
      headers: { "Content-Type": "application/json" },
    }
  )
  return newReport;
}

export async function getReportDb(rid: string): Promise<Report> {
  if (rid === "") { throw Error("Not able to process empty report ID"); }
  return await (await fetch(db_url + "/reports/" + rid)).json();
}

export async function addReportItemDb(
  rid: string,
  item: ReportItem,
  sortAlg: (a: ReportItem, b: ReportItem) => number
) {
  if (rid === "") { return; }
  const r = await getReportDb(rid);
  if (r.items === null) {
    r.items = [item];
  } else {
    r.items.push(item);
  }
  r.items.sort(sortAlg);

  await fetch(
    db_url + "/reports/" + rid,
    {
      method: "PUT",
      body: JSON.stringify(r),
      headers: { "Content-Type": "application/json" }
    }
  )
}
