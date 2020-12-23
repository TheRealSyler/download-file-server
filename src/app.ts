import express = require('express');
import { Response } from 'express';
import { Server } from 'http';
import { join, resolve } from 'path';
import { createReadStream, createWriteStream, promises, existsSync, mkdirSync} from 'fs';
import busboy from 'connect-busboy';

const port = 4000;
const ip = '192.168.7.131'
const uploadPath = resolve(process.cwd(),'assets')
ensureDir(uploadPath); 
 
const app = express();
const server = new Server(app);

app.use(busboy({
  highWaterMark: 2 * 1024 * 1024,
}));

app.get('/', async (req, res) => {
  console.log('get: /', req.ip)
  const css = (await promises.readFile('./public/index.css')).toString()
  const html = (await promises.readFile('./public/index.html')).toString()

  res.send(html.replace('--CARDS--', await genCards()).replace('--STYLE--', `<style>${css}</style>`))
});
 
app.get('/download/:name', (req, res) => {
  Download(req.ip,res, req.params.name);
});


app.post("/upload", (req, res) => {

  req.pipe(req.busboy); 

  req.busboy.on('file', (fieldName, file, filename) => {
    console.log(`Upload of '${filename}' started`);

    
    const fsStream = createWriteStream(join(uploadPath, filename));
    file.pipe(fsStream);


    fsStream.on('close', () => {
      console.log(`Upload of '${filename}' finished`);
      res.redirect('back');
    });
  });

});

async function genCards() {
  let out = ''
  const files = await promises.readdir('./assets')
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    out += `<div class="container" onclick="Download('${file}')" title="Click to Download">
  <h2>${file}</h2>
</div>`
  }
  return out
}
 
server.listen(port,ip , () => {
  console.log('Listening... ', `http://${ip}:${port}`);
});

function Download(ip: string,res: Response, file: string) {
  console.log('Download:', file, `(${ip})`, new Date().toLocaleTimeString());
  // ONLY FILES WORK, FOLDERS DO NOT GET DOWNLOADED
  const files = createReadStream(resolve(process.cwd(),'assets', file));
  res.writeHead(200, { 'Content-disposition': `attachment; filename=${file}` }); //here you can specify file name
  const a = files.pipe(res)
  a.addListener('close', () => {
    console.log('Downloaded:', file, `(${ip})`, new Date().toLocaleTimeString());
  })
}

function ensureDir(dir: string) {
  const exits = existsSync(dir)
  if (!exits) {
    mkdirSync(dir)
  }
}