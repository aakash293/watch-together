const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.room = room;
  });

  socket.on('setVideo', (url) => {
    io.to(socket.room).emit('loadVideo', url);
  });

  socket.on('controlVideo', (data) => {
    socket.to(socket.room).emit('controlVideo', data);
  });

  socket.on('chat', ({ room, message }) => {
    io.to(room).emit('chat', { message });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));