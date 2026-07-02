module.exports = {
  apps: [
    {
      name: 'life2026-db-local',
      script: 'npx',
      args: 'json-server@0.17.4 --watch ../json_server/real_db/work2024.json --port 8002 --host 127.0.0.1',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'report2026-db-local',
      script: 'npx',
      args: 'json-server@0.17.4 --watch ../json_server/real_db/report2024.json --port 8001 --host 127.0.0.1',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'mengxiq-app-local',
      script: 'npx',
      args: 'serve -s ../mengxiq/mgq-local -l tcp://127.0.0.1:3019',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'meilisearch-local',
      script: 'meilisearch',
      args: '--db-path ../search_engine/real_search_engine --http-addr 127.0.0.1:8011',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
