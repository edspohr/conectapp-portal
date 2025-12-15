import React, { useState } from 'react';
import { Smile, Frown, Meh, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const DailyTracker = ({ db, appId, userId, onSaved }) => {
  const [mood, setMood] = useState(null); // 'good', 'neutral', 'bad'
  const [phase, setPhase] = useState('mood'); // 'mood' | 'factor'
  const [isSaving, setIsSaving] = useState(false);

  const moods = [
    { id: 'good', icon: Smile, color: 'text-green-500 bg-green-50 border-green-200', activeColor: 'bg-green-100 ring-2 ring-green-400', label: 'Bien', value: 3 },
    { id: 'neutral', icon: Meh, color: 'text-yellow-500 bg-yellow-50 border-yellow-200', activeColor: 'bg-yellow-100 ring-2 ring-yellow-400', label: 'Regular', value: 2 },
    { id: 'bad', icon: Frown, color: 'text-red-500 bg-red-50 border-red-200', activeColor: 'bg-red-100 ring-2 ring-red-400', label: 'Mal', value: 1 },
  ];

  const availableFactors = [
    { id: 'sleep', label: '💤 Sueño' },
    { id: 'food', label: '🍎 Comida' },
    { id: 'sensory', label: '👂 Sensorial' },
    { id: 'routine', label: '📅 Rutina' },
    { id: 'health', label: '🤒 Salud' },
    { id: 'other', label: '📝 Otro' },
  ];

  const handleMoodClick = (moodId) => {
    setMood(moodId);
    setPhase('factor');
  };

  const handleFactorClick = async (factorId) => {
    if (!mood || isSaving) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'daily_logs'), {
        mood,
        moodValue: moods.find(m => m.id === mood)?.value || 0,
        factors: [factorId], // Single factor as per 2-click request
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
      });
      if (onSaved) onSaved();
      
      // Reset
      setTimeout(() => {
        setMood(null);
        setPhase('mood');
        setIsSaving(false);
      }, 300);

    } catch (error) {
      console.error("Error saving daily log:", error);
      setIsSaving(false);
    }
  };

  const reset = () => {
    setMood(null);
    setPhase('mood');
  };

  return (
    <div className="mx-auto max-w-sm mb-2 px-4 transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-indigo-100 p-2 relative overflow-hidden">
        
        {phase === 'mood' ? (
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-bold text-slate-500 mr-2">¿Cómo va el día?</span>
            <div className="flex gap-3 flex-1 justify-end">
              {moods.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMoodClick(m.id)}
                    className={`p-1.5 rounded-full border transition-all active:scale-95 ${m.color} hover:brightness-95`}
                    title={m.label}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in-right flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-slate-500">¿Factor principal?</span>
              <button onClick={reset} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-3 h-3 text-gray-400" /></button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {availableFactors.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFactorClick(f.id)}
                  disabled={isSaving}
                  className={`
                    px-2 py-2 rounded-lg text-xs font-bold border border-slate-100 bg-slate-50 text-slate-600 
                    hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95
                    disabled:opacity-50 flex justify-center
                  `}
                >
                  {isSaving && f.id === 'sleep' ? '...' : f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTracker;
