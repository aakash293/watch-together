// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (index.html, room.html, etc.)
app.use(express.static(path.join(__dirname)));

// Root redirect to index.html (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join', (room) => {
    socket.join(room);
    console.log('User joined room: ${room}');
  });

  socket.on('chat', ({ room, msg }) => {
    io.to(room).emit('chat', msg);
  });

  socket.on('video-control', (data) => {
    socket.to(data.room).emit('video-control', data);
  });

  socket.on('video-load', (data) => {
    socket.to(data.room).emit('video-load', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on http://localhost:${PORT}');
});
