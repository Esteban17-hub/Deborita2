import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, Shield, PlusCircle, Pencil, Trash2, KeyRound, 
  CheckCircle2, XCircle, Search, Filter, Layers, ArrowRight, Activity, 
  TrendingUp, Sparkles, UserCheck, RefreshCw, Eye, ShieldCheck, History, Clock, FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { hashPin } from '../utils/security';
import { exportToExcel } from '../utils/exportHelpers';
import { logAuditAction } from '../utils/auditLogger';
import { toast } from 'react-hot-toast';

export default function AdminView({
  congregations = [],
  users = [],
  committees = [],
  movements = [],
  tithes = [],
  offerings = [],
  projects = [],
  activeCongregationId,
  onSelectCongregation,
  onCreateCongregation,
  onUpdateCongregation,
  onDeleteCongregation,
  onCreateUser,
  onUpdateUser,
  onResetPin,
  onDeleteUser,
  isMobile = false
}) {
  const [activeSubTab, setActiveSubTab] = useState('congregations'); // 'congregations', 'users', 'overview'
  
  // Filtros y búsquedas
  const [searchCongQuery, setSearchCongQuery] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userCongFilter, setUserCongFilter] = useState('ALL');

  // Modales
  const [isCongModalOpen, setIsCongModalOpen] = useState(false);
  const [editingCong, setEditingCong] = useState(null);
  const [congName, setCongName] = useState('');
  const [congCity, setCongCity] = useState('');
  const [congPastorName, setCongPastorName] = useState('');
  const [congTreasurerName, setCongTreasurerName] = useState('');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [targetCongId, setTargetCongId] = useState(congregations[0]?.id || '');
  const [targetCommitteeId, setTargetCommitteeId] = useState('');
  const [userNameInput, setUserNameInput] = useState('');
  const [userRoleInput, setUserRoleInput] = useState('TESORERO');
  const [userPinInput, setUserPinInput] = useState('1234');

  const [isResetPinModalOpen, setIsResetPinModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState(null);
  const [newPinInput, setNewPinInput] = useState('');

  // Estadísticas Globales
  const totalCongregations = congregations.length;
  const regularUsers = users.filter(u => u.role !== 'SUPERADMIN');
  const totalUsers = regularUsers.length;
  
  const totalMovementsAmount = movements.filter(m => !m.annulled && m.type === 'INGRESO').reduce((sum, m) => sum + (m.amount || 0), 0);
  const totalTithesAmount = tithes.reduce((sum, t) => sum + (t.grossTithe || 0), 0);
  const totalOfferingsAmount = offerings.reduce((sum, o) => sum + (o.amount || 0), 0);
  const globalRecaudo = totalMovementsAmount + totalTithesAmount + totalOfferingsAmount;

  // Congregaciones filtradas
  const filteredCongregations = useMemo(() => {
    return congregations.filter(c => {
      if (!c) return false;
      const q = searchCongQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q)
      );
    });
  }, [congregations, searchCongQuery]);

  // Usuarios filtrados
  const filteredUsers = useMemo(() => {
    return regularUsers.filter(u => {
      if (!u) return false;
      if (userCongFilter !== 'ALL' && u.congregationId !== userCongFilter) {
        return false;
      }
      const q = searchUserQuery.toLowerCase().trim();
      if (!q) return true;
      const cong = congregations.find(c => c.id === u.congregationId);
      const congName = (cong?.name || '').toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        congName.includes(q)
      );
    });
  }, [regularUsers, userCongFilter, searchUserQuery, congregations]);

  // Manejadores de Congregaciones
  const handleOpenCreateCong = () => {
    setEditingCong(null);
    setCongName('');
    setCongCity('');
    setCongPastorName('');
    setCongTreasurerName('');
    setIsCongModalOpen(true);
  };

  const handleOpenEditCong = (cong) => {
    setEditingCong(cong);
    setCongName(cong.name || '');
    setCongCity(cong.city || '');
    setIsCongModalOpen(true);
  };

  const handleSubmitCong = async (e) => {
    e.preventDefault();
    if (!congName.trim()) {
      toast.error('El nombre de la congregación es obligatorio');
      return;
    }

    if (editingCong) {
      if (onUpdateCongregation) {
        await onUpdateCongregation(editingCong.id, {
          name: congName.trim(),
          city: congCity.trim()
        });
      }
    } else {
      if (onCreateCongregation) {
        await onCreateCongregation(
          congName.trim(),
          congPastorName.trim() || 'Pastor',
          congTreasurerName.trim() || 'Tesorero'
        );
      }
    }

    setIsCongModalOpen(false);
  };

  // Manejadores de Usuarios
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    const initialCong = congregations[0]?.id || '';
    setTargetCongId(initialCong);
    const firstComm = committees.find(c => c.congregationId === initialCong);
    setTargetCommitteeId(firstComm?.id || '');
    setUserNameInput('');
    setUserRoleInput('TESORERO');
    setUserPinInput('1234');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setTargetCongId(user.congregationId);
    setTargetCommitteeId(user.committeeId || '');
    setUserNameInput(user.name || '');
    setUserRoleInput(user.role || 'TESORERO');
    setIsUserModalOpen(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!userNameInput.trim()) {
      toast.error('El nombre del usuario es obligatorio');
      return;
    }

    if (userRoleInput === 'COMITE' && !targetCommitteeId) {
      toast.error('Debe seleccionar un comité para este usuario');
      return;
    }

    if (editingUser) {
      if (onUpdateUser) {
        await onUpdateUser(editingUser.id, {
          name: userNameInput.trim(),
          role: userRoleInput,
          congregationId: targetCongId,
          committeeId: userRoleInput === 'COMITE' ? targetCommitteeId : null
        });
      }
    } else {
      if (!userPinInput.trim() || userPinInput.length < 4) {
        toast.error('El PIN debe tener al menos 4 dígitos numéricos');
        return;
      }
      if (onCreateUser) {
        await onCreateUser({
          congregationId: targetCongId,
          name: userNameInput.trim(),
          role: userRoleInput,
          pin: hashPin(userPinInput.trim()),
          committeeId: userRoleInput === 'COMITE' ? targetCommitteeId : null
        });
      }
    }

    setIsUserModalOpen(false);
  };

  // Manejador de Restablecer PIN
  const handleOpenResetPin = (user) => {
    setTargetResetUser(user);
    setNewPinInput('');
    setIsResetPinModalOpen(true);
  };

  const handleSubmitResetPin = async (e) => {
    e.preventDefault();
    if (!newPinInput.trim() || newPinInput.length < 4) {
      toast.error('El nuevo PIN debe tener al menos 4 dígitos');
      return;
    }

    if (onResetPin && targetResetUser) {
      await onResetPin(targetResetUser.id, hashPin(newPinInput.trim()));
      toast.success(`PIN actualizado correctamente para ${targetResetUser.name}`);
    }

    setIsResetPinModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner SuperAdmin */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-6 ${isMobile ? 'p-6' : 'p-8'} rounded-3xl text-white shadow-2xl relative overflow-hidden`}
        style={{ backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 80%, #6366f1 100%)', boxShadow: '0 20px 40px -15px rgba(67, 56, 202, 0.4)' }}
      >
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-200 bg-white/15 px-3 py-1 rounded-full inline-block mb-2 backdrop-blur-sm">
            👑 Panel Maestro de Administración
          </span>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-white mb-1 tracking-tight`}>
            Administración Global del Sistema
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 font-medium opacity-90">
            Control centralizado de congregaciones, permisos de acceso y usuarios independientes
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-wrap">
          <button
            onClick={handleOpenCreateCong}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs shadow-lg shadow-black/20 transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Nueva Congregación</span>
          </button>

          <button
            onClick={handleOpenCreateUser}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-bold text-xs border border-indigo-300/30 backdrop-blur-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Crear Usuario</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Congregaciones */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-900 border-2 border-indigo-200 dark:border-indigo-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-1 rounded-lg">
              Sedes
            </span>
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-indigo-950 dark:text-white tracking-tight">
            {totalCongregations}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Congregaciones activas
          </p>
        </div>

        {/* Usuarios Registrados */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 border-2 border-emerald-200 dark:border-emerald-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
              Usuarios
            </span>
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-950 dark:text-white tracking-tight">
            {totalUsers}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Cuentas independientes
          </p>
        </div>

        {/* Comités Totales */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-slate-900 border-2 border-purple-200 dark:border-purple-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2.5 py-1 rounded-lg">
              Comités
            </span>
            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-950 dark:text-white tracking-tight">
            {committees.length}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Departamentos y comités
          </p>
        </div>

        {/* Recaudo Consolidado General */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-slate-900 border-2 border-amber-200 dark:border-amber-900/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg">
              Recaudo
            </span>
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-950 dark:text-white tracking-tight truncate">
            {formatCurrency(globalRecaudo)}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            Consolidado histórico
          </p>
        </div>

      </div>

      {/* 3. Selector de Sub-Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
        <button
          onClick={() => setActiveSubTab('congregations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'congregations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Gestión de Congregaciones ({congregations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Usuarios por Sede ({regularUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Auditoría y Resumen Financiero</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'audit_logs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Logs de Auditoría & Trazabilidad</span>
        </button>
      </div>

      {/* PESTAÑA 1: GESTIÓN DE CONGREGACIONES */}
      {activeSubTab === 'congregations' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar congregación por nombre o ciudad..."
                value={searchCongQuery}
                onChange={(e) => setSearchCongQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              onClick={handleOpenCreateCong}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Añadir Sede</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCongregations.map(cong => {
              const congUsers = users.filter(u => u.congregationId === cong.id);
              const congCommittees = committees.filter(c => c.congregationId === cong.id);
              const congMovements = movements.filter(m => m.congregationId === cong.id && !m.annulled);
              const isCurrent = cong.id === activeCongregationId;

              return (
                <div 
                  key={cong.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                    isCurrent 
                      ? 'border-indigo-600 shadow-indigo-500/10 ring-2 ring-indigo-500/30' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isCurrent ? '⭐ Sede en Vista Actual' : 'Congregación'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditCong(cong)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/60 cursor-pointer"
                          title="Editar congregación"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteCongregation && (
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar la congregación "${cong.name}" y todos sus registros asociados? Esta acción no se puede deshacer.`)) {
                                onDeleteCongregation(cong.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 cursor-pointer"
                            title="Eliminar congregación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                      🏛️ {cong.name}
                    </h3>
                    {cong.city && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        📍 {cong.city}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Usuarios</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{congUsers.length}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Comités</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{congCommittees.length}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">Movs</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{congMovements.length}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onSelectCongregation) {
                        onSelectCongregation(cong.id, cong.name);
                        toast.success(`Visualizando ahora: ${cong.name}`);
                      }
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-95'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{isCurrent ? 'Inspeccionando esta Sede' : 'Inspeccionar Sede'}</span>
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* PESTAÑA 2: GESTIÓN DE USUARIOS POR SEDE */}
      {activeSubTab === 'users' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar usuario por nombre o rol..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <select
                value={userCongFilter}
                onChange={(e) => setUserCongFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">🏛️ Todas las Sedes</option>
                {congregations.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Rol Asignado</th>
                  <th className="py-3.5 px-4">Congregación</th>
                  <th className="py-3.5 px-4 text-right">Acciones de Seguridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(u => {
                  const cong = congregations.find(c => c.id === u.congregationId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                            <span className="text-[10px] text-slate-400">ID: {u.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          u.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300' 
                            : u.role === 'TESORERO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                            : u.role === 'COMITE'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                        }`}>
                          {u.role === 'ADMIN' 
                            ? 'Pastor Titular' 
                            : u.role === 'TESORERO' 
                            ? 'Tesorero Local' 
                            : u.role === 'COMITE'
                            ? `Comité: ${committees.find(c => c.id === u.committeeId)?.name || 'Asignado'}`
                            : 'Visita / Auditor'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        🏛️ {cong ? cong.name : 'Sin sede asignada'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenResetPin(u)}
                            className="flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 font-bold text-xs hover:scale-105 transition-all cursor-pointer"
                            title="Cambiar o restablecer PIN de acceso"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Cambiar PIN</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/60 cursor-pointer"
                            title="Editar usuario"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteUser && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar el usuario "${u.name}"?`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/60 cursor-pointer"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* PESTAÑA 3: AUDITORÍA Y RESUMEN FINANCIERO GLOBAL */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Consolidado Financiero por Congregación
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resumen comparativo de movimientos, diezmos y ofrendas de todas las sedes
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px]">
                    <th className="py-3 px-4">Congregación</th>
                    <th className="py-3 px-4 text-right">Ingresos Comités</th>
                    <th className="py-3 px-4 text-right">Egresos Comités</th>
                    <th className="py-3 px-4 text-right">Diezmos Recaudados</th>
                    <th className="py-3 px-4 text-right">Ofrendas Locales</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {congregations.map(c => {
                    const cMovs = movements.filter(m => m.congregationId === c.id && !m.annulled);
                    const cIncome = cMovs.filter(m => m.type === 'INGRESO').reduce((s, m) => s + (m.amount || 0), 0);
                    const cExpense = cMovs.filter(m => m.type === 'EGRESO').reduce((s, m) => s + (m.amount || 0), 0);
                    const cTithes = tithes.filter(t => t.congregationId === c.id).reduce((s, t) => s + (t.grossTithe || 0), 0);
                    const cOffs = offerings.filter(o => o.congregationId === c.id).reduce((s, o) => s + (o.amount || 0), 0);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-black text-slate-900 dark:text-white">🏛️ {c.name}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(cIncome)}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">{formatCurrency(cExpense)}</td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-600">{formatCurrency(cTithes)}</td>
                        <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(cOffs)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (onSelectCongregation) {
                                onSelectCongregation(c.id, c.name);
                                toast.success(`Conmutado a: ${c.name}`);
                              }
                            }}
                            className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold hover:bg-indigo-100 cursor-pointer"
                          >
                            Entrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: LOGS DE AUDITORÍA Y TRAZABILIDAD */}
      {activeSubTab === 'audit_logs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Historial de Auditoría y Trazabilidad de Acciones</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro cronológico de operaciones administrativas, cambios de PIN y modificaciones contables
                </p>
              </div>

              <button
                onClick={() => {
                  try {
                    const logs = JSON.parse(localStorage.getItem('deborita_local_audit') || '[]');
                    const exportData = logs.map(l => ({
                      'Fecha y Hora': new Date(l.createdAt).toLocaleString('es-CO'),
                      'Usuario': l.userName,
                      'Rol': l.userRole,
                      'Acción': l.action,
                      'Entidad': l.entity,
                      'Detalles': l.details,
                      'Congregación': l.congregationId
                    }));
                    exportToExcel(exportData, 'Logs_Auditoria_Sistema');
                  } catch (e) {
                    toast.error('Error al exportar logs');
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Logs Excel</span>
              </button>
            </div>

            {(() => {
              let logs = [];
              try {
                logs = JSON.parse(localStorage.getItem('deborita_local_audit') || '[]');
              } catch (_) {}

              if (logs.length === 0) {
                return (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    <History className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                    No hay registros de auditoría almacenados en este momento. Las nuevas acciones aparecerán aquí automáticamente.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px]">
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Rol</th>
                        <th className="py-3 px-4">Acción</th>
                        <th className="py-3 px-4">Entidad</th>
                        <th className="py-3 px-4">Detalle de la Operación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.map((l, idx) => (
                        <tr key={l.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {new Date(l.createdAt || Date.now()).toLocaleString('es-CO')}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            👤 {l.userName}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                              {l.userRole}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                              l.action === 'ELIMINAR' || l.action === 'ANULAR'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                                : l.action === 'CREAR'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            }`}>
                              {l.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {l.entity}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {l.details || 'Operación regular'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR CONGREGACIÓN */}
      {isCongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>{editingCong ? 'Editar Congregación' : 'Crear Nueva Congregación'}</span>
            </h3>

            <form onSubmit={handleSubmitCong} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  value={congName}
                  onChange={(e) => setCongName(e.target.value)}
                  required
                  placeholder="Ej: Sede Central - Neiva"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Ciudad / Municipio
                </label>
                <input
                  type="text"
                  value={congCity}
                  onChange={(e) => setCongCity(e.target.value)}
                  placeholder="Ej: Neiva, Huila"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {!editingCong && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Pastor Titular
                    </label>
                    <input
                      type="text"
                      value={congPastorName}
                      onChange={(e) => setCongPastorName(e.target.value)}
                      placeholder="Nombre del pastor"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Tesorero(a) Titular
                    </label>
                    <input
                      type="text"
                      value={congTreasurerName}
                      onChange={(e) => setCongTreasurerName(e.target.value)}
                      placeholder="Nombre del tesorero(a)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Se inicializarán los 11 comités reglamentarios y los usuarios Pastor, Tesorero y Visita con PIN 1234.
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCongModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  {editingCong ? 'Guardar Cambios' : 'Crear Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR USUARIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</span>
            </h3>

            <form onSubmit={handleSubmitUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Congregación Asignada *
                </label>
                <select
                  value={targetCongId}
                  onChange={(e) => {
                    const newCongId = e.target.value;
                    setTargetCongId(newCongId);
                    const comms = committees.filter(c => c.congregationId === newCongId);
                    if (comms.length > 0) {
                      setTargetCommitteeId(comms[0].id);
                    } else {
                      setTargetCommitteeId('');
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {congregations.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre Completo del Usuario *
                </label>
                <input
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  required
                  placeholder="Ej: David Pérez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Rol de Acceso *
                </label>
                <select
                  value={userRoleInput}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setUserRoleInput(newRole);
                    if (newRole === 'COMITE' && !targetCommitteeId) {
                      const comms = committees.filter(c => c.congregationId === targetCongId);
                      if (comms.length > 0) setTargetCommitteeId(comms[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ADMIN">ADMIN (Pastor - Control Total de la Sede)</option>
                  <option value="TESORERO">TESORERO (Gestión Financiera)</option>
                  <option value="COMITE">COMITÉ (Tesorero de Comité Específico)</option>
                  <option value="VISITA">VISITA (Modo Consulta / Auditoría)</option>
                </select>
              </div>

              {/* Selector de Comité Específico si el Rol es COMITE */}
              {userRoleInput === 'COMITE' && (
                <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800 space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-black text-blue-950 dark:text-blue-200 uppercase">
                    🏛️ Comité Asignado *
                  </label>
                  <select
                    value={targetCommitteeId}
                    onChange={(e) => setTargetCommitteeId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {committees.filter(c => c.congregationId === targetCongId).length === 0 ? (
                      <option value="">No hay comités creados en esta sede</option>
                    ) : (
                      committees.filter(c => c.congregationId === targetCongId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                    Este usuario solo podrá ver y registrar movimientos de este comité en específico y ver ofrendas.
                  </p>
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    PIN Numérico Inicial *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={userPinInput}
                    onChange={(e) => setUserPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    placeholder="Mínimo 4 dígitos (ej: 1234)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESTABLECER PIN */}
      {isResetPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Restablecer PIN</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Asigna un nuevo PIN para el usuario <strong className="text-slate-900 dark:text-white">{targetResetUser?.name}</strong>.
            </p>

            <form onSubmit={handleSubmitResetPin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nuevo PIN Numérico *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  placeholder="Ingrese nuevo PIN (ej: 1234)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetPinModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                >
                  Actualizar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
