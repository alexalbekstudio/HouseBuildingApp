import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Ako nije podešen DATABASE_URL, koristi lokalnu SQLite bazu pored .exe fajla
const appDir = process.cwd();
if (!process.env.DATABASE_URL) {
  const dbFile = path.join(appDir, 'housebuilding_local.db');
  process.env.DATABASE_URL = `file:${dbFile}`;
}
process.env.PORT = process.env.PORT || '3000';

// Pokreni Express server
import('./src/app.js').then(() => {
  const url = `http://localhost:${process.env.PORT}`;
  console.log(`HouseBuilding Desktop pokrenut na ${url}`);

  // Otvori nativni Windows App prozor (Edge/Chrome --app mod bez adresne trake, isto kao pywebview)
  const startCmd = `start msedge --app=${url} --window-size=1360,860 || start chrome --app=${url} || start ${url}`;
  spawn(startCmd, { shell: true, stdio: 'ignore' });
});