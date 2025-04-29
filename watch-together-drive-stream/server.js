const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

app.get('/', (req, res) => {
  const roomId = uuidv4();
  res.redirect(`/room/${roomId}`);
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId }) => {
    socket.join(roomId);
  });

  socket.on('iframe-sync', ({ roomId, action, time }) => {
    socket.to(roomId).emit('iframe-sync', { action, time });
  });

  socket.on('chat-message', ({ roomId, message }) => {
    socket.to(roomId).emit('chat-message', message);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});