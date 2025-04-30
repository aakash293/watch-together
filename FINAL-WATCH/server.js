const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', socket => {
  socket.on('join', room => socket.join(room));

  socket.on('chat', ({ room, msg }) => {
    io.to(room).emit('chat', msg);
  });

  socket.on('video-control', data => {
    socket.to(data.room).emit('video-control', data);
  });

  socket.on('video-load', data => {
    socket.to(data.room).emit('video-load', data);
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));