import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import VideoPlayer from './VideoPlayer';
import Chat from './Chat';
import WebcamShare from './WebcamShare';

const socket = io('https://your-railway-domain.up.railway.app'); // change this
const peer = new Peer(undefined, {
  host: 'your-railway-domain.up.railway.app',
  port: 443,
  path: '/peerjs',
  secure: true
});

export default function Room() {
  const [roomId] = useState(window.location.pathname.split('/')[2] || 'default');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoState, setVideoState] = useState({ time: 0, isPlaying: false });

  useEffect(() => {
    socket.emit('join-room', roomId);
    socket.on('video-state', setVideoState);
    socket.on('sync-video', setVideoState);
  }, []);

  const handleAction = (action) => {
    socket.emit('video-action', { roomId, action });
    setVideoState(prev => ({ ...prev, ...action }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 min-h-screen bg-black text-white">
      <div className="md:col-span-3 p-4">
        <input className="mb-2 w-full text-black p-2" placeholder="Paste Google Drive Embed Link" onChange={(e) => setVideoUrl(e.target.value)} />
        <VideoPlayer url={videoUrl} videoState={videoState} onAction={handleAction} />
        <WebcamShare peer={peer} />
      </div>
      <div className="p-4 border-l border-gray-700">
        <Chat socket={socket} roomId={roomId} />
      </div>
    </div>
  );
}
