import React, { useState, useEffect, useMemo, useRef } from 'react';

import { initializeApp } from 'firebase/app';

import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, writeBatch, query, where, getDocs, deleteDoc } from 'firebase/firestore';



// ==========================================

// 1. CONFIGURACIÓN E INICIALIZACIÓN

const firebaseConfig = {
  apiKey: "AIzaSyBvMEE3mfEFSFwhnFZwjdM_gtWnedH6KoM",
  authDomain: "metodo-pf.firebaseapp.com",
  projectId: "metodo-pf",
  storageBucket: "metodo-pf.firebasestorage.app",
  messagingSenderId: "1044522703006",
  appId: "1:1044522703006:web:55939a76f3f73d38e7838f"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';



// --- PALETA DE COLORES ---

const BRAND = {

  primary: '#C0857D',       

  primaryHover: '#A87069', 

  secondary: '#9CAD95',     

  secondaryHover: '#8A9B84',

  bgMain: '#FDFBF8',        

  bgCard: '#FFFFFF',        

  textMain: '#5C4B45',      

  textLight: '#988883',     

  accentLight: '#F2E6E4',   

  border: '#E8E4E1',        

  ui: {

    yes: '#9CAD95',        

    no: '#C0857D',          

    emptyDay: '#F5F5F4'

  }

};



// ==========================================

// 2. HELPERS Y DATOS

// ==========================================



const DIFFICULTY_DATA = {

  Corporal: { label: '🔹 Corporal', options: ['Cansancio', 'Dolor', 'Embarazo', 'Enfermedad', 'Otro ¿Cuál?'] },

  Emocional: { label: '🔹 Emocional', options: ['Ansiedad', 'Irritabilidad', 'Miedo', 'Tristeza', 'Otro ¿Cuál?'] },

  Cognitiva: { label: '🔹 Cognitiva', options: ['Anticipación negativa', 'Autoexigencia y perfeccionismo', 'Comparación', 'Confusión / Saturación mental', 'Creencias de incapacidad', 'Describe brevemente cual fue el pensamiento', 'Desconexión del sentido', 'Desvalorización / Autoinvalidación'] },

  Contextual: { label: '🔹 Contextual', options: ['Falta de tiempo', 'Familia', 'Interrupciones', 'Trabajo', 'Otro ¿Cuál?'] },

  Relacional: { label: '🔹 Relacional', options: ['Demandas de otros', 'Demandas externas', 'Discusión', 'Falta de apoyo', 'Otro ¿Cuál?'] }

};



const createWeeksData = (objectives = {}) => {

  let mainAction = "tu objetivo";

  const allObjs = Object.values(objectives).flat();

  if (allObjs.length > 0 && allObjs[0]?.text?.trim() !== "") {

      mainAction = allObjs[0].text;

  }

  return Array.from({ length: 12 }, (_, i) => {

    const weekNum = i + 1;

    let phase = "Práctica";

    if (weekNum <= 2) phase = "Exploración";

    else if (weekNum <= 6) phase = "Consolidación";

    else if (weekNum <= 9) phase = "Sostén";

    else phase = "Autonomía";

    return { week: weekNum, action: `Continuar con ${mainAction}`, phase: phase, question: "¿Cómo te sentiste esta semana?", days: {} };

  });

};



// ==========================================

// 3. ICONOS Y COMPONENTES UI

// ==========================================



const Icons = {

  Heart: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 14c1.49-1.28 3.6-2.33 3.6-5.27 0-3-2.39-5.27-5.4-5.27a5.43 5.43 0 0 0-4.2 1.94 5.43 5.43 0 0 0-4.2-1.94C5.4 3.5 3 5.76 3 8.73c0 2.94 2.1 3.99 3.6 5.27"/></svg>,

  Star: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,

  Battery: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/></svg>,

  BookOpen: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,

  Check: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"/></svg>,

  X: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,

  Plus: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>,

  Trash2: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,

  AlertCircle: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,

  Loader2: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,

  User: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,

  ArrowLeft: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,

  EyeOff: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.44 0 .87-.03 1.28-.08"/><line x1="2" x2="22" y1="2" y2="22"/></svg>,

  Eye: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,

  Leaf: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,

  Lock: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,

  CheckCircle: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,

  FileText: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,

  Sparkles: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M2 7h4"/><path d="M2 11h4"/></svg>,

  Lightbulb: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5 0-3.33-2.67-6-6 0 0-6 .67-6 6 0 1.5.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>,

  PieChart: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,

  Edit2: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,

  Settings: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.18-.08a2 2 0 0 0-2 0l-.45.26a2 2 0 0 0-.77 2.76l.1.18a2 2 0 0 1 0 2.44l-.1.18a2 2 0 0 0 .77 2.76l.45.26a2 2 0 0 0 2 0l.18-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.18.08a2 2 0 0 0 2 0l.45-.26a2 2 0 0 0 .77-2.76l-.1-.18a2 2 0 0 1 0-2.44l.1-.18a2 2 0 0 0-.77-2.76l-.45-.26a2 2 0 0 0-2 0l-.18.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,

  Key: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 2 2 2.222 2.222-4 4L15.5 7.5zm2 2L21 5"/></svg>,

  Brain: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,

  Users: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,

  Home: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,

  ChevronLeft: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>,

  ChevronRight: (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 18 6-6-6-6"/></svg>

};



const LogoPlaceholder = ({ size = "large" }) => {

  const isLarge = size === "large";

  const containerSize = isLarge ? "w-28 h-28" : "w-10 h-10";

  const iconSize = isLarge ? 28 : 14;

  return (

    <div className={`${containerSize} rounded-full flex flex-col items-center justify-center relative shadow-sm overflow-hidden border-2 mx-auto`} style={{ backgroundColor: BRAND.accentLight, borderColor: BRAND.bgCard }}>

      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `radial-gradient(circle, ${BRAND.primary} 10%, transparent 10%)`, backgroundSize: '10px 10px' }}></div>

      <div className="flex flex-col items-center justify-center z-10 relative" style={{ top: isLarge ? '1px' : '0' }}>

        <Icons.Leaf width={iconSize} height={iconSize} stroke={BRAND.primary} strokeWidth={1.5} className="mb-0.5 opacity-60" />

        {isLarge && (

          <span className="font-serif font-medium text-3xl tracking-tight leading-none" style={{ color: BRAND.textMain }}>PF</span>

        )}

      </div>

    </div>

  );

};



const SimplePieChart = ({ data, size = 160 }) => {

  const total = data.reduce((acc, item) => acc + item.value, 0);

  let cumulativeAngle = 0;



  if (total === 0) return <div className="w-full h-32 flex items-center justify-center text-stone-300 text-xs font-bold uppercase tracking-widest">Sin datos</div>;



  return (

    <div className="relative flex items-center justify-center">

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">

        {data.map((slice, i) => {

            const angle = (slice.value / total) * 360;

            const x1 = size / 2 + (size / 2) * Math.cos((Math.PI * cumulativeAngle) / 180);

            const y1 = size / 2 + (size / 2) * Math.sin((Math.PI * cumulativeAngle) / 180);

            const x2 = size / 2 + (size / 2) * Math.cos((Math.PI * (cumulativeAngle + angle)) / 180);

            const y2 = size / 2 + (size / 2) * Math.sin((Math.PI * (cumulativeAngle + angle)) / 180);

            

            if (angle === 360) {

                return <circle key={i} cx={size/2} cy={size/2} r={size/2} fill={slice.color} stroke="white" strokeWidth="3" />

            }



            const isLargeArc = angle > 180 ? 1 : 0;

            

            const pathData = `

            M ${size / 2} ${size / 2}

            L ${x1} ${y1}

            A ${size / 2} ${size / 2} 0 ${isLargeArc} 1 ${x2} ${y2}

            Z

            `;

            

            cumulativeAngle += angle;

            

            return (

            <path key={i} d={pathData} fill={slice.color} stroke="white" strokeWidth="3" />

            );

        })}

        </svg>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

             <div className="w-16 h-16 bg-white rounded-full shadow-sm"></div>

        </div>

    </div>

  );

};



const MobileLayout = ({ children, className = "" }) => (

  <div className={`min-h-screen bg-[#FDFBF8] flex flex-col items-center justify-start ${className}`}>

    <div className="w-full max-w-md mx-auto bg-[#FDFBF8] md:bg-white md:shadow-2xl md:my-10 md:rounded-[3rem] md:min-h-[85vh] md:border-x md:border-stone-100 overflow-hidden relative flex flex-col flex-1">

      {children}

    </div>

  </div>

);



// ==========================================

// 4. VISTAS Y COMPONENTES PRINCIPALES

// ==========================================



const HomeView = ({ onLogin, onSelectTherapist, loading }) => {

  const [showLoginForm, setShowLoginForm] = useState(false);

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');



  const handleSubmit = (e) => {

    e.preventDefault();

    setError('');

    onLogin(username.trim(), password.trim(), (err) => setError(err));

  };



  return (

    <MobileLayout className="text-center p-6 justify-center">

      <div className="flex flex-col h-full p-6 overflow-y-auto custom-scrollbar">

        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[500px]">

          <div className="mb-8 relative z-10 transform transition-transform hover:scale-105 active:scale-95 mx-auto" onClick={() => {

              let c = parseInt(window.logoClicks || 0) + 1;

              window.logoClicks = c;

              if (c >= 3) { onSelectTherapist(); window.logoClicks = 0; }

              setTimeout(() => window.logoClicks = 0, 1000);

          }}>

            <div className="mx-auto shadow-xl rounded-full p-2 bg-white select-none cursor-pointer"><LogoPlaceholder size="large" /></div>

          </div>



          <div className="z-10 mb-8 w-full text-center">

              <h1 className="text-4xl font-serif mb-1" style={{ color: BRAND.textMain }}>Método PF</h1>

              <h2 className="text-xl font-serif mb-2" style={{ color: BRAND.textMain }}>Paola Florez</h2>

              <p className="text-xs tracking-widest uppercase italic font-medium px-4 max-w-xs mx-auto leading-relaxed" style={{ color: BRAND.primary }}>

                {!showLoginForm 

                  ? "Psicóloga TCC, ayudo a mejorar tus hábitos" 

                  : "Cada pequeño paso te acerca a la vida que quieres construir"}

              </p>

          </div>



          {!showLoginForm ? (

            <div className="w-full max-w-sm space-y-4 z-10 animate-fade-in-up px-4">

              <button 

                onClick={() => setShowLoginForm(true)} 

                className="w-full p-6 bg-white rounded-[2.5rem] shadow-sm border-2 hover:shadow-md transition-all flex items-center justify-center gap-4 group" 

                style={{ borderColor: BRAND.border }}

              >

                  <div className="p-3 rounded-full transition-colors group-hover:bg-rose-50" style={{ backgroundColor: BRAND.accentLight }}><Icons.User stroke={BRAND.primary} /></div>

                  <div className="text-left">

                    <h3 className="font-serif text-lg font-bold" style={{ color: BRAND.textMain }}>Ingresar a mi espacio</h3>

                  </div>

              </button>

            </div>

          ) : (

            <div className="w-full max-w-sm mx-auto z-10 animate-fade-in-up px-4">

              <form onSubmit={handleSubmit} className="space-y-4 text-left">

                <div className="relative group">

                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><Icons.User width="18" stroke="#94a3b8" /></div>

                  <input 

                    type="text" 

                    className="w-full pl-14 pr-4 py-5 bg-white border-2 border-stone-100 rounded-[2.5rem] shadow-sm focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] outline-none transition-all" 

                    placeholder="Tu Usuario" 

                    value={username} 

                    onChange={(e) => setUsername(e.target.value)} 

                    autoFocus

                  />

                </div>

                <div className="relative group">

                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><Icons.Lock width="18" stroke="#94a3b8" /></div>

                  <input 

                    type={showPassword ? "text" : "password"} 

                    className="w-full pl-14 pr-14 py-5 bg-white border-2 border-stone-100 rounded-[2.5rem] shadow-sm focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] outline-none transition-all" 

                    placeholder="Tu Contraseña" 

                    value={password} 

                    onChange={(e) => setPassword(e.target.value)} 

                  />

                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#C0857D] transition-colors focus:outline-none">

                    {showPassword ? <Icons.EyeOff width="20" stroke={BRAND.primary}/> : <Icons.Eye width="20" stroke={BRAND.primary}/>}

                  </button>

                </div>

                {error && <p className="text-xs text-red-500 animate-pulse text-center font-bold">{error}</p>}

                <div className="flex flex-col gap-3">

                    <button type="submit" disabled={!username || !password || loading} className={`w-full py-5 rounded-[2.5rem] font-bold transition-all shadow-md flex items-center justify-center ${(!username || !password) ? 'opacity-50' : 'hover:opacity-90 active:scale-95 shadow-[#C0857D]/20'}`} style={{ backgroundColor: BRAND.primary, color: '#fff' }}>

                      {loading ? <Icons.Loader2 width={20} stroke="#fff" /> : 'Entrar a mi bitácora'}

                    </button>

                    <button type="button" onClick={() => setShowLoginForm(false)} className="text-[10px] text-stone-400 font-bold uppercase tracking-widest hover:text-stone-600 transition-colors text-center py-2">Volver</button>

                </div>

              </form>

            </div>

          )}

        </div>

        <div className="mt-8 shrink-0 text-center">

            <p className="text-[9px] text-stone-300 font-bold uppercase tracking-[0.3em]">@psicopaolaflorez</p>

        </div>

      </div>

    </MobileLayout>

  );

};



const TherapistLoginView = ({ onLoginSuccess, onBack }) => {

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(false);

  const handleSubmit = (e) => { e.preventDefault(); if (username.trim() === 'adminterapeuta' && password.trim() === 'P1sc0Paol4.3991') { onLoginSuccess(); } else { setError(true); setTimeout(() => setError(false), 2000); } };



  return (

    <MobileLayout className="text-center justify-center">

       <div className="flex flex-col h-full p-6 relative">

           <button onClick={onBack} className="absolute top-6 left-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-20"><Icons.ArrowLeft stroke={BRAND.textLight} /></button>

           <div className="w-full max-w-sm z-10 text-left mx-auto px-6 flex flex-col justify-center flex-1">

              <div className="mb-4 text-center"><LogoPlaceholder size="large" /></div>

              <div className="text-center mb-10">

                <h2 className="text-3xl font-serif mb-1" style={{ color: BRAND.textMain }}>Acceso Psicóloga</h2>

              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                 <div className="relative group">

                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><Icons.User width="18" stroke="#94a3b8" /></div>

                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-14 pr-4 py-4 bg-white border-2 border-stone-100 rounded-[2.5rem] shadow-sm focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] outline-none transition-all placeholder-opacity-50" style={{ color: BRAND.textMain }} placeholder="Usuario Profesional" autoFocus />

                 </div>

                 <div className="relative group">

                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><Icons.Lock width="18" stroke="#94a3b8" /></div>

                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-14 pr-12 py-4 bg-white border-2 border-stone-100 rounded-[2.5rem] shadow-sm focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] outline-none transition-all placeholder-opacity-50" style={{ color: BRAND.textMain }} placeholder="Contraseña Profesional" />

                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#C0857D] transition-colors focus:outline-none">

                      {showPassword ? <Icons.EyeOff width="18" stroke={BRAND.primary} /> : <Icons.Eye width="18" stroke={BRAND.primary} />}

                    </button>

                 </div>

                 {error && <div className="text-xs text-red-500 text-center font-bold">Credenciales incorrectas</div>}

                 <button type="submit" disabled={!password || !username} className={`w-full py-4 rounded-[2.5rem] font-bold shadow-md transition-all text-white active:scale-95 hover:opacity-90 shadow-[#C0857D]/20`} style={{ backgroundColor: BRAND.primary }}>Ingresar al Panel</button>

              </form>

           </div>

       </div>

    </MobileLayout>

  );

};



const GoalView = ({ setCurrentView, goalCategory, setGoalCategory, goalSubCategories, setGoalSubCategories, objectives, setObjectives, onSaveProfile, isSaving, onBack }) => {

  const categories = useMemo(() => [

    { id: 'cuerpo', label: 'Cuerpo', icon: <Icons.Star size={20} />, subcategories: ['Salud', 'Sueño', 'Alimentación', 'Actividad física'] },

    { id: 'vinculos', label: 'Vínculos', icon: <Icons.Users size={20} />, subcategories: ['Pareja', 'Familia', 'Amigos', 'Comunidad'] },

    { id: 'proyectos', label: 'Proyectos', icon: <Icons.BookOpen size={20} />, subcategories: ['Trabajo', 'Estudios', 'Finanzas'] },

    { id: 'mente', label: 'Salud Mental', icon: <Icons.Brain size={20} />, subcategories: ['Calmar mi mente', 'Hobbies', 'Manejo emocional', 'Cambiar conductas', 'Espiritualidad'] },

  ], []);

    

  const selectedCat = categories.find(c => c.id === goalCategory);

  // Safely check if objectives are available

  const allObjectives = Object.values(objectives || {}).flat();

  const currentTotal = allObjectives.length;



  const handleCategorySelect = (catId) => {

    if (goalCategory === catId) return;

    setGoalCategory(catId);

  };



  const toggleSub = (sub) => {

    if (goalSubCategories.includes(sub)) {

       setGoalSubCategories(prev => prev.filter(s => s !== sub));

       const newObjs = {...objectives}; delete newObjs[sub]; setObjectives(newObjs);

    } else if (goalSubCategories.length < 3 && currentTotal < 3) {

       setGoalSubCategories(prev => [...prev, sub]);

       // Initialize with empty days array

       setObjectives(prev => ({...prev, [sub]: [{text: '', days: []}]}));

    }

  };



  const updateObjText = (sub, idx, text) => {

     const newArr = [...(objectives[sub] || [])]; 

     newArr[idx] = { ...newArr[idx], text };

     setObjectives({...objectives, [sub]: newArr});

  };



  const toggleDay = (sub, idx, dayNum) => {

      const newArr = [...(objectives[sub] || [])];

      const currentDays = newArr[idx].days || [];

      const newDays = currentDays.includes(dayNum) 

        ? currentDays.filter(d => d !== dayNum) 

        : [...currentDays, dayNum];

      newArr[idx] = { ...newArr[idx], days: newDays };

      setObjectives({...objectives, [sub]: newArr});

  };



  const addObjective = (sub) => {

    const subCount = (objectives[sub] || []).length;

    if (currentTotal < 3 && subCount < 2) {

      setObjectives({...objectives, [sub]: [...(objectives[sub] || []), {text: '', days:[]}]});

    }

  };



  const removeObjective = (sub, idx) => {

    const newArr = [...(objectives[sub] || [])];

    newArr.splice(idx, 1);

    

    const newObjectives = {...objectives};

    

    if (newArr.length === 0) {

        delete newObjectives[sub];

        setGoalSubCategories(prev => prev.filter(s => s !== sub));

    } else {

        newObjectives[sub] = newArr;

    }

    

    setObjectives(newObjectives);

  };



  return (

    <MobileLayout className="text-left">

      <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">

        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors">

            <Icons.ArrowLeft size={16} /> Volver

        </button>

        <h2 className="text-xl font-serif mb-1 leading-tight text-stone-800 font-bold">Define tus objetivos</h2>

        <p className="text-xs text-stone-400 mb-4 font-bold uppercase tracking-wider">Explora las áreas. Máx 3 objetivos totales.</p>

        

        <div className="mb-8 p-5 bg-stone-50 border-l-4 rounded-r-xl shadow-sm" style={{ borderColor: BRAND.primary }}>

          <h4 className="text-xs font-bold text-stone-700 uppercase mb-1 flex items-center gap-2"><Icons.Lightbulb size={14} stroke={BRAND.primary}/> Tip para tus objetivos</h4>

          <p className="text-[11px] text-stone-600 italic leading-relaxed">

            Puedes combinar áreas (ej. 1 de Cuerpo y 1 de Mente).<br/>

            Define acciones <strong>pequeñas</strong>: <span className="opacity-70">"Leer 2 págs" es mejor que "Leer más".</span>

          </p>

        </div>

          

        <div className="space-y-8 pb-20">

          <div>

            <label className="block text-sm font-bold mb-3 text-stone-700 font-serif">1. Área de cambio</label>

            <div className="grid grid-cols-2 gap-3 mt-2">

              {categories.map((cat) => (

                <button key={cat.id} onClick={() => handleCategorySelect(cat.id)} className="p-3 rounded-[2rem] border-2 border-stone-100 flex flex-col items-center gap-2 transition-all shadow-sm" style={{ backgroundColor: goalCategory === cat.id ? BRAND.accentLight : BRAND.bgCard, borderColor: goalCategory === cat.id ? BRAND.accentLight : 'transparent', color: goalCategory === cat.id ? BRAND.primary : BRAND.textLight }}>

                  {cat.icon}

                  <span className="text-sm font-medium">{cat.label}</span>

                </button>

              ))}

            </div>

          </div>



          {selectedCat && (

            <div className="animate-fade-in-up space-y-2 text-left">

              <label className="block text-sm font-bold text-stone-700 font-serif">2. Subcategorías (Máx 3)</label>

              <div className="flex flex-wrap gap-2">

                {selectedCat.subcategories.map((sub) => {

                  const isSelected = goalSubCategories.includes(sub);

                  return (

                    <button key={sub} onClick={() => toggleSub(sub)} className={`px-5 py-2 rounded-full text-sm border-2 transition-all ${isSelected ? 'text-white shadow-md shadow-stone-200' : 'bg-white'}`} style={{ backgroundColor: isSelected ? BRAND.secondary : 'transparent', borderColor: isSelected ? BRAND.secondary : BRAND.border, color: isSelected ? '#fff' : BRAND.textMain }}>{sub}</button>

                  );

                })}

              </div>

            </div>

          )}



          {goalSubCategories.length > 0 && (

            <div className="animate-fade-in-up">

              <div className="flex justify-between items-center mb-4">

                <label className="text-sm font-bold text-stone-800 font-serif">3. Acciones concretas</label>

                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${currentTotal >= 3 ? 'bg-[#C0857D] text-white shadow-lg shadow-[#C0857D]/20' : 'bg-emerald-100 text-emerald-600'}`}>

                  {currentTotal} de 3 objetivos totales

                </span>

              </div>

              

              <div className="space-y-4">

              {goalSubCategories.map(sub => (

                <div key={sub} className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-stone-50">

                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: BRAND.secondary }}><Icons.Star size={16} stroke={BRAND.secondary} /> {sub}</h4>

                    <div className="space-y-6">

                    {(objectives[sub] || []).map((obj, idx) => (

                      <div key={idx} className="space-y-3 border-b border-stone-50 pb-4 last:border-none">

                          <div className="flex gap-2">

                              <input className="w-full p-4 bg-stone-50 rounded-2xl text-sm border-none shadow-inner outline-none focus:ring-2 focus:ring-stone-200 text-stone-700 font-serif font-medium" placeholder={`¿Qué harás para ${sub.toLowerCase()}?`} value={obj.text} onChange={e => updateObjText(sub, idx, e.target.value)} />

                              <button onClick={() => removeObjective(sub, idx)} className="text-stone-300 hover:text-rose-400 p-2 transition-colors"><Icons.Trash2 size={18} /></button>

                          </div>

                          <p className="text-[10px] text-stone-400 font-bold ml-2 mt-2 mb-1 uppercase tracking-wide">

                              Selecciona los días que realizarás el objetivo:

                          </p>

                          <div className="flex justify-between gap-1 px-2">

                              {[1,2,3,4,5,6,7].map(d => {

                                  const active = obj.days?.includes(d);

                                  return (

                                      <button key={d} onClick={() => toggleDay(sub, idx, d)} className={`w-8 h-8 rounded-full text-[10px] font-bold border transition-all ${active ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-300 border-stone-100'}`}>

                                          {['L','M','X','J','V','S','D'][d-1]}

                                      </button>

                                  );

                              })}

                          </div>

                      </div>

                    ))}

                    </div>

                    {currentTotal < 3 && (objectives[sub] || []).length < 2 && (

                      <button onClick={() => addObjective(sub)} className="text-xs font-bold flex items-center gap-1 mt-4 px-4 py-2 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors" style={{ color: BRAND.primary }}>

                          <Icons.Plus size={14} stroke={BRAND.primary} /> Añadir otra acción

                      </button>

                    )}

                </div>

              ))}

              </div>

            </div>

          )}

        </div>

      </div>

      <div className="mt-auto p-6 pt-2 text-center bg-white sticky bottom-0 z-10 border-t border-stone-50">

        <button onClick={onSaveProfile} disabled={isSaving || currentTotal === 0} className={`w-full py-5 rounded-full font-bold transition-all shadow-xl flex items-center justify-center gap-2 text-white active:scale-95`} style={{ backgroundColor: BRAND.primary }}>

          {isSaving ? <Icons.Loader2 width={20} stroke="#fff" /> : 'Confirmar mi plan'}

        </button>

      </div>

    </MobileLayout>

  );

};



const DashboardView = ({ patientName, activeWeekIndex, setActiveWeekIndex, weeksData, objectives, onSaveWeek, isSaving, onLogout, onEditGoals }) => {

  const activeWeek = weeksData[activeWeekIndex] || { days: {}, action: 'Cargando...' };

  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7); 

  const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const [editingObj, setEditingObj] = useState(null); 

  const [objData, setObjData] = useState({});

  const scrollRef = useRef(null);



  // --- AUTO-SCROLL EFFECT ---

  useEffect(() => {

    if (scrollRef.current) {

        const activeBtn = scrollRef.current.children[activeWeekIndex];

        if (activeBtn) {

            activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

        }

    }

  }, [activeWeekIndex]);



  const dayData = activeWeek?.days?.[selectedDay] || {};

  const currentDayObjectives = dayData.objectives || {}; 

  const allObjectives = Object.values(objectives || {}).flat().filter(o => o.text?.trim() !== "");



  const openModal = (obj, forcedStatus = null) => {

      setEditingObj(obj);

      const existing = currentDayObjectives[obj] || {};

      setObjData({

          status: forcedStatus || existing.status || 'yes',

          energy: existing.energy || 3,

          hasDifficulty: existing.hasDifficulty !== undefined ? existing.hasDifficulty : (forcedStatus === 'no'),

          diffCategory: existing.diffCategory || '',

          diffSubcategory: existing.diffSubcategory || '',

          diffDetail: existing.diffDetail || '',

          adjustment: existing.adjustment || ''

      });

  };



  const closeModal = () => { setEditingObj(null); setObjData({}); };



  const saveObjective = () => {

      if (!editingObj || !objData.status) return;

      const updatedDayObjs = { ...currentDayObjectives, [editingObj]: objData };

      

      const energies = Object.values(updatedDayObjs).map(o => o.energy).filter(e => e);

      const avgEnergy = energies.length > 0 ? Math.round(energies.reduce((a,b)=>a+b,0)/energies.length) : 0;



      onSaveWeek({

          ...activeWeek,

          days: { ...activeWeek.days, [selectedDay]: { ...dayData, status: 'completed', energy: avgEnergy, objectives: updatedDayObjs, timestamp: new Date().toISOString() } }

      });

      setEditingObj(null);

  };



  const isWeekCompleted = (week) => {

      if (!week || !week.days) return false;

      

      const allConfiguredObjectives = Object.values(objectives || {}).flat().filter(o => o.text?.trim() !== "");

      const daysWithObjectives = new Set();

      

      allConfiguredObjectives.forEach(obj => {

          if (Array.isArray(obj.days)) {

              obj.days.forEach(dayNum => daysWithObjectives.add(dayNum));

          }

      });



      if (daysWithObjectives.size === 0) return false;



      const registeredDays = Object.keys(week.days).map(k => parseInt(k));

      

      for (let day of daysWithObjectives) {

          if (!registeredDays.includes(day)) {

              return false; 

          }

      }



      return true; 

  };



  const handlePrevWeek = () => {

      if(activeWeekIndex > 0) setActiveWeekIndex(activeWeekIndex - 1);

  };



  const handleNextWeek = () => {

      if(activeWeekIndex < weeksData.length - 1) setActiveWeekIndex(activeWeekIndex + 1);

  };



  const ENERGY_LEVELS = { 

    1: "agotado/a, saturado/a, dolor, crisis emocional", 

    2: "muy baja energía", 

    3: "energía media", 

    4: "buena energía", 

    5: "mucha energía" 

  };



  return (

    <MobileLayout> 

      <div className="rounded-b-[3rem] shadow-sm p-7 pb-10 bg-white border-b border-stone-100 text-center animate-fade-in relative z-20">

          <div className="flex justify-between items-center mb-6 text-left">

             <div><h1 className="text-xl font-serif text-stone-800 font-bold">Hola, {patientName}</h1><p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1 font-serif">Método PF</p></div>

             <div className="flex items-center gap-4">

                 <button onClick={onEditGoals} className="p-2 rounded-full hover:bg-stone-50 transition-colors text-stone-400 active:scale-95" title="Ajustar mis objetivos">

                     <Icons.ArrowLeft size={24} strokeWidth={1.5} />

                 </button>

                 <div onClick={onLogout} className="cursor-pointer active:scale-95 transition-all text-stone-400 hover:text-rose-400 p-1"><Icons.Home size={24} strokeWidth={1.5} /></div>

             </div>

          </div>

          <div className="p-6 rounded-[2rem] relative overflow-hidden bg-stone-50 border-2 border-stone-100 text-left shadow-inner">

             <Icons.Star className="absolute top-0 right-0 p-4 opacity-5" width="60" height="60" color={BRAND.primary}/>

             <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 font-serif font-bold">Misión de la semana</p>

             <p className="text-sm font-serif leading-tight text-stone-700 italic">"{activeWeek.action}"</p>

          </div>

      </div>



      <div className="px-6 mt-6 overflow-x-auto pb-4 hide-scrollbar text-center relative z-10">

          <div className="flex justify-between gap-3 min-w-max">

              {DAYS.map((d, i) => {

                  const dayNum = i+1;

                  const isSel = selectedDay === dayNum;

                  const dInfo = activeWeek?.days?.[dayNum];

                  let bg = BRAND.ui.emptyDay; let txt = BRAND.textLight;

                  

                  if (isSel) { bg = BRAND.primary; txt = 'white'; }

                  else if (dInfo && Object.keys(dInfo.objectives || {}).length > 0) { bg = BRAND.secondary; txt = 'white'; }

                  

                  return (

                      <button key={dayNum} onClick={() => setSelectedDay(dayNum)} className={`w-12 h-14 rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold transition-all shadow-sm ${isSel ? 'scale-105 shadow-md shadow-stone-200' : ''}`} style={{ backgroundColor: bg, color: txt }}>

                          <span>{d}</span>

                          {dInfo && Object.keys(dInfo.objectives || {}).length > 0 && <Icons.Check width="8" strokeWidth={5}/>}

                      </button>

                  )

              })}

          </div>

      </div>



      <div className="px-6 mt-4 space-y-5 text-left text-stone-800 flex-1 overflow-y-auto pb-40 custom-scrollbar relative z-0">

          <h3 className="font-serif text-lg text-stone-800 font-bold sticky top-0 bg-[#FDFBF8] py-2 z-10">Hábitos para hoy</h3>

          {allObjectives.map((obj, i) => {

              const data = currentDayObjectives[obj.text] || {};

              const status = data.status;

              const isScheduledToday = obj.days?.includes(selectedDay);



              return (

                  <div key={i} className={`w-full bg-white p-6 rounded-[2.5rem] shadow-sm border-2 animate-fade-in-up ${status ? (status === 'yes' ? 'border-[#9CAD95]' : 'border-[#C0857D]') : 'border-stone-100'}`}>

                      <p className={`font-bold text-sm mb-6 font-serif font-medium ${!isScheduledToday ? 'opacity-40' : 'text-stone-700'}`}>{obj.text}</p>

                      

                      {!isScheduledToday ? (

                          <div className="p-4 bg-stone-50 rounded-2xl text-center">

                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest italic">No corresponde este día</p>

                          </div>

                      ) : status ? (

                        <button onClick={() => openModal(obj.text)} className="w-full flex items-center justify-between transition-all text-left">

                            <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: status === 'yes' ? BRAND.secondary : BRAND.primary }}>{status === 'yes' ? 'Completado' : 'Tuve dificultad'}</p>

                            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: status === 'yes' ? '#f0fdf4' : '#fef2f2' }}>

                                {status === 'yes' ? <Icons.Check size={20} className="text-emerald-500"/> : <Icons.X size={20} className="text-rose-500"/>}

                            </div>

                        </button>

                      ) : (

                        <div className="flex gap-4">

                            <button onClick={() => openModal(obj.text, 'yes')} className="flex-1 py-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center gap-2 font-bold text-xs hover:bg-emerald-100 transition-all active:scale-95 shadow-sm border border-emerald-100">

                                <Icons.Check size={18}/> Sí

                            </button>

                            <button onClick={() => openModal(obj.text, 'no')} className="flex-1 py-4 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center gap-2 font-bold text-xs active:scale-95 transition-all shadow-sm border border-rose-100">

                                <Icons.X size={18}/> Tuve dificultad

                            </button>

                        </div>

                      )}

                  </div>

              )

          })}

      </div>



      {editingObj && (

          <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">

              <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-100 text-left">

                  <div className="p-8 border-b flex justify-between items-center bg-stone-50/50">

                      <h3 className="font-serif text-lg text-stone-800 truncate pr-2 font-bold">{editingObj}</h3>

                      <button onClick={() => setEditingObj(null)} className="p-2 rounded-full hover:bg-stone-200 transition-colors text-stone-400 active:scale-90"><Icons.X size={20}/></button>

                  </div>

                  <div className="p-8 overflow-y-auto space-y-8 text-center text-left">

                      {objData.status === 'no' && (

                        <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] animate-fade-in-up">

                            <Icons.CheckCircle className="mx-auto mb-2" stroke={BRAND.secondary} />

                            <p className="text-xs font-bold text-emerald-800 italic leading-relaxed text-center">¡Gracias por ser honesto/a! Reconocer los obstáculos es el primer paso para superarlos.</p>

                        </div>

                      )}

                      <div>

                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4 block text-center font-serif text-stone-800 font-bold">Nivel de energía</label>

                          <div className="flex justify-between gap-1 mb-3">

                              {[1,2,3,4,5].map(lvl => (

                                  <button key={lvl} onClick={() => setObjData({...objData, energy: lvl})} className={`h-11 flex-1 rounded-2xl font-bold border-2 transition-all ${objData.energy === lvl ? 'bg-stone-800 text-white border-stone-800 shadow-lg scale-105' : 'bg-white text-stone-300 border-stone-100'}`}>{lvl}</button>

                              ))}

                          </div>

                          <div className="text-center bg-stone-50 p-4 rounded-2xl shadow-inner border border-stone-100">

                             <p className="text-[9px] font-bold text-stone-400 uppercase tracking-tight mb-1 font-sans">Escala Seleccionada:</p>

                             <p className="text-[11px] font-serif text-stone-700 italic font-medium leading-tight">"{ENERGY_LEVELS[objData.energy || 3]}"</p>

                          </div>

                      </div>

                      {objData.status === 'no' && (

                        <div className="space-y-4 animate-fade-in text-left">

                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 block text-center font-serif font-bold">¿Qué dificultó el proceso?</label>

                            <div className="space-y-3 p-6 bg-stone-50 rounded-[2.5rem] border-2 border-stone-100 shadow-inner text-left">

                                <select value={objData.diffCategory || ''} onChange={e => setObjData({...objData, diffCategory: e.target.value, diffSubcategory: ''})} className="w-full p-4 rounded-2xl border-none bg-white text-xs font-bold text-stone-700 shadow-sm outline-none cursor-pointer font-serif"><option value="">Selecciona área...</option>{Object.keys(DIFFICULTY_DATA).map(c => <option key={c} value={c}>{DIFFICULTY_DATA[c].label}</option>)}</select>

                                {objData.diffCategory && <select value={objData.diffSubcategory || ''} onChange={e => setObjData({...objData, diffSubcategory: e.target.value})} className="w-full p-4 rounded-2xl border-none bg-white text-xs font-bold text-stone-700 shadow-sm outline-none cursor-pointer font-serif"><option value="">Selecciona detalle...</option>{[...DIFFICULTY_DATA[objData.diffCategory].options].sort((a,b)=>a.localeCompare(b)).map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}</select>}

                                {(objData.diffSubcategory?.toLowerCase().includes('otro') || objData.diffSubcategory?.toLowerCase().includes('pensamiento')) && (

                                    <input className="w-full p-4 rounded-2xl border-none bg-white text-xs font-medium text-stone-700 shadow-sm outline-none animate-fade-in font-serif" placeholder="Describe brevemente..." value={objData.diffDetail || ''} onChange={e => setObjData({...objData, diffDetail: e.target.value})} />

                                )}

                            </div>

                        </div>

                      )}

                      <div>

                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4 block text-center font-serif">Observaciones / Notas</label>

                          <textarea rows="3" className="w-full p-5 text-xs rounded-[2.5rem] bg-stone-50 border-2 border-stone-100 resize-none outline-none focus:ring-2 focus:ring-stone-200 text-stone-700 shadow-inner font-serif" placeholder="Opcional..." value={objData.adjustment || ''} onChange={e => setObjData({...objData, adjustment: e.target.value})} />

                      </div>

                  </div>

                  <div className="p-8 border-t bg-stone-50/50">

                      <button onClick={saveObjective} disabled={isSaving || (objData.status === 'no' && !objData.diffSubcategory)} className="w-full py-5 rounded-full font-bold text-white shadow-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-40 shadow-stone-300" style={{ backgroundColor: BRAND.primary }}>

                          {isSaving ? <Icons.Loader2 width={20} className="animate-spin" stroke="#fff" /> : 'Guardar registro diario'}

                      </button>

                  </div>

              </div>

          </div>

      )}



      {/* SEMANAS ABAJO - DISEÑO MEJORADO MÓVIL */}

      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-100 p-4 pb-6 z-40 text-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">

          <div className="flex items-center justify-between gap-2">

              <button onClick={handlePrevWeek} disabled={activeWeekIndex === 0} className="p-2 rounded-full hover:bg-stone-100 disabled:opacity-30 transition-all">

                  <Icons.ChevronLeft size={20} className="text-stone-400" />

              </button>

              

              <div ref={scrollRef} className="overflow-x-auto hide-scrollbar flex gap-3 px-2 text-center w-full scroll-smooth">

                  {weeksData.map((w, idx) => {

                      const completed = isWeekCompleted(w);

                      const isCurrent = activeWeekIndex === idx;

                      return (

                          <button key={idx} onClick={() => setActiveWeekIndex(idx)} className={`flex-shrink-0 min-w-[85px] p-3 rounded-[1.2rem] border-2 transition-all flex flex-col items-center gap-0.5 ${isCurrent ? 'bg-stone-800 border-stone-800 text-white shadow-xl scale-105' : completed ? 'bg-[#9CAD95] border-[#9CAD95] text-white shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>

                              <span className={`text-[10px] font-bold uppercase tracking-widest ${completed ? 'text-white' : ''} ${isCurrent ? 'text-white' : ''}`}>SEM {idx + 1}</span>

                              {completed && <Icons.CheckCircle width={10} strokeWidth={4} stroke="#fff" className="mt-1"/>}

                          </button>

                      );

                  })}

              </div>



              <button onClick={handleNextWeek} disabled={activeWeekIndex === weeksData.length - 1} className="p-2 rounded-full hover:bg-stone-100 disabled:opacity-30 transition-all">

                  <Icons.ChevronRight size={20} className="text-stone-400" />

              </button>

          </div>

      </div>

    </MobileLayout>

  );

};



const TherapistView = ({ onBack, user }) => {

  const [patients, setPatients] = useState([]);

  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const [selectedPatientData, setSelectedPatientData] = useState(null);

  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPatient, setNewPatient] = useState({ name: '', username: '', password: '' });

  const [showPassModal, setShowPassModal] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const [selectedWeekForSummary, setSelectedWeekForSummary] = useState(1); // Nuevo estado para selector de semana

  const [showManageModal, setShowManageModal] = useState(false);

  const [managePassword, setManagePassword] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);

  // Estados para la confirmación de eliminación en UI personalizada

  const [deleteConfirmation, setDeleteConfirmation] = useState(false);



  useEffect(() => {

    if (!user) return;

    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'patient_directory'), (snap) => {

        const list = []; snap.forEach(d => list.push({id: d.id, ...d.data()}));

        setPatients(list); setLoading(false);

    });

    return () => unsub();

  }, [user]);



  useEffect(() => {

    if (!selectedPatientId || !user) return;

    const unsubWeeks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'patient_weeks'), (snap) => {

      const weeks = {}; 

      snap.forEach(d => { 

        const data = d.data();

        if (data.patientId === selectedPatientId) {

          const parts = d.id.split('_week_'); 

          if (parts.length === 2) {

              const weekNum = parseInt(parts[1]);

              weeks[weekNum] = data; 

          }

        }

      });

      setSelectedPatientData(weeks);

      

      // Auto-seleccionar la última semana con datos, o la 1

      const weeksWithData = Object.keys(weeks).map(Number).sort((a,b)=>b-a);

      if(weeksWithData.length > 0) setSelectedWeekForSummary(weeksWithData[0]);

    });



    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'patients', selectedPatientId), (snap) => {

        if (snap.exists()) setSelectedPatientProfile(snap.data());

    });



    return () => { unsubWeeks(); unsubProfile(); };

  }, [selectedPatientId, user]);



  const processPatientData = () => {

      if (!selectedPatientData) return { 

          globalPieData: [],

          weeklyStats: {}, // Estructura: { 1: { pieData: [], successNotes: [], diffNotes: [], dayRecords: [], diffCount: 0 }, ... }

          totalStats: { adherence: 0, energy: 0, difficultyTotal: 0 } 

      };



      // Contadores Globales

      let globalYes = 0, globalNo = 0, globalPartial = 0;

      let totalEnergy = 0, energyCount = 0;

      let totalDiffCount = 0;



      // Estructura por semanas

      let weeksProcessed = {};



      // Inicializar estructura para las 12 semanas

      for(let i=1; i<=12; i++) {

          weeksProcessed[i] = {

              yes: 0, no: 0, partial: 0,

              successNotes: [],

              difficultyNotes: [],

              dayRecords: [],

              diffCount: 0

          };

      }



      // Procesar datos

      Object.entries(selectedPatientData).forEach(([weekKey, weekData]) => {

          const weekNum = parseInt(weekKey);

          if (!weeksProcessed[weekNum]) return; // Safety check



          if (weekData.days) {

              Object.entries(weekData.days).forEach(([dayKey, day]) => {

                  const dayNum = parseInt(dayKey);

                  // Stats for Energy (Global)

                  if (day.energy) { totalEnergy += day.energy; energyCount++; }



                  // Procesar Objetivos del día

                  if (day.objectives) {

                      Object.entries(day.objectives).forEach(([objName, obj]) => {

                          // Global Counters

                          if (obj.status === 'yes') globalYes++;

                          else if (obj.status === 'no') { globalNo++; totalDiffCount++; }

                          else if (obj.status === 'partial') globalPartial++;



                          // Weekly Counters

                          if (obj.status === 'yes') weeksProcessed[weekNum].yes++;

                          else if (obj.status === 'no') {

                              weeksProcessed[weekNum].no++;

                              weeksProcessed[weekNum].diffCount++;

                          }

                          else if (obj.status === 'partial') weeksProcessed[weekNum].partial++;



                          // Notes

                          if (obj.status === 'yes' && obj.adjustment) {

                              weeksProcessed[weekNum].successNotes.push({ text: `${obj.adjustment} (Obj: ${objName})` });

                          }

                          if ((obj.status === 'no' || obj.hasDifficulty)) {

                              const detail = obj.diffDetail || obj.adjustment || obj.diffSubcategory;

                              if (detail) {

                                  weeksProcessed[weekNum].difficultyNotes.push({ 

                                      category: obj.diffCategory,

                                      text: detail,

                                      objName: objName

                                  });

                              }

                          }

                      });

                      

                      // Guardar registro del día para la vista detallada

                      weeksProcessed[weekNum].dayRecords.push({

                          dayNum: dayNum,

                          objectives: day.objectives

                      });

                  }

              });

          }

      });



      // Construir Global Pie Data

      const globalPieData = [

          { label: 'Completado', value: globalYes, color: '#9CAD95' }, 

          { label: 'Parcial', value: globalPartial, color: '#D6E0D2' }, 

          { label: 'No realizado', value: globalNo, color: '#C0857D' } 

      ].filter(d => d.value > 0);



      // Calcular Adherencia Global (simplificada)

      const totalGlobal = globalYes + globalNo + globalPartial;

      const globalAdherence = totalGlobal > 0 ? Math.round(((globalYes + (globalPartial * 0.5)) / totalGlobal) * 100) : 0;

      const avgEnergy = energyCount > 0 ? (totalEnergy / energyCount).toFixed(1) : 0;



      return {

          globalPieData,

          weeklyStats: weeksProcessed,

          totalStats: { adherence: globalAdherence, energy: avgEnergy, difficultyTotal: totalDiffCount }

      };

  };



  const dashboardData = useMemo(() => processPatientData(), [selectedPatientData]);

  const currentWeekStats = dashboardData.weeklyStats[selectedWeekForSummary] || { yes: 0, no: 0, partial: 0, diffCount: 0, successNotes: [], difficultyNotes: [], dayRecords: [] };

  

  // Pie chart data for current selected week

  const weeklyPieData = [

      { label: 'Completado', value: currentWeekStats.yes, color: '#9CAD95' },

      { label: 'Parcial', value: currentWeekStats.partial, color: '#D6E0D2' },

      { label: 'No realizado', value: currentWeekStats.no, color: '#C0857D' }

  ].filter(d => d.value > 0);





  const handleCreatePatient = async (e) => {

    e.preventDefault();

    if (!newPatient.name || !newPatient.username || !newPatient.password) return;

    setIsCreating(true);

    try {

      const pid = crypto.randomUUID(); 

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_credentials', newPatient.username), { ...newPatient, password: newPatient.password, patientId: pid });

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_directory', pid), { name: newPatient.name, username: newPatient.username, lastUpdated: new Date().toISOString() });

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patients', pid), { name: newPatient.name });

      setShowCreateModal(false); setNewPatient({ name: '', username: '', password: '' });

    } catch (e) { console.error(e); }

    setIsCreating(false);

  };



  // Función interna para ejecutar el borrado real sin window.confirm

  const executeDeletePatient = async () => {

      setIsUpdating(true);

      try {

          const batch = writeBatch(db);

          

          const patientInfo = patients.find(p => p.id === selectedPatientId);

          

          if (patientInfo && patientInfo.username) {

               const credRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_credentials', patientInfo.username);

               batch.delete(credRef);

          } else {

               console.warn("No se encontró username para eliminar credenciales, se procederá a eliminar datos.");

          }



          const dirRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_directory', selectedPatientId);

          batch.delete(dirRef);



          const profileRef = doc(db, 'artifacts', appId, 'public', 'data', 'patients', selectedPatientId);

          batch.delete(profileRef);



          for(let i=1; i<=12; i++) {

              const weekRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_weeks', `${selectedPatientId}_week_${i}`);

              batch.delete(weekRef);

          }



          await batch.commit();

          

          setShowManageModal(false);

          setSelectedPatientId(null);

          setDeleteConfirmation(false); // Resetear estado

          // Feedback opcional, pero mejor usar UI

      } catch(e) {

          console.error("Error eliminando paciente:", e);

      } finally {

          setIsUpdating(false);

      }

  };



  const handleUpdatePassword = async (e) => {

    e.preventDefault();

    if(!managePassword) return;

    setIsUpdating(true);

    try {

        const patientInfo = patients.find(p => p.id === selectedPatientId);

        if(patientInfo && patientInfo.username) {

            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_credentials', patientInfo.username), { password: managePassword }, { merge: true });

            setManagePassword('');

            setShowManageModal(false);

        }

    } catch(e) {

        console.error(e);

    }

    setIsUpdating(false);

  };



  // NOTA: TherapistView NO USA MobileLayout para ocupar todo el ancho

  return (

      <div className="min-h-screen bg-[#FDFBF8] p-6 relative animate-fade-in text-left pb-12 font-serif">

          <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-100">

              <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest active:scale-95 transition-all font-sans font-bold"><Icons.ArrowLeft size={16}/> Salir</button>

              <button onClick={() => setShowCreateModal(true)} className="px-8 py-3 bg-[#C0857D] text-white rounded-full text-[10px] font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest font-sans font-bold"><Icons.Plus size={16}/> Nuevo Paciente</button>

          </div>



          {showCreateModal && (

              <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                  <div className="bg-white rounded-[3.5rem] p-10 w-full max-w-sm shadow-2xl border-2 border-stone-100 animate-fade-in text-center font-sans">

                      <h3 className="font-serif text-2xl mb-8 text-stone-800 font-bold">Alta de Paciente</h3>

                      <form onSubmit={handleCreatePatient} className="space-y-6 text-left">

                          <label className="text-[10px] font-bold text-stone-400 uppercase ml-4">Nombre Completo</label>

                          <input className="w-full p-5 bg-white rounded-[2rem] text-sm border-2 border-stone-100 shadow-sm outline-none focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] transition-all" placeholder="Ej: Ana Pérez" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />

                          <label className="text-[10px] font-bold text-stone-400 uppercase ml-4">Usuario de acceso</label>

                          <input className="w-full p-5 bg-white rounded-[2rem] text-sm border-2 border-stone-100 shadow-sm outline-none focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] transition-all" placeholder="Ej: ana2024" value={newPatient.username} onChange={e => setNewPatient({...newPatient, username: e.target.value})} />

                          <div className="relative">

                            <label className="text-[10px] font-bold text-stone-400 uppercase ml-4 block font-serif font-bold">Contraseña</label>

                            <input type={showPassModal ? "text" : "password"} className="w-full p-5 bg-white rounded-[2rem] text-sm border-2 border-stone-100 shadow-sm outline-none focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] transition-all" placeholder="••••••••" value={newPatient.password} onChange={e => setNewPatient({...newPatient, password: e.target.value})} />

                            <button type="button" onClick={() => setShowPassModal(!showPassModal)} className="absolute right-6 top-[55%] text-stone-400 hover:text-[#C0857D] transition-colors focus:outline-none"><Icons.EyeOff size={18}/></button>

                          </div>

                          <button type="submit" disabled={isCreating} className="w-full py-5 bg-[#C0857D] text-white rounded-full font-bold uppercase text-[10px] tracking-widest shadow-xl active:scale-95 mt-4 font-sans font-bold flex items-center justify-center gap-2">{isCreating ? <Icons.Loader2 width={18} className="animate-spin" stroke="#fff" /> : 'Generar Acceso'}</button>

                          <button type="button" onClick={() => setShowCreateModal(false)} className="w-full text-[10px] text-stone-400 font-bold uppercase tracking-widest pt-4 text-center block font-sans">Cancelar</button>

                      </form>

                  </div>

              </div>

          )}



          {showManageModal && (

              <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

                  <div className="bg-white rounded-[3.5rem] p-10 w-full max-w-sm shadow-2xl border-2 border-stone-100 animate-fade-in text-center font-sans">

                      <div className="flex justify-between items-center mb-6">

                          <h3 className="font-serif text-2xl text-stone-800 font-bold">Gestión de Paciente</h3>

                          <button onClick={() => { setShowManageModal(false); setDeleteConfirmation(false); }}><Icons.X size={24} className="text-stone-400" /></button>

                      </div>

                      

                      <div className="space-y-8">

                          {/* CAMBIAR CONTRASEÑA */}

                          <form onSubmit={handleUpdatePassword} className="space-y-4 text-left border-b border-stone-100 pb-8">

                              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2"><Icons.Key size={14}/> Cambiar Contraseña</h4>

                              <input 

                                  type="text" 

                                  className="w-full p-4 bg-stone-50 rounded-[2rem] text-sm border-2 border-stone-100 shadow-inner outline-none focus:ring-2 focus:ring-[#C0857D]/20 focus:border-[#C0857D] transition-all" 

                                  placeholder="Nueva contraseña" 

                                  value={managePassword} 

                                  onChange={e => setManagePassword(e.target.value)} 

                              />

                              <button type="submit" disabled={isUpdating || !managePassword} className="w-full py-3 bg-stone-800 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-50">Actualizar Clave</button>

                          </form>



                          {/* ZONA DE PELIGRO - CON CONFIRMACIÓN UI */}

                          <div className="text-left space-y-4">

                              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2"><Icons.Trash2 size={14}/> Zona de Peligro</h4>

                              <p className="text-[10px] text-stone-400 leading-tight">Esta acción eliminará permanentemente al paciente y todo su historial. No se puede deshacer.</p>

                              

                              {!deleteConfirmation ? (

                                <button onClick={() => setDeleteConfirmation(true)} className="w-full py-3 bg-rose-50 text-rose-600 border-2 border-rose-100 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-rose-100 active:scale-95 disabled:opacity-50 transition-all">Eliminar Paciente</button>

                              ) : (

                                <div className="space-y-2 animate-fade-in">

                                    <p className="text-center text-xs font-bold text-rose-600 mb-2">¿Estás segura? Se borrará todo.</p>

                                    <button onClick={executeDeletePatient} disabled={isUpdating} className="w-full py-3 bg-rose-600 text-white rounded-full font-bold text-xs uppercase tracking-widest shadow-md hover:bg-rose-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2">

                                        {isUpdating ? <Icons.Loader2 width={14} className="animate-spin" stroke="#fff" /> : 'SÍ, ELIMINAR DEFINITIVAMENTE'}

                                    </button>

                                    <button onClick={() => setDeleteConfirmation(false)} className="w-full py-3 bg-stone-100 text-stone-500 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-stone-200 active:scale-95 transition-all">Cancelar</button>

                                </div>

                              )}

                          </div>

                      </div>

                  </div>

              </div>

          )}

           

          <div className="flex flex-col md:flex-row gap-8">

              {/* MODIFICACIÓN: OCULTAR LISTA SI HAY PACIENTE SELECCIONADO */}

              {!selectedPatientId && (

                  <div className="w-full md:w-1/3 space-y-6 animate-fade-in">

                      <h3 className="font-serif text-2xl text-stone-800 ml-4 mb-6 text-left font-bold font-serif">Pacientes</h3>

                      <div className="space-y-4">

                        {loading ? <Icons.Loader2 size={24} stroke={BRAND.primary}/> : patients.map(p => (

                            <button key={p.id} onClick={() => setSelectedPatientId(p.id)} className={`w-full p-6 text-left rounded-[3rem] border-2 transition-all bg-white border-stone-100 shadow-sm hover:border-stone-300 active:scale-95`}>

                                <p className="font-bold text-sm font-serif font-serif">{p.name}</p>

                                <p className={`text-[10px] uppercase tracking-wider font-bold opacity-60 mt-2 font-sans`}>{p.category || 'Plan pendiente'}</p>

                            </button>

                        ))}

                      </div>

                  </div>

              )}



              {/* MODIFICACIÓN: ANCHO COMPLETO SI ESTÁ SELECCIONADO */}

              {selectedPatientId && (

                  <div className="flex-1 bg-white rounded-[3.5rem] shadow-sm p-10 border-2 border-stone-50 min-h-[75vh] animate-fade-in relative shadow-stone-200 text-left font-serif">

                      {selectedPatientData ? (

                          <div>

                              <div className="flex justify-between items-center mb-8">

                                  <button onClick={() => setSelectedPatientId(null)} className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest">

                                      <Icons.ArrowLeft size={14} /> Volver a la lista

                                  </button>

                                  <button onClick={() => setShowManageModal(true)} className="flex items-center gap-2 text-[10px] font-bold text-stone-500 bg-stone-50 border border-stone-200 px-4 py-2 rounded-full hover:bg-stone-100 transition-colors uppercase tracking-widest shadow-sm">

                                      <Icons.Settings size={14} /> Gestión

                                  </button>

                              </div>

                              <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b border-stone-100 pb-10">

                                <div>

                                    <h3 className="font-serif text-3xl md:text-5xl text-stone-800 mb-2 font-serif font-bold">{selectedPatientProfile?.name}</h3>

                                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.3em] font-sans font-bold">Bitácora de seguimiento clínico</p>

                                </div>

                                <div className="flex flex-wrap gap-4 font-sans text-center mt-4 md:mt-0">

                                    <div className="text-center bg-stone-50 p-3 md:p-5 rounded-[2rem] border border-stone-100 shadow-inner min-w-[100px]">

                                        <p className="text-[8px] font-bold text-stone-400 uppercase mb-1 font-sans font-bold">Cumplimiento</p>

                                        <p className="text-xl md:text-2xl font-bold text-emerald-600">{dashboardData.totalStats.adherence}%</p>

                                    </div>

                                    <div className="text-center bg-stone-50 p-3 md:p-5 rounded-[2rem] border border-stone-100 shadow-inner min-w-[100px]">

                                        <p className="text-[8px] font-bold text-stone-400 uppercase mb-1 font-serif font-bold text-left font-serif font-bold">Energía Ø</p>

                                        <p className="text-xl md:text-2xl font-bold text-stone-700">{dashboardData.totalStats.energy}</p>

                                    </div>

                                    <div className="text-center bg-rose-50 p-3 md:p-5 rounded-[2rem] border border-rose-100 shadow-inner min-w-[100px]">

                                        <p className="text-[8px] font-bold text-rose-400 uppercase mb-1 font-serif font-bold font-serif font-bold">Dificultades</p>

                                        <p className="text-xl md:text-2xl font-bold text-rose-600">{dashboardData.totalStats.difficultyTotal}</p>

                                    </div>

                                </div>

                              </div>



                              <div className="mb-12">

                                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 ml-2 font-serif font-bold text-left font-serif">Resumen Global de Objetivos (Total Acumulado)</h4>

                                    <div className="flex flex-col md:flex-row items-center justify-around bg-stone-50 rounded-[3rem] border-2 border-stone-100 p-8">

                                        <div className="mb-6 md:mb-0">

                                            <SimplePieChart data={dashboardData.globalPieData} />

                                        </div>

                                        <div className="space-y-3 text-left w-full md:w-auto px-4">

                                            {dashboardData.globalPieData.map((slice, i) => (

                                                <div key={i} className="flex items-center gap-3">

                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>

                                                    <span className="text-xs font-bold text-stone-600 font-serif">{slice.label}: {slice.value} objs</span>

                                                </div>

                                            ))}

                                            <p className="text-[10px] text-stone-400 pt-2 italic">Total objetivos registrados: {dashboardData.globalPieData.reduce((a,b)=>a+b.value,0)}</p>

                                        </div>

                                    </div>

                              </div>



                              {/* --- SECCIÓN DE RESUMEN SEMANAL --- */}

                              <div className="mt-16">

                                  <div className="flex items-center justify-between mb-6">

                                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-serif font-bold">Resumen Semanal</h4>

                                  </div>

                                  

                                  {/* SELECTOR DE SEMANAS */}

                                  <div className="flex flex-wrap justify-center gap-2 mb-8">

                                      {[...Array(12)].map((_, i) => {

                                          const wNum = i + 1;

                                          const isSelected = selectedWeekForSummary === wNum;

                                          const hasData = dashboardData.weeklyStats[wNum]?.yes + dashboardData.weeklyStats[wNum]?.no + dashboardData.weeklyStats[wNum]?.partial > 0;

                                          return (

                                              <button 

                                                  key={wNum} 

                                                  onClick={() => setSelectedWeekForSummary(wNum)}

                                                  className={`px-4 py-2 md:px-5 md:py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border-2 ${isSelected ? 'bg-stone-800 text-white border-stone-800 shadow-md' : hasData ? 'bg-white text-stone-600 border-stone-200' : 'bg-stone-50 text-stone-300 border-transparent'}`}

                                              >

                                                  Semana {wNum}

                                              </button>

                                          );

                                      })}

                                  </div>



                                  {/* CONTENIDO DE LA SEMANA SELECCIONADA */}

                                  <div className="animate-fade-in-up">

                                      <h5 className="font-serif text-2xl text-stone-800 font-bold mb-8 text-center">Detalle Semana {selectedWeekForSummary}</h5>

                                      

                                      {/* GRÁFICO SEMANAL Y TOTAL DIFICULTADES - CENTRADO */}

                                      <div className="flex flex-col md:flex-row items-center gap-6 mb-12 max-w-md mx-auto">

                                          <div className="w-full bg-white p-6 rounded-[2.5rem] border-2 border-stone-100 shadow-sm flex flex-col items-center justify-center">

                                              <h6 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 w-full text-center">Progreso Semanal</h6>

                                              <SimplePieChart data={weeklyPieData} size={140} />

                                              <div className="mt-6 w-full space-y-2">

                                                  {weeklyPieData.map((slice, i) => (

                                                      <div key={i} className="flex justify-between text-xs font-medium text-stone-600 border-b border-stone-50 pb-1 last:border-0">

                                                          <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: slice.color}}></div>{slice.label}</span>

                                                          <span>{slice.value}</span>

                                                      </div>

                                                  ))}

                                              </div>

                                          </div>

                                          

                                          {/* CARD TOTAL DIFICULTADES SEMANALES */}

                                          <div className="w-full bg-rose-50 p-6 rounded-[2.5rem] border-2 border-rose-100 shadow-sm text-center">

                                              <p className="text-[10px] font-bold text-rose-400 uppercase mb-2">Dificultades (Semana {selectedWeekForSummary})</p>

                                              <p className="text-3xl font-bold text-rose-600">{currentWeekStats.diffCount}</p>

                                          </div>

                                      </div>



                                      {/* REGISTRO DETALLADO FILTRADO POR SEMANA */}

                                      <div className="bg-white rounded-[2.5rem] border-2 border-stone-100 p-8 shadow-sm text-left">

                                          <h6 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6 text-center">Registro Diario Detallado</h6>

                                          <div className="space-y-6">

                                              {currentWeekStats.dayRecords.length > 0 ? currentWeekStats.dayRecords.sort((a,b)=>a.dayNum-b.dayNum).map((record) => {

                                                  const dayName = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][record.dayNum - 1];

                                                  return (

                                                      <div key={record.dayNum} className="border-b border-stone-50 pb-4 last:border-0 last:pb-0">

                                                          <p className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-3 bg-stone-100 inline-block px-3 py-1 rounded-lg">{dayName}</p>

                                                          <div className="grid gap-3">

                                                              {Object.entries(record.objectives).map(([objName, objData], idx) => (

                                                                  <div key={idx} className="flex flex-col gap-3 bg-stone-50 p-4 rounded-2xl">

                                                                      <div className="flex-1">

                                                                          <p className="text-sm font-serif font-bold text-stone-700">{objName}</p>

                                                                      </div>

                                                                      <div className="flex items-center gap-3 flex-wrap">

                                                                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${objData.status === 'yes' ? 'bg-emerald-100 text-emerald-700' : objData.status === 'no' ? 'bg-rose-100 text-rose-700' : 'bg-stone-200 text-stone-600'}`}>

                                                                              {objData.status === 'yes' ? 'Completado' : objData.status === 'no' ? 'No realizado' : 'Parcial'}

                                                                          </span>

                                                                          {objData.energy && (

                                                                              <span className="text-[10px] font-bold text-stone-500 bg-white px-2 py-1 rounded-lg border border-stone-100">

                                                                                  ⚡ {objData.energy}/5

                                                                              </span>

                                                                          )}

                                                                      </div>

                                                                      {(objData.hasDifficulty || objData.adjustment) && (

                                                                          <div className="w-full text-xs text-stone-500 leading-tight bg-white p-3 rounded-xl border border-stone-100">

                                                                              {objData.hasDifficulty && (

                                                                                  <p className="mb-1 text-rose-600 font-medium">

                                                                                      ⚠️ {objData.diffCategory}: {objData.diffSubcategory} {objData.diffDetail ? `- ${objData.diffDetail}` : ''}

                                                                                  </p>

                                                                              )}

                                                                              {objData.adjustment && <p className="italic text-emerald-700">📝 "{objData.adjustment}"</p>}

                                                                          </div>

                                                                      )}

                                                                  </div>

                                                              ))}

                                                          </div>

                                                      </div>

                                                  );

                                              }) : <p className="text-sm text-stone-400 italic text-center py-8">No hay registros diarios para mostrar en esta semana.</p>}

                                          </div>

                                      </div>

                                  </div>

                              </div>



                          </div>

                      ) : (

                          <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-6 opacity-40 animate-fade-in text-center font-sans font-serif font-serif font-sans font-serif font-bold">

                              <Icons.Loader2 width={40} className="animate-spin" />

                              <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-center max-w-[250px] leading-relaxed font-serif font-bold font-sans font-bold">Cargando datos...</p>

                          </div>

                      )}

                  </div>

              )}

          </div>

      </div>

  );

};



// --- APP CORE ---

const App = () => {

  const [authLoading, setAuthLoading] = useState(true); 

  const [user, setUser] = useState(null);

  const [currentView, setCurrentView] = useState('landing'); 

  const [activePatientId, setActivePatientId] = useState(null);



  const [patientName, setPatientName] = useState('');

  const [goalCategory, setGoalCategory] = useState('');

  const [goalSubCategories, setGoalSubCategories] = useState([]); 

  const [objectives, setObjectives] = useState({});



  const [weeksStatus, setWeeksStatus] = useState({});

  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  const [isSaving, setIsSaving] = useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [isEditing, setIsEditing] = useState(false); 



  useEffect(() => {

    const initAuth = async () => {

      try {

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {

          await signInWithCustomToken(auth, __initial_auth_token);

        } else {

          await signInAnonymously(auth);

        }

      } catch (err) { console.error("Auth error:", err); }

    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {

      setUser(u);

      setAuthLoading(false);

    });

    return () => unsubscribe();

  }, []);



  useEffect(() => {

    if (!activePatientId || !user) return;

    const fetchProfile = async () => {

       const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'patients', activePatientId);

       const docSnap = await getDoc(docRef);

       if (docSnap.exists()) {

          const d = docSnap.data(); setPatientName(d.name || ''); setGoalCategory(d.category || ''); setGoalSubCategories(d.subcategories || []); setObjectives(d.objectives || {});

          if (d.category) setCurrentView('dashboard'); else setCurrentView('goal');

       } else setCurrentView('goal');

    };

    

    const unsubWeeks = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'patient_weeks'), (sn) => {

        const rem = {}; 

        sn.forEach(d => { 

            const data = d.data();

            if (data.patientId === activePatientId) {

                const p = d.id.split('_week_'); 

                if (p.length === 2) rem[parseInt(p[1])] = data; 

            }

        });

        setWeeksStatus(rem);

    });

    fetchProfile(); return () => unsubWeeks();

  }, [activePatientId, user]); 



  // useMemo ahora puede usar createWeeksData sin problemas porque está definida arriba

  const weeksData = useMemo(() => {

      return createWeeksData(objectives).map((w, idx) => {

          const statusData = weeksStatus[idx + 1];

          return statusData ? { ...w, ...statusData } : w;

      });

  }, [objectives, weeksStatus]);



  const handlePatientLogin = async (u, p, onErr) => {

     setIsLoggingIn(true);

     try {

       const snap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_credentials', u));

       if (snap.exists()) {

           if(snap.data().password === p) {

               setActivePatientId(snap.data().patientId);

           } else {

               onErr('Contraseña incorrecta');

           }

       } else {

           onErr('Usuario no encontrado');

       }

     } catch (e) { 

         console.error(e);

         onErr('Error de conexión'); 

     } finally {

         setIsLoggingIn(false);

     }

  };



  const handleSaveProfile = async () => {

    if (!activePatientId || !user) return; setIsSaving(true);

    try {

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patients', activePatientId), { name: patientName, category: goalCategory, subcategories: goalSubCategories, objectives: objectives }, { merge: true });

      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'patient_directory', activePatientId), { name: patientName, category: goalCategory, lastUpdated: new Date().toISOString() }, { merge: true });

      const batch = writeBatch(db);

      createWeeksData(objectives).forEach(w => {

          const wRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_weeks', `${activePatientId}_week_${w.week}`);

          batch.set(wRef, { patientId: activePatientId, week: w.week, action: w.action, phase: w.phase }, { merge: true });

      });

      await batch.commit(); 

      setIsEditing(false); 

      setCurrentView('dashboard');

    } catch (e) { console.error(e); }

    setIsSaving(false);

  };



  const handleSaveWeek = async (wData) => {

    if (!activePatientId || !user) return; setIsSaving(true);

    try {

      const weekRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_weeks', `${activePatientId}_week_${activeWeekIndex + 1}`);

      await setDoc(weekRef, { ...wData, patientId: activePatientId }, { merge: true });

    } catch (e) { console.error(e); }

    setIsSaving(false);

  };



  if (authLoading) return <div className="h-screen flex items-center justify-center bg-[#FDFBF8] text-[#C0857D]"><Icons.Loader2 width={40} stroke={BRAND.primary} /></div>;



  return (

    <div className="font-sans antialiased text-stone-800">

       <style>{`

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

          .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }

          .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

          .hide-scrollbar::-webkit-scrollbar { display: none; }

          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

          .custom-scrollbar::-webkit-scrollbar { height: 6px; }

          .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 20px; }

          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E8E4E1; border-radius: 20px; }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C0857D; }

      `}</style>

      {currentView === 'landing' && (

        <HomeView 

          onLogin={handlePatientLogin} 

          onSelectTherapist={() => setCurrentView('therapist_login')} 

          loading={isLoggingIn}

        />

      )}

      {currentView === 'therapist_login' && <TherapistLoginView onLoginSuccess={() => setCurrentView('therapist_dashboard')} onBack={() => setCurrentView('landing')} />}

      {currentView === 'goal' && (

        <GoalView 

            setCurrentView={setCurrentView} 

            goalCategory={goalCategory} 

            setGoalCategory={setGoalCategory} 

            goalSubCategories={goalSubCategories} 

            setGoalSubCategories={setGoalSubCategories} 

            objectives={objectives} 

            setObjectives={setObjectives} 

            onSaveProfile={handleSaveProfile} 

            isSaving={isSaving} 

            onBack={() => {

                if (isEditing) {

                    setIsEditing(false);

                    setCurrentView('dashboard');

                } else {

                    setCurrentView('landing');

                }

            }}

        />

      )}

      {currentView === 'dashboard' && (

        <DashboardView 

            patientName={patientName} 

            activeWeekIndex={activeWeekIndex} 

            setActiveWeekIndex={setActiveWeekIndex} 

            weeksData={weeksData} 

            objectives={objectives} 

            onSaveWeek={handleSaveWeek} 

            isSaving={isSaving} 

            onLogout={() => { setActivePatientId(null); setCurrentView('landing'); }} 

            onEditGoals={() => { setIsEditing(true); setCurrentView('goal'); }}

        />

      )}

      {currentView === 'therapist_dashboard' && <TherapistView onBack={() => setCurrentView('landing')} user={user} />}

    </div>

  );

};



export default App;