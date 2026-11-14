const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT) || 8000;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json'
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'clinic-visit-history.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(root, relative);

  if (file !== root && !file.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(file, (statError, stat) => {
    const target = !statError && stat.isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (error, data) => {
      if (error) {
        response.writeHead(error.code === 'ENOENT' ? 404 : 500, {'Content-Type': 'text/plain; charset=utf-8'});
        response.end(error.code === 'ENOENT' ? 'Halaman tidak ditemukan.' : 'Server lokal mengalami masalah.');
        return;
      }
      response.writeHead(200, {'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream'});
      response.end(data);
    });
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`EchaVet tersedia di http://localhost:${port}`);
});
