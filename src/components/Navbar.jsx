import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Bell, LogOut, Activity, RotateCcw, Cloud, CloudOff, RefreshCw, User, Users, Palette, Check, Banknote } from 'lucide-react';

export default function Navbar({
  congregationName,
  userRole,
  userName,
  networkStatus,
  connectedUsers,
  theme,
  setTheme,
  onLogout,
  onOpenDiagnostics,
  onOpenReset,
  onOpenCashCount
}) {
  const { isOnline, isSyncing, pendingCount } = networkStatus;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const menuRef = useRef(null);
  const themeRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleLabel = () => {
    switch (userRole) {
      case 'SUPERADMIN': return '👑 Super Administrador';
      case 'ADMIN': return 'Pastor - Administrador';
      case 'TESORERO': return 'Tesorero General';
      case 'VISITA': return 'Visita (Solo Lectura)';
      default: return userRole;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Congregation Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-white/5 flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Gestión de Comités
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {congregationName || 'Congregación Central'}
            </p>
          </div>
        </div>

        {/* Right side: Sync Status + Cash Count + Theme + Menu */}
        <div className="flex items-center gap-2 sm:gap-3 relative" ref={menuRef}>
          
          {/* Botón Arqueo y Conteo Rápido */}
          <button
            onClick={onOpenCashCount}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-black text-xs border border-emerald-200 dark:border-emerald-800/80 shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Arqueo y Conteo Rápido de Efectivo"
          >
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Arqueo</span>
          </button>
          
          {/* Theme Selector */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all focus:outline-none"
              title="Seleccionar Tema"
            >
              <Palette className="w-5 h-5" />
            </button>
            
            {isThemeOpen && (
              <div className="absolute right-0 top-12 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform origin-top-right transition-all z-50">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estilos Visuales</p>
                </div>
                <div className="py-2">
                  <button onClick={() => { setTheme('modern-light'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-500 shadow-sm"></div> ☀️ Tema Claro (Recomendado)</span>
                    {theme === 'modern-light' && <Check className="w-4 h-4 text-blue-600 dark:text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('dark-premium'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-600"></div> 🌙 Dark Premium</span>
                    {theme === 'dark-premium' && <Check className="w-4 h-4 text-blue-600 dark:text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('corporate-blue'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-blue-100 border border-blue-300"></div> Corporate Blue</span>
                    {theme === 'corporate-blue' && <Check className="w-4 h-4 text-blue-600 dark:text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('executive-graphite'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-500"></div> Executive Graphite</span>
                    {theme === 'executive-graphite' && <Check className="w-4 h-4 text-blue-600 dark:text-emerald-400" />}
                  </button>
                  <button onClick={() => { setTheme('forest-emerald'); setIsThemeOpen(false); }} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                    <span className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-emerald-50 border border-emerald-300"></div> Forest Emerald</span>
                    {theme === 'forest-emerald' && <Check className="w-4 h-4 text-blue-600 dark:text-emerald-400" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kebab Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all focus:outline-none"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Pop-up Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform origin-top-right transition-all z-50" ref={menuRef}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{userName}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{getRoleLabel()}</p>
                  </div>
                </div>
              </div>

              <div className="py-2">
                <div className="px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{connectedUsers || 1} Usuarios Activos</span>
                </div>

                <button
                  onClick={() => { setIsMenuOpen(false); if (onOpenCashCount) onOpenCashCount(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left cursor-pointer"
                >
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Conteo de Efectivo (Arqueo)</span>
                </button>

                <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Notificaciones</span>
                </button>

                <button
                  onClick={() => { setIsMenuOpen(false); onOpenDiagnostics(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Diagnóstico</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.location.reload();
                  }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-500" />
                  <span>Refrescar App</span>
                </button>

                <button
                  onClick={() => { setIsMenuOpen(false); onOpenReset(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>Restablecer Datos</span>
                </button>
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => { setIsMenuOpen(false); onLogout(); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
