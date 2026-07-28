const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

http.createServer((request, response) => {
    let requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
    if (requestPath === '/') requestPath = '/index.html';
    const filePath = path.resolve(root, `.${requestPath}`);
    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }
    fs.readFile(filePath, (error, file) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500);
            response.end('Not found');
            return;
        }
        response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
        response.end(file);
    });
}).listen(8000, '127.0.0.1');
