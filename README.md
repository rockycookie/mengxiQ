# mengxiQ
MengxiQ is a to-do list. Users organize to-do items across multiple task queues, prioritize/catogrize them into 4 priority groups, then "report" the completed items to a separate reporting view (so that engineers/developers know what to say in the next standup meeting lol).

The principle is to **prioritize, record and forget quickly**, which minimizes the interruption to the currently in-progress task. And the user can come back later with a good sense of the items.

The UI is done by React TypeScript. NodeJS JSON Server is used as a REST backend, which is more than enough for the currently single-user scenario~

## How to run
### 0. Setup
```
nvm use v21.1.0
```

### 1. Create new db if needed
Simply create a JSON file in `./json_server/real_db` with content:
```
{
    "queues": []
}
```
for example `./json_server/real_db/work2024.json`

### 2. Spin up the db
- Queue Items db
```
npx json-server --watch ./json_server/real_db/work2024.json --port 8002
```
- Report db
```
npx json-server --watch ./json_server/real_db/report2024.json --port 8001
```

### 3. Spin up the React app
```
cd mengxiq
npm run build
npx serve -s build -l 3019
```
