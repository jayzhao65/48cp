module.exports = {
  apps: [{
    name: "48cp",
    script: "./dist/app.js",
    watch: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true
  }]
}