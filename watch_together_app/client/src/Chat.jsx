import React, { useState, useEffect } from 'react';

export default function Chat({ socket, roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    socket.on('chat-message', msg => setMessages(prev => [...prev, msg]));
  }, []);

  const sendMessage = () => {
    socket.emit('chat-message', { roomId, message: input });
    setMessages(prev => [...prev, input]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, i) => <div key={i} className="mb-1">{msg}</div>)}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="text-black p-2 mb-1"
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Type message..."
      />
      <button className="bg-red-500 p-2" onClick={sendMessage}>Send</button>
    </div>
  );
}
