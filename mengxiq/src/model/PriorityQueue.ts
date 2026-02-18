export class PriorityQueue {
  constructor(
    public id: string,
    public name: string,
    public isDeleted: boolean = false,
    public deletedAt?: number
  ) { }
}
