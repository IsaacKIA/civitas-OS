import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function civitasPersistenceServerPlugin(): Plugin {
  const dataDir = path.resolve(process.cwd(), 'data');
  const backupDir = path.resolve(process.cwd(), 'backups');
  const dbFile = path.join(dataDir, 'civitas_db.json');
  const seedBackupFile = path.resolve(process.cwd(), 'Civitas_Ops_Backup_2026-11-11.json');

  const ensureDirs = () => {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    if (!fs.existsSync(dbFile) && fs.existsSync(seedBackupFile)) {
      fs.copyFileSync(seedBackupFile, dbFile);
    }
  };

  return {
    name: 'civitas-transactional-persistence-server',
    configureServer(server) {
      ensureDirs();

      server.middlewares.use('/api/state', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            ensureDirs();
            if (fs.existsSync(dbFile)) {
              const raw = fs.readFileSync(dbFile, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(raw);
              return;
            }
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'No server state initialized yet' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'Server read error' }));
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (!parsed || !parsed.settings || !Array.isArray(parsed.customers)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid state payload rejected by server' }));
                return;
              }
              ensureDirs();
              // Atomic write via temporary file
              const tmpFile = `${dbFile}.tmp`;
              fs.writeFileSync(tmpFile, JSON.stringify(parsed, null, 2), 'utf-8');
              fs.renameSync(tmpFile, dbFile);

              // Automatic daily rotating backup in backups/
              const todayStr = new Date().toISOString().split('T')[0];
              const dailyBackup = path.join(backupDir, `civitas_auto_backup_${todayStr}.json`);
              fs.writeFileSync(dailyBackup, JSON.stringify(parsed, null, 2), 'utf-8');

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString(), dailyBackup: path.basename(dailyBackup) }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message || 'Server write error' }));
            }
          });
          return;
        }

        next();
      });

      server.middlewares.use('/api/backups', (req, res, next) => {
        if (req.method === 'GET') {
          try {
            ensureDirs();
            const files = fs.readdirSync(backupDir)
              .filter(f => f.endsWith('.json'))
              .map(f => {
                const stat = fs.statSync(path.join(backupDir, f));
                return { filename: f, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() };
              })
              .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ backups: files }));
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err?.message || 'Failed to list backups' }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [civitasPersistenceServerPlugin()],
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5174,
    open: true
  }
});
