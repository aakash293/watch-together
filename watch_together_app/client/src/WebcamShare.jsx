import React, { useEffect, useRef } from 'react';

export default function WebcamShare({ peer }) {
  const videoRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        peer.on('call', call => call.answer(stream));
      });
  }, []);

  return <video ref={videoRef} className="w-40 h-28 rounded-xl border border-white" muted autoPlay playsInline />;
}
