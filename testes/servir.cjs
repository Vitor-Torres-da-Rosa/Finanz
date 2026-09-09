const http=require('http'),fs=require('fs'),p=require('path');
const raiz=process.argv[2], porta=Number(process.argv[3]);
const tipos={'.html':'text/html','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.jpg':'image/jpeg','.png':'image/png'};
http.createServer((q,s)=>{let u=q.url.split('?')[0]; if(u==='/')u='/index.html';
const f=p.join(raiz,u);
try{const b=fs.readFileSync(f);s.writeHead(200,{'Content-Type':tipos[p.extname(f)]||'application/octet-stream'});s.end(b);}catch(e){s.writeHead(404);s.end('x');}}).listen(porta);
