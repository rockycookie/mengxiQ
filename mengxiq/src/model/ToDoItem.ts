export class ToDoItem {
  constructor(
    public description: string,
    public link: string,
    public id: string,
    public created_time: number,
    public priorityId: string,
    public modified_time: number = created_time,
    public startDate: string | null = null,
    public deadline: string | null = null
  ) { }
}
