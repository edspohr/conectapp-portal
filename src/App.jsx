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
  where,
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
  Phone,
  Hand,
  Clock,
  ChevronDown,
  Eye,
  EyeOff,
} from 'lucide-react';

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
const QUICK_TOPICS = [
  { id: 'rutinas', label: 'Rutinas de sueño', suggestion: 'Quiero hablar de las rutinas de sueño de mi ser querido.' },
  { id: 'crisis', label: 'Crisis', suggestion: 'Necesito ideas para manejar las crisis y la desregulación.' },
  { id: 'colegio', label: 'Colegio / social', suggestion: 'Quiero hablar sobre el colegio y la adaptación social.' },
  { id: 'desahogo', label: 'Desahogo', suggestion: 'Sólo quiero desahogarme hoy. Ha sido un día intenso.' },
];

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

const Input = ({ label, value, onChange, placeholder, type = 'text', textarea = false, error, rightElement }) => (
  <div className="mb-5 relative">
    {label && <label className={`block text-sm font-semibold mb-1.5 ml-1 ${error ? 'text-red-500' : 'text-gray-700'}`}>{label}</label>}
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
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
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

/* WhatsApp Button: Se oculta al escribir */
const WhatsAppButton = ({ hidden }) => {
  const [showSnippet, setShowSnippet] = useState(true);
  const snippetVisible = showSnippet && !hidden;

  return (
    <div className={`fixed right-4 bottom-24 md:bottom-28 flex flex-col items-end gap-2 z-40 transition-all duration-500 ${hidden ? 'translate-y-20 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
      <div className={`relative px-4 py-3 text-[11px] md:text-xs bg-white/90 backdrop-blur-md border border-blue-100 rounded-xl shadow-lg text-slate-600 max-w-[200px] md:max-w-xs transition-all duration-300 origin-bottom-right ${snippetVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
        <button onClick={() => setShowSnippet(false)} className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full p-0.5 border border-gray-100 shadow-sm"><X className="w-3 h-3" /></button>
        <span className="font-bold text-slate-800 block mb-0.5">¿Necesitas ayuda humana?</span>
        <span>Escríbenos por WhatsApp.</span>
      </div>
      <a href="https://wa.me/56965863160" target="_blank" rel="noopener noreferrer" className="group relative w-14 h-14 md:w-16 md:h-16 rounded-full shadow-xl shadow-green-200 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-100">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 via-green-500 to-emerald-500 opacity-90 group-hover:opacity-100 transition-opacity"></span>
        <span className="absolute inset-[3px] rounded-full bg-white/10 backdrop-blur"></span>
        <img src="/img/WhatsApp.webp" alt="WhatsApp" className="relative w-7 h-7 md:w-8 md:h-8 object-contain drop-shadow" />
        <span className="absolute -bottom-6 text-[10px] font-semibold text-emerald-600 bg-white px-2 py-1 rounded-full shadow-sm border border-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity">WhatsApp</span>
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

/* ----- PROMPT IA ----- */
function buildGeminiPrompt(userMessage, profileData, messages, hoursSinceLastMsg, currentTopic) {
  const contextWindow = messages.slice(-20);
  const lastExchanges = contextWindow.map(m => `${m.role === 'user' ? 'FAMILIA' : 'CONECTAPP'}: ${m.content}`).join('\n');
  const tiempoTexto = hoursSinceLastMsg == null ? 'No se sabe cuánto tiempo pasó.' : hoursSinceLastMsg < 2 ? 'Pasó poco tiempo desde el último mensaje.' : `Pasaron aproximadamente ${Math.round(hoursSinceLastMsg)} horas desde el último mensaje.`;
  const topicText = currentTopic ? `Tema actual declarado: "${currentTopic}".` : 'No hay un tema declarado.';

  return `
Eres ConectApp, un Coach experto en acompañamiento para familias neurodivergentes.
OBJETIVO: Brindar apoyo, contención emocional y estrategias prácticas con absoluta solidez y calma profesional.
PERSONALIDAD: Resolutiva, tranquila, experta. Transmite confianza sin usar frases de descargo ("no soy médico"). Demuestra experiencia con el contenido.
FORMATO: Responde breve y directo (máx 4-6 frases). Usa negritas (**texto**) para conceptos clave. Usa listas solo si hay pasos prácticos.
CONTEXTO:
- Cuidador/a: ${profileData.caregiverFirstName || 'quien cuida'}
- Ser querido: ${profileData.neuroName || 'el ser querido'} (${profileData.age || '?'})
- Diagnóstico: ${profileData.diagnosisLevel}
- Sensibilidades: ${profileData.sensorySensitivities || 'No especificadas'}
- Calma: ${profileData.calmingStrategies || 'No especificadas'}
TIEMPO: ${tiempoTexto}
TEMA: ${topicText}
HISTORIAL:
${lastExchanges}
MENSAJE ACTUAL: "${userMessage}"
Responde con empatía resolutiva.
`;
}

/* ----- COMPONENTE PRINCIPAL ----- */
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
  
  // Profile & Data
  const [profileData, setProfileData] = useState({ caregiverFirstName: '', caregiverLastName: '', neuroName: '', patientName: '', age: '', diagnosisLevel: 'Necesito orientación inicial', communicationStyle: '', sensorySensitivities: '', specialInterests: '', triggers: '', calmingStrategies: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Para auto-grow y focus

  // Helper para notificaciones
  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  /* --- UTILS --- */
  const upsertUserProfile = async (userObj) => {
    if (!userObj) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', userObj.uid, 'data', 'profile');
    try {
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

  // CHAT SYNC - Manejo de error de índice
  useEffect(() => {
    if (!user || !activeSessionId) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'conversations'), where('sessionId', '==', activeSessionId), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) {
        setMessages([{ role: 'system', content: 'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte.' }]);
      } else {
        setMessages(snap.docs.map(d => {
          const dt = d.data();
          return { ...dt, timestamp: dt.timestamp || (dt.createdAt?.seconds * 1000) || Date.now() };
        }).reverse());
      }
    }, (err) => {
      // ESTE LOG ES CRÍTICO PARA EL USUARIO: Muestra el link de creación de índice
      console.error("🔥 ERROR FIRESTORE (Probable falta de índice). Copia este link en tu navegador:", err.message.match(/https:\/\/[^\s]+/)?.[0] || err);
    });
    return () => unsub();
  }, [user, activeSessionId]);

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
    
    // Ocultar snippet al enviar también
    if (inputRef.current) inputRef.current.blur();

    if (!activeSessionId) { /* Logic inside useEffect handles session creation mostly */ }

    const now = Date.now();
    const lastMsg = messages.filter(m => m.role !== 'system').slice(-1)[0];
    const hoursSince = lastMsg?.timestamp ? (now - lastMsg.timestamp) / 36e5 : null;

    if (['suicidio', 'matarme', 'morir', 'emergencia', '133', '911'].some(k => inputMessage.toLowerCase().includes(k))) {
      setShowSafetyAlert(true); return;
    }

    const newMsg = { role: 'user', content: inputMessage, timestamp: now };
    setMessages(p => [...p, newMsg]);
    setInputMessage('');
    if(inputRef.current) inputRef.current.style.height = 'auto'; // Reset height
    setIsTyping(true);

    try {
      const msgsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'conversations');
      await addDoc(msgsRef, { ...newMsg, createdAt: serverTimestamp(), sessionId: activeSessionId });
      await updateLastInteraction();

      const prompt = buildGeminiPrompt(newMsg.content, { ...profileData, caregiverFirstName, neuroName }, messages, hoursSince, currentTopic);
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key faltante');

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!res.ok) throw new Error('Error API');
      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Estoy aquí contigo.';
      const aiMsg = { role: 'assistant', content: aiText, timestamp: Date.now() };
      
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
            <Logo className="w-20 h-20 mx-auto mb-4" />
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
            <Input type={showPassword ? "text" : "password"} label="Contraseña" placeholder="********" value={authMode === 'login' ? loginPassword : registerPassword} onChange={e => authMode === 'login' ? setLoginPassword(e.target.value) : setRegisterPassword(e.target.value)} error={formErrors.loginPassword || formErrors.registerPassword} rightElement={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button>} />
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
      <aside className="hidden md:flex flex-col w-72 bg-white border-r h-screen sticky top-0 z-20"><div className="p-6 border-b flex items-center gap-3"><div className="w-9 h-9"><Logo /></div><span className="font-bold text-xl">ConectApp</span></div><nav className="flex-1 p-4 space-y-2"><button onClick={() => setActiveTab('chat')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><MessageSquare /> Chat</button><button onClick={() => setActiveTab('profile')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><User /> Perfil</button><button onClick={() => setActiveTab('evolution')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'evolution' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}><BookOpen /> Bitácora</button></nav><div className="p-4 border-t"><Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-500"><LogOut className="w-4 h-4 mr-2" /> Salir</Button></div></aside>
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b p-4 sticky top-0 z-30 flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-8 h-8"><Logo /></div><span className="font-bold text-lg">ConectApp</span></div><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2"><Menu /></button></header>
      {mobileMenuOpen && <div className="fixed inset-0 bg-white z-20 pt-24 px-6 md:hidden flex flex-col gap-4"><button onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><MessageSquare /> Chat</button><button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><User /> Perfil</button><button onClick={() => { setActiveTab('evolution'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded-xl flex gap-3"><BookOpen /> Bitácora</button><Button onClick={handleLogout} variant="danger" className="mt-auto mb-8">Cerrar Sesión</Button></div>}

      <main className="flex-1 overflow-hidden relative h-[calc(100vh-64px)] md:h-screen bg-slate-50/50">
        {activeTab === 'profile' && <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 animate-fade-in"><div className="max-w-3xl mx-auto space-y-6"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Perfil</h2><Button onClick={async () => { setIsSavingProfile(true); try { await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile'), { ...profileData, caregiverFirstName, caregiverLastName, neuroName }, { merge: true }); showToast('Guardado'); } finally { setIsSavingProfile(false); } }} disabled={isSavingProfile}><Save className="w-4 h-4" /> Guardar</Button></div><Card title="Datos" icon={User}><div className="grid md:grid-cols-2 gap-4"><Input label="Tu Nombre" value={caregiverFirstName} onChange={e => setCaregiverFirstName(e.target.value)} /><Input label="Nombre Ser Querido" value={neuroName} onChange={e => setNeuroName(e.target.value)} /></div></Card><Card title="Detalles" icon={BrainCircuit}><Input textarea label="Intereses" value={profileData.specialInterests} onChange={e => setProfileData({ ...profileData, specialInterests: e.target.value })} /><Input textarea label="Calma" value={profileData.calmingStrategies} onChange={e => setProfileData({ ...profileData, calmingStrategies: e.target.value })} /></Card></div></div>}
        
        {activeTab === 'evolution' && <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 animate-fade-in"><div className="max-w-3xl mx-auto"><h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-blue-600" /> Bitácora</h2>{journalEntries.length === 0 ? <div className="text-center p-12 border-2 border-dashed rounded-3xl"><p className="text-gray-400">Sin registros.</p></div> : <div className="space-y-6">{journalEntries.map(e => <JournalEntryItem key={e.id} entry={e} userId={user.uid} onNoteSaved={() => showToast('Nota guardada')} />)}</div>}</div></div>}

        {activeTab === 'chat' && <div className="h-full flex flex-col bg-slate-50 animate-fade-in"><div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin"><div className="flex gap-2 flex-wrap justify-center mb-6">{QUICK_TOPICS.map(t => <button key={t.id} onClick={() => { setCurrentTopic(t.label); setInputMessage(t.suggestion); inputRef.current?.focus(); }} className="text-xs px-4 py-2 bg-white border rounded-full hover:bg-blue-50 shadow-sm">{t.label}</button>)}</div>{messages.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>{msg.role !== 'user' && <div className="w-10 h-10 rounded-full bg-white border mr-3 p-1.5 flex items-center justify-center shrink-0"><Logo /></div>}<div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed group relative ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm'}`}><RichText text={msg.content} /><div className="text-[10px] mt-1 opacity-60 text-right flex items-center justify-end gap-1">{msg.role === 'assistant' && <Clock className="w-3 h-3" />}{formatTime(msg.timestamp)}</div>{msg.role === 'assistant' && <div className="mt-2 pt-2 border-t border-gray-100/30 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={handleSaveMilestone} className="text-xs flex gap-1 items-center bg-white/20 hover:bg-white/40 px-2 py-1 rounded text-current"><Save className="w-3 h-3" /> Guardar hito</button></div>}</div></div>)}{isTyping && <TypingIndicator />}<div ref={messagesEndRef} className="h-4" /></div><div className="p-4 bg-white/80 backdrop-blur-md border-t relative z-20"><form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto items-end"><textarea ref={inputRef} value={inputMessage} onChange={handleInputChange} onFocus={() => { if(inputRef.current) inputRef.current.style.height = 'auto'; }} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder="Cuéntame..." className="flex-1 bg-gray-100/50 border rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none max-h-40 min-h-[56px] shadow-inner" rows="1" /><Button type="submit" disabled={!inputMessage.trim() || isTyping} className="rounded-2xl w-14 h-[56px] p-0"><Send className="w-6 h-6 ml-0.5" /></Button></form></div></div>}
        
        {/* WhatsApp Button hides when typing (input has text) or focused */}
        <WhatsAppButton hidden={inputMessage.length > 0 || (inputRef.current && document.activeElement === inputRef.current)} />
      </main>
    </div>
  );
}
