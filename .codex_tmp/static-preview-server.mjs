import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const port = Number(process.argv[2] || 8765);
const host = process.argv[3] || '127.0.0.1';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

http.createServer((request, response) => {
  const requestUrl = new URL(request.url, 'http://127.0.0.1');
  const previewRoutes = {
    '/preview/schedule-detail': '/03-高保真页面/task-detail.html?id=P01&status=pending&source=schedule',
    '/preview/emergency-detail': '/03-高保真页面/task-detail.html?id=E-P01&status=pending&source=emergency',
    '/preview/dynamic-detail': '/03-高保真页面/task-detail.html?id=T-P01&status=pending&source=dynamic'
  };
  if (previewRoutes[requestUrl.pathname]) {
    response.writeHead(302, { Location: encodeURI(previewRoutes[requestUrl.pathname]) }).end();
    return;
  }
  const pathname = decodeURIComponent(requestUrl.pathname);
  const requested = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!requested.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(requested, (error, data) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
      return;
    }
    response.writeHead(200, { 'Content-Type': mime[path.extname(requested).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  });
}).listen(port, host, () => {
  console.log(`Preview server listening on http://${host}:${port}`);
});
