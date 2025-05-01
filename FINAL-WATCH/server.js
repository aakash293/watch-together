const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files like index.html, room.html, client.js
app.use(express.static(path.join(__dirname)));

const roomUsers = {};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/room.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'room.html'));
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
  
  socket.on('set-video', ({ room, link }) => {
    socket.to(room).emit('set-video', { link });
  });

  socket.on('video-action', ({ room, action, time }) => { 
    socket.to(room).emit('video-action', { action, time }); 
  });

  socket.on('sync-video', ({ room, action, time }) => {
    socket.to(room).emit('sync-video', { action, time });
  });
    

  socket.on('disconnect', () => {
    const room = socket.room;
    if (room && roomUsers[room]) {
      delete roomUsers[room][socket.id];
      io.to(room).emit('user-list', Object.values(roomUsers[room]));
    }
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
