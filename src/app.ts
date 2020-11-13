import express = require('express');
import { Response } from 'express';
import { Server } from 'http';
import { normalize, resolve } from 'path';
import { createReadStream, promises, readdir, readFileSync } from 'fs';
const port = 4000;

const app = express();
const server = new Server(app);
app.get('/', async (req, res) => {
  console.log('get: /', req.ip)
  res.send(`<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Downloads</title>
  <style>${(await promises.readFile('./public/index.css')).toString()}</style>
</head>
  
<body>
  <div class="header" style="text-align: center">click to download</div>
  ${await genCards()}
  <script>
    function Download(path) {
      window.open(\`/download/\${path}\`)
      console.log('DOWNLOAD', path)
    }
  </script>
  </body>
</html>`)

});

app.get('/download/:name', (req, res) => {
  Download(req.ip,res, req.params.name);
});

async function genCards() {
  let out = ''
  const files = await promises.readdir('./assets')
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    out += `<div class="container" onclick="Download('${file}')">
  <h2>${file}</h2>
</div>`
  }
  return out
}

server.listen(port, '192.168.7.131', () => {
  console.log('Listening... ', `http://192.168.7.131:${port}`);
});
function Download(ip: string,res: Response, file: string) {
  console.log('Download:', file, `(${ip})`);
  // ONLY FILES WORK, FOLDERS DO NOT GET DOWNLOADED
  const files = createReadStream(resolve(process.cwd(),'assets', file));
  res.writeHead(200, { 'Content-disposition': `attachment; filename=${file}` }); //here you can specify file name
  const a = files.pipe(res)
  a.addListener('close', () => {
    console.log('Downloaded:', file, `(${ip})`);
  })
}
