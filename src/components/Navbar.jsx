import React from 'react';
import { Cloud, CloudOff, RefreshCw, UserCheck, Users, RotateCcw } from 'lucide-react';
import { triggerBackgroundSync } from '../services/syncEngine';

export default function Navbar({
  congregationName,
  userRole,
  userName,
  networkStatus,
  onLogout,
  onOpenDiagnostics,
  onOpenReset
}) {
  const { isOnline, isSyncing, pendingCount } = networkStatus;

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300';
      case 'TESORERO': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
      case 'VISITA': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'ADMIN': return 'Administrador';
      case 'TESORERO': return 'Tesorero General';
      case 'VISITA': return 'Visita (Solo Lectura)';
      default: return userRole;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Brand & Congregation Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-slate-200">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Gestión de Comités
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {congregationName || 'Congregación Central'}
            </p>
          </div>
        </div>

        {/* Sync Indicator & Controls */}
        <div className="flex items-center gap-2">
          
          {/* Indicador de Nube y Estado Offline */}
          <button
            onClick={() => triggerBackgroundSync()}
            title={isOnline ? 'En línea (Clic para sincronizar)' : 'Modo Sin Conexión (Offline)'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 animate-pulse'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            ) : isOnline ? (
              <Cloud className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloudOff className="w-4 h-4 text-amber-600" />
            )}

            <span className="hidden sm:inline">
              {isSyncing ? 'Sincronizando...' : isOnline ? 'En línea' : 'Modo Offline'}
            </span>

            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full text-[10px] shadow-sm">
                {pendingCount} pend.
              </span>
            )}
          </button>

          {/* Indicador de Presencia Activa (Realtime) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700" title="Usuarios conectados">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="hidden md:inline">1 Conectado(s)</span>
          </div>

          {/* Badge de Rol y Logout */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${getRoleBadgeColor()}`} title="Rol actual">
            <UserCheck className="w-4 h-4" />
            <span>{userName} ({getRoleLabel()})</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 text-xs font-bold transition-all"
            title="Cerrar sesión"
          >
            <span>Cerrar sesión</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/60 text-xs font-bold transition-all"
            title="Diagnosticar Conexión"
          >
            <span>Diagnóstico</span>
          </button>

          <button
            onClick={onOpenReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 text-xs font-bold transition-all"
            title="Restablecer Datos de Fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

        </div>

      </div>
    </header>
  );
}
