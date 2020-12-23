import express = require('express');
import { Response } from 'express';
import { Server } from 'http';
import { join, resolve } from 'path';
import { createReadStream, createWriteStream, promises, existsSync, mkdirSync } from 'fs';
import busboy from 'connect-busboy';
import { config } from 'dotenv'

config()

const PORT = process.env.PORT || 5000;
const IP = process.env.IP || '192.168.7.131'
const uploadPath = resolve(process.cwd(), 'assets')
ensureDir(uploadPath);

const app = express();
const server = new Server(app);

app.use(busboy({
  highWaterMark: 2 * 1024 * 1024,
}));

app.get('/', async (req, res) => {
  console.log('get: /', req.ip)
  const css = await LoadFile('./public/index.css')
  const html = await LoadFile('./public/index.html')

  res.send(html.replace('--CARDS--', await genCards()).replace('--STYLE--', `<style>${css}</style>`))
});

app.get('/download/:name', (req, res) => {
  Download(req.ip, res, req.params.name);
});



app.post("/upload", (req, res) => {

  req.pipe(req.busboy);

  req.busboy.on('file', (fieldName, file, filename) => {
    if (filename) {

      console.log(`Upload of '${filename}' started`);

      const fsStream = createWriteStream(join(uploadPath, filename));
      file.pipe(fsStream);

      fsStream.on('close', () => {
        console.log(`Upload of '${filename}' finished`);
        res.redirect('back');
      });
    } else {
      console.log('upload filename empty')
      res.redirect('back')
    }
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

server.listen(PORT, IP as any, () => {
  console.log('Listening... ', `http://${IP}:${PORT}`);
});

function Download(ip: string, res: Response, file: string) {
  console.log('Started downloading:', file, `(${ip})`, new Date().toLocaleTimeString());
  // ONLY FILES WORK, FOLDERS DO NOT GET DOWNLOADED
  const files = createReadStream(resolve(process.cwd(), 'assets', file));
  res.writeHead(200, { 'Content-disposition': `attachment; filename=${file}` }); //here you can specify file name
  const a = files.pipe(res)
  a.addListener('close', () => {
    console.log('Finished downloading:', file, `(${ip})`, new Date().toLocaleTimeString());
  })
}

function ensureDir(dir: string) {
  const exits = existsSync(dir)
  if (!exits) {
    mkdirSync(dir)
  }
}

async function LoadFile(path: string) {
  return (await promises.readFile(path)).toString()
}