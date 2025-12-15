import React, { useState } from 'react';
import { FileText, Download, Copy, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

const ClinicalReport = ({ db, appId, userId, profileName }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [range, setRange] = useState(30); // days
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReport('');

    try {
      // 1. Fetch Data
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - range);

      // Daily Logs
      const logsRef = collection(db, 'artifacts', appId, 'users', userId, 'daily_logs');
      const logsQ = query(logsRef, orderBy('createdAt', 'desc'), limit(100)); // Simple fetch then filter client side for ease
      const logsSnap = await getDocs(logsQ);
      const logs = logsSnap.docs
        .map(d => d.data())
        .filter(d => d.createdAt && d.createdAt.toDate() >= startDate);

      // Journal Milestones
      const journalRef = collection(db, 'artifacts', appId, 'users', userId, 'journal');
      const journalQ = query(journalRef, orderBy('createdAt', 'desc'), limit(50));
      const journalSnap = await getDocs(journalQ);
      const journal = journalSnap.docs
        .map(d => d.data())
        .filter(d => d.createdAt && d.createdAt.toDate() >= startDate);

      // 2. Prepare Prompt Data
      const logSummary = logs.map(l => `- ${l.date}: Estado ${l.mood} (${l.factors.join(', ')})`).join('\n');
      const journalSummary = journal.map(j => `- ${j.createdAt.toDate().toLocaleDateString()}: ${j.title} - ${j.content.substring(0, 100)}...`).join('\n');
      
      const promptData = `
        DATOS DEL PACIENTE: ${profileName || 'Paciente'}
        PERIODO: Últimos ${range} días.
        
        REGISTRO DIARIO (Estado de ánimo y Factores):
        ${logSummary || 'No hay registros diarios.'}
        
        BITÁCORA DE HITOS (Crisis, Logros, Eventos):
        ${journalSummary || 'No hay hitos registrados.'}
      `;

      // 3. Call AI
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Falta API Key");

      const systemPrompt = `
        Actúa como un Asistente Clínico Experto. Escribe un REPORTE CLÍNICO RESUMIDO para un Neurólogo/Psiquiatra.
        Usa lenguaje formal, médico y objetivo.
        Estructura:
        1. RESUMEN GENERAL: Tendencia de estado de ánimo y regulación.
        2. FACTORES DESENCADENANTES IDENTIFICADOS: Patrones (sueño, rutinas, etc).
        3. HITOS RELEVANTES: Crisis o avances significativos.
        4. OBSERVACIONES: Sugerencias basadas en los datos.
        
        No inventes datos. Si no hay suficiente información, indícalo.
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nDATOS A ANALIZAR:\n" + promptData }] }]
        })
      });

      const data = await response.json();
      if (!data.candidates || !data.candidates[0].content) throw new Error("Error generando reporte");
      
      setReport(data.candidates[0].content.parts[0].text);

    } catch (err) {
      console.error(err);
      setError('Error al generar el reporte. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Reporte Clínico
          </h3>
          <p className="text-xs text-slate-500 mt-1">Genera un resumen para médicos o terapeutas.</p>
        </div>
      </div>

      <div className="p-6">
        {!report ? (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Periodo a analizar:</label>
              <div className="flex gap-2">
                {[7, 15, 30, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${range === d ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
                  >
                    {d} días
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {loading ? 'Analizando datos...' : 'Generar Reporte con IA'}
            </button>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="bg-slate-50 border p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed h-96 overflow-y-auto mb-4 custom-scrollbar">
              {report}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copiar Texto
              </button>
              <button
                onClick={() => setReport('')}
                className="px-4 py-2.5 text-slate-500 font-medium hover:text-slate-800 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalReport;
