const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const peerServer = ExpressPeerServer(server, {
  debug: true
});
app.use('/peerjs', peerServer);

let videoState = {
  url: '',
  time: 0,
  isPlaying: false
};

io.on('connection', socket => {
  console.log('User connected:', socket.id);

  socket.on('join-room', roomId => {
    socket.join(roomId);
    socket.emit('video-state', videoState);
    socket.to(roomId).emit('user-connected', socket.id);
  });

  socket.on('video-action', ({ roomId, action }) => {
    videoState = { ...videoState, ...action };
    socket.to(roomId).emit('sync-video', action);
  });

  socket.on('chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('chat-message', message);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
