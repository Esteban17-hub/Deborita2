import React, { useState } from 'react';
import { Building2, User, ShieldCheck, KeyRound, Crown, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { verifyPin } from '../utils/security';

export default function LoginModal({ 
  isOpen, 
  onClose, 
  onLogin, 
  currentCongregation, 
  currentRole, 
  congregations = [], 
  users = [],
  committees = []
}) {
  const defaultCongId = congregations.find(c => c.name === currentCongregation)?.id || (congregations.length > 0 ? congregations[0].id : '');
  
  // Modo de Login: 'congregational' o 'superadmin'
  const [loginMode, setLoginMode] = useState('congregational');
  
  // Estados para Acceso Congregacional
  const [congregationId, setCongregationId] = useState(defaultCongId);
  const [role, setRole] = useState(currentRole || 'TESORERO');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [pin, setPin] = useState('');
  
  // Estados para Acceso SuperAdmin
  const [superAdminPin, setSuperAdminPin] = useState('');
  
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);

  // Sincronizar select cuando cargan las congregaciones
  React.useEffect(() => {
    if (!congregationId && congregations.length > 0) {
      setCongregationId(congregations[0].id);
    }
  }, [congregations, congregationId]);

  // Lista de usuarios de comités para la congregación seleccionada
  const committeeUsers = useMemo(() => {
    return users.filter(u => u.congregationId === congregationId && u.role === 'COMITE');
  }, [users, congregationId]);

  React.useEffect(() => {
    if (role === 'COMITE' && committeeUsers.length > 0) {
      if (!selectedUserId || !committeeUsers.some(u => u.id === selectedUserId)) {
        setSelectedUserId(committeeUsers[0].id);
      }
    }
  }, [role, committeeUsers, selectedUserId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- ACCESO SUPERADMIN ---
    if (loginMode === 'superadmin') {
      const superUser = users.find(u => u.role === 'SUPERADMIN');
      if (!superUser) {
        setError('El usuario SuperAdmin aún no se ha inicializado en la base de datos.');
        return;
      }

      if (!verifyPin(superAdminPin, superUser.pin)) {
        setError('PIN de SuperAdmin incorrecto.');
        return;
      }

      onLogin({
        congregation: 'Panel General',
        congregationId: congregations[0]?.id || 'global',
        username: superUser.name || 'SuperAdmin',
        role: 'SUPERADMIN',
        committeeId: null,
        remember: remember
      });
      setSuperAdminPin('');
      onClose();
      return;
    }

    // --- ACCESO CONGREGACIONAL REGULAR ---
    let user;
    if (role === 'COMITE') {
      user = committeeUsers.find(u => u.id === selectedUserId) || committeeUsers[0];
      if (!user) {
        setError('No hay un usuario de comité creado para esta congregación.');
        return;
      }
    } else {
      user = users.find(u => u.congregationId === congregationId && u.role === role);
    }
    
    if (!user) {
      setError('No se encontró un usuario con este rol para la congregación seleccionada.');
      return;
    }
    
    if (!verifyPin(pin, user.pin)) {
      setError('PIN incorrecto. Intente nuevamente.');
      return;
    }

    const selectedCongregation = congregations.find(c => c.id === congregationId);
    
    onLogin({ 
      congregation: selectedCongregation ? selectedCongregation.name : 'Mi Congregación',
      congregationId: congregationId, 
      username: user.name, 
      role: user.role,
      committeeId: user.committeeId || null,
      remember: remember
    });
    setPin('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-5">
        
        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
            loginMode === 'superadmin'
              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-indigo-500/25'
              : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/25'
          }`}>
            {loginMode === 'superadmin' ? (
              <Crown className="w-6 h-6 text-amber-300 animate-pulse" />
            ) : (
              <Building2 className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {loginMode === 'superadmin' ? 'Acceso SuperAdmin' : 'Acceso al Sistema'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {loginMode === 'superadmin' ? 'Panel de Control Maestro' : 'Gestión Contable Congregacional'}
            </p>
          </div>
        </div>

        {/* Selector de Pestaña de Acceso: Congregacional vs SuperAdmin */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setLoginMode('congregational'); setError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'congregational'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sede Local</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode('superadmin'); setError(''); }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              loginMode === 'superadmin'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>SuperAdmin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {loginMode === 'superadmin' ? (
            // --- VISTA: ACCESO SUPERADMIN ---
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  <span>Usuario Maestro: <strong>SuperAdmin</strong></span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Acceso con privilegios de creación, autorización de sedes y gestión de usuarios.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  PIN de Acceso SuperAdmin
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={superAdminPin}
                    onChange={(e) => setSuperAdminPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    autoFocus
                    placeholder="Ingrese su PIN de seguridad"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-900">
                  {error}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="remember-super"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="remember-super" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Recordar sesión de SuperAdmin
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all cursor-pointer mt-2"
              >
                Entrar al Panel de Administración
              </button>
            </div>
          ) : (
            // --- VISTA: ACCESO CONGREGACIONAL REGULAR ---
            <div className="space-y-4 animate-fade-in">
              
              {/* 1. Selector de Congregación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  🏛️ Congregación
                </label>
                <select
                  value={congregationId}
                  onChange={(e) => setCongregationId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  {congregations.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Rol de Acceso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  👤 Rol de Acceso / Usuario
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      role === 'ADMIN'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pastor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('TESORERO')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      role === 'TESORERO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Tesorero</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('COMITE')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      role === 'COMITE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Comité</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('VISITA')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      role === 'VISITA'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20 font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Visita</span>
                  </button>
                </div>
              </div>

              {/* Selector de Usuario / Comité cuando role === 'COMITE' */}
              {role === 'COMITE' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 animate-fade-in">
                  <label className="block text-xs font-black text-blue-950 dark:text-blue-200 uppercase">
                    🏛️ Seleccionar Usuario del Comité
                  </label>
                  {committeeUsers.length === 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      No hay usuarios de comité creados para esta congregación. Ingrese como Pastor o SuperAdmin para crear uno.
                    </p>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {committeeUsers.map(u => {
                        const comm = committees.find(c => c.id === u.committeeId);
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} — {comm ? comm.name : 'Comité Asignado'}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}

              {/* 3. PIN de Seguridad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  🔑 PIN de Acceso
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    placeholder="Ingrese su PIN numérico"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-xs font-bold bg-red-50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-900">
                  {error}
                </p>
              )}

              {role === 'VISITA' && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                  ⚠️ Modo Solo Lectura: El módulo de Diezmos estará oculto y no podrá crear o editar registros.
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                  Recordar inicio de sesión
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer mt-2"
              >
                Ingresar a la Sede
              </button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
}
