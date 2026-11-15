import { spawn } from 'child_process';
process.env.PORT = process.env.PORT || '3000';
import('./src/app.js').then(() => {
  const url = `http://localhost:${process.env.PORT}`;
  spawn(`start msedge --app=${url} --window-size=1360,860 || start chrome --app=${url} || start ${url}`, { shell: true, stdio: 'ignore' });
});
