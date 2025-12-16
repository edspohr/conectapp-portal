import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  limit,
} from 'firebase/firestore';

import {
  MessageSquare,
  User,
  Save,
  Send,
  LogOut,
  BookOpen,
  Menu,
  X,
  AlertTriangle,
  BrainCircuit,
  Edit3,
  Check,
  Hand,
  Clock,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  Lightbulb,
  Heart,
  Zap,
  Shield,
  Smile,
  ArrowRight
} from 'lucide-react';

import DailyTracker from './components/DailyTracker';
import VisualSchedule from './components/VisualSchedule';
import ClinicalReport from './components/ClinicalReport';

/* --- CONFIGURACIÓN FIREBASE --- */
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

/* --- CONFIGURACIÓN IA --- */
const GEMINI_MODEL = "gemini-2.5-flash";

const googleProvider = new GoogleAuthProvider();

/* --- TEMAS RÁPIDOS --- */


/* --- UTILIDADES --- */
const RichText = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return 'Edad desconocida';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} años`;
};

/* --- COMPONENTES UI --- */
const ToastNotification = ({ message, visible }) => (
  <div className={`fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
    <Check className="w-4 h-4 text-green-400" />
    <span className="text-sm font-medium">{message}</span>
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    ghost: 'text-gray-500 hover:bg-gray-100 hover:text-blue-600',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', textarea = false, error, rightElement, icon: Icon, helpText }) => (
  <div className="mb-5 relative">
    <div className="flex items-center gap-2 mb-1.5 ml-1">
      {Icon && <Icon className="w-4 h-4 text-blue-600" />}
      {label && <label className={`block text-sm font-semibold ${error ? 'text-red-500' : 'text-gray-700'}`}>{label}</label>}
      {helpText && (
        <div className="group relative cursor-help">
          <Info className="w-3.5 h-3.5 text-gray-400" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {helpText}
          </div>
        </div>
      )}
    </div>
    
    {textarea ? (
      <textarea className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all min-h-[100px] resize-none ${error ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500'}`} value={value} onChange={onChange} placeholder={placeholder} />
    ) : (
      <div className="relative">
        <input type={type} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${error ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500'} ${rightElement ? 'pr-12' : ''}`} value={value} onChange={onChange} placeholder={placeholder} />
        {rightElement && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightElement}</div>}
      </div>
    )}
    {error && <span className="text-xs text-red-500 ml-1 mt-1 font-medium animate-pulse">{error}</span>}
  </div>
);

const Card = ({ children, title, icon: Icon }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden h-full">
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Logo = () => (
  <div className="relative flex items-center justify-center shrink-0 w-full h-full">
    <img src="/img/logo.png" alt="ConectApp" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span class="text-xs font-bold text-blue-600">CA</span>'; }} />
  </div>
);

const TypingIndicator = () => (
  <div className="flex items-center gap-1 p-3 bg-gray-100 rounded-2xl rounded-bl-none w-16 justify-center animate-fade-in mb-4 ml-14">
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

const WhatsAppButton = ({ hidden }) => {
  const [showSnippet, setShowSnippet] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-hide snippet after 15 seconds to be less intrusive
  useEffect(() => {
    const timer = setTimeout(() => setShowSnippet(false), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`fixed right-5 bottom-5 md:right-8 md:bottom-8 z-[60] hidden md:flex flex-col items-end gap-3 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) ${hidden ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* Mensaje flotante (Tooltip) Mejorado */}
      <div className={`
        absolute bottom-full right-0 mb-3 w-64 p-4 
        bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-2xl rounded-br-sm
        transform transition-all duration-500 origin-bottom-right
        ${showSnippet ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}
      `}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Soporte Humano</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSnippet(false); }} 
            className="text-slate-300 hover:text-slate-500 p-1 -mr-2 -mt-2 transition-colors rounded-full hover:bg-slate-100/50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed font-medium">
          ¿Hola! 👋 ¿Tienes alguna duda? Estamos aquí para ayudarte.
        </p>
      </div>

      {/* Botón Principal */}
      <a 
        href="https://wa.me/56965863160" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 transition-transform duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95"
      >
        {/* Efecto de 'Resplandor' trasero */}
        <div className={`absolute inset-0 rounded-full bg-green-500/30 blur-xl transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Ondas sutiles */}
        <span className="absolute inset-0 rounded-full border border-green-500/30 opacity-0 animate-ping duration-[3s]"></span>
        
        {/* Contenedor del Botón */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#25D366] to-[#075E54] shadow-[0_8px_25px_-5px_rgba(37,211,102,0.5)] group-hover:shadow-[0_15px_35px_-5px_rgba(37,211,102,0.6)] transition-all duration-300 border border-white/20"></div>
        
        {/* Icono Container */}
        <div className="relative z-10 p-3.5 md:p-4 w-full h-full flex items-center justify-center">
          <img 
            src="/img/WhatsApp.webp" 
            alt="WhatsApp" 
            className="w-full h-full object-contain drop-shadow-sm filter brightness-0 invert" 
          />
        </div>

        {/* Badge de Notificación */}
        <span className="absolute top-0 right-0 md:top-1 md:right-1 w-4 h-4 bg-red-500 border-[2.5px] border-white rounded-full z-20 flex items-center justify-center animate-bounce duration-[2000ms]">
          <span className="sr-only">1 new message</span>
        </span>
      </a>
    </div>
  );
};

/* Ítem de bitácora */
const JournalEntryItem = ({ entry, userId, onNoteSaved }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userNoteDraft, setUserNoteDraft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const startEditing = () => {
    setUserNoteDraft(entry.userNotes || '');
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    try {
      const entryRef = doc(db, 'artifacts', appId, 'users', userId, 'journal', entry.id);
      await updateDoc(entryRef, { userNotes: userNoteDraft });
      setIsEditing(false);
      onNoteSaved();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-all duration-300">
      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-50">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
              <Hand className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-base">
                {entry.title || 'Hito de Conversación'}
              </h4>
              <span className="text-xs text-gray-400 block mt-0.5">
                {entry.createdAt?.seconds
                  ? new Date(entry.createdAt.seconds * 1000).toLocaleString()
                  : 'Recién'}
              </span>
            </div>
          </div>
        </div>

        <div className={`text-gray-600 text-sm leading-relaxed transition-all duration-500 ease-in-out relative ${isExpanded ? 'max-h-[1500px]' : 'max-h-20'} overflow-hidden`}>
          <div className={isExpanded ? '' : 'line-clamp-3'}>
            <RichText text={entry.fullContent || entry.content} />
          </div>
          {!isExpanded && (entry.fullContent || '').length > 150 && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
        {(entry.fullContent || '').length > 150 && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
          >
            {isExpanded ? <>Colapsar <ChevronDown className="w-3 h-3 rotate-180" /></> : <>Leer resumen completo <ChevronDown className="w-3 h-3" /></>}
          </button>
        )}
      </div>

      <div className="p-6 md:w-1/3 bg-gray-50/50 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Edit3 className="w-3 h-3" /> Tus Notas
          </h5>
          {!isEditing && (
            <button onClick={startEditing} className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Editar nota">
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full flex-1 p-3 text-sm border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none bg-white resize-none min-h-[100px]"
              value={userNoteDraft}
              onChange={(e) => setUserNoteDraft(e.target.value)}
              placeholder="Agrega tus observaciones privadas aquí..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveNote} className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-colors">
                <Check className="w-3 h-3" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div onClick={startEditing} className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-white hover:shadow-sm p-3 -ml-3 rounded-xl transition-all border border-transparent hover:border-gray-100 min-h-[80px]">
            {entry.userNotes ? <p className="italic">{entry.userNotes}</p> : <span className="text-gray-400 text-xs italic">Clic aquí para agregar notas personales sobre este hito...</span>}
          </div>
        )}
      </div>
    </div>
  );
};

/* ----- PROMPT IA AVANZADO ----- */
function buildGeminiPrompt(userMessage, profileData, messages, hoursSinceLastMsg, currentTopic) {
  const contextWindow = messages.slice(-15); // Contexto más corto para enfocar
  const lastExchanges = contextWindow.map(m => `${m.role === 'user' ? 'FAMILIA' : 'CONECTAPP'}: ${m.content}`).join('\n');
  const tiempoTexto = hoursSinceLastMsg == null ? 'No se sabe cuánto tiempo pasó.' : hoursSinceLastMsg < 2 ? 'Pasó poco tiempo desde el último mensaje.' : `Pasaron aproximadamente ${Math.round(hoursSinceLastMsg)} horas desde el último mensaje.`;
  const topicText = currentTopic ? `Tema declarado por usuario: "${currentTopic}".` : 'Tema libre.';

  const edadTexto = calculateAge(profileData.birthDate);
  const interests = profileData.specialInterests ? profileData.specialInterests : 'No especificados';

  return `
Eres ConectApp, un Copiloto Experto en Neurodivergencia y Crianza Respetuosa.
Tu misión es acompañar a ${profileData.caregiverFirstName || 'el cuidador/a'} en la crianza de ${profileData.neuroName || 'su ser querido'}, quien tiene ${edadTexto}.

--- PERFIL DE ${profileData.neuroName || 'SER QUERIDO'} ---
- Diagnóstico/Perfil: ${profileData.diagnosis || 'No especificado'}
- Estilo de Comunicación: ${profileData.communicationStyle || 'No especificado'}
- Hipersensibilidades (Evita): ${profileData.hypersensitivities || 'No especificado'}
- Hiposensibilidades (Busca): ${profileData.hyposensitivities || 'No especificado'}
- Intereses Profundos (SpIns): ${interests}
- Desencadenantes (Triggers): ${profileData.triggers || 'No especificado'}
- Estrategias de Calma: ${profileData.calmingStrategies || 'No especificado'}
- Fortalezas: ${profileData.strengths || 'No especificado'}
- Nivel de Energía: ${profileData.energyLevel || 'No especificado'}
- Desafío Actual: ${profileData.mainChallenge || 'No especificado'}

--- PAUTAS DE INTERACCIÓN (DINÁMICA CONVERSACIONAL) ---
1. **ESTRUCTURA DE RESPUESTA:**
   - **Paso 1: VALIDAR.** Empieza validando la emoción del cuidador (ej. "Entiendo que es agotador...").
   - **Paso 2: ANALIZAR.** Conecta la situación con el Perfil (ej. "Quizás el ruido activó su hipersensibilidad...").
   - **Paso 3: PROPONER.** Da UNA o DOS micro-estrategias concretas. No hagas listas largas.

2. **USO DE METÁFORAS:**
   - Usa los **Intereses Profundos** (${interests}) para explicar conceptos o proponer soluciones lúdicas si aplica. (Ej: Si le gustan los trenes, usa analogías de "vías", "estaciones" o "señales").

3. **ENFOQUE AFIRMATIVO:**
   - Habla de "necesidades de apoyo" en lugar de "déficits".
   - Busca la co-regulación. Ajusta tus consejos a la edad de ${edadTexto}.

--- CONTEXTO ACTUAL ---
TIEMPO: ${tiempoTexto}
TEMA: ${topicText}
HISTORIAL RECIENTE:
${lastExchanges}

MENSAJE ACTUAL: "${userMessage}"

Responde con calidez, brevedad y profesionalismo.
`;
}

  /* --- COMPONENTE PRINCIPAL ----- */
export default function ConectApp() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  
  // Auth Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [caregiverLastName, setCaregiverLastName] = useState('');
  const [neuroName, setNeuroName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // App State
  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  
  // Profile & Data (Updated Structure)
  const [profileData, setProfileData] = useState({ 
    caregiverFirstName: '', 
    caregiverLastName: '', 
    neuroName: '', 
    birthDate: '', // Nuevo campo
    diagnosis: '', // Nuevo 10 campos
    communicationStyle: '',
    hypersensitivities: '',
    hyposensitivities: '',
    specialInterests: '',
    triggers: '',
    calmingStrategies: '',
    strengths: '',
    energyLevel: '',
    mainChallenge: ''
  });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Para auto-grow y focus

  // Helper para notificaciones
  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  // Helper para verificar perfil incompleto
  const isProfileIncomplete = !profileData.neuroName || !profileData.diagnosis || !profileData.birthDate;

  /* --- UTILS --- */
  const upsertUserProfile = async (userObj) => {
    if (!userObj) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', userObj.uid, 'data', 'profile');
    try {
      // Solo actualizamos email/nombre si es login inicial, no sobrescribimos datos complejos aquí
      await setDoc(profileRef, { email: userObj.email || '', caregiverFirstName: userObj.displayName ? userObj.displayName.split(' ')[0] : '' }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const validateForm = () => {
    const errors = {};
    if (authMode === 'login') {
      if (!loginEmail) errors.loginEmail = 'Requerido';
      if (!loginPassword) errors.loginPassword = 'Requerido';
    } else {
      if (!caregiverFirstName) errors.caregiverFirstName = 'Requerido';
      if (!neuroName) errors.neuroName = 'Requerido';
      if (!registerEmail) errors.registerEmail = 'Requerido';
      if (!registerPassword) errors.registerPassword = 'Requerido';
      if (registerPassword !== registerPasswordConfirm) errors.registerPasswordConfirm = 'No coinciden';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* --- EFECTOS --- */
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) await upsertUserProfile(result.user);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthChecked(true);
      setAuthError('');
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setJournalEntries([]);
      setMessages([{ role: 'system', content: 'Hola. Soy tu acompañante en ConectApp...' }]);
      setActiveSessionId(null);
      return;
    }

    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfileData(prev => ({ ...prev, ...data }));
        if (data.caregiverFirstName) setCaregiverFirstName(data.caregiverFirstName);
        if (data.caregiverLastName) setCaregiverLastName(data.caregiverLastName);
        if (data.neuroName) setNeuroName(data.neuroName);
      }
    });

    const sessionDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session');
    const ensureSession = async () => {
      const snap = await getDoc(sessionDocRef);
      if (!snap.exists() || !snap.data().activeSessionId) {
        const newId = `session-${Date.now()}`;
        await setDoc(sessionDocRef, { activeSessionId: newId, lastInteractionAt: serverTimestamp() }, { merge: true });
        setActiveSessionId(newId);
      } else {
        const data = snap.data();
        setActiveSessionId(data.activeSessionId);
      }
    };
    ensureSession();

    const unsubJournal = onSnapshot(query(collection(db, 'artifacts', appId, 'users', user.uid, 'journal'), orderBy('createdAt', 'desc')), (snap) => {
      setJournalEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubProfile(); unsubJournal(); };
  }, [user]);

  // CHAT SYNC - MODIFICADO PARA HISTORIAL CONTINUO (TIPO WHATSAPP)
  useEffect(() => {
    if (!user) return; // No necesitamos activeSessionId para leer, solo el usuario.
    
    // Eliminamos el filtro 'where("sessionId", "==", activeSessionId)'
    // Esto asegura que carguemos todos los mensajes históricos, ordenados por fecha.
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'conversations'), 
      orderBy('createdAt', 'desc'), 
      limit(200) // Aumentamos el límite para tener más contexto histórico visible
    );

    const unsub = onSnapshot(q, snap => {
      if (snap.empty) {
        setMessages([{ role: 'system', content: 'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte.' }]);
      } else {
        setMessages(snap.docs.map(d => {
          const dt = d.data();
          // Manejo seguro del timestamp por si viene null del servidor en escritura inmediata
          const timestamp = dt.timestamp || (dt.createdAt?.seconds * 1000) || Date.now();
          return { ...dt, timestamp };
        }).reverse()); // Reverse para mostrar orden cronológico (antiguos arriba, nuevos abajo)
      }
    }, (err) => {
      console.error("🔥 ERROR FIRESTORE (Probable falta de índice). Copia este link en tu navegador:", err.message.match(/https:\/\/[^\s]+/)?.[0] || err);
    });
    return () => unsub();
  }, [user]); // Quitamos activeSessionId de las dependencias

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping, activeTab]);

  /* --- AUTO GROW TEXTAREA --- */
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  /* --- HANDLERS --- */
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAuthLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      await upsertUserProfile(res.user);
    } catch { setAuthError('Credenciales incorrectas.'); } finally { setAuthLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAuthLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, registerEmail.trim(), registerPassword);
      await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'data', 'profile'), { caregiverFirstName, neuroName, email: registerEmail.trim(), createdAt: serverTimestamp() }, { merge: true });
      setAuthMode('login'); setLoginEmail(registerEmail.trim());
    } catch { setAuthError('Error al crear cuenta.'); } finally { setAuthLoading(false); }
  };

  const handleAuth = (isLogin, e) => {
    if (isLogin) {
      return handleEmailLogin(e);
    }
    return handleRegister(e);
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await upsertUserProfile(res.user);
    } catch (err) {
      if (['auth/popup-blocked', 'auth/cancelled-popup-request'].includes(err.code)) {
        await signInWithRedirect(auth, googleProvider);
      } else { setAuthError('Error con Google Login.'); setAuthLoading(false); }
    }
  };

  const handlePasswordReset = async () => {
    if (!loginEmail) return setAuthError('Ingresa tu correo arriba primero.');
    try { await sendPasswordResetEmail(auth, loginEmail.trim()); setAuthError('Correo enviado.'); } catch (err) { console.error(err); setAuthError('Error enviando correo.'); }
  };

  const handleLogout = async () => { await signOut(auth); setActiveTab('chat'); };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;
    
    if (inputRef.current) inputRef.current.blur();

    // Mantenemos la lógica de activeSessionId solo para escritura y metadatos
    if (!activeSessionId) { /* Logic inside useEffect handles session creation */ }

    const now = Date.now();
    const lastMsg = messages.filter(m => m.role !== 'system').slice(-1)[0];
    const hoursSince = lastMsg?.timestamp ? (now - lastMsg.timestamp) / 36e5 : null;

    if (['suicidio', 'matarme', 'morir', 'emergencia', '133', '911'].some(k => inputMessage.toLowerCase().includes(k))) {
      setShowSafetyAlert(true); return;
    }

    const newMsg = { role: 'user', content: inputMessage, timestamp: now };
    // Optimistic UI update
    setMessages(p => [...p, newMsg]);
    setInputMessage('');
    if(inputRef.current) inputRef.current.style.height = 'auto'; // Reset height
    setIsTyping(true);

    try {
      const msgsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'conversations');
      // Guardamos el sessionId para trazabilidad, aunque ya no filtramos por él al leer
      await addDoc(msgsRef, { ...newMsg, createdAt: serverTimestamp(), sessionId: activeSessionId });
      await updateLastInteraction();

      const fullPrompt = buildGeminiPrompt(newMsg.content, { ...profileData, caregiverFirstName, neuroName }, messages, hoursSince, '');
      /*
       * CALL SERVERLESS API (SECURE)
       */
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error('Error en el servidor de chat');
      }

      const data = await response.json();
      const aiText = data.result || 'Estoy aquí contigo.';
      const aiMsg = { role: 'assistant', content: aiText, timestamp: Date.now() };
      
      // Optimistic UI update (será sobrescrito por el onSnapshot cuando llegue del servidor)
      setMessages(prev => [...prev, aiMsg]);
      await addDoc(msgsRef, { ...aiMsg, createdAt: serverTimestamp(), sessionId: activeSessionId });
      await updateLastInteraction();
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: (error.code === 'permission-denied' ? 'Error de permisos. Revisa reglas Firestore.' : 'Tuve un problema de conexión.'), timestamp: Date.now() }]);
    } finally { setIsTyping(false); }
  };

  const handleSaveMilestone = async () => {
    if (!user || !activeSessionId) return;
    const summary = messages.slice(-8).map(m => `${m.role === 'user' ? 'Fam' : 'IA'}: ${m.content}`).join('\n\n');
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'journal'), { title: 'Hito', content: summary, fullContent: summary, userNotes: '', createdAt: serverTimestamp(), type: 'milestone', sessionId: activeSessionId });
      showToast('Hito guardado en bitácora');
    } catch { console.error('Error saving milestone'); }
  };

  const updateLastInteraction = async () => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session'), { lastInteractionAt: serverTimestamp(), activeSessionId: activeSessionId || `session-${Date.now()}` }, { merge: true });
  };

  /* --- RENDER --- */
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-medium">Cargando ConectApp...</div>;

  if (!user) { // LOGIN UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 animate-fade-in">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-white">
            <div className="text-center mb-8">
            {/* Logo envuelto en un div para controlar su tamaño (w-16 h-16 = 64px) */}
            <div className="w-16 h-16 mx-auto mb-4">
              <Logo />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">ConectApp</h1>
            <p className="text-blue-600 mt-1 font-medium">Acompañamiento para familias neurodivergentes</p>
          </div>
          <div className="flex gap-2 mb-6 bg-gray-100/50 p-1 rounded-xl">
            <button onClick={() => { setAuthMode('login'); setFormErrors({}); setAuthError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${authMode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>Ingresar</button>
            <button onClick={() => { setAuthMode('register'); setFormErrors({}); setAuthError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${authMode === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>Registrar</button>
          </div>
          {authError && <div className="text-red-600 text-xs mb-4 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{authError}</div>}
          
          <form onSubmit={(e) => handleAuth(authMode === 'login', e)} className="space-y-1">
            {authMode === 'register' && <div className="grid grid-cols-2 gap-3">
              <Input label="Tu Nombre" placeholder="Ej. Ana" value={caregiverFirstName} onChange={e => setCaregiverFirstName(e.target.value)} error={formErrors.caregiverFirstName} />
              <Input label="Nombre Ser Querido" placeholder="Ej. Leo" value={neuroName} onChange={e => setNeuroName(e.target.value)} error={formErrors.neuroName} />
            </div>}
            <Input type="email" label="Correo" placeholder="correo@ejemplo.com" value={authMode === 'login' ? loginEmail : registerEmail} onChange={e => authMode === 'login' ? setLoginEmail(e.target.value) : setRegisterEmail(e.target.value)} error={formErrors.loginEmail || formErrors.registerEmail} />
            <Input type={showPassword ? "text" : "password"} label="Contraseña" placeholder="********" value={authMode === 'login' ? loginPassword : registerPassword} 
            onChange={e => authMode === 'login' ? setLoginPassword(e.target.value) : setRegisterPassword(e.target.value)} 
            error={formErrors.loginPassword || formErrors.registerPassword} rightElement={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>} />
            {authMode === 'register' && <Input type="password" label="Confirmar" placeholder="********" value={registerPasswordConfirm} onChange={e => setRegisterPasswordConfirm(e.target.value)} error={formErrors.registerPasswordConfirm} />}
            {authMode === 'login' && <div className="flex justify-end mb-6"><button type="button" onClick={handlePasswordReset} className="text-xs text-blue-600 hover:underline">¿Olvidaste tu contraseña?</button></div>}
            <Button type="submit" disabled={authLoading} className="w-full py-3 mb-4">{authLoading ? 'Procesando...' : (authMode === 'login' ? 'Entrar' : 'Crear Cuenta')}</Button>
          </form>
          <div className="mt-6 border-t border-gray-100 pt-6"><button onClick={handleGoogleLogin} disabled={authLoading} className="w-full bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors text-slate-700 font-medium">{authLoading ? 'Conectando...' : <><img src="https://developers.google.com/identity/images/g-logo.png" className="w-5 h-5" alt="G" />Continuar con Google</>}</button></div>
          <p className="mt-6 text-[10px] text-center text-gray-400">Accediendo aceptas nuestros <a href="#" className="underline hover:text-blue-600">Términos y Condiciones</a>.</p>
        </div>
      </div>
    );
  }

  // APP LAYOUT
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans text-slate-800">
      <ToastNotification message={toast.message} visible={toast.visible} />
      {showSafetyAlert && <div className="fixed inset-0 z-[100] bg-red-900/90 flex items-center justify-center p-4"><div className="bg-white p-8 rounded-3xl text-center max-w-sm"><AlertTriangle className="w-10 h-10 text-red-600 mx-auto mb-2" /><h2 className="text-xl font-bold text-red-700 mb-2">Alerta de Seguridad</h2><p className="mb-4 text-gray-600">Detectamos riesgo. Pide ayuda.</p><a href="tel:133" className="block w-full bg-red-600 text-white py-3 rounded-xl font-bold mb-3">Llamar Emergencias</a><button onClick={() => setShowSafetyAlert(false)} className="underline text-gray-500">Estoy bien</button></div></div>}
      
      {/* SIDEBAR & HEADER */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r h-screen sticky top-0 z-20"><div className="p-6 border-b flex items-center gap-3"><div className="w-9 h-9"><Logo /></div><span className="font-bold text-xl">ConectApp</span></div><nav className="flex-1 p-4 space-y-2"><button onClick={() => setActiveTab('chat')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><MessageSquare /> Chat</button><button onClick={() => setActiveTab('schedule')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><Clock /> Rutina</button><button onClick={() => setActiveTab('profile')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><User /> Perfil</button><button onClick={() => setActiveTab('evolution')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'evolution' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><BookOpen /> Bitácora</button></nav><div className="p-4 border-t"><Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500"><LogOut className="w-4 h-4 mr-2" /> Salir</Button></div></aside>
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b p-4 sticky top-0 z-30 flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-8 h-8"><Logo /></div><span className="font-bold text-lg">ConectApp</span></div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2"><Menu /></button></header>
      {mobileMenuOpen && <div className="fixed inset-0 bg-white z-20 pt-24 px-6 md:hidden flex flex-col gap-4"><button onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><MessageSquare /> Chat</button><button onClick={() => { setActiveTab('schedule'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><Clock /> Rutina</button><button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><User /> Perfil</button><button onClick={() => { setActiveTab('evolution'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><BookOpen /> Bitácora</button><Button onClick={handleLogout} variant="danger" className="mt-auto mb-8">Cerrar Sesión</Button></div>}

      <main className="flex-1 overflow-hidden relative h-[calc(100vh-64px)] md:h-screen bg-slate-50/50">
        
        {/* --- PESTAÑA PERFIL MEJORADA --- */}
        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 animate-fade-in">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex justify-between items-center sticky top-0 bg-slate-50/95 backdrop-blur z-10 py-4 -my-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Perfil de Familia</h2>
                  <p className="text-sm text-slate-500">Personaliza la experiencia para recibir mejor apoyo.</p>
                </div>
                <Button 
                  onClick={async () => { 
                    setIsSavingProfile(true); 
                    try { 
                      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile'), { 
                        ...profileData, 
                        caregiverFirstName, 
                        caregiverLastName, 
                        neuroName 
                      }, { merge: true }); 
                      showToast('Perfil actualizado correctamente'); 
                    } finally { setIsSavingProfile(false); } 
                  }} 
                  disabled={isSavingProfile}
                  className="shadow-lg shadow-blue-200"
                >
                  <Save className="w-4 h-4" /> {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>

              <div className="grid md:grid-cols-1 gap-6">
                {/* 1. DATOS BÁSICOS */}
                <Card title="Datos Básicos" icon={User}>
                  <div className="grid md:grid-cols-2 gap-5">
                    <Input label="Tu Nombre (Cuidador/a)" value={caregiverFirstName} onChange={e => setCaregiverFirstName(e.target.value)} placeholder="¿Cómo te llamas?" />
                    <Input label="Nombre de tu Ser Querido" value={neuroName} onChange={e => setNeuroName(e.target.value)} placeholder="Nombre o apodo" />
                    <Input 
                      type="date" 
                      label="Fecha de Nacimiento (Ser Querido)" 
                      value={profileData.birthDate} 
                      onChange={e => setProfileData({ ...profileData, birthDate: e.target.value })} 
                      helpText="Usamos esto para calcular la edad y adaptar los consejos."
                    />
                  </div>
                </Card>

                {/* 2. CONTEXTO NEURODIVERGENTE (10 SECCIONES) */}
                <Card title="Contexto Neurodivergente" icon={BrainCircuit}>
                  <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded-xl border border-blue-100 flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    Completa estas secciones para que la IA entienda profundamente a tu ser querido y te dé consejos realmente personalizados.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input icon={BrainCircuit} textarea label="1. Diagnóstico / Perfil" placeholder="Ej. Autismo Nivel 1, TDAH, Dispraxia..." value={profileData.diagnosis} onChange={e => setProfileData({ ...profileData, diagnosis: e.target.value })} />
                    <Input icon={MessageSquare} textarea label="2. Estilo de Comunicación" placeholder="Ej. Verbal fluido, Gestual, Uso de SAAC, Ecolalia..." value={profileData.communicationStyle} onChange={e => setProfileData({ ...profileData, communicationStyle: e.target.value })} />
                    
                    <Input icon={EyeOff} textarea label="3. Hipersensibilidades (Le molesta)" placeholder="Ej. Ruidos fuertes, etiquetas, luces brillantes..." value={profileData.hypersensitivities} onChange={e => setProfileData({ ...profileData, hypersensitivities: e.target.value })} />
                    <Input icon={Eye} textarea label="4. Hiposensibilidades (Busca)" placeholder="Ej. Presión profunda, girar, morder objetos..." value={profileData.hyposensitivities} onChange={e => setProfileData({ ...profileData, hyposensitivities: e.target.value })} />
                    
                    <div className="md:col-span-2">
                      <Input icon={Heart} textarea label="5. Intereses Profundos (SpIns)" placeholder="Ej. Dinosaurios, Trenes, Astronomía (¡Esto es clave para usar analogías!)" value={profileData.specialInterests} onChange={e => setProfileData({ ...profileData, specialInterests: e.target.value })} helpText="La IA usará estos temas para explicar cosas o proponer juegos." />
                    </div>

                    <Input icon={AlertTriangle} textarea label="6. Desencadenantes (Triggers)" placeholder="Ej. Cambios de rutina, Hambre, Sueño, Lugares concurridos..." value={profileData.triggers} onChange={e => setProfileData({ ...profileData, triggers: e.target.value })} />
                    <Input icon={Smile} textarea label="7. Estrategias de Calma" placeholder="Ej. Co-regulación, Música, Tablet, Espacio tranquilo..." value={profileData.calmingStrategies} onChange={e => setProfileData({ ...profileData, calmingStrategies: e.target.value })} />
                    
                    <Input icon={Zap} textarea label="8. Fortalezas" placeholder="Ej. Memoria visual, Empatía con animales, Creatividad..." value={profileData.strengths} onChange={e => setProfileData({ ...profileData, strengths: e.target.value })} />
                    <Input icon={Clock} textarea label="9. Nivel de Energía / Ritmo" placeholder="Ej. Muy activo/motor, o más pasivo/observador..." value={profileData.energyLevel} onChange={e => setProfileData({ ...profileData, energyLevel: e.target.value })} />
                    
                    <div className="md:col-span-2">
                      <Input icon={Shield} textarea label="10. Desafío Actual Principal" placeholder="Ej. Control de esfínteres, Socialización, Agresividad..." value={profileData.mainChallenge} onChange={e => setProfileData({ ...profileData, mainChallenge: e.target.value })} />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* --- PESTAÑA RUTINA --- */}
        {activeTab === 'schedule' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 animate-fade-in">
             <div className="max-w-full md:max-w-6xl mx-auto h-full">
               <VisualSchedule db={db} appId={appId} userId={user.uid} />
             </div>
          </div>
        )}
        
        {activeTab === 'evolution' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 animate-fade-in">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="text-blue-600" /> Bitácora</h2>
              
              <ClinicalReport db={db} appId={appId} userId={user.uid} profileName={neuroName} />
              
              {journalEntries.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-3xl"><p className="text-gray-400">Sin registros.</p></div>
              ) : (
                <div className="space-y-6">{journalEntries.map(e => <JournalEntryItem key={e.id} entry={e} userId={user.uid} onNoteSaved={() => showToast('Nota guardada')} />)}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-slate-50 animate-fade-in relative">
            
            {/* 1. BANNER DE PERFIL INCOMPLETO */}
            {isProfileIncomplete && (
              <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-start gap-3 shadow-sm z-10 shrink-0">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-800">¡Completa tu perfil para mejores resultados!</h4>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    La IA puede darte consejos mucho más precisos si conoce el diagnóstico, edad e intereses de tu ser querido.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className="text-xs font-bold bg-amber-200 text-amber-800 px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors shadow-sm active:scale-95 flex items-center gap-1"
                >
                  Completar <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && <div className="w-10 h-10 rounded-full bg-white border mr-3 p-1.5 flex items-center justify-center shrink-0"><Logo /></div>}
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed group relative ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm'}`}>
                    <RichText text={msg.content} />
                    <div className="text-[10px] mt-1 opacity-60 text-right flex items-center justify-end gap-1">{msg.role === 'assistant' && <Clock className="w-3 h-3" />}{formatTime(msg.timestamp)}</div>
                    
                    {/* 2. BOTÓN GUARDAR MEJORADO */}
                    {msg.role === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                        <button 
                          onClick={handleSaveMilestone} 
                          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all duration-300 hover:shadow-md active:scale-95 group border border-indigo-100"
                        >
                          <BookOpen className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>Guardar en Bitácora</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} className="h-4" />
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-md border-t relative z-20 pb-2">
              <DailyTracker db={db} appId={appId} userId={user.uid} onSaved={() => showToast('Día registrado')} />
              <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-3 max-w-4xl mx-auto items-end">
                
                {/* Mobile WhatsApp Button (Integrated) */}
                <a 
                  href="https://wa.me/56965863160" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="md:hidden w-12 h-[56px] flex items-center justify-center bg-green-50 rounded-2xl border border-green-100 active:scale-95 transition-transform"
                  title="Soporte Humano"
                >
                  <img src="/img/WhatsApp.webp" alt="Soporte" className="w-6 h-6 object-contain" />
                </a>

                <textarea ref={inputRef} value={inputMessage} onChange={handleInputChange} onFocus={() => { if(inputRef.current) inputRef.current.style.height = 'auto'; }} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder="Cuéntame..." className="flex-1 bg-gray-100/50 border rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none max-h-40 min-h-[56px] shadow-inner" rows="1" /><Button type="submit" disabled={!inputMessage.trim() || isTyping} className="rounded-2xl w-14 h-[56px] p-0 shadow-lg shadow-blue-200/50"><Send className="w-6 h-6 ml-0.5" /></Button></form></div>
          </div>
        )}
        
        {/* WhatsApp Button hides when typing (input has text) or focused */}
        <WhatsAppButton hidden={inputMessage.length > 0 || (inputRef.current && document.activeElement === inputRef.current)} />
      </main>
    </div>
  );
}