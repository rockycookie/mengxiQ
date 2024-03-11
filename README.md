# mengxiQ
This is a task management tool for multiple item queues (todo list) with customized priority definition. The tool is to help users to quickly capture and record any new idea/suggestion/concern when they are focusing on their primary task which could be totally irrelevant to the items they add to the queues.

The principle is to **prioritize, record and forget quickly**, which minimizes the interruption to the primary task. And the user can come back later with a good sense of the items.

Note this tool is not designed to replace formal feature tracking software systems like Jira. It is designed to be a temporary cache, where users come back and clean the queues frequently (once they have a break from their primary task). By cleaning the queue, users do not have to finish the action, they can put those into formal feature tracking system with more data for example.

## How to run
### 1. Create new db if needed
Simply create a JSON file in `./json_server/real_db` with content:
```
{
    "queues": []
}
```
for example `./json_server/real_db/work2024.json`

### 2. Spin up the db
```
npx json-server --watch ./json_server/real_db/work2024.json --port 8000
```

### 3. Spin up the React app
```
cd mengxiq
npm run build
npx serve -s build
```
