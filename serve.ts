// Tiny static server for local play-testing. Serves game/ at the root
// on localhost:8080. Standard library only; run with `node serve.ts`
// and open the printed address in desktop Chrome.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const port = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    if (rel === '' || rel === '/') rel = 'index.html';
    const file = join(root, rel);
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Lentera Senja at http://127.0.0.1:${port}/`);
});
