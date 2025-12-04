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
    {/* Coloca public/img/logo.png en tu proyecto */}
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

/* Botón flotante de WhatsApp + snippet */

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
      {/* Ícono clásico de WhatsApp en SVG */}
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
              <Hand className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm md:text-base">
              {entry.title || 'Registro Automático'}
            </h4>
          </div>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap">
            {entry.createdAt?.seconds
              ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString()
              : 'Hoy'}
          </span>
        </div>
        <div
          className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
            isExpanded ? 'max-h-[500px]' : 'max-h-12'
          } overflow-hidden`}
        >
          <p
            style={{
              display: isExpanded ? 'block' : '-webkit-box',
              WebkitLineClamp: isExpanded ? 'unset' : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {entry.fullContent || entry.content}
          </p>
        </div>
        {(entry.fullContent || '').length > 180 && (
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
  const lastExchanges = messages
    .slice(-8)
    .map((m) => `${m.role === 'user' ? 'FAMILIA' : 'CONECTAPP'}: ${m.content}`)
    .join('\n');

  const tiempoTexto =
    hoursSinceLastMsg == null
      ? 'No se sabe cuánto tiempo pasó.'
      : hoursSinceLastMsg < 2
      ? 'Pasó poco tiempo desde el último mensaje.'
      : `Pasaron aproximadamente ${Math.round(
          hoursSinceLastMsg,
        )} horas desde el último mensaje.`;

  const topicText = currentTopic
    ? `Tema actual declarado por la familia: "${currentTopic}".`
    : 'No hay un tema declarado, interpreta según el mensaje.';

  return `
Eres ConectApp, un acompañante digital para familias neurodivergentes.

ESTILO:
- Hablas en español neutro, sin marcar género (usa expresiones como "quien cuida", "la persona cuidadora", "tu peque", "la familia").
- Evita asumir si la persona es mamá, papá, hombre o mujer.
- Tono cercano, empático y claro, como un chat de WhatsApp, con una voz de coach que contiene emocionalmente y cuenta con el respaldo de profesionales.

DINÁMICA DE CONVERSACIÓN:
- Imagina que estás siguiendo una conversación continua.
- Responde de forma natural al mensaje actual, sin repetir siempre la misma estructura.
- Normalmente:
  - Primero valida la emoción en 1 frase breve.
  - Luego conversa: haz 1–2 preguntas sencillas o da hasta 3 ideas prácticas si ayudan.
- Puedes usar viñetas o numeración SOLO cuando tenga sentido (no siempre).
- No escribas más de 12 líneas en total.

NOCIÓN DE TIEMPO:
${tiempoTexto}
- Si pasaron MÁS de 12 horas y el mensaje parece retomar un tema (por ejemplo: "como te conté antes", "sigamos", etc.), empieza preguntando suavemente si la persona quiere:
  - seguir con la conversación anterior, o
  - hablar de algo nuevo.

${topicText}

CONTEXTO DE LA FAMILIA:
- Persona cuidadora: ${profileData.caregiverFirstName || 'quien cuida'} ${
    profileData.caregiverLastName || ''
  }
- Ser querido neurodivergente: ${
    profileData.neuroName || profileData.patientName || 'tu peque'
  }
- Edad aproximada: ${profileData.age || 'no indicada'}
- Sensibilidades: ${
    profileData.sensorySensitivities || 'aún no se han descrito'
  }
- Cosas que le calman: ${
    profileData.calmingStrategies || 'todavía no se han registrado'
  }

HISTORIAL RECIENTE:
${lastExchanges || 'Sin mensajes previos relevantes.'}

MENSAJE ACTUAL DE LA FAMILIA:
"${userMessage}"

RESPUESTA:
Responde siguiendo TODO lo anterior, de forma simple, empática y práctica.
`;
}

/* ----- COMPONENTE PRINCIPAL ----- */

export default function ConectApp() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
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

  const [messages, setMessages] = useState([
    {
      role: 'system',
      content:
        'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte, entenderte y buscar juntos estrategias simples para tu familia. ¿Cómo te sientes hoy?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [journalEntries, setJournalEntries] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const messagesEndRef = useRef(null);

  const upsertProfileFromAuth = async (userCred, extraData = {}) => {
    if (!userCred?.uid) return;
    const profileRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      userCred.uid,
      'data',
      'profile',
    );

    await setDoc(
      profileRef,
      {
        email: userCred.email || '',
        caregiverFirstName: userCred.displayName
          ? userCred.displayName.split(' ')[0]
          : '',
        ...extraData,
      },
      { merge: true },
    );
  };

  /* --- EFECTO: escuchar cambios de autenticación --- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
      setAuthChecked(true);
      setAuthError('');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          upsertProfileFromAuth(result.user);
        }
      })
      .catch((err) => {
        console.error('Error finalizando login con Google:', err);
      });
  }, []);

  /* --- EFECTO: cargar perfil y bitácora cuando hay usuario --- */
  useEffect(() => {
    if (!user) {
      setJournalEntries([]);
      setMessages([
        {
          role: 'system',
          content:
            'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte, entenderte y buscar juntos estrategias simples para tu familia. ¿Cómo te sientes hoy?',
        },
      ]);
      setActiveSessionId(null);
      setShowResumePrompt(false);
      return;
    }

    const profileRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'profile',
    );
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData((prev) => ({
          ...prev,
          ...data,
        }));

        setCaregiverFirstName(
          (prev) => prev || data.caregiverFirstName || '',
        );
        setCaregiverLastName((prev) => prev || data.caregiverLastName || '');
        setNeuroName(
          (prev) => prev || data.neuroName || data.patientName || '',
        );
      }
    });

    const sessionRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'session',
    );

    const ensureSession = async () => {
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) {
        const newSessionId = `session-${Date.now()}`;
        await setDoc(sessionRef, {
          activeSessionId: newSessionId,
          lastInteractionAt: serverTimestamp(),
        });
        setActiveSessionId(newSessionId);
      }
    };

    ensureSession();

    const unsubscribeSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.activeSessionId) {
          setActiveSessionId(data.activeSessionId);
        }
        if (data.lastInteractionAt?.seconds) {
          const lastDate = data.lastInteractionAt.seconds * 1000;
          const hoursDiff = (Date.now() - lastDate) / (1000 * 60 * 60);
          setShowResumePrompt(hoursDiff > 12);
        }
      }
    });

    const journalRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'journal',
    );
    const q = query(journalRef, orderBy('createdAt', 'desc'));
    const unsubscribeJournal = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setJournalEntries(entries);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeJournal();
      unsubscribeSession();
    };
  }, [user]);

  /* --- EFECTO: cargar conversación activa --- */
  useEffect(() => {
    if (!user || !activeSessionId) return undefined;

    const messagesRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'conversations',
    );

    const q = query(
      messagesRef,
      where('sessionId', '==', activeSessionId),
      orderBy('createdAt', 'desc'),
      limit(100),
    );

    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (loaded.length === 0) {
        setMessages([
          {
            role: 'system',
            content:
              'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte, entenderte y buscar juntos estrategias simples para tu familia. ¿Cómo te sientes hoy?',
          },
        ]);
        return;
      }

      const normalized = loaded
        .map((msg) => ({
          ...msg,
          timestamp:
            msg.timestamp ||
            (msg.createdAt?.seconds ? msg.createdAt.seconds * 1000 : Date.now()),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(normalized);
    });

    return () => unsubscribeMessages();
  }, [user, activeSessionId]);

  /* --- EFECTO: hacer scroll al final del chat --- */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  /* --- AUTENTICACIÓN --- */

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
    } catch (err) {
      console.error(err);
      setAuthError('Revisa tu correo y contraseña.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (
      !registerEmail ||
      !registerPassword ||
      !registerPasswordConfirm ||
      !caregiverFirstName ||
      !neuroName
    ) {
      setAuthError('Completa los datos principales antes de continuar.');
      return;
    }

    if (registerPassword !== registerPasswordConfirm) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }

    setAuthLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        registerEmail.trim(),
        registerPassword,
      );

      await upsertProfileFromAuth(cred.user, {
        caregiverFirstName,
        caregiverLastName,
        neuroName,
        patientName: neuroName,
        email: registerEmail.trim(),
        createdAt: serverTimestamp(),
      });

      setAuthMode('login');
      setLoginEmail(registerEmail.trim());
      setLoginPassword('');
      setAuthError('');
    } catch (err) {
      console.error(err);
      setAuthError('No pudimos crear tu cuenta. Intenta de nuevo.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await upsertProfileFromAuth(result.user);
    } catch (err) {
      console.error(err);
      if (err?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error('Redirect Google error:', redirectError);
        }
      }
      setAuthError(
        'No pudimos iniciar sesión con Google. Verifica el dominio autorizado o intenta nuevamente.',
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthError('');
    if (!loginEmail.trim()) {
      setAuthError(
        'Escribe tu correo arriba para poder enviarte el enlace de recuperación.',
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginEmail.trim());
      setAuthError(
        'Te enviamos un correo para recuperar tu contraseña. Revisa tu bandeja de entrada o spam.',
      );
    } catch (err) {
      console.error(err);
      setAuthError(
        'No pudimos enviar el correo de recuperación. Revisa el correo o intenta más tarde.',
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMessages([
      {
        role: 'system',
        content:
          'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte. ¿Cómo te sientes hoy?',
      },
    ]);
    setProfileData({
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
    setCurrentTopic('');
  };

  /* --- PERFIL --- */

  const saveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const docRef = doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'data',
        'profile',
      );
      await setDoc(
        docRef,
        {
          ...profileData,
          caregiverFirstName,
          caregiverLastName,
          neuroName,
          patientName: neuroName || profileData.patientName,
        },
        { merge: true },
      );
      const btn = document.getElementById('save-btn');
      if (btn) {
        const originalText = btn.innerText;
        btn.innerText = '¡Guardado!';
        setTimeout(() => {
          btn.innerText = originalText;
        }, 2000);
      }
      if (messages.length === 1) setActiveTab('chat');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveJournalEntry = async (
    content,
    title = 'Hito de conversación',
  ) => {
    if (!user || !activeSessionId) return;
    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'users', user.uid, 'journal'),
        {
          title,
          content,
          fullContent: content,
          userNotes: '',
          createdAt: serverTimestamp(),
          type: 'milestone',
          sessionId: activeSessionId,
        },
      );
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

  /* --- CHEQUEO DE SEGURIDAD --- */

  const checkSafety = (text) => {
    const dangerKeywords = [
      'suicidio',
      'matarme',
      'morir',
      'acabar con todo',
      'sangre',
      'herida profunda',
      'cortar',
      'emergencia',
      'urgencia',
      'ambulancia',
      'policia',
      'no puedo más',
      'descontrol total',
    ];
    const lowerText = text.toLowerCase();
    return dangerKeywords.some((keyword) => lowerText.includes(keyword));
  };

  const updateLastInteraction = async () => {
    if (!user) return;
    const sessionRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'session',
    );
    await setDoc(
      sessionRef,
      {
        lastInteractionAt: serverTimestamp(),
        activeSessionId: activeSessionId || `session-${Date.now()}`,
      },
      { merge: true },
    );
  };

  const startNewConversation = async () => {
    if (!user) return;
    const newSessionId = `session-${Date.now()}`;
    const sessionRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'session',
    );
    await setDoc(
      sessionRef,
      { activeSessionId: newSessionId, lastInteractionAt: serverTimestamp() },
      { merge: true },
    );
    setActiveSessionId(newSessionId);
    setShowResumePrompt(false);
    setMessages([
      {
        role: 'system',
        content:
          'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte, entenderte y buscar juntos estrategias simples para tu familia. ¿Cómo te sientes hoy?',
      },
    ]);
  };

  const conversationWindow = () =>
    messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20);

  const buildMilestoneSummary = () => {
    const recent = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8);
    if (recent.length === 0) return 'Sin mensajes recientes.';
    return recent
      .map(
        (m) =>
          `${m.role === 'user' ? 'Familia' : 'ConectApp'}: ${m.content.trim()}`,
      )
      .join('\n');
  };

  const handleSaveMilestoneFromMessage = (msg) => {
    const summary = buildMilestoneSummary();
    const milestoneText = `${summary}\n\nMensaje clave de ConectApp:\n${msg.content}`;
    saveJournalEntry(milestoneText, 'Hito de conversación');
  };

  /* --- ENVÍO DE MENSAJE / GEMINI --- */

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !user) return;

    if (!activeSessionId) {
      await startNewConversation();
    }

    const messagesRef = collection(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'conversations',
    );

    const now = Date.now();

    const lastMsgWithTime = [...conversationWindow()]
      .reverse()
      .find((m) => typeof m.timestamp === 'number');

    let hoursSinceLastMsg = null;
    if (lastMsgWithTime) {
      const diffMs = now - lastMsgWithTime.timestamp;
      hoursSinceLastMsg = diffMs / (1000 * 60 * 60);
    }

    if (checkSafety(inputMessage)) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: inputMessage, timestamp: now },
        {
          role: 'system',
          content:
            '⚠️ He detectado una situación de riesgo. Por favor, prioriza la seguridad física inmediata.',
          timestamp: now,
        },
      ]);
      setInputMessage('');
      setShowSafetyAlert(true);
      return;
    }

    const newMsg = { role: 'user', content: inputMessage, timestamp: now };
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      await addDoc(messagesRef, {
        role: 'user',
        content: inputMessage,
        createdAt: serverTimestamp(),
        timestamp: now,
        sessionId: activeSessionId,
      });
      await updateLastInteraction();
    } catch (error) {
      console.error('Error guardando mensaje del usuario:', error);
    }

    try {
      const contextPrompt = buildGeminiPrompt(
        newMsg.content,
        { ...profileData, caregiverFirstName, caregiverLastName, neuroName },
        conversationWindow(),
        hoursSinceLastMsg,
        currentTopic,
      );

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Por ahora no tengo acceso a mi modelo externo, pero estoy aquí para acompañarte. Cuéntame un poco más.',
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: contextPrompt }] }],
          }),
        },
      );

      const data = await response.json();
      const aiText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Estoy aquí contigo, ¿puedes contarme un poco más?';

      const assistantMsg = {
        role: 'assistant',
        content: aiText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      try {
        await addDoc(messagesRef, {
          role: 'assistant',
          content: aiText,
          createdAt: serverTimestamp(),
          timestamp: assistantMsg.timestamp,
          sessionId: activeSessionId,
        });
        await updateLastInteraction();
      } catch (error) {
        console.error('Error guardando mensaje de la IA:', error);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, mi conexión falló momentáneamente.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  /* --- RENDER: ESTADOS ESPECIALES --- */

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-blue-600">
        Cargando ConectApp...
      </div>
    );
  }

  /* --- PANTALLA DE LOGIN / REGISTRO --- */

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 transform transition-transform duration-300">
            <div className="flex flex-col items-center mb-6">
              <Logo className="w-16 h-16 mb-3" />
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                ConectApp
              </h1>
              <p className="text-sm text-blue-600 mt-1">
                Tu compañero en la neurodivergencia
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-xs md:text-sm text-blue-900 mb-4">
              <p className="font-semibold">
                Bienvenida familia neurodivergente.
              </p>
              <p className="mt-1">
                Crea una cuenta para guardar la evolución de tu ser querido en
                el tiempo.
              </p>
            </div>

            <div className="flex mb-4 rounded-xl bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                  authMode === 'login'
                    ? 'bg-white shadow-sm text-blue-700 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                  authMode === 'register'
                    ? 'bg-white shadow-sm text-blue-700 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {authError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {authError}
              </div>
            )}

            {authMode === 'login' ? (
              <form onSubmit={handleEmailLogin} className="space-y-3 mb-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="********"
                />

                <div className="flex justify-end mb-1">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full justify-center py-2.5"
                >
                  {authLoading ? 'Ingresando...' : 'Iniciar sesión'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Nombre"
                    value={caregiverFirstName}
                    onChange={(e) => setCaregiverFirstName(e.target.value)}
                    placeholder="Tu nombre"
                  />
                  <Input
                    label="Apellido"
                    value={caregiverLastName}
                    onChange={(e) => setCaregiverLastName(e.target.value)}
                    placeholder="Tu apellido"
                  />
                </div>
                <Input
                  label="Nombre de tu ser querido neurodivergente"
                  value={neuroName}
                  onChange={(e) => setNeuroName(e.target.value)}
                  placeholder="Ej. Mateo"
                />
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                />
                <Input
                  label="Contraseña"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="********"
                />
                <Input
                  label="Repite la contraseña"
                  type="password"
                  value={registerPasswordConfirm}
                  onChange={(e) =>
                    setRegisterPasswordConfirm(e.target.value)
                  }
                  placeholder="********"
                />

                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full justify-center py-2.5 mt-1"
                >
                  {authLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </Button>
              </form>
            )}

            {/* Botón estándar de Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors mt-1"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt=""
                className="w-4 h-4"
              />
              <span>
                {authLoading
                  ? 'Conectando con Google...'
                  : 'Continuar con Google'}
              </span>
            </button>

            <p className="mt-4 text-[10px] text-slate-400 text-center leading-relaxed">
              Al continuar aceptas nuestros{' '}
              <span className="underline">términos de servicio</span> y{' '}
              <span className="underline">política de privacidad</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* --- VISTA PRINCIPAL --- */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {showSafetyAlert && (
        <div className="fixed inset-0 z-[100] bg-red-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">
              Protocolo de Seguridad Activado
            </h2>
            <p className="text-gray-700 mb-6">
              Hemos detectado una situación de riesgo. Por favor, pide ayuda
              inmediata.
            </p>
            <div className="space-y-3">
              <a
                href="tel:133"
                className="block w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" /> Llamar a Emergencias (133/911)
              </a>
              <Button
                onClick={() => setShowSafetyAlert(false)}
                variant="secondary"
                className="w-full justify-center"
              >
                Fue un error, estoy bien
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 shadow-lg z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <div>
            <span className="font-bold text-xl text-gray-800 tracking-tight block">
              ConectApp
            </span>
            {profileData.caregiverFirstName && (
              <span className="text-xs text-gray-500">
                {profileData.caregiverFirstName} {profileData.caregiverLastName}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" /> Chat Acompañante
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" /> Perfil Familiar
            {!profileData.neuroName && (
              <span className="w-2 h-2 bg-amber-400 rounded-full ml-auto animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'evolution'
                ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-5 h-5" /> Bitácora / Evolución
          </button>
        </nav>

        <div className="p-4 bg-gray-50 m-4 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            “Estamos construyendo comunidad.”
          </p>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-500 hover:text-red-500 px-0"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </Button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <div>
            <span className="font-bold text-lg text-gray-800 block">
              ConectApp
            </span>
            {profileData.caregiverFirstName && (
              <span className="text-[11px] text-gray-500">
                {profileData.caregiverFirstName} {profileData.caregiverLastName}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-600 p-2"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-10 pt-24 px-6 md:hidden flex flex-col gap-4">
          <button
            onClick={() => {
              setActiveTab('chat');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 text-lg font-medium text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <MessageSquare className="w-6 h-6 text-blue-600" /> Chat
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 text-lg font-medium text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <User className="w-6 h-6 text-blue-600" /> Perfil
          </button>
          <button
            onClick={() => {
              setActiveTab('evolution');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 text-lg font-medium text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <BookOpen className="w-6 h-6 text-blue-600" /> Bitácora
          </button>
          <Button
            onClick={handleLogout}
            variant="danger"
            className="mt-auto mb-8 py-4"
          >
            Cerrar Sesión
          </Button>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-hidden relative h-[calc(100vh-64px)] md:h-screen bg-gray-50">
        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Perfil Familiar
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Ayúdame a conocer a quien cuidamos para ser un mejor apoyo.
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    Usuario:{' '}
                    <span className="font-medium text-gray-600">
                      {caregiverFirstName} {caregiverLastName}
                    </span>
                    {neuroName && (
                      <>
                        {' · '}Ser querido:{' '}
                        <span className="font-medium text-blue-600">
                          {neuroName}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    id="save-btn"
                    onClick={saveProfile}
                    disabled={isSavingProfile}
                  >
                    <Save className="w-4 h-4" />{' '}
                    {isSavingProfile ? 'Guardando...' : 'Guardar Datos'}
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900 text-sm">
                    Mejora tus resultados
                  </h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Cuanta más información completes aquí, más personalizadas y
                    simples serán las estrategias que te proponga el coach.
                  </p>
                </div>
              </div>

              <Card title="Datos Básicos" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Tu nombre"
                    placeholder="Ej. Francisca"
                    value={caregiverFirstName}
                    onChange={(e) => setCaregiverFirstName(e.target.value)}
                  />
                  <Input
                    label="Tu apellido"
                    placeholder="Ej. Pérez"
                    value={caregiverLastName}
                    onChange={(e) => setCaregiverLastName(e.target.value)}
                  />
                  <Input
                    label="Nombre de tu ser querido"
                    placeholder="Ej. Mateo"
                    value={neuroName}
                    onChange={(e) => setNeuroName(e.target.value)}
                  />
                  <Input
                    label="Edad"
                    placeholder="Ej. 8 años"
                    value={profileData.age}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        age: e.target.value,
                      })
                    }
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ¿Cómo describirías su situación actual?
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={profileData.diagnosisLevel}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          diagnosisLevel: e.target.value,
                        })
                      }
                    >
                      <option>
                        Necesito orientación inicial (Sin diagnóstico claro)
                      </option>
                      <option>
                        Diagnóstico reciente (Aprendiendo juntos)
                      </option>
                      <option>Requiere apoyo constante en el día a día</option>
                      <option>
                        Es bastante autónomo, buscamos estrategias sociales
                      </option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card title="Su Mundo Interior" icon={BrainCircuit}>
                <p className="text-sm text-gray-500 mb-4 italic">
                  Estos detalles permiten que el coach conecte emocionalmente.
                </p>
                <Input
                  label="Intereses profundos (sus pasiones)"
                  placeholder="¿Qué le hace brillar los ojos? (Ej. dinosaurios, trenes, el espacio...)"
                  textarea
                  value={profileData.specialInterests}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      specialInterests: e.target.value,
                    })
                  }
                />
                <Input
                  label="¿Qué cosas le calman o le hacen feliz?"
                  placeholder="Ej. presión fuerte, música suave, saltar, dibujar..."
                  textarea
                  value={profileData.calmingStrategies}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      calmingStrategies: e.target.value,
                    })
                  }
                />
              </Card>

              <Card title="Desafíos y sensibilidad" icon={AlertTriangle}>
                <Input
                  label="Experiencias sensoriales"
                  placeholder="¿Qué le molesta? (ruidos, etiquetas, luces, texturas de comida...)"
                  textarea
                  value={profileData.sensorySensitivities}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      sensorySensitivities: e.target.value,
                    })
                  }
                />
                <Input
                  label="Detonantes de crisis"
                  placeholder="¿Qué suele causar desregulación? (cambios de rutina, hambre, 'no', sueño...)"
                  textarea
                  value={profileData.triggers}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      triggers: e.target.value,
                    })
                  }
                />
                <Input
                  label="Forma de comunicarse"
                  placeholder="¿Verbal, gestual, pictogramas, ecolalia?"
                  value={profileData.communicationStyle}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      communicationStyle: e.target.value,
                    })
                  }
                />
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="h-full overflow-y-auto p-4 md:p-10 pb-32">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">
                    Bitácora de Evolución
                  </h2>
                </div>
              </div>
              <p className="text-gray-500 mb-8 text-sm">
                Aquí guardas los hitos importantes de tus conversaciones y los
                resúmenes que decidas marcar manualmente.
              </p>

              {journalEntries.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-400">Aún no hay registros.</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Usa el botón de “Guardar en bitácora” desde tus
                    conversaciones con ConectApp para dejar tus hitos.
                  </p>
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

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-white md:bg-gray-50">
            {!neuroName && (
              <div className="bg-amber-50 border-b border-amber-100 p-3 text-center text-sm text-amber-800 flex items-center justify-center gap-2">
                <span>
                  🌱 Para poder acompañarte mejor, cuéntame sobre tu familia.
                </span>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="underline font-bold hover:text-amber-900"
                >
                  Ir al Perfil
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {showResumePrompt && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm animate-pulse">
                  <div>
                    <p className="font-semibold text-blue-800 text-sm md:text-base">
                      Retomemos la conversación
                    </p>
                    <p className="text-xs md:text-sm text-blue-700">
                      Pasó tiempo desde el último intercambio. ¿Quieres seguir donde lo dejaste o empezar un nuevo hilo?
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      onClick={() => setShowResumePrompt(false)}
                      className="text-blue-700 border-blue-200 hover:bg-blue-100"
                    >
                      Continuar conversación
                    </Button>
                    <Button onClick={startNewConversation} className="bg-blue-600 text-white hover:bg-blue-700">
                      Nueva conversación
                    </Button>
                  </div>
                </div>
              )}

              {/* Chips de temas rápidos */}
              <div className="mb-2">
                <div className="flex flex-wrap gap-2">
                  {QUICK_TOPICS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setCurrentTopic(t.label);
                        if (!inputMessage) {
                          setInputMessage(t.suggestion);
                        }
                      }}
                      className={`text-xs px-3 py-1 rounded-full border ${
                        currentTopic === t.label
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {currentTopic && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Hablando sobre:{' '}
                    <span className="font-medium text-gray-600">
                      {currentTopic}
                    </span>
                  </p>
                )}
              </div>

              {/* Mensajes */}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 shrink-0 text-blue-600 overflow-hidden">
                      <Logo className="w-7 h-7" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 shadow-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                    }`}
                  >
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex flex-col items-start ml-2 mt-1">
                      <button
                        onClick={() => handleSaveMilestoneFromMessage(msg)}
                        className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-full px-3 py-1 flex items-center gap-1 transition-all duration-200 shadow-sm"
                      >
                        <Save className="w-3 h-3" />
                        Guardar en bitácora
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start ml-10">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 rounded-bl-none flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="p-3 md:p-4 bg-white border-t border-gray-100 md:m-4 md:rounded-2xl md:shadow-xl relative z-10">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Cuéntame, ¿qué está pasando?..."
                  className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none max-h-32 min-h-[50px] placeholder:text-gray-400 text-gray-700 text-sm md:text-base"
                  rows="1"
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="h-[48px] w-[48px] md:h-[50px] md:w-[50px] rounded-xl !px-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </Button>
              </form>
            </div>
          </div>
        )}

        <WhatsAppButton />
      </main>
    </div>
  );
}