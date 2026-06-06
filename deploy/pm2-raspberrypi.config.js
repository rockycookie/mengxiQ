module.exports = {
  apps: [
    {
      name: 'nginx',
      script: 'nginx',
      args: "-g 'daemon off;' -c /home/admin11/workspace/mengxiq/nginx.conf",
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'life2026-db',
      script: 'npx',
      args: 'json-server@0.17.4 --watch life2026.json --port 8002 --host 127.0.0.1',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'report2026-db',
      script: 'npx',
      args: 'json-server@0.17.4 --watch report2026.json --port 8001 --host 127.0.0.1',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'mengxiq-app',
      script: 'npx',
      args: 'http-server mgq-raspberrypi -p 3018 -a 127.0.0.1',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'meilisearch',
      script: 'meilisearch',
      args: '--db-path /home/admin11/workspace/meilisearch/data --http-addr 127.0.0.1:8011',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
