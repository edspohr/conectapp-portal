import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, BookOpen, Utensils, Gamepad2, School, Tv, 
  Bed, ShowerHead, Music, User, Clock, CheckCircle, Trash2, GripVertical, Save, Edit3, Lightbulb,
  ArrowRight, Calendar
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const ICONS = [
  { id: 'wake', icon: Sun, label: 'Despertar' },
  { id: 'breakfast', icon: Utensils, label: 'Desayuno' },
  { id: 'school', icon: School, label: 'Colegio' },
  { id: 'lunch', icon: Utensils, label: 'Almuerzo' },
  { id: 'homework', icon: BookOpen, label: 'Tareas' },
  { id: 'play', icon: Gamepad2, label: 'Jugar' },
  { id: 'tv', icon: Tv, label: 'Pantallas' },
  { id: 'shower', icon: ShowerHead, label: 'Baño' },
  { id: 'dinner', icon: Utensils, label: 'Cena' },
  { id: 'sleep', icon: Bed, label: 'Dormir' },
  { id: 'therapy', icon: User, label: 'Terapia' },
  { id: 'music', icon: Music, label: 'Música' },
];

const VisualSchedule = ({ db, appId, userId }) => {
  const [items, setItems] = useState({ today: [], tomorrow: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('today');
  
  // Load schedule with Midnight Rollover Logic
  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'users', userId, 'data', 'schedule_v2'), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // CHECK ROLLOVER
        const lastUpdate = data.updatedAt ? new Date(data.updatedAt) : new Date();
        const now = new Date();
        const isSameDay = lastUpdate.getDate() === now.getDate() && 
                          lastUpdate.getMonth() === now.getMonth() && 
                          lastUpdate.getFullYear() === now.getFullYear();

        if (!isSameDay && data.tomorrow && data.tomorrow.length > 0) {
          // Perform Rollover: Tomorrow -> Today
          console.log("Performing Midnight Rollover...");
          const newToday = data.tomorrow.map(item => ({ ...item, completed: false }));
          const newTomorrow = [];
          
          // Optimistic Update
          setItems({
            today: newToday,
            tomorrow: newTomorrow
          });

          // Save to Firestore immediately
          try {
            await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'data', 'schedule_v2'), {
              today: newToday,
              tomorrow: newTomorrow,
              updatedAt: now.toISOString()
            }, { merge: true });
          } catch (e) {
            console.error("Rollover save failed", e);
          }
        } else {
          // Normal Load
          setItems({
            today: data.today || [],
            tomorrow: data.tomorrow || []
          });
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [db, appId, userId]);

  // Auto-save helper
  const saveToFirestore = async (newItems) => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', userId, 'data', 'schedule_v2'), { 
        today: newItems.today,
        tomorrow: newItems.tomorrow,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving schedule:", error);
    }
  };

  // Actions automatically save
  const addItem = async (iconData, day) => {
    const newItem = {
      // eslint-disable-next-line
      id: String(Date.now()),
      iconId: iconData.id,
      label: iconData.label,
      completed: false
    };
    
    const newItems = { ...items, [day]: [...items[day], newItem] };
    setItems(newItems);
    await saveToFirestore(newItems);
  };

  const removeItem = async (id, day) => {
    const newItems = { ...items, [day]: items[day].filter(i => i.id !== id) };
    setItems(newItems);
    await saveToFirestore(newItems);
  };

  const toggleComplete = async (id, day) => {
    if (isEditing) return;
    
    const dayItems = items[day];
    const item = dayItems.find(i => i.id === id);
    if (!item) return;

    if (!item.completed) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, disableForReducedMotion: true });
    }

    const newItems = { 
      ...items, 
      [day]: dayItems.map(i => i.id === id ? { ...i, completed: !i.completed } : i) 
    };
    
    setItems(newItems);
    await saveToFirestore(newItems);
  };

  const moveItem = async (index, direction, day) => {
    const list = [...items[day]];
    if (direction === 'up' && index > 0) {
      [list[index], list[index - 1]] = [list[index - 1], list[index]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index], list[index + 1]] = [list[index + 1], list[index]];
    }
    const newItems = { ...items, [day]: list };
    setItems(newItems);
    await saveToFirestore(newItems);
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Cargando agenda...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50 md:bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      
      {/* HEADER + TABS */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        {!isEditing && (
          <div className="bg-blue-50/50 p-3 flex gap-3 border-b border-blue-50">
            <div className="bg-blue-100 p-1.5 rounded-full h-fit text-blue-600"><Lightbulb className="w-4 h-4" /></div>
            <p className="text-xs text-blue-800 leading-snug">
              Anticipa el <b>Mañana</b> para dormir tranquilo. Marca el <b>Hoy</b> para sentir logros.
            </p>
          </div>
        )}
        
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl md:hidden">
             <button onClick={() => setActiveDay('today')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeDay === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Hoy</button>
             <button onClick={() => setActiveDay('tomorrow')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeDay === 'tomorrow' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Mañana</button>
          </div>
          <h3 className="hidden md:block font-bold text-gray-700 text-lg">Planificación Semanal</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ml-auto ${isEditing ? 'bg-green-100 text-green-700' : 'bg-gray-50 border text-gray-600'}`}
          >
            {isEditing ? <CheckCircle className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isEditing ? 'Listo' : 'Editar'}
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:flex md:gap-6">
        {/* DESKTOP SPLIT VIEW OR MOBILE SINGLE VIEW */}
        {['today', 'tomorrow'].map((day) => {
          const isHiddenMobile = day !== activeDay ? 'hidden md:block' : 'block';
          const titleColor = day === 'today' ? 'text-blue-600' : 'text-purple-600';
          const bgColor = day === 'today' ? 'bg-blue-50/30' : 'bg-purple-50/30';
          
          return (
            <div key={day} className={`flex-1 ${isHiddenMobile} md:border-r md:last:border-r-0 md:pr-4 min-w-[300px]`}>
               <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${titleColor}`}>
                 <Calendar className="w-4 h-4" /> {day === 'today' ? 'Hoy' : 'Mañana'}
               </h4>

               <div className={`space-y-3 min-h-[200px] ${items[day].length === 0 ? 'flex items-center justify-center border-2 border-dashed rounded-xl ' + bgColor : ''}`}>
                 {items[day].length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-sm text-gray-400 font-medium">Vacío</p>
                      {isEditing && <p className="text-[10px] text-gray-400 mt-1">agrega abajo</p>}
                    </div>
                 ) : (
                    items[day].map((item, index) => {
                      // Lookup icon by iconId
                      const iconObj = ICONS.find(i => i.id === item.iconId) || ICONS[0];
                      const Icon = iconObj.icon;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleComplete(item.id, day)}
                          className={`
                            relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300
                            ${isEditing ? 'bg-white border-gray-200' : item.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:border-blue-200 cursor-pointer'}
                          `}
                        >
                          {!isEditing && (
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                               <CheckCircle className="w-4 h-4" />
                             </div>
                          )}
                          <div className={`p-2 rounded-lg ${day === 'today' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className={`font-bold text-gray-700 text-sm ${item.completed && !isEditing ? 'line-through text-gray-400' : ''}`}>{item.label}</span>
                          
                          {isEditing && (
                             <div className="ml-auto flex gap-1">
                               <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'up', day); }} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-20"><GripVertical className="w-4 h-4" /></button>
                               <button onClick={(e) => { e.stopPropagation(); removeItem(item.id, day); }} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          )}
                        </div>
                      );
                    })
                 )}
               </div>

               {isEditing && (
                 <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Agregar a {day === 'today' ? 'Hoy' : 'Mañana'}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {ICONS.map((icon) => {
                        const Icon = icon.icon;
                        return (
                          <button key={icon.id} onClick={() => addItem(icon, day)} className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                            <Icon className="w-5 h-5 text-slate-500 mb-1" />
                            <span className="text-[9px] font-bold text-slate-500 truncate w-full text-center">{icon.label}</span>
                          </button>
                        )
                      })}
                    </div>
                 </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisualSchedule;
