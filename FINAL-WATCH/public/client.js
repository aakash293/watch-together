const socket = io();
const params = new URLSearchParams(window.location.search);
const room = params.get("room");
socket.emit("joinRoom", room);

function setVideoLink() {
  const link = document.getElementById('videoLink').value;
  const embedLink = link.replace('/view', '/preview');
  socket.emit('setVideo', embedLink);
}

socket.on('loadVideo', (url) => {
  document.getElementById('videoFrame').src = url;
});

function playVideo() {
  socket.emit('controlVideo', { action: 'play' });
}
function pauseVideo() {
  socket.emit('controlVideo', { action: 'pause' });
}

socket.on('controlVideo', ({ action }) => {
  const iframe = document.getElementById('videoFrame');
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: action + 'Video', args: [] }),
    '*'
  );
});

// Chat
function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value;
  if (message) {
    socket.emit('chat', { room, message });
    input.value = "";
  }
}
socket.on('chat', ({ message }) => {
  const chat = document.getElementById('chat');
  chat.innerHTML += `<div>${message}</div>`;
  chat.scrollTop = chat.scrollHeight;
});

// Webcam (only local preview for now)
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(stream => {
    document.getElementById('localVideo').srcObject = stream;
  });