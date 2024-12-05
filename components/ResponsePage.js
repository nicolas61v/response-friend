import React, { useState, useEffect } from 'react';
import { Sparkles, Pizza } from 'lucide-react';
import { doc, setDoc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const PlumbBob = () => (
  <svg 
    viewBox="0 0 100 100" 
    className="w-8 h-8 absolute -top-10 left-1/2 -translate-x-1/2"
  >
    <path
      d="M50 10L65 40V60L50 90L35 60V40L50 10Z"
      fill="#17f14f"
      fillOpacity="0.7"
      className="animate-pulse"
    />
  </svg>
);

const FloatingEmojis = ({ onEmojiClick }) => {
  const [emojis, setEmojis] = useState([]);
  const emojisList = ['🍔', '🍟', '🌮', '🍕', '🥤'];

  useEffect(() => {
    const createNewEmoji = () => {
      return {
        id: Math.random().toString(36).substr(2, 9),
        emoji: emojisList[Math.floor(Math.random() * emojisList.length)],
        left: Math.random() * 90 + 5, // 5-95%
        points: Math.floor(Math.random() * 10) + 1,
      };
    };

    // Iniciar con algunos emojis
    setEmojis(Array(6).fill(null).map(createNewEmoji));

    // Agregar nuevos emojis periódicamente
    const addInterval = setInterval(() => {
      setEmojis(current => {
        if (current.length < 10) {
          return [...current, createNewEmoji()];
        }
        return current;
      });
    }, 2000);

    // Limpiar emojis viejos
    const cleanupInterval = setInterval(() => {
      setEmojis(current => {
        if (current.length > 6) {
          return current.slice(-6);
        }
        return current;
      });
    }, 8000);

    return () => {
      clearInterval(addInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute animate-float floating-emoji cursor-pointer pointer-events-auto"
          style={{
            left: `${emoji.left}%`
          }}
          onClick={() => {
            onEmojiClick(emoji.points);
            setEmojis(current => current.filter(e => e.id !== emoji.id));
          }}
        >
          <span className="text-4xl hover:scale-125 transition-transform inline-block select-none">
            {emoji.emoji}
          </span>
        </div>
      ))}
    </div>
  );
};

const ScoreDisplay = ({ points }) => (
  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-3xl font-bold px-6 py-3 rounded-full shadow-lg">
    {points}
  </div>
);

const ResponsePage = () => {
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [noClicks, setNoClicks] = useState(0);
  const [points, setPoints] = useState(0);

  const sessionId = 'eve-response';
  const interactionsRef = doc(db, 'interactions', sessionId);
  const finalResponseRef = doc(db, 'final-response', sessionId);

  useEffect(() => {
    const resetAndInitialize = async () => {
      try {
        await deleteDoc(finalResponseRef);
        await deleteDoc(interactionsRef);
        
        await setDoc(interactionsRef, {
          noClickCount: 0,
          points: 0,
          lastUpdated: new Date(),
          sessions: []
        });

        setShowSuccess(false);
        setNoClicks(0);
        setPoints(0);
        return false;
      } catch (error) {
        console.error("Error reseteando estado:", error);
        return false;
      }
    };

    if (!initialized && typeof window !== 'undefined') {
      const yesButton = document.getElementById('yesButton');
      if (yesButton) {
        const rect = yesButton.getBoundingClientRect();
        setNoPosition({
          x: rect.right + 16,
          y: rect.top
        });
        setInitialized(true);
      }

      resetAndInitialize();
    }
  }, [initialized]);

  const handleEmojiClick = async (emojiPoints) => {
    const newPoints = points + emojiPoints;
    setPoints(newPoints);
    
    try {
      await updateDoc(interactionsRef, {
        points: newPoints,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error("Error actualizando puntos:", error);
    }
  };

  const moveNoButton = async () => {
    const newCount = noClicks + 1;
    setNoClicks(newCount);

    try {
      const docSnap = await getDoc(interactionsRef);
      const currentData = docSnap.data() || { sessions: [] };
      
      await updateDoc(interactionsRef, {
        noClickCount: newCount,
        lastUpdated: new Date(),
        sessions: [...currentData.sessions, {
          timestamp: new Date(),
          clickNumber: newCount,
          pointsAtTime: points
        }]
      });
    } catch (error) {
      console.error("Error actualizando interacciones:", error);
    }

    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 40;
    let newX, newY;
    
    do {
      newX = Math.random() * maxX;
      newY = Math.random() * maxY;
    } while (
      Math.abs(newX - noPosition.x) < 150 && 
      Math.abs(newY - noPosition.y) < 150
    );
    
    setNoPosition({ x: newX, y: newY });
  };

  const handleYes = async () => {
    setLoading(true);
    
    try {
      await setDoc(finalResponseRef, {
        response: 'yes',
        timestamp: new Date(),
        noClicksBeforeYes: noClicks,
        finalPoints: points
      });

      setTimeout(() => {
        setShowSuccess(true);
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Error registrando respuesta:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative">
      <FloatingEmojis onEmojiClick={handleEmojiClick} />
      <ScoreDisplay points={points} />
      
      <div className="max-w-sm w-full backdrop-blur-sm bg-white/70 rounded-3xl shadow-xl p-10 relative border border-emerald-100">
        {!showSuccess ? (
          <>
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <h1 className="text-5xl font-light text-emerald-800 mb-6 relative">
                  Eve
                  <Sparkles className="absolute -top-4 -right-8 text-emerald-400 w-6 h-6" />
                </h1>
              </div>
              <p className="text-emerald-700 text-xl font-light">
                ¿Nos vemos en Chef Burger? 🍔
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <button
                  id="yesButton"
                  onClick={handleYes}
                  className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 text-lg font-light hover:scale-105 transform shadow-lg hover:shadow-xl hover:shadow-emerald-200 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="animate-pulse">...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      ¡Vamos! <Pizza className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </div>
            </div>
              
            <button
              style={{
                position: 'fixed',
                left: `${noPosition.x}px`,
                top: `${noPosition.y}px`,
                transition: 'all 0.15s ease-in-out'
              }}
              onClick={moveNoButton}
              onMouseOver={moveNoButton}
              onMouseEnter={moveNoButton}
              onTouchStart={moveNoButton}
              className="relative px-8 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-900 transition-all duration-200 text-lg font-light hover:scale-105 transform shadow-md hover:shadow-lg backdrop-blur-sm moving-button"
            >
              <PlumbBob />
              No
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="relative mb-8">
              <PlumbBob />
              <Pizza className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            </div>
            <h2 className="text-3xl font-light text-emerald-800 mb-4">¡Súper!</h2>
            <p className="text-emerald-700 text-lg mb-2">
              ¡Recolectaste {points} puntos mientras jugabas! 🎮
            </p>
            <p className="text-emerald-500 text-sm mt-6 font-light">
              Vamos por esas hamburguesas 
              <Sparkles className="inline-block ml-2 w-4 h-4" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePage;