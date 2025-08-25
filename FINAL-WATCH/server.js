const express = require('express');
const http = require('http');
const path = require('path');
const axios = require('axios');
const compression = require('compression');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const { Transform } = require('stream');
const srt2vtt = require('srt-to-vtt');

const { Server } = require('socket.io');

const app = express();
app.use(compression());
const server = http.createServer(app);
const io = new Server(server);

// Serve static files like index.html, room.html, client.js
app.use(express.static(path.join(__dirname)));
const upload = multer({ dest: 'uploads/' });
app.use('/subtitles', express.static(path.join(__dirname, 'public/subtitles')));


const roomUsers = {};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/room.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'room.html'));
});

app.get('/proxy', async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.status(400).send('Missing video URL');

  try {
    const response = await axios.get(videoUrl, {
      responseType: 'stream',
      headers: {
        'Range': req.headers.range || ''
      },
      timeout: 10000
    });

    const contentType = response.headers['content-type'] || (
      videoUrl.endsWith('.mkv') ? 'video/x-matroska' :
      videoUrl.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream'
    );

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length, Content-Type',
      'Content-Type': contentType
    };

    if (response.headers['content-length']) {
      headers['Content-Length'] = response.headers['content-length'];
    }

    if (response.headers['accept-ranges']) {
      headers['Accept-Ranges'] = response.headers['accept-ranges'];
    }

    if (response.headers['content-range']) {
      headers['Content-Range'] = response.headers['content-range'];
    }

    res.writeHead(response.status || 200, headers);

    // Stream directly to the client without buffering
    response.data.pipe(res);

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy failed: ' + err.message);
  }
});

app.post('/upload-subtitles', upload.single('zip'), async (req, res) => {
  const zipPath = req.file.path;
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const subtitleDir = path.join(__dirname, 'public/subtitles');
  if (!fs.existsSync(subtitleDir)) fs.mkdirSync(subtitleDir, { recursive: true });

  const vttFiles = [];

  for (const entry of entries) {
    if (entry.entryName.endsWith('.srt') || entry.entryName.endsWith('.sub')) {
      const raw = entry.getData();
      const baseName = path.basename(entry.entryName, path.extname(entry.entryName));
      const vttName = `${baseName}-${Date.now()}.vtt`;
      const vttPath = path.join(subtitleDir, vttName);

      const readStream = new Transform({
        transform(chunk, _, cb) { cb(null, chunk); }
      });
      readStream.end(raw);
      const writeStream = fs.createWriteStream(vttPath);

      await new Promise((resolve, reject) => {
        readStream
          .pipe(srt2vtt())
          .pipe(writeStream)
          .on('finish', () => {
            vttFiles.push(`/subtitles/${vttName}`);
            resolve();
          })
          .on('error', reject);
      });
    }
  }

  fs.unlinkSync(zipPath); // cleanup uploaded zip
  res.json({ subtitles: vttFiles });
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', ({ room, name }) => {
    socket.join(room);
    socket.room = room;
    socket.name = name;

    if (!roomUsers[room]) roomUsers[room] = {};
    roomUsers[room][socket.id] = name;

    io.to(room).emit('user-list', Object.values(roomUsers[room]));
  });

  
  socket.on('chat', ({ room, msg }) => {
    io.to(room).emit('chat', msg);
  });

  socket.on('ready', (room) => {
    socket.to(room).emit('ready', socket.id);
  });

  socket.on('offer', ({ target, offer }) => {
    io.to(target).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ target, answer }) => {
    io.to(target).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', { from: socket.id, candidate });
  });
  
  // socket.on('file-loaded', ({ room, name, filename }) => {
  //   socket.to(room).emit('file-loaded', { name, filename });
  // });
  
  socket.on('file-loaded', ({ room, name, filename }) => {
    io.to(room).emit('file-loaded', { name, filename });
  });

  
  socket.on('set-video', ({ room, link }) => {
    socket.to(room).emit('set-video', { link });
  });
  socket.on('set-subtitle', ({ room, content }) => {
     io.to(room).emit('set-subtitle', { content });
  });
  socket.on('subtitle-set', ({ room, subtitles }) => {
  io.to(room).emit('subtitle-set', { subtitles });
  });
  
  socket.on('ping-keepalive', () => {
  // Keep-alive ping received
  });
  
  socket.on('video-action', ({ room, action, time }) => { 
    socket.to(room).emit('video-action', { action, time }); 
  });

  socket.on('sync-video', ({ room, action, time }) => {
    socket.to(room).emit('sync-video', { action, time });
  });
  socket.on('camera-toggle', ({ room, on }) => {
  socket.to(room).emit('camera-toggle', { from: socket.id, on });
});
  
  socket.on('disconnect', () => {
    const room = socket.room;
    if (room && roomUsers[room]) {
      delete roomUsers[room][socket.id];
      io.to(room).emit('user-list', Object.values(roomUsers[room]));
      io.to(room).emit('user-disconnected', socket.id);
    }
    console.log('A user disconnected');
  });
});



const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
