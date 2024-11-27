module.exports = {
  apps: [{
    name: "48cp-server",
    script: "./dist/app.js",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      MONGODB_URI: "mongodb://jayzhao:ilovediyi@8.218.98.220:27017/48cp",
      // 其他环境变量...
    }
  }]
} 