# mengxiQ
MengxiQ is a to-do list for engineers/developers. Users organize to-do items across multiple task queues, prioritize them into 4 color-coded priority groups, and "report" completed items to a separate reporting view — so you know exactly what to say in the next standup meeting.

The principle is to 
1. **prioritize, record and forget quickly**
2. **remember quickly**

which minimizes the interruption to the currently in-progress task. The user can come back later with a good sense of the items. And the user can search history from those items as a knowledge base.

Key features:
- **Queue management** — create, edit, reorder (drag-and-drop), soft-delete and restore queues, each with optional markdown descriptions
- **To-do items** — add/edit/delete items with description (markdown), reference link, priority, optional start date and deadline
- **Deadline timeline** — Gantt-chart-like visualization of items with deadlines, with a today indicator
- **Encryption** — optionally encrypt item descriptions with a session passphrase; on-click decryption with hint support
- **Reporting** — mark items as completed to move them into a report; filter by date range (defaults to last workday → today), by today, or view all; filter by queue; undo completed items back to their queue; paginated results
- **Full-text search** — powered by Meilisearch with fuzzy matching across all items (completed and in-progress), filterable by queue
- **Deleted queues** — soft-deleted queues can be restored or permanently removed

The UI is done by React TypeScript. NodeJS JSON Server is used as a REST backend, which is more than enough for the currently single-user scenario~

## To deploy/run on RaspberryPi
- [Deploy RaspberryPi](./deploy/DEPLOY_RASPBERRYPI.md)

## To run locally
No nginx required — services are accessed directly over HTTP.

### 1. Build
```sh
nvm use v21.1.0
cd mengxiq   ## from the root of this project

npm run build:local
```

### 2. Run
```sh
nvm use v21.1.0
npm install pm2@latest -g

cd deploy   ## from the root of this project
pm2 start pm2-local.config.js
```

To reload after config changes:
```sh
pm2 delete mengxiq-app-local
pm2 start pm2-local.config.js --only mengxiq-app-local
```

Access the app at `http://127.0.0.1:3019/`

## To run as dev
### 0. Setup
```sh
nvm use v21.1.0
```

### 1. Create new db if needed
Simply create JSON files in `./json_server/real_db` with content:
```json
// task queue
{
    "queues": []
}

// report
{
    "reports": [
        {
            "id": "7ce7c617-82ab-4fa0-8cfd-051c02751862",
            "name": "Current Report",
            "items": []
        }
    ]
}
```
for example `./json_server/real_db/work2024.json`, `./json_server/real_db/report2024.json`

### 2. Spin up the db
- Queue Items db
```sh
npx json-server --watch ./json_server/real_db/work2024.json --port 8002
```
- Report db
```sh
npx json-server --watch ./json_server/real_db/report2024.json --port 8001
```

### 3. Spin up the full-text search engine
```sh
meilisearch --db-path ./search_engine/real_db --http-addr 127.0.0.1:8011
```

### 4. Spin up the React app
```sh
cd mengxiq
npm run build:local
npx serve -s build -l tcp://localhost:3009
```
