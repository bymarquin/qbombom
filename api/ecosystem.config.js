module.exports = {
  apps: [
    {
      name: 'qbombom-api',
      script: './app.js',
      instances: 2,
      exec_mode: 'cluster',
      sticky: true,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'development',
      },
    },
  ],
};
