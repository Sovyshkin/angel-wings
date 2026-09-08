module.exports = {
  apps: [
    {
      name: 'angel-wings-telegram-worker',
      script: 'src/telegram-worker.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      restart_delay: 3000,
      max_memory_restart: '256M',
      kill_timeout: 10000,
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
