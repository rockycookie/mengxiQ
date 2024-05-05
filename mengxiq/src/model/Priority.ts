class Priority {
	constructor(public display: string, public rank: number) { }
}
export const priorityLevelMap = new Map<string, Priority>([
	["select_priority", new Priority("Select priority", 0)],
	["do_it_now", new Priority("Do it now", 100)],
	["important_doable", new Priority("Important doable", 80)],
	["low_hanging_fruit", new Priority("Low-hanging fruit", 70)],
	["moon_shooting", new Priority("Moon shooting", 50)],
]);

export const priorityLevelMapKeys = [
	"select_priority",
	"do_it_now",
	"important_doable",
	"low_hanging_fruit",
	"moon_shooting",
];
