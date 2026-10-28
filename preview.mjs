import { createServer } from 'node:http';
import {createReadStream, statSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
const root = import.meta.dirname;
const port = Number(process.env.PORT || 4187);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const server = createServer((req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + pathname);
    if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403); res.end('Forbidden'); return; }
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    res.writeHead(200, {'Content-Type':mime[extname(file)] || 'application/octet-stream'});
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`DEA preview: http://127.0.0.1:${port}`));
