// Servidor simples (sem dependências): node server.js  ->  http://localhost:3000
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,FILE=path.join(__dirname,'data.json'),clients=new Set();
let st={edits:{},novos:{},mov:[],mails:{}};
try{st=Object.assign(st,JSON.parse(fs.readFileSync(FILE,'utf8')))}catch(e){}
const save=()=>{fs.writeFileSync(FILE+'.tmp',JSON.stringify(st));fs.renameSync(FILE+'.tmp',FILE)};
const push=()=>{const d='data: '+JSON.stringify(st)+'\n\n';clients.forEach(r=>r.write(d))};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript'};
http.createServer((req,res)=>{
 const u=req.url.split('?')[0];
 if(u=='/api/state'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(st))}
 if(u=='/api/stream'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});res.write('retry: 3000\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return}
 if(req.method=='POST'&&u.startsWith('/api/')){let b='';req.on('data',c=>{b+=c;if(b.length>1e6)req.destroy()});req.on('end',()=>{try{const d=JSON.parse(b);
  if(u=='/api/edit'&&/^[AFN][\w]*$/.test(d.key)){const t=d.key[0]=='N'?st.novos:st.edits;t[d.key]=Object.assign(t[d.key]||{},d.patch)}
  else if(u=='/api/mov'){st.mov.push(d)}
  else if(u=='/api/mails'){st.mails=d}
  else throw 0;
  save();push();res.end('ok')}catch(e){res.statusCode=400;res.end('erro')}});return}
 const f=path.join(__dirname,u=='/'?'index.html':path.basename(u));
 fs.readFile(f,(e,data)=>{if(e){res.statusCode=404;return res.end('nao encontrado')}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(data)});
}).listen(PORT,'0.0.0.0',()=>console.log('AFM dashboard em http://localhost:'+PORT));
