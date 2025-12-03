import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
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
  Hand,
  Star,
  AlertTriangle,
  BrainCircuit,
  Edit3,
  Check,
  Phone,
} from 'lucide-react';

/* --- CONFIGURACIÓN FIREBASE --- */
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = import.meta.env.VITE_APP_ID || 'default-app-id';

/* --- COMPONENTES UI --- */

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const baseStyle =
    'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95';
  const variants = {
    primary:
      'bg-blue-700 text-white hover:bg-blue-800 shadow-md shadow-blue-200',
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
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
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
      src="img/logo.png"
      alt="ConectApp Logo"
      className="w-full h-full object-contain"
      onError={(e) => {
        const target = e.target;
        target.onerror = null;
        target.style.display = 'none';
        const parent = target.parentElement;
        parent.classList.add('bg-blue-100', 'rounded-full', 'text-blue-600');
        parent.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>';
      }}
    />
  </div>
);

const WhatsAppButton = () => (
  <a
    href="https://wa.me/1234567890"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-32 right-6 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-lg z-50 transition-transform hover:scale-110 flex items-center justify-center"
    title="Soporte Humano"
  >
    <Hand className="w-6 h-6 fill-current" />
  </a>
);

const JournalEntryItem = ({ entry, userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userNoteDraft, setUserNoteDraft] = useState('');

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
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
              <BrainCircuit className="w-4 h-4" />
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
        <p className="text-gray-600 text-sm leading-relaxed">{entry.content}</p>
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

/* --- VISTA PRINCIPAL --- */

export default function ConectApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);

  const [profileData, setProfileData] = useState({
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
        'Hola. Soy tu acompañante en ConectApp. Estoy aquí para escucharte, entenderte y buscar juntos las mejores estrategias para tu familia. ¿Cómo te sientes hoy?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [journalEntries, setJournalEntries] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error('Error en login anónimo:', err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(
      db,
      'artifacts',
      appId,
      'users',
      user.uid,
      'data',
      'profile',
    );
    const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfileData((prev) => ({ ...prev, ...docSnap.data() }));
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
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const handleLogout = async () => {
    await signOut(auth);
    setMessages([
      {
        role: 'system',
        content:
          'Hola. Soy tu acompañante en ConectApp. ¿Cómo te sientes hoy?',
      },
    ]);
    setProfileData({
      patientName: '',
      age: '',
      diagnosisLevel: 'Necesito orientación inicial',
      communicationStyle: '',
      sensorySensitivities: '',
      specialInterests: '',
      triggers: '',
      calmingStrategies: '',
    });
  };

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
      await setDoc(docRef, profileData, { merge: true });
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

  const saveJournalEntry = async (content) => {
    if (!user) return;
    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'users', user.uid, 'journal'),
        {
          title: 'Registro de Conversación',
          content:
            content.substring(0, 300) + (content.length > 300 ? '...' : ''),
          fullContent: content,
          userNotes: '',
          createdAt: serverTimestamp(),
          type: 'auto-generated',
        },
      );
      console.log('Entrada guardada automáticamente');
    } catch (error) {
      console.error('Error saving journal:', error);
    }
  };

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (checkSafety(inputMessage)) {
      setMessages((prev) => [...prev, { role: 'user', content: inputMessage }]);
      setInputMessage('');
      setShowSafetyAlert(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content:
            '⚠️ He detectado una situación de riesgo. Por favor, prioriza la seguridad física inmediata.',
        },
      ]);
      return;
    }

    const newMsg = { role: 'user', content: inputMessage };
    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const contextPrompt = `
        Eres "ConectApp", un coach y acompañante especializado en familias neurodivergentes.
        Tu tono es: Cálido, empático, contenedor emocionalmente.
        
        INSTRUCCIONES CLAVE:
        1. Valida las emociones primero.
        2. Usa la info del perfil (${profileData.patientName || 'el paciente'}).
        3. Da respuestas estructuradas y útiles.
        
        CONTEXTO DEL PERFIL:
        - Nombre: ${profileData.patientName}
        - Edad: ${profileData.age}
        - Calma: ${profileData.calmingStrategies}
        - Sensibilidades: ${profileData.sensorySensitivities}

        PREGUNTA DEL USUARIO: "${newMsg.content}"
      `;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Por ahora no tengo acceso a mi modelo externo, pero estoy aquí para acompañarte. Cuéntame un poco más.',
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
        'Estoy aquí contigo, ¿puedes repetirlo?';

      setMessages((prev) => [...prev, { role: 'assistant', content: aiText }]);

      if (aiText.length > 150) {
        saveJournalEntry(aiText);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, mi conexión falló momentáneamente.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600">
        Cargando ConectApp...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <div className="text-center mb-8 pt-4">
            <Logo className="w-24 h-24 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">ConectApp</h1>
            <p className="text-blue-600 font-medium mt-2">
              Tu compañero en la neurodivergencia
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-5 rounded-xl text-sm text-blue-800 border border-blue-100">
              <p className="font-semibold mb-2">
                Bienvenida familia neurodivergente.
              </p>
              Este es un espacio seguro de contención, aprendizaje y apoyo
              personalizado.
            </div>

            <p className="text-center text-sm text-gray-500">
              Estamos inicializando tu sesión...
            </p>
          </div>
        </Card>
      </div>
    );
  }

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
              Hemos detectado una situación de riesgo. Por favor, usa ayuda
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
          <span className="font-bold text-xl text-gray-800 tracking-tight">
            ConectApp
          </span>
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
            {!profileData.patientName && (
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
            "Estamos construyendo comunidad."
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
          <span className="font-bold text-lg text-gray-800">ConectApp</span>
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
                  <p className="text-gray-500">
                    Ayúdame a conocer a quien cuidamos para ser un mejor apoyo.
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
                    útiles serán las estrategias que te proponga el coach.
                  </p>
                </div>
              </div>

              <Card title="Datos Básicos" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nombre de tu ser querido"
                    placeholder="Ej. Mateo"
                    value={profileData.patientName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        patientName: e.target.value,
                      })
                    }
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
                  label="Intereses Profundos (Sus pasiones)"
                  placeholder="¿Qué le hace brillar los ojos? (Ej. Dinosaurios, trenes, el espacio...)"
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
                  placeholder="Ej. Presión fuerte, música clásica, saltar, dibujar..."
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

              <Card title="Desafíos y Sensibilidad" icon={AlertTriangle}>
                <Input
                  label="Experiencias Sensoriales"
                  placeholder="¿Qué le molesta? (Ruidos, etiquetas, luces, texturas de comida...)"
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
                  label="Detonantes de Crisis"
                  placeholder="¿Qué suele causar desregulación? (Cambios de rutina, hambre, 'no', sueño...)"
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
                  label="Forma de Comunicarse"
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
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Bitácora de Evolución
                </h2>
              </div>
              <p className="text-gray-500 mb-8">
                Aquí guardamos los hitos importantes de tus conversaciones.
                Puedes agregar tus propias notas a cada registro.
              </p>

              {journalEntries.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-400">Aún no hay registros.</p>
                  <p className="text-sm text-gray-300 mt-2">
                    Cuando tengas conversaciones relevantes, la IA las
                    registrará aquí automáticamente.
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
            {!profileData.patientName && (
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

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 shrink-0 text-blue-600">
                      <Logo className="w-5 h-5" />
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

            <div className="p-4 bg-white border-t border-gray-100 md:m-4 md:rounded-2xl md:shadow-xl relative z-10">
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
                  className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none max-h-32 min-h-[50px] placeholder:text-gray-400 text-gray-700"
                  rows="1"
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="h-[50px] w-[50px] rounded-xl !px-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
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
