// A simple logger utility that wraps the console.
const logger = {
  log: (...args) => {
    console.log(...args);
  },
  info: (...args) => {
    console.info(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
  warn: (...args) => {
    console.warn(...args);
  }
};

module.exports = logger;
