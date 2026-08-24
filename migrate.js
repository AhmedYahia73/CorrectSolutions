const { execSync } = require('child_process');
const fs = require('fs');

// تحديد الـ DATABASE_URL
process.env.DATABASE_URL = 'mysql://kidsero:Kidsero%403030@localhost:3306/kidsero';

const logFile = 'migration-log.txt';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage);
}

log('========== Migration Started ==========');
log('DATABASE_URL: ' + process.env.DATABASE_URL);

try {
  log('Running drizzle-kit push...');
  const output = execSync('npx drizzle-kit push --verbose', { 
    encoding: 'utf8',
    env: { ...process.env }
  });
  log('Output: ' + output);
  log('========== Migration Completed Successfully ==========');
} catch (error) {
  log('ERROR: ' + error.message);
  if (error.stdout) log('STDOUT: ' + error.stdout);
  if (error.stderr) log('STDERR: ' + error.stderr);
  log('========== Migration Failed ==========');
}
