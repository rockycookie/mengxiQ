const interpreter = process.env.HOME + '/.nvm/versions/node/v21.1.0/bin/node';

module.exports = {
  apps: [
    {
      name: 'life2026-db-local',
      script: 'npx',
      args: 'json-server ../json_server/real_db/work2024.json -p 8002 -h 127.0.0.1',
      cwd: __dirname,
      interpreter: interpreter,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PATH: process.env.HOME + '/.nvm/versions/node/v21.1.0/bin:' + process.env.PATH
      }
    },
    {
      name: 'report2026-db-local',
      script: 'npx',
      args: 'json-server ../json_server/real_db/report2024.json -p 8001 -h 127.0.0.1',
      cwd: __dirname,
      interpreter: interpreter,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PATH: process.env.HOME + '/.nvm/versions/node/v21.1.0/bin:' + process.env.PATH
      }
    },
    {
      name: 'mengxiq-app-local',
      script: 'npx',
      args: 'serve -s ../mengxiq/mgq-local -l tcp://127.0.0.1:3019',
      cwd: __dirname,
      interpreter: interpreter,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'development',
        PATH: process.env.HOME + '/.nvm/versions/node/v21.1.0/bin:' + process.env.PATH
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
    },
    {
      name: 'backup-json-db-local',
      script: '../backup/backup-json-db.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: '0 * * * *',
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'development',
        BACKUP_FILES: '../json_server/real_db/work2024.json, ../json_server/real_db/report2024.json'
      }
    }
  ]
};
