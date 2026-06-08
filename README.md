# mengxiQ
MengxiQ is a to-do list. Users organize to-do items across multiple task queues, prioritize/catogrize them into 4 priority groups, then "report" the completed items to a separate reporting view (so that engineers/developers know what to say in the next standup meeting lol).

The principle is to **prioritize, record and forget quickly**, which minimizes the interruption to the currently in-progress task. And the user can come back later with a good sense of the items.

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
npx http-server build -p 3009 -a localhost
```
