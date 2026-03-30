/**
 * Logger Utility
 * Provides consistent logging across the application
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const logToFile = (level, message) => {
  const timestamp = getTimestamp();
  const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
};

const logger = {
  info: (message) => {
    const msg = `[INFO] ${message}`;
    console.log(msg);
    logToFile('INFO', message);
  },

  error: (message) => {
    const msg = `[ERROR] ${message}`;
    console.error(msg);
    logToFile('ERROR', message);
  },

  warn: (message) => {
    const msg = `[WARN] ${message}`;
    console.warn(msg);
    logToFile('WARN', message);
  },

  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      const msg = `[DEBUG] ${message}`;
      console.log(msg);
      logToFile('DEBUG', message);
    }
  },
};

module.exports = logger;
