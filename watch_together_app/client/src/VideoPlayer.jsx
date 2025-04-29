import React, { useRef, useEffect } from 'react';

export default function VideoPlayer({ url, videoState, onAction }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current) {
      ref.current.currentTime = videoState.time;
      videoState.isPlaying ? ref.current.play() : ref.current.pause();
    }
  }, [videoState]);

  return (
    <video
      ref={ref}
      src={url}
      controls
      className="w-full max-h-[70vh]"
      onPlay={() => onAction({ isPlaying: true, time: ref.current.currentTime })}
      onPause={() => onAction({ isPlaying: false, time: ref.current.currentTime })}
      onSeeked={() => onAction({ time: ref.current.currentTime })}
    />
  );
}
