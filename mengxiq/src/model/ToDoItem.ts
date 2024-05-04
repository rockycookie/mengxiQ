export class ToDoItem {
    constructor(
        public description: string,
        public link: string,
        public id: string,
        public created_time: number,
        public priorityId: string
    ) {}
}
