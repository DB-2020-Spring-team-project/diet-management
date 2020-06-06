const http = require('http');
const port = 3000;
const hostname = '127.0.0.1';
var server = http.createServer((req, res)=> {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello, World\n');
});

server.listen(port, hostname, ()=> {
    console.log(`Server running at http://${hostname}:${port}/`);
});
