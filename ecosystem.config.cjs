module.exports = {
  apps: [
    {
      name: 'onyu-virtual-tryon',
      script: 'npm',
      args: 'run start',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 5112
      },
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log', '.git']
    }
  ]
};
