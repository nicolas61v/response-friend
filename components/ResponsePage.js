import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
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

const ResponsePage = () => {
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [noClicks, setNoClicks] = useState(0);

  // ID único para esta sesión
  const sessionId = 'eve-response';
  const interactionsRef = doc(db, 'interactions', sessionId);
  const finalResponseRef = doc(db, 'final-response', sessionId);

  useEffect(() => {
    const resetAndInitialize = async () => {
      try {
        // Borrar la respuesta anterior y las interacciones
        await deleteDoc(finalResponseRef);
        await deleteDoc(interactionsRef);
        
        // Inicializar nuevo estado
        await setDoc(interactionsRef, {
          noClickCount: 0,
          lastUpdated: new Date(),
          sessions: []
        });

        setShowSuccess(false);
        setNoClicks(0);
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

      // Resetear e inicializar el estado
      resetAndInitialize();
    }
  }, [initialized]);

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
          clickNumber: newCount
        }]
      });
    } catch (error) {
      console.error("Error actualizando interacciones:", error);
    }

    // Calculate new position with minimum distance from current position
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
        noClicksBeforeYes: noClicks
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-10 relative">
        {!showSuccess ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-light text-stone-800 mb-6">Eve</h1>
              <p className="text-stone-600 text-lg font-light">
                ¿Nos vemos en Chef Burger?
              </p>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <button
                  id="yesButton"
                  onClick={handleYes}
                  className="px-8 py-2.5 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors duration-200 text-sm font-light hover:scale-105 transform"
                  disabled={loading}
                >
                  {loading ? '...' : 'Sí'}
                </button>
              </div>
            </div>
              
            <button
              style={{
                position: 'fixed',
                left: `${noPosition.x}px`,
                top: `${noPosition.y}px`,
                transition: 'all 0.1s ease'
              }}
              onClick={moveNoButton}
              onMouseOver={moveNoButton}
              onMouseEnter={moveNoButton}
              onTouchStart={moveNoButton}
              className="relative px-8 py-2.5 bg-stone-200 text-stone-600 rounded-full hover:bg-stone-300 transition-colors duration-200 text-sm font-light hover:scale-105 transform"
            >
              <PlumbBob />
              No
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="relative mb-6">
              <PlumbBob />
              <Heart className="w-12 h-12 text-stone-900 mx-auto" />
            </div>
            <h2 className="text-2xl font-light text-stone-800 mb-3">¡Gracias!</h2>
            <p className="text-stone-600">Yo sabía que dirías que sí</p>
            <p className="text-stone-400 text-sm mt-6 font-light">Nos vemos en Chef Burger</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsePage;