const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer((request, response) => {
  let requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (requestPath === '/') requestPath = '/index.html';
  const filePath = path.resolve(root, `.${requestPath}`);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      return response.end('Not found');
    }
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  });
}).listen(8765, '127.0.0.1');
