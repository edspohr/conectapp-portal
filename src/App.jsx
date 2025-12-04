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
  Eye,
  EyeOff,
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
    'px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.97] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed';
  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50',
    secondary:
      'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    ghost: 'text-gray-500 hover:bg-gray-100 hover:text-blue-600',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
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
  error,
  rightElement,
}) => (
  <div className="mb-5 relative">
    {label && (
      <label className={`block text-sm font-semibold mb-1.5 ml-1 ${error ? 'text-red-500' : 'text-gray-700'}`}>
        {label}
      </label>
    )}
    {textarea ? (
      <textarea
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all min-h-[100px] resize-none ${
          error 
            ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-500' 
            : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500'
        }`}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    ) : (
      <div className="relative">
        <input
          type={type}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none transition-all ${
            error 
              ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-500' 
              : 'border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-blue-500/20 focus:border-blue-500'
          } ${rightElement ? 'pr-12' : ''}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {rightElement}
          </div>
        )}
      </div>
    )}
    {error && <span className="text-xs text-red-500 ml-1 mt-1 font-medium animate-pulse">{error}</span>}
  </div>
);

const Card = ({ children, title, icon: Icon, className = '' }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden ${className}`}
  >
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2 bg-gray-50/30">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Logo = ({ className = 'w-10 h-10' }) => (
  <div className={`${className} relative flex items-center justify-center shrink-0`}>
    <img
      src="/img/logo.png"
      alt="ConectApp Logo"
      className="w-full h-full object-contain drop-shadow-sm"
      onError={(e) => {
        const target = e.target;
        target.onerror = null;
        target.style.display = 'none';
        const parent = target.parentElement;
        parent.classList.add('bg-blue-100', 'rounded-full', 'text-blue-600');
        parent.innerHTML = '<span class="text-xs font-bold">CA</span>';
      }}
    />
  </div>
);

/* Botón flotante de WhatsApp */
const WhatsAppButton = ({ hideSnippet }) => (
  <div className="fixed right-4 bottom-24 md:bottom-28 flex flex-col items-end gap-2 z-40 transition-all duration-500">
    <div
      className={`px-4 py-3 text-[11px] md:text-xs bg-white/90 backdrop-blur-md border border-blue-100 rounded-xl shadow-lg text-slate-600 max-w-[200px] md:max-w-xs transition-all duration-300 origin-bottom-right ${
        hideSnippet
          ? 'opacity-0 translate-y-4 pointer-events-none scale-95'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <span className="font-bold text-slate-800 block mb-0.5">
        ¿Necesitas ayuda humana?
      </span>
      <span>Escríbenos por WhatsApp.</span>
    </div>
    <a
      href="https://wa.me/56965863160"
      target="_blank"
      rel="noopener noreferrer"
      className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full shadow-xl shadow-green-200 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-green-100 opacity-80 hover:opacity-100"
      aria-label="Escribir por WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 md:w-8 md:h-8 fill-current"
        aria-hidden="true"
      >
        <path d="M16.04 4C9.96 4 5 8.96 5 15.02c0 2.63.94 5.06 2.52 6.98L6 28l6.17-1.5A11.06 11.06 0 0 0 16.04 26C22.1 26 27 21.04 27 14.98 27.08 8.96 22.12 4 16.04 4zm6.46 15.65c-.27.77-1.58 1.46-2.18 1.5-.6.04-1.2.38-4.05-.84-3.41-1.49-5.57-4.94-5.74-5.17-.17-.23-1.37-1.82-1.37-3.47 0-1.65.87-2.46 1.18-2.8.31-.34.68-.43.9-.43.22 0 .45 0 .65.01.21.01.5-.08.78.6.27.68.92 2.34 1 2.51.08.17.13.37.02.6-.11.23-.17.37-.34.57-.17.2-.36.45-.51.6-.17.17-.34.35-.15.69.19.34.84 1.39 1.8 2.25 1.24 1.11 2.29 1.46 2.63 1.63.34.17.54.15.74-.09.2-.24.85-.99 1.08-1.33.23-.34.46-.28.78-.17.31.11 1.97.93 2.31 1.1.34.17.57.26.65.4.08.14.08.81-.19 1.58z" />
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
        entry.id
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

        <div
          className={`text-gray-600 text-sm leading-relaxed transition-all duration-500 ease-in-out relative ${
            isExpanded ? 'max-h-[1500px]' : 'max-h-20'
          } overflow-hidden`}
        >
          <p
            className={isExpanded ? '' : 'line-clamp-3'}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {entry.fullContent || entry.content}
          </p>
          {!isExpanded && (entry.fullContent || '').length > 150 && (
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
        {(entry.fullContent || '').length > 150 && (
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
          >
            {isExpanded ? 'Colapsar resumen' : 'Leer resumen completo'}
          </button>
        )}
      </div>

      <div className="p-6 md:w-1/3 bg-gray-50/50 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Edit3 className="w-3 h-3" /> Tus Notas
          </h5>
          {!isEditing && (
            <button
              onClick={startEditing}
              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar nota"
            >
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
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNote}
                className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Check className="w-3 h-3" /> Guardar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={startEditing}
            className="flex-1 text-sm text-gray-600 cursor-pointer hover:bg-white hover:shadow-sm p-3 -ml-3 rounded-xl transition-all border border-transparent hover:border-gray-100 min-h-[80px]"
          >
            {entry.userNotes ? (
              <p className="italic">{entry.userNotes}</p>
            ) : (
              <span className="text-gray-400 text-xs italic">
                Clic aquí para agregar notas personales sobre este hito...
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
  currentTopic
) {
  const contextWindow = messages.slice(-20);

  const lastExchanges = contextWindow
    .map(
      (m) => `${m.role === 'user' ? 'FAMILIA' : 'CONECTAPP'}: ${m.content}`
    )
    .join('\n');

  const tiempoTexto =
    hoursSinceLastMsg == null
      ? 'No se sabe cuánto tiempo pasó.'
      : hoursSinceLastMsg < 2
      ? 'Pasó poco tiempo desde el último mensaje.'
      : `Pasaron aproximadamente ${Math.round(
          hoursSinceLastMsg
        )} horas desde el último mensaje.`;

  const topicText = currentTopic
    ? `Tema actual declarado por la familia: "${currentTopic}".`
    : 'No hay un tema declarado, interpreta según el mensaje.';

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
- Sensibilidades: ${
    profileData.sensorySensitivities || 'No especificadas'
  }
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
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const messagesEndRef = useRef(null);

  /* --- UTILS --- */
  const upsertUserProfile = async (userObj) => {
    if (!userObj) return;
    const profileRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      userObj.uid,
      'data',
      'profile'
    );
    try {
      await setDoc(
        profileRef,
        {
          email: userObj.email || '',
          caregiverFirstName: userObj.displayName
            ? userObj.displayName.split(' ')[0]
            : '',
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Error upserting profile:', e);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (authMode === 'login') {
        if (!loginEmail) errors.loginEmail = 'El correo es obligatorio';
        if (!loginPassword) errors.loginPassword = 'La contraseña es obligatoria';
    } else {
        if (!caregiverFirstName) errors.caregiverFirstName = 'El nombre es obligatorio';
        if (!neuroName) errors.neuroName = 'El nombre del peque es obligatorio';
        if (!registerEmail) errors.registerEmail = 'El correo es obligatorio';
        if (!registerPassword) errors.registerPassword = 'La contraseña es obligatoria';
        if (registerPassword !== registerPasswordConfirm) errors.registerPasswordConfirm = 'Las contraseñas no coinciden';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* --- EFECTOS --- */
  
  // 1. Detectar resultado de Redirect (Fix para Vercel/Mobile)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          await upsertUserProfile(result.user);
          console.log("Redirect login success");
        }
      })
      .catch((error) => {
        console.error('Error redirect login:', error);
        setAuthError(
          'No se pudo completar el ingreso. Verifica los dominios autorizados en Firebase.'
        );
      });
  }, []);

  // 2. Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthChecked(true);
      setAuthError('');
    });
    return () => unsubscribe();
  }, []);

  // 3. Cargar Datos de Usuario (Perfil, Sesión, Bitácora)
  useEffect(() => {
    if (!user) {
      setJournalEntries([]);
      setMessages([
        {
          role: 'system',
          content: 'Hola. Soy tu acompañante en ConectApp...',
        },
      ]);
      setActiveSessionId(null);
      setShowResumePrompt(false);
      return;
    }

    // Cargar perfil
    const profileRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'profile'
    );
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfileData((prev) => ({ ...prev, ...data }));
        setCaregiverFirstName((prev) => prev || data.caregiverFirstName || '');
        setCaregiverLastName((prev) => prev || data.caregiverLastName || '');
        setNeuroName(
          (prev) => prev || data.neuroName || data.patientName || ''
        );
      }
    });

    // Gestión de Sesión (Recupera ID de sesión anterior)
    const sessionRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'session'
    );
    const ensureSession = async () => {
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) {
        const newSessionId = `session-${Date.now()}`;
        await setDoc(
          sessionRef,
          {
            activeSessionId: newSessionId,
            lastInteractionAt: serverTimestamp(),
          },
          { merge: true }
        );
        setActiveSessionId(newSessionId);
      }
    };
    ensureSession();

    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.activeSessionId) setActiveSessionId(data.activeSessionId);

        // Lógica de inactividad > 12 horas
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
    const journalRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'journal'
    );
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

  // 4. Cargar Chat (Últimos 100 mensajes de la sesión activa)
  useEffect(() => {
    if (!user || !activeSessionId) return;
    
    const messagesRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'conversations'
    );
    
    // Consulta: Dame los 100 más recientes
    const q = query(
      messagesRef,
      where('sessionId', '==', activeSessionId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubMsg = onSnapshot(q, (snap) => {
      const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      if (loaded.length === 0) {
        setMessages([
          {
            role: 'system',
            content: 'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte.',
          },
        ]);
        return;
      }
      
      // Invertimos para mostrar cronológicamente (antiguo arriba, nuevo abajo)
      const sorted = loaded
        .map((m) => ({
          ...m,
          timestamp:
            m.timestamp ||
            (m.createdAt?.seconds ? m.createdAt.seconds * 1000 : Date.now()),
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
    if (!validateForm()) return;
    setAuthLoading(true);
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        loginEmail.trim(),
        loginPassword
      );
      await upsertUserProfile(result.user);
    } catch (err) {
      setAuthError('Credenciales incorrectas o usuario no encontrado.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAuthLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        registerEmail.trim(),
        registerPassword
      );
      await setDoc(
        doc(db, 'artifacts', appId, 'users', cred.user.uid, 'data', 'profile'),
        {
          caregiverFirstName,
          caregiverLastName,
          neuroName,
          email: registerEmail.trim(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      setAuthMode('login');
      setLoginEmail(registerEmail.trim());
      setLoginPassword('');
    } catch (err) {
      setAuthError('Error al crear cuenta (el correo podría estar en uso).');
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
      console.log("Popup failed, trying redirect...");
      if (
        err.code === 'auth/popup-blocked' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/popup-closed-by-user'
      ) {
        // Fallback robusto para Vercel/Mobile
        await signInWithRedirect(auth, googleProvider);
      } else {
        setAuthError('Error con Google Login. Verifica configuración.');
        setAuthLoading(false); // Only turn off if not redirecting
      }
    }
  };

  const handlePasswordReset = async () => {
    setAuthError('');
    if (!loginEmail.trim()) {
      setAuthError(
        'Escribe tu correo en el campo de arriba para enviarte el enlace.'
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginEmail.trim());
      setAuthError(
        '¡Listo! Revisa tu correo (y spam) para restablecer la contraseña.'
      );
    } catch (err) {
      console.error(err);
      setAuthError(
        'No pudimos enviar el correo. Verifica que esté bien escrito.'
      );
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
      await setDoc(
        doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'profile'),
        {
          ...profileData,
          caregiverFirstName,
          caregiverLastName,
          neuroName,
        },
        { merge: true }
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveMilestoneFromMessage = async (msg) => {
    if (!user || !activeSessionId) return;

    const recentHistory = messages.slice(-8);
    const summaryText = recentHistory
      .map(
        (m) => `${m.role === 'user' ? 'Familia' : 'ConectApp'}: ${m.content}`
      )
      .join('\n\n');

    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'users', user.uid, 'journal'),
        {
          title: 'Hito de Conversación',
          content: summaryText,
          fullContent: summaryText,
          userNotes: '',
          createdAt: serverTimestamp(),
          type: 'milestone',
          sessionId: activeSessionId,
        }
      );
      // Feedback visual simple
      const btn = document.getElementById('btn-save-' + msg.timestamp);
      if (btn) btn.innerText = 'Guardado!';
    } catch (error) {
      console.error('Error guardando hito:', error);
    }
  };

  const checkSafety = (text) => {
    const dangerKeywords = [
      'suicidio',
      'matarme',
      'morir',
      'emergencia',
      '133',
      '911',
    ];
    return dangerKeywords.some((k) => text.toLowerCase().includes(k));
  };

  const updateLastInteraction = async () => {
    if (!user) return;
    await setDoc(
      doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session'),
      {
        lastInteractionAt: serverTimestamp(),
        activeSessionId: activeSessionId || `session-${Date.now()}`,
      },
      { merge: true }
    );
  };

  const startNewConversation = async () => {
    if (!user) return;
    const newId = `session-${Date.now()}`;
    await setDoc(
      doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'session'),
      {
        activeSessionId: newId,
        lastInteractionAt: serverTimestamp(),
      },
      { merge: true }
    );
    setActiveSessionId(newId);
    setMessages([
      {
        role: 'system',
        content: 'Hola. Empecemos de nuevo. ¿En qué puedo ayudarte?',
      },
    ]);
    setShowResumePrompt(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    if (!activeSessionId) await startNewConversation();

    const now = Date.now();

    const lastMsg = messages.filter((m) => m.role !== 'system').slice(-1)[0];
    let hoursSince = null;
    if (lastMsg && lastMsg.timestamp) {
      hoursSince = (now - lastMsg.timestamp) / (1000 * 60 * 60);
    }

    if (checkSafety(inputMessage)) {
      setShowSafetyAlert(true);
      return;
    }

    const newMsg = { role: 'user', content: inputMessage, timestamp: now };
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);
    setShowResumePrompt(false);

    const msgsRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'conversations'
    );
    await addDoc(msgsRef, {
      ...newMsg,
      createdAt: serverTimestamp(),
      sessionId: activeSessionId,
    });
    await updateLastInteraction();

    try {
      const prompt = buildGeminiPrompt(
        newMsg.content,
        { ...profileData, caregiverFirstName, caregiverLastName, neuroName },
        messages,
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
      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Estoy aquí contigo.';

      const aiMsg = {
        role: 'assistant',
        content: aiText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      await addDoc(msgsRef, {
        ...aiMsg,
        createdAt: serverTimestamp(),
        sessionId: activeSessionId,
      });
      await updateLastInteraction();
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Tuve un problema de conexión, pero te leo.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* --- RENDER --- */
  if (!authChecked)
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-600 font-medium">
        Cargando ConectApp...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-100/50 w-full max-w-md border border-white animate-fade-in">
          <div className="text-center mb-8">
            <Logo className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ConectApp</h1>
            <p className="text-blue-600 mt-1 font-medium">Acompañamiento para familias neurodivergentes</p>
          </div>
          
          <div className="flex gap-2 mb-6 bg-gray-100/50 p-1 rounded-xl">
            <button
              onClick={() => { setAuthMode('login'); setFormErrors({}); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                authMode === 'login'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ingresar
            </button>
            <button
              onClick={() => { setAuthMode('register'); setFormErrors({}); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                authMode === 'register'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Registrar
            </button>
          </div>

          {authError && (
            <div className="text-red-600 text-xs mb-4 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {authError}
            </div>
          )}

          <div className="animate-fade-in">
            {authMode === 'login' ? (
              <form onSubmit={handleEmailLogin} className="space-y-1">
                <Input
                  label="Correo electrónico"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  error={formErrors.loginEmail}
                />
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  error={formErrors.loginPassword}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  }
                />
                
                <div className="flex justify-end mb-6">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button type="submit" disabled={authLoading} className="w-full py-3 mb-4">
                  {authLoading ? 'Ingresando...' : 'Entrar'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-1">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Tu Nombre"
                    placeholder="Ej. Ana"
                    value={caregiverFirstName}
                    onChange={(e) => setCaregiverFirstName(e.target.value)}
                    error={formErrors.caregiverFirstName}
                  />
                  <Input
                    label="Nombre Peque"
                    placeholder="Ej. Leo"
                    value={neuroName}
                    onChange={(e) => setNeuroName(e.target.value)}
                    error={formErrors.neuroName}
                  />
                </div>
                <Input
                  label="Correo"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  error={formErrors.registerEmail}
                />
                <Input
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  error={formErrors.registerPassword}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                    </button>
                  }
                />
                <Input
                  label="Confirmar"
                  type="password"
                  placeholder="********"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  error={formErrors.registerPasswordConfirm}
                />

                <Button type="submit" disabled={authLoading} className="w-full py-3 mt-4">
                  {authLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            )}
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full bg-white border border-gray-200 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors text-slate-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <span className="text-gray-400">Conectando...</span>
              ) : (
                <>
                  <img src="https://developers.google.com/identity/images/g-logo.png" className="w-5 h-5" alt="G" />
                  Continuar con Google
                </>
              )}
            </button>
          </div>

          <p className="mt-6 text-[10px] text-center text-gray-400 leading-tight">
            Accediendo a la aplicación implica la aceptación de nuestros{' '}
            <a href="#" className="underline hover:text-blue-600">
              Términos y Condiciones de Servicio
            </a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Alerta Seguridad */}
      {showSafetyAlert && (
        <div className="fixed inset-0 z-[100] bg-red-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl text-center max-w-sm shadow-2xl">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-700 mb-2">
              Alerta de Seguridad
            </h2>
            <p className="mb-6 text-gray-600">
              Detectamos una situación de riesgo. Por favor, pide ayuda profesional.
            </p>
            <a
              href="tel:133"
              className="block w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl mb-3 font-bold transition-colors"
            >
              Llamar Emergencias
            </a>
            <button
              onClick={() => setShowSafetyAlert(false)}
              className="text-gray-400 text-sm underline hover:text-gray-600"
            >
              Estoy bien, fue un error
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200/60 h-screen sticky top-0 shadow-sm z-20">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <Logo className="w-9 h-9" />
          <span className="font-bold text-xl tracking-tight text-slate-800">ConectApp</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
              activeTab === 'chat'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-5 h-5" /> Chat
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5" /> Perfil
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
              activeTab === 'evolution'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-5 h-5" /> Bitácora
          </button>
        </nav>
        <div className="p-4 border-t border-gray-50">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </Button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg text-slate-800">ConectApp</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-20 pt-24 px-6 md:hidden flex flex-col gap-4 animate-fade-in">
          <button
            onClick={() => {
              setActiveTab('chat');
              setMobileMenuOpen(false);
            }}
            className="text-lg font-medium p-4 bg-gray-50 rounded-2xl flex items-center gap-4 active:scale-95 transition-transform"
          >
            <MessageSquare className="text-blue-600" /> Chat
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
            className="text-lg font-medium p-4 bg-gray-50 rounded-2xl flex items-center gap-4 active:scale-95 transition-transform"
          >
            <User className="text-blue-600" /> Perfil
          </button>
          <button
            onClick={() => {
              setActiveTab('evolution');
              setMobileMenuOpen(false);
            }}
            className="text-lg font-medium p-4 bg-gray-50 rounded-2xl flex items-center gap-4 active:scale-95 transition-transform"
          >
            <BookOpen className="text-blue-600" /> Bitácora
          </button>
          <Button
            onClick={handleLogout}
            variant="danger"
            className="mt-auto mb-8 py-4 text-lg"
          >
            Cerrar Sesión
          </Button>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative h-[calc(100vh-64px)] md:h-screen bg-slate-50/50">
        
        {/* VISTA PERFIL */}
        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Perfil Familiar</h2>
                <Button onClick={saveProfile} disabled={isSavingProfile}>
                  <Save className="w-4 h-4" />{' '}
                  {isSavingProfile ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>

              <Card title="Datos Básicos" icon={User}>
                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Tu Nombre"
                    value={caregiverFirstName}
                    onChange={(e) => setCaregiverFirstName(e.target.value)}
                  />
                  <Input
                    label="Tu Apellido"
                    value={caregiverLastName}
                    onChange={(e) => setCaregiverLastName(e.target.value)}
                  />
                  <Input
                    label="Nombre del Peque"
                    value={neuroName}
                    onChange={(e) => setNeuroName(e.target.value)}
                  />
                  <Input
                    label="Edad"
                    value={profileData.age}
                    onChange={(e) =>
                      setProfileData({ ...profileData, age: e.target.value })
                    }
                  />
                </div>
              </Card>
              <Card title="Detalles Neurodivergentes" icon={BrainCircuit}>
                <Input
                  textarea
                  label="Intereses Especiales (Pasiones)"
                  value={profileData.specialInterests}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      specialInterests: e.target.value,
                    })
                  }
                  placeholder="¿Qué le hace brillar los ojos?"
                />
                <Input
                  textarea
                  label="Estrategias de Calma"
                  value={profileData.calmingStrategies}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      calmingStrategies: e.target.value,
                    })
                  }
                  placeholder="¿Qué le ayuda a regularse?"
                />
                <Input
                  textarea
                  label="Sensibilidades Sensoriales"
                  value={profileData.sensorySensitivities}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      sensorySensitivities: e.target.value,
                    })
                  }
                  placeholder="Ruidos, texturas, luces..."
                />
              </Card>
            </div>
          </div>
        )}

        {/* VISTA BITÁCORA */}
        {activeTab === 'evolution' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-800">
                  <BookOpen className="text-blue-600 w-7 h-7" /> Bitácora
                </h2>
                <p className="text-gray-500 text-sm">
                  Registro de hitos importantes y notas privadas.
                </p>
              </div>
              
              {journalEntries.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-3xl bg-white">
                  <p className="text-gray-400 font-medium">No hay registros aún.</p>
                  <p className="text-sm text-gray-400 mt-1">Guarda hitos importantes directamente desde el chat.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {journalEntries.map((entry) => (
                    <JournalEntryItem
                      key={entry.id}
                      entry={entry}
                      userId={user.uid}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA CHAT */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-slate-50">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              {showResumePrompt && (
                <div className="bg-white border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-50 animate-fade-in mx-auto max-w-2xl">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">
                      Hola de nuevo
                    </h4>
                    <p className="text-sm text-slate-500">
                      Ha pasado un tiempo. ¿Quieres seguir con lo anterior?
                    </p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button
                      variant="secondary"
                      onClick={() => setShowResumePrompt(false)}
                      className="flex-1 md:flex-none justify-center"
                    >
                      Continuar
                    </Button>
                    <Button
                      onClick={startNewConversation}
                      className="flex-1 md:flex-none justify-center"
                    >
                      Nueva
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap justify-center mb-6">
                {QUICK_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTopic(t.label);
                      setInputMessage(t.suggestion);
                    }}
                    className="text-xs px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all shadow-sm font-medium text-gray-600"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  } animate-slide-up`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center mr-3 shrink-0 shadow-sm overflow-hidden p-1.5">
                      <Logo className="w-full h-full" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl shadow-sm text-sm md:text-[15px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 rounded-bl-sm text-gray-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-gray-100/50 flex justify-end">
                        <button
                          id={'btn-save-' + msg.timestamp}
                          onClick={() => handleSaveMilestoneFromMessage(msg)}
                          className="text-xs flex items-center gap-1.5 text-blue-500 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-all"
                        >
                          <Save className="w-3.5 h-3.5" /> Guardar hito
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="ml-14 flex gap-1.5 p-2">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100" />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200" />
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-gray-100/50 relative z-20">
              <form
                onSubmit={handleSendMessage}
                className="flex gap-3 relative max-w-4xl mx-auto items-end"
              >
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Cuéntame, ¿cómo estás hoy?..."
                  className="flex-1 bg-gray-100/50 border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 outline-none resize-none max-h-40 min-h-[60px] shadow-inner transition-all text-base"
                  rows="1"
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="rounded-2xl w-14 h-[60px] flex items-center justify-center p-0 shrink-0 shadow-md hover:shadow-lg shadow-blue-500/30"
                >
                  <Send className="w-6 h-6 ml-0.5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        <WhatsAppButton hideSnippet={inputMessage.length > 0} />
      </main>
    </div>
  );
}
