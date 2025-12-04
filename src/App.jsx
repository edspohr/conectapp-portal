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
  Star,
} from 'lucide-react';

/* --- CONFIGURACIÓN FIREBASE --- */
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

const googleProvider = new GoogleAuthProvider();

/* --- TEMAS RÁPIDOS DE CONVERSACIÓN --- */
const QUICK_TOPICS = [
  {
    id: 'rutinas_sueno',
    label: 'Rutinas de sueño',
    suggestion: 'Quiero hablar de las rutinas de sueño de mi peque.',
  },
  {
    id: 'crisis',
    label: 'Crisis y desregulación',
    suggestion:
      'Necesito ideas para manejar las crisis y la desregulación de mi peque.',
  },
  {
    id: 'colegio',
    label: 'Colegio / social',
    suggestion:
      'Quiero hablar sobre el colegio, lo social y cómo ayudarle a adaptarse.',
  },
  {
    id: 'desahogo',
    label: 'Necesito desahogarme',
    suggestion:
      'Sólo quiero desahogarme hoy. Ha sido un día intenso y necesito contarlo.',
  },
];

/* --- COMPONENTES UI BÁSICOS --- */

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const baseStyle =
    'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97]';
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200',
    secondary:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    ghost: 'text-gray-500 hover:bg-gray-100',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea = false,
}) => (
  <div className="mb-4">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    {textarea ? (
      <textarea
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px]"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    ) : (
      <input
        type={type}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    )}
  </div>
);

const Card = ({ children, title, icon: Icon, className = '' }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
  >
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Logo = ({ className = 'w-10 h-10' }) => (
  <div className={`${className} relative flex items-center justify-center`}>
    <img
      src="/img/logo.png"
      alt="ConectApp Logo"
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target;
        target.onerror = null;
        target.style.display = 'none';
        const parent = target.parentElement;
        parent.classList.add('bg-blue-100', 'rounded-full', 'text-blue-600');
        parent.innerHTML =
          '<span class="text-xs font-bold">CA</span>';
      }}
    />
  </div>
);

/* Botón flotante de WhatsApp */

const WhatsAppButton = () => (
  <div className="fixed right-4 bottom-24 md:bottom-28 flex flex-col items-end gap-2 z-40">
    <div className="px-3 py-2 text-[11px] md:text-xs bg-slate-50 border border-slate-200 rounded-lg shadow-sm text-slate-600 max-w-[180px] md:max-w-xs">
      <span className="font-medium text-slate-800">
        ¿Necesitas ayuda rápida?
      </span>{' '}
      <span>Escríbenos por WhatsApp y te orientamos.</span>
    </div>
    <a
      href="https://wa.me/56965863160"
      target="_blank"
      rel="noopener noreferrer"
      className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-lg flex items-center justify-center transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]"
      aria-label="Escribir por WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 md:w-8 md:h-8"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.63.94 5.06 2.52 6.98L6 28l6.17-1.5A11.06 11.06 0 0 0 16.04 26C22.1 26 27 21.04 27 14.98 27.08 8.96 22.12 4 16.04 4zm6.46 15.65c-.27.77-1.58 1.46-2.18 1.5-.6.04-1.2.38-4.05-.84-3.41-1.49-5.57-4.94-5.74-5.17-.17-.23-1.37-1.82-1.37-3.47 0-1.65.87-2.46 1.18-2.8.31-.34.68-.43.9-.43.22 0 .45 0 .65.01.21.01.5-.08.78.6.27.68.92 2.34 1 2.51.08.17.13.37.02.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.34.35-.15.69.19.34.84 1.39 1.8 2.25 1.24 1.11 2.29 1.46 2.63 1.63.34.17.54.15.74-.09.2-.24.85-.99 1.08-1.33.23-.34.46-.28.78-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.81-.19 1.58z"
        />
      </svg>
    </a>
  </div>
);

/* Ítem de bitácora */

const JournalEntryItem = ({ entry, userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userNoteDraft, setUserNoteDraft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const startEditing = () => {
    setUserNoteDraft(entry.userNotes || '');
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    try {
      const entryRef = doc(
        db,
        'artifacts',
        appId,
        'users',
        userId,
        'journal',
        entry.id,
      );
      await updateDoc(entryRef, {
        userNotes: userNoteDraft,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
      <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600 animate-pulse">
              {/* CAMBIO: Ícono de Mano solicitado */}
              <Hand className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">
              {entry.title || 'Hito de Conversación'}
            </h4>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap">
            {entry.createdAt?.seconds
              ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString()
              : 'Hoy'}
          </span>
        </div>
        
        {/* CAMBIO: Animación y truncado a 2 líneas */}
        <div
          className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
            isExpanded ? 'max-h-[1000px]' : 'max-h-12'
          } overflow-hidden`}
        >
          <p
            className={isExpanded ? '' : 'line-clamp-2'}
            style={{
              display: isExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: isExpanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {entry.fullContent || entry.content}
          </p>
        </div>
        {(entry.fullContent || '').length > 100 && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            {isExpanded ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>

      <div className="p-5 md:w-1/3 bg-gray-50 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Notas de la Familia
          </h5>
          {!isEditing && (
            <button
              onClick={startEditing}
              className="text-blue-600 hover:text-blue-800 p-1"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              className="w-full flex-1 p-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none min-h-[80px]"
              value={userNoteDraft}
              onChange={(e) => setUserNoteDraft(e.target.value)}
              placeholder="Agrega tus observaciones aquí..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={startEditing}
            className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 -ml-2 rounded-lg transition-colors italic min-h-[60px]"
          >
            {entry.userNotes ? (
              entry.userNotes
            ) : (
              <span className="text-gray-400">
                Clic para agregar tus notas personales...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ----- PROMPTS PARA GEMINI ----- */

function buildGeminiPrompt(
  userMessage,
  profileData,
  messages,
  hoursSinceLastMsg,
  currentTopic,
) {
  // CAMBIO: Contexto (RAG Simple) limitado a los últimos 20 mensajes
  const contextWindow = messages.slice(-20);
  
  const lastExchanges = contextWindow
    .map((m) => `${m.role === 'user' ? 'FAMILIA' : 'CONECTAPP'}: ${m.content}`)
    .join('\n');

  const tiempoTexto =
    hoursSinceLastMsg == null
      ? 'No se sabe cuánto tiempo pasó.'
      : hoursSinceLastMsg < 2
      ? 'Pasó poco tiempo desde el último mensaje.'
      : `Pasaron aproximadamente ${Math.round(hoursSinceLastMsg)} horas desde el último mensaje.`;

  const topicText = currentTopic
    ? `Tema actual declarado por la familia: "${currentTopic}".`
    : 'No hay un tema declarado, interpreta según el mensaje.';

  // CAMBIO: Prompt actualizado para tono Coach profesional y eliminar disclaimers
  return `
Eres ConectApp, un Coach y acompañante digital especializado para familias neurodivergentes.
Tu rol es proveer contención emocional, estrategias prácticas y orientación basada en evidencia.

ESTILO Y TONO:
- Tono: Cálido, empático, profesional pero cercano. Como un terapeuta experto que habla por chat.
- Eres una fuente de apoyo confiable. NO uses frases como "como IA no puedo..." o "no soy médico". Asume tu rol de Coach con respaldo profesional.
- Valida siempre la emoción primero. Haz sentir a la familia escuchada y comprendida.
- Lenguaje: Español neutro inclusivo (usa "quien cuida", "tu peque", "la familia").

DINÁMICA:
- Mantén el hilo de la conversación de forma natural.
- Si pasaron muchas horas, saluda suavemente antes de retomar.
- Respuestas concisas (máx 12 líneas). Usa viñetas solo si es necesario para dar pasos claros.

CONTEXTO DE LA FAMILIA:
- Cuidador/a: ${profileData.caregiverFirstName || 'quien cuida'}
- Peque: ${profileData.neuroName || 'el peque'}
- Edad: ${profileData.age || '?'}
- Diagnóstico/Situación: ${profileData.diagnosisLevel}
- Sensibilidades: ${profileData.sensorySensitivities || 'No especificadas'}
- Calma: ${profileData.calmingStrategies || 'No especificadas'}

SITUACIÓN TEMPORAL:
${tiempoTexto}
${topicText}

HISTORIAL RECIENTE (Contexto):
${lastExchanges}

MENSAJE ACTUAL:
"${userMessage}"

Responde con empatía y utilidad práctica.
`;
}

/* ----- COMPONENTE PRINCIPAL ----- */

export default function ConectApp() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [authMode, setAuthMode] = useState('login'); 
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

  const [activeTab, setActiveTab] = useState('chat');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);

  const [profileData, setProfileData] = useState({
    caregiverFirstName: '',
    caregiverLastName: '',
    neuroName: '',
    patientName: '',
    age: '',
    diagnosisLevel: 'Necesito orientación inicial',
    communicationStyle: '',
    sensorySensitivities: '',
    specialInterests: '',
    triggers: '',
    calmingStrategies: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [journalEntries, setJournalEntries] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  // CAMBIO: Estado para mostrar prompt de inactividad
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const messagesEndRef = useRef(null);

  /* --- UTILS --- */
  const upsertUserProfile = async (userObj) => {
    if (!userObj) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', userObj.uid, 'data', 'profile');
    try {
      await setDoc(profileRef, {
        email: userObj.email || '',
        caregiverFirstName: userObj.displayName ? userObj.displayName.split(' ')[0] : '',
      }, { merge: true });
    } catch (e) {
      console.error('Error upserting profile:', e);
    }
  };

  /* --- EFECTOS --- */
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await upsertUserProfile(result.user);
        }
      })
      .catch((error) => console.error('Error redirect login:', error));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthChecked(true);
      setAuthError('');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setJournalEntries([]);
      setMessages([{ role: 'system', content: 'Hola. Soy tu acompañante en ConectApp...' }]);
      setActiveSessionId(null);
      setShowResumePrompt(false);
      return;
    }

    // Cargar perfil
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfileData((prev) => ({ ...prev, ...data }));
        setCaregiverFirstName((prev) => prev || data.caregiverFirstName || '');
        setCaregiverLastName((prev) => prev || data.caregiverLastName || '');
        setNeuroName((prev) => prev || data.neuroName || data.patientName || '');
      }
    });

    // Gestión de Sesión e Inactividad
    const sessionRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session');
    const ensureSession = async () => {
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) {
        const newSessionId = `session-${Date.now()}`;
        await setDoc(sessionRef, { activeSessionId: newSessionId, lastInteractionAt: serverTimestamp() });
        setActiveSessionId(newSessionId);
      }
    };
    ensureSession();

    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.activeSessionId) setActiveSessionId(data.activeSessionId);
        
        // CAMBIO: Lógica de detección de inactividad > 12 horas
        if (data.lastInteractionAt?.seconds) {
          const lastDate = data.lastInteractionAt.seconds * 1000;
          const hoursDiff = (Date.now() - lastDate) / (1000 * 60 * 60);
          if (hoursDiff > 12) {
            setShowResumePrompt(true);
          } else {
            setShowResumePrompt(false);
          }
        }
      }
    });

    // Cargar bitácora
    const journalRef = collection(db, 'artifacts', appId, 'users', user.uid, 'journal');
    const qJournal = query(journalRef, orderBy('createdAt', 'desc'));
    const unsubJournal = onSnapshot(qJournal, (snap) => {
      setJournalEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProfile();
      unsubSession();
      unsubJournal();
    };
  }, [user]);

  // Cargar Chat
  useEffect(() => {
    if (!user || !activeSessionId) return;
    const messagesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'conversations');
    const q = query(
      messagesRef, 
      where('sessionId', '==', activeSessionId), 
      orderBy('createdAt', 'desc'), 
      limit(100) // Traemos los últimos 100 para tener contexto suficiente
    );

    const unsubMsg = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (loaded.length === 0) {
        setMessages([{ role: 'system', content: 'Hola. Soy tu acompañante en ConectApp...' }]);
        return;
      }
      // Ordenamos cronológicamente para mostrar en pantalla
      const sorted = loaded
        .map(m => ({
          ...m,
          timestamp: m.timestamp || (m.createdAt?.seconds ? m.createdAt.seconds * 1000 : Date.now())
        }))
        .reverse();
      setMessages(sorted);
    });
    return () => unsubMsg;
  }, [user, activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  /* --- HANDLERS --- */

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      await upsertUserProfile(result.user);
    } catch (err) {
      setAuthError('Credenciales incorrectas.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerEmail || !registerPassword || !caregiverFirstName) {
      setAuthError('Faltan datos.');
      return;
    }
    if (registerPassword !== registerPasswordConfirm) {
      setAuthError('Contraseñas no coinciden.');
      return;
    }
    setAuthLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, registerEmail.trim(), registerPassword);
      await setDoc(doc(db, 'artifacts', appId, 'users', cred.user.uid, 'data', 'profile'), {
        caregiverFirstName,
        caregiverLastName,
        neuroName,
        email: registerEmail.trim(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      setAuthMode('login');
      setLoginEmail(registerEmail.trim());
      setLoginPassword('');
    } catch (err) {
      setAuthError('Error al crear cuenta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await upsertUserProfile(result.user);
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        setAuthError('Error con Google Login.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('chat');
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile'), {
        ...profileData,
        caregiverFirstName,
        caregiverLastName,
        neuroName
      }, { merge: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  /* --- LOGICA BITÁCORA MANUAL --- */
  
  // CAMBIO: Lógica para guardar hito manual con los últimos 8 mensajes
  const handleSaveMilestoneFromMessage = async (msg) => {
    if (!user || !activeSessionId) return;
    
    // Tomamos los últimos 8 mensajes del historial actual
    const recentHistory = messages.slice(-8);
    const summaryText = recentHistory
      .map(m => `${m.role === 'user' ? 'Familia' : 'ConectApp'}: ${m.content}`)
      .join('\n\n');

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'journal'), {
        title: 'Hito de Conversación',
        content: summaryText, // Resumen automático (extracto)
        fullContent: summaryText,
        userNotes: '', // Notas vacías para que el usuario las llene
        createdAt: serverTimestamp(),
        type: 'milestone',
        sessionId: activeSessionId,
      });
      alert('Hito guardado en la bitácora correctamente.');
    } catch (error) {
      console.error('Error guardando hito:', error);
    }
  };

  const checkSafety = (text) => {
    const dangerKeywords = ['suicidio', 'matarme', 'morir', 'emergencia', '133', '911'];
    return dangerKeywords.some((k) => text.toLowerCase().includes(k));
  };

  const updateLastInteraction = async () => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session'), {
      lastInteractionAt: serverTimestamp(),
      activeSessionId: activeSessionId || `session-${Date.now()}`
    }, { merge: true });
  };

  const startNewConversation = async () => {
    if (!user) return;
    const newId = `session-${Date.now()}`;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session'), {
      activeSessionId: newId,
      lastInteractionAt: serverTimestamp()
    }, { merge: true });
    setActiveSessionId(newId);
    setMessages([{ role: 'system', content: 'Hola. Empecemos de nuevo. ¿En qué puedo ayudarte?' }]);
    setShowResumePrompt(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    if (!activeSessionId) await startNewConversation();

    const now = Date.now();
    
    // Cálculo de tiempo desde último mensaje para el prompt
    const lastMsg = messages.filter(m => m.role !== 'system').slice(-1)[0];
    let hoursSince = null;
    if (lastMsg && lastMsg.timestamp) {
      hoursSince = (now - lastMsg.timestamp) / (1000 * 60 * 60);
    }

    if (checkSafety(inputMessage)) {
      setShowSafetyAlert(true);
      return;
    }

    const newMsg = { role: 'user', content: inputMessage, timestamp: now };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);
    setShowResumePrompt(false); // Ocultar prompt al responder

    // Guardar User Msg
    const msgsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'conversations');
    await addDoc(msgsRef, { ...newMsg, createdAt: serverTimestamp(), sessionId: activeSessionId });
    await updateLastInteraction();

    try {
      // Prompt a Gemini con ventana de 20 mensajes
      const prompt = buildGeminiPrompt(
        newMsg.content, 
        { ...profileData, caregiverFirstName, caregiverLastName, neuroName },
        messages, // Se corta dentro de la función buildGeminiPrompt
        hoursSince,
        currentTopic
      );

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error('No API Key');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      
      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Estoy aquí contigo.';

      const aiMsg = { role: 'assistant', content: aiText, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      
      await addDoc(msgsRef, { ...aiMsg, createdAt: serverTimestamp(), sessionId: activeSessionId });
      await updateLastInteraction();

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tuve un problema de conexión, pero te leo.', timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  /* --- RENDER --- */
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center text-blue-600">Cargando...</div>;

  if (!user) {
    // LOGIN SCREEN (Simplificado para brevedad, misma lógica que tenías)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-6">
            <Logo className="w-16 h-16 mx-auto mb-2" />
            <h1 className="text-2xl font-bold">ConectApp</h1>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded ${authMode === 'login' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}>Ingresar</button>
            <button onClick={() => setAuthMode('register')} className={`flex-1 py-2 rounded ${authMode === 'register' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-gray-500'}`}>Registrar</button>
          </div>
          {authError && <div className="text-red-500 text-sm mb-3 bg-red-50 p-2 rounded">{authError}</div>}
          
          <form onSubmit={authMode === 'login' ? handleEmailLogin : handleRegister} className="space-y-3">
            {authMode === 'register' && (
              <>
                <Input placeholder="Tu Nombre" value={caregiverFirstName} onChange={e => setCaregiverFirstName(e.target.value)} />
                <Input placeholder="Nombre de tu Peque" value={neuroName} onChange={e => setNeuroName(e.target.value)} />
              </>
            )}
            <Input type="email" placeholder="Correo" value={authMode === 'login' ? loginEmail : registerEmail} onChange={e => authMode === 'login' ? setLoginEmail(e.target.value) : setRegisterEmail(e.target.value)} />
            <Input type="password" placeholder="Contraseña" value={authMode === 'login' ? loginPassword : registerPassword} onChange={e => authMode === 'login' ? setLoginPassword(e.target.value) : setRegisterPassword(e.target.value)} />
            {authMode === 'register' && <Input type="password" placeholder="Confirmar Contraseña" value={registerPasswordConfirm} onChange={e => setRegisterPasswordConfirm(e.target.value)} />}
            
            <Button type="submit" disabled={authLoading} className="w-full">{authLoading ? 'Procesando...' : (authMode === 'login' ? 'Entrar' : 'Crear Cuenta')}</Button>
          </form>

          <div className="mt-4 border-t pt-4">
             <button onClick={handleGoogleLogin} className="w-full border py-2 rounded flex justify-center gap-2 hover:bg-gray-50">
               <span className="font-bold text-gray-700">Continuar con Google</span>
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Alerta Seguridad */}
      {showSafetyAlert && (
        <div className="fixed inset-0 z-50 bg-red-900/90 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl text-center max-w-sm">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-red-700">Alerta de Seguridad</h2>
            <p className="mb-4">Detectamos una situación de riesgo. Pide ayuda.</p>
            <a href="tel:133" className="block w-full bg-red-600 text-white py-3 rounded mb-2 font-bold">Llamar Emergencias</a>
            <button onClick={() => setShowSafetyAlert(false)} className="text-gray-500 underline">Estoy bien</button>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r h-screen sticky top-0 shadow-sm z-10">
        <div className="p-6 border-b flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-xl">ConectApp</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('chat')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <MessageSquare className="w-5 h-5" /> Chat
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <User className="w-5 h-5" /> Perfil
          </button>
          <button onClick={() => setActiveTab('evolution')} className={`w-full flex gap-3 px-4 py-3 rounded-xl ${activeTab === 'evolution' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BookOpen className="w-5 h-5" /> Bitácora
          </button>
        </nav>
        <div className="p-4 border-t">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start"><LogOut className="w-4 h-4 mr-2" /> Salir</Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white border-b p-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold">ConectApp</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
      </header>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-10 pt-24 px-6 md:hidden flex flex-col gap-4">
           <button onClick={() => { setActiveTab('chat'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded flex gap-3"><MessageSquare /> Chat</button>
           <button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded flex gap-3"><User /> Perfil</button>
           <button onClick={() => { setActiveTab('evolution'); setMobileMenuOpen(false); }} className="text-lg p-4 bg-gray-50 rounded flex gap-3"><BookOpen /> Bitácora</button>
           <Button onClick={handleLogout} variant="danger" className="mt-auto mb-8">Cerrar Sesión</Button>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative h-[calc(100vh-64px)] md:h-screen bg-gray-50">
        
        {/* VISTA PERFIL */}
        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Perfil Familiar</h2>
              <div className="flex justify-end"><Button onClick={saveProfile} disabled={isSavingProfile}><Save className="w-4 h-4" /> {isSavingProfile ? 'Guardando...' : 'Guardar'}</Button></div>
              
              <Card title="Datos Básicos" icon={User}>
                 <div className="grid md:grid-cols-2 gap-4">
                    <Input label="Tu Nombre" value={caregiverFirstName} onChange={e => setCaregiverFirstName(e.target.value)} />
                    <Input label="Tu Apellido" value={caregiverLastName} onChange={e => setCaregiverLastName(e.target.value)} />
                    <Input label="Nombre del Peque" value={neuroName} onChange={e => setNeuroName(e.target.value)} />
                    <Input label="Edad" value={profileData.age} onChange={e => setProfileData({...profileData, age: e.target.value})} />
                 </div>
              </Card>
              <Card title="Detalles Neurodivergentes" icon={BrainCircuit}>
                 <Input textarea label="Intereses Especiales" value={profileData.specialInterests} onChange={e => setProfileData({...profileData, specialInterests: e.target.value})} />
                 <Input textarea label="Estrategias de Calma" value={profileData.calmingStrategies} onChange={e => setProfileData({...profileData, calmingStrategies: e.target.value})} />
                 <Input textarea label="Sensibilidades" value={profileData.sensorySensitivities} onChange={e => setProfileData({...profileData, sensorySensitivities: e.target.value})} />
              </Card>
            </div>
          </div>
        )}

        {/* VISTA BITÁCORA */}
        {activeTab === 'evolution' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><BookOpen className="text-blue-600" /> Bitácora</h2>
              {journalEntries.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed rounded-xl text-gray-400">No hay registros aún. Guarda hitos desde el chat.</div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map(entry => <JournalEntryItem key={entry.id} entry={entry} userId={user.uid} />)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA CHAT */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {/* CAMBIO: Prompt de Inactividad Visual */}
              {showResumePrompt && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                  <div>
                    <h4 className="font-bold text-blue-800">Han pasado varias horas</h4>
                    <p className="text-sm text-blue-600">¿Quieres continuar lo que hablábamos o empezar algo nuevo?</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowResumePrompt(false)}>Continuar</Button>
                    <Button onClick={startNewConversation}>Nueva Conversación</Button>
                  </div>
                </div>
              )}

              {/* Chips Temas */}
              <div className="flex gap-2 flex-wrap mb-4">
                 {QUICK_TOPICS.map(t => (
                   <button key={t.id} onClick={() => { setCurrentTopic(t.label); setInputMessage(t.suggestion); }} className="text-xs px-3 py-1 bg-white border rounded-full hover:bg-blue-50 transition-colors">
                     {t.label}
                   </button>
                 ))}
              </div>

              {/* Mensajes */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 shrink-0"><Logo className="w-6 h-6" /></div>}
                  <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none text-gray-700'}`}>
                    {msg.content}
                    {/* CAMBIO: Botón manual para guardar hito en mensajes del asistente */}
                    {msg.role === 'assistant' && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button 
                          onClick={() => handleSaveMilestoneFromMessage(msg)}
                          className="text-xs flex items-center gap-1 text-blue-500 hover:text-blue-700 font-medium transition-colors"
                        >
                          <Save className="w-3 h-3" /> Guardar en bitácora
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && <div className="ml-12 text-gray-400 text-sm animate-pulse">Escribiendo...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
               <form onSubmit={handleSendMessage} className="flex gap-2 relative max-w-4xl mx-auto">
                 <textarea 
                    value={inputMessage} 
                    onChange={e => setInputMessage(e.target.value)} 
                    onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                    placeholder="Escribe aquí..." 
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none max-h-32" 
                    rows="1" 
                 />
                 <Button type="submit" disabled={!inputMessage.trim() || isTyping} className="rounded-xl w-12 h-12 flex items-center justify-center p-0"><Send className="w-5 h-5" /></Button>
               </form>
            </div>
          </div>
        )}

        <WhatsAppButton />
      </main>
    </div>
  );
}
