import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getPendingCount } from '../services/syncEngine';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function DiagnosticsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const runDiagnostics = async () => {
    setLoading(true);
    setResults(null);

    const supaUrl = import.meta.env.VITE_SUPABASE_URL;
    const supaKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const hasSupaUrl = !!supaUrl;
    const hasSupaKey = !!supaKey;
    const isSupaClientInit = !!supabase;

    let pingOk = false;
    let pingError = null;
    let queryData = null;
    let pendingQueueSize = 0;

    try {
      pendingQueueSize = await getPendingCount();
    } catch (e) {
      console.error(e);
    }

    if (isSupaClientInit) {
      try {
        const start = Date.now();
        const { data, error } = await supabase.from('congregations').select('*').limit(1);
        if (error) {
          pingError = `${error.code}: ${error.message}`;
        } else {
          pingOk = true;
          queryData = data;
        }
      } catch (err) {
        pingError = err.message || String(err);
      }
    }

    setResults({
      hasSupaUrl,
      hasSupaKey,
      isSupaClientInit,
      supaUrlPrefix: supaUrl ? supaUrl.substring(0, 15) + '...' : 'Faltante',
      supaKeyPrefix: supaKey ? supaKey.substring(0, 15) + '...' : 'Faltante',
      pingOk,
      pingError,
      queryData,
      pendingQueueSize,
      userAgent: navigator.userAgent
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Diagnóstico de Conexión</h2>
            <p className="text-xs text-slate-500">Verifica la salud de la sincronización en la nube</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analizando conexión...</span>
              </>
            ) : (
              <span>Ejecutar Diagnóstico</span>
            )}
          </button>

          {results && (
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm overflow-y-auto max-h-96">
              {/* Variables de Entorno */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">1. Variables cargadas en Vercel</p>
                <div className="flex justify-between items-center">
                  <span>URL de Supabase:</span>
                  <span className={results.hasSupaUrl ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {results.hasSupaUrl ? "Cargado" : "FALTANTE"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono pl-2">{results.supaUrlPrefix}</div>

                <div className="flex justify-between items-center">
                  <span>Clave Pública (Anon Key):</span>
                  <span className={results.hasSupaKey ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {results.hasSupaKey ? "Cargado" : "FALTANTE"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono pl-2">{results.supaKeyPrefix}</div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Estado del Cliente */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">2. Inicialización del Cliente</p>
                <div className="flex justify-between items-center">
                  <span>Cliente Supabase listo:</span>
                  <span className={results.isSupaClientInit ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                    {results.isSupaClientInit ? "SÍ" : "NO"}
                  </span>
                </div>
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Prueba de Ping */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">3. Prueba de Conexión en Vivo</p>
                {results.pingOk ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Conexión Exitosa con la Nube!</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-600 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Fallo de Conexión</span>
                    </div>
                    {results.pingError && (
                      <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-xs font-mono break-words">
                        {results.pingError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <hr className="border-slate-200 dark:border-slate-800" />

              {/* Cola de Sincronización */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase">4. Cola Local de Pendientes</p>
                <div className="flex justify-between items-center">
                  <span>Cambios por subir a la nube:</span>
                  <span className="font-bold">{results.pendingQueueSize} cambios</span>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className="mt-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 p-3 rounded-xl border border-blue-150 dark:border-blue-900/50 text-xs">
                <p className="font-bold mb-1">💡 Consejos de solución rápida:</p>
                <ul className="list-disc pl-4 space-y-1">
                  {!results.hasSupaUrl || !results.hasSupaKey ? (
                    <li>Las variables de entorno en Vercel siguen vacías. Revisa la guía en Vercel, agrégalas y haz un <strong>Redeploy</strong>.</li>
                  ) : !results.pingOk ? (
                    <li>
                      <strong>Posible Bloqueo de Red:</strong> Desactiva temporalmente el VPN de Opera, Brave Shields, o extensiones bloqueadoras de anuncios y recarga.
                    </li>
                  ) : results.pendingQueueSize > 0 ? (
                    <li>Hay datos en cola. La sincronización debería completarse en segundos. Si no, dale clic al ícono de la nube en la barra superior para forzar.</li>
                  ) : (
                    <li>Todo el sistema está sano. Si no ves los datos reflejados, asegúrate de estar usando la misma congregación exacta en ambos dispositivos.</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
