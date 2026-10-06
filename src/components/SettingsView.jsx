import React, { useState } from 'react';
import { Building2, User, KeyRound, Save, ShieldAlert, CheckCircle2, Users, PlusCircle, Trash2, Pencil, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { hashPin, verifyPin } from '../utils/security';

export default function SettingsView({
  congregationId,
  congregationName,
  congregationCity,
  users = [],
  committees = [],
  userRole,
  currentUser,
  isMobile,
  onUpdateCongregation,
  onUpdateUsers,
  onCreateUser,
  onDeleteUser,
  onResetPin
}) {
  const isAdmin = userRole === 'ADMIN';

  // Buscar usuarios clave
  const adminUser = users.find(u => u.congregationId === congregationId && u.role === 'ADMIN');
  const treasurerUser = users.find(u => u.congregationId === congregationId && u.role === 'TESORERO');
  const committeeUsers = users.filter(u => u.congregationId === congregationId && u.role === 'COMITE');
  const localCommittees = committees.filter(c => c.congregationId === congregationId);

  // Modales de Usuario de Comité
  const [isCommUserModalOpen, setIsCommUserModalOpen] = useState(false);
  const [editingCommUser, setEditingCommUser] = useState(null);
  const [commUserName, setCommUserName] = useState('');
  const [commUserCommitteeId, setCommUserCommitteeId] = useState('');
  const [commUserPin, setCommUserPin] = useState('1234');

  // Estado Local: Congregación (Solo Admin)
  const [editCongName, setEditCongName] = useState(congregationName || '');
  const [editCongCity, setEditCongCity] = useState(congregationCity || '');

  // Estado Local: Usuarios (Admin edita nombres, Admin/Tesorero editan su propio PIN)
  const [editPastorName, setEditPastorName] = useState(adminUser?.name || '');
  const [editTreasurerName, setEditTreasurerName] = useState(treasurerUser?.name || '');

  // Estado de PIN (Solo edita el propio PIN por seguridad)
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const handleSaveCongregation = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    await onUpdateCongregation({
      name: editCongName.trim(),
      city: editCongCity.trim()
    });
    toast.success('Datos de la congregación actualizados correctamente.');
  };

  const handleSaveUsers = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    const updatedUsers = [];
    if (adminUser) updatedUsers.push({ ...adminUser, name: editPastorName.trim() });
    if (treasurerUser) updatedUsers.push({ ...treasurerUser, name: editTreasurerName.trim() });
    
    await onUpdateUsers(updatedUsers);
    toast.success('Nombres de usuarios actualizados correctamente.');
  };

  const handleOpenCreateCommUser = () => {
    setEditingCommUser(null);
    setCommUserName('');
    setCommUserCommitteeId(localCommittees[0]?.id || '');
    setCommUserPin('1234');
    setIsCommUserModalOpen(true);
  };

  const handleOpenEditCommUser = (u) => {
    setEditingCommUser(u);
    setCommUserName(u.name || '');
    setCommUserCommitteeId(u.committeeId || localCommittees[0]?.id || '');
    setIsCommUserModalOpen(true);
  };

  const handleSubmitCommUser = async (e) => {
    e.preventDefault();
    if (!commUserName.trim()) {
      toast.error('El nombre del usuario es obligatorio');
      return;
    }
    if (!commUserCommitteeId) {
      toast.error('Debe seleccionar un comité');
      return;
    }

    if (editingCommUser) {
      if (onUpdateUsers) {
        await onUpdateUsers([{
          ...editingCommUser,
          name: commUserName.trim(),
          committeeId: commUserCommitteeId
        }]);
        toast.success('Usuario de comité actualizado');
      }
    } else {
      if (!commUserPin || commUserPin.length < 4) {
        toast.error('El PIN debe tener al menos 4 dígitos');
        return;
      }
      if (onCreateUser) {
        await onCreateUser({
          congregationId,
          name: commUserName.trim(),
          role: 'COMITE',
          committeeId: commUserCommitteeId,
          pin: hashPin(commUserPin.trim())
        });
        toast.success('Usuario de comité creado exitosamente');
      }
    }

    setIsCommUserModalOpen(false);
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    // Validaciones
    if (!verifyPin(currentPin, currentUser?.pin)) {
      setPinError('El PIN actual es incorrecto.');
      return;
    }
    if (newPin.length < 4 || newPin.length > 6) {
      setPinError('El nuevo PIN debe tener entre 4 y 6 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('La confirmación del nuevo PIN no coincide.');
      return;
    }
    if (newPin === currentPin) {
      setPinError('El nuevo PIN no puede ser igual al actual.');
      return;
    }

    // Actualizar PIN del usuario logueado con hash
    onUpdateUsers([{ ...currentUser, pin: hashPin(newPin) }]);
    setPinSuccess('PIN actualizado de forma segura. Use su nuevo PIN en el próximo inicio de sesión.');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  if (userRole === 'VISITA') {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 p-8 rounded-3xl border border-amber-200 dark:border-amber-900 text-center max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Acceso Restringido</h3>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Su rol actual no tiene privilegios para acceder a las configuraciones del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Configuración */}
      <div 
        className={`flex flex-wrap items-center justify-between gap-4 ${isMobile ? 'p-6' : 'p-8'} rounded-[2rem] text-white shadow-2xl`}
        style={{ backgroundImage: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', boxShadow: '0 25px 50px -12px rgba(30, 41, 59, 0.5)' }}
      >
        <div>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>Configuración</h2>
          <p className="text-sm text-slate-300 font-medium">Administra los datos de la sede, usuarios de comités y seguridad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tarjeta 1: Congregación (Solo ADMIN) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Datos de la Congregación</h3>
            </div>
            
            <form onSubmit={handleSaveCongregation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre de la Sede</label>
                <input
                  type="text"
                  value={editCongName}
                  onChange={(e) => setEditCongName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Ciudad / Municipio</label>
                <input
                  type="text"
                  value={editCongCity}
                  onChange={(e) => setEditCongCity(e.target.value)}
                  placeholder="Ej: Bogotá, Zuluaga, Cali"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Guardar Sede
              </button>
            </form>
          </div>
        )}

        {/* Tarjeta 2: Nombres de Usuarios Principales (Solo ADMIN) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Perfiles Locales</h3>
            </div>
            
            <form onSubmit={handleSaveUsers} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Pastor (ADMIN)</label>
                <input
                  type="text"
                  value={editPastorName}
                  onChange={(e) => setEditPastorName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Tesorero(a)</label>
                <input
                  type="text"
                  value={editTreasurerName}
                  onChange={(e) => setEditTreasurerName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Actualizar Perfiles
              </button>
            </form>
          </div>
        )}

        {/* Tarjeta 3: Usuarios de Comités con Rol Exclusivo (Solo ADMIN) */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm md:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Usuarios y Tesoreros de Comités</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cuentas con acceso exclusivo para gestionar solo su comité asignado
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateCommUser}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Crear Usuario de Comité</span>
              </button>
            </div>

            {committeeUsers.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Aún no hay usuarios de comités creados en esta congregación.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreateCommUser}
                  className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Crear el primer usuario de comité
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase text-[11px]">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Comité Asignado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {committeeUsers.map(u => {
                      const comm = localCommittees.find(c => c.id === u.committeeId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            👤 {u.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300">
                              🏛️ {comm ? comm.name : 'Sin comité'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCommUser(u)}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/60 cursor-pointer"
                                title="Editar nombre o comité"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteUser && (
                                <button
                                  type="button"
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
            )}
          </div>
        )}

        {/* Tarjeta 4: Seguridad / Cambio de PIN Propio */}
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm ${!isAdmin ? 'md:col-span-2 max-w-lg mx-auto w-full' : 'md:col-span-2'}`}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Seguridad de la Cuenta</h3>
          </div>
          
          <form onSubmit={handleChangePin} className="max-w-md space-y-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
              Cambia el PIN de acceso para el usuario <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name} ({currentUser?.role})</strong>.
            </p>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {pinError}
              </div>
            )}
            
            {pinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {pinSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">PIN Actual</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nuevo PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="4-6 dígitos"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Confirmar PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Actualizar PIN Seguro
            </button>
          </form>
        </div>

      </div>

      {/* MODAL CREAR / EDITAR USUARIO DE COMITÉ */}
      {isCommUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>{editingCommUser ? 'Editar Usuario de Comité' : 'Crear Usuario de Comité'}</span>
            </h3>

            <form onSubmit={handleSubmitCommUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre del Usuario *
                </label>
                <input
                  type="text"
                  value={commUserName}
                  onChange={(e) => setCommUserName(e.target.value)}
                  required
                  placeholder="Ej: David Pérez"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Comité Asignado *
                </label>
                <select
                  value={commUserCommitteeId}
                  onChange={(e) => setCommUserCommitteeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {localCommittees.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">
                  Este usuario solo podrá ver e ingresar movimientos de este comité específico.
                </p>
              </div>

              {!editingCommUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    PIN Numérico Inicial *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={commUserPin}
                    onChange={(e) => setCommUserPin(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    placeholder="Mínimo 4 dígitos (ej: 1234)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCommUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
                >
                  {editingCommUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
