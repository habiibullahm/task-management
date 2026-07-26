/**
 * Frees the configured API port so `npm run dev` does not fail with EADDRINUSE.
 * Cross-platform: Windows (netstat/taskkill) and Unix (lsof/kill).
 */
const { execSync } = require('child_process');
const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  /* optional */
}

const port = String(process.env.PORT || 8080).trim();

function pidsOnWindows(targetPort) {
  let output = '';
  try {
    output = execSync(`netstat -ano | findstr :${targetPort}`, { encoding: 'utf8' });
  } catch {
    return [];
  }

  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    if (!/LISTENING/i.test(line)) continue;
    // Match local address ending with :port (IPv4 or [::]:port)
    if (!new RegExp(`[:\\.]${targetPort}\\s`).test(line) && !line.includes(`:${targetPort} `)) {
      continue;
    }
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }
  return [...pids];
}

function pidsOnUnix(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN`, { encoding: 'utf8' });
    return output
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
  } else {
    execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
  }
}

const pids = process.platform === 'win32' ? pidsOnWindows(port) : pidsOnUnix(port);

if (pids.length === 0) {
  console.log(`[free-port] Port ${port} is free`);
  process.exit(0);
}

for (const pid of pids) {
  try {
    killPid(pid);
    console.log(`[free-port] Freed port ${port} (killed PID ${pid})`);
  } catch (error) {
    console.warn(`[free-port] Could not kill PID ${pid}:`, error.message || error);
  }
}
