import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Volume1, Volume } from 'lucide-react';

const AudioPlayer = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolume, setShowVolume] = useState(false);
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current) {
        audioRef.current.play().catch(error => 
          console.error('Error reproduciendo audio:', error)
        );
        document.removeEventListener('click', handleFirstInteraction);
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      audioRef.current.muted = false;
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX />;
    if (volume < 0.33) return <Volume />;
    if (volume < 0.66) return <Volume1 />;
    return <Volume2 />;
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowVolume(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowVolume(false);
    }, 2000);
  };

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={toggleMute}
        className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 hover:bg-white"
      >
        <div className="w-6 h-6 text-stone-600">
          {getVolumeIcon()}
        </div>
      </button>

      <div 
        className={`
          bg-white/80 backdrop-blur-sm rounded-full shadow-lg overflow-hidden
          transition-all duration-300 ease-in-out
          ${showVolume ? 'w-32 opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 mx-4 my-2 accent-emerald-500"
        />
      </div>

      <audio
        ref={audioRef}
        src="/background-music.mp3"
        loop
        preload="auto"
      />
    </div>
  );
};

export default AudioPlayer;