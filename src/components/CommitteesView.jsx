import React, { useState } from 'react';
import { Plus, ArrowRightLeft, Ban, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import MoneyInput from './MoneyInput';

export default function CommitteesView({
  committees,
  movements,
  userRole,
  isMobile,
  onCreateCommittee,
  onAddMovement,
  onAnnulMovement
}) {
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'detail'
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);
  const [isNewCommitteeOpen, setIsNewCommitteeOpen] = useState(false);
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [annulModalState, setAnnulModalState] = useState({ isOpen: false, movementId: null, reason: '' });

  // Formulario Nuevo Comité
  const [newCommitteeName, setNewCommitteeName] = useState('');
  const [newCommitteeTreasurer, setNewCommitteeTreasurer] = useState('');

  // Formulario Nuevo Movimiento
  const [movementType, setMovementType] = useState('INGRESO');
  const [movementAmount, setMovementAmount] = useState(0);
  const [movementDescription, setMovementDescription] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));

  const isReadOnly = userRole === 'VISITA';
  const activeCommittee = committees.find(c => c.id === selectedCommitteeId);

  const committeeMovements = selectedCommitteeId ? movements.filter(m => m.committeeId === selectedCommitteeId) : [];

  const handleCreateCommittee = (e) => {
    e.preventDefault();
    if (!newCommitteeName) return;
    onCreateCommittee({ name: newCommitteeName, treasurer: newCommitteeTreasurer });
    setNewCommitteeName('');
    setNewCommitteeTreasurer('');
    setIsNewCommitteeOpen(false);
  };

  const handleCreateMovement = (e) => {
    e.preventDefault();
    if (!movementAmount || movementAmount <= 0) return;
    onAddMovement({
      committeeId: selectedCommitteeId,
      type: movementType,
      amount: movementAmount,
      description: movementDescription,
      date: movementDate
    });
    setMovementAmount(0);
    setMovementDescription('');
    setIsNewMovementOpen(false);
  };

  const handleConfirmAnnul = (e) => {
    e.preventDefault();
    if (!annulModalState.reason) return;
    onAnnulMovement(annulModalState.movementId, annulModalState.reason);
    setAnnulModalState({ isOpen: false, movementId: null, reason: '' });
  };

  const handleSelectCommittee = (committeeId) => {
    setSelectedCommitteeId(committeeId);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      
      {viewMode === 'list' && (
        <div className="space-y-6">
          <div 
            className={`flex flex-wrap items-center justify-between gap-4 ${isMobile ? 'p-6' : 'p-8'} rounded-[2rem] text-white shadow-2xl`}
            style={{ backgroundImage: 'var(--gradient-committees)', boxShadow: '0 25px 50px -12px var(--shadow-color)' }}
          >
            <div>
              <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>Mis Comités</h2>
              <p className="text-sm text-indigo-100 font-medium">Gestiona y revisa los fondos de cada departamento</p>
            </div>
            {!isReadOnly && (
              <button
                onClick={() => setIsNewCommitteeOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-sm shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Comité</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {committees.map((c) => {
              const commBalance = c.balance || 0;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCommittee(c.id)}
                  className="p-6 rounded-[2rem] bg-slate-800/80 backdrop-blur-md border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col gap-5 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                       <span className="text-xl font-bold">{c.name.charAt(0)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-xl text-white leading-tight mb-2">
                      {c.name}
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Saldo Actual
                    </span>
                    <span className={`text-2xl font-black ${
                      commBalance < 0 ? 'text-rose-400' : 'text-white'
                    }`}>
                      {formatCurrency(commBalance)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center mt-auto">
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                      👤 {c.treasurer || 'Sin asignar'}
                    </p>
                    <span className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'detail' && activeCommittee && (() => {
        const activeBalance = activeCommittee.balance || 0;

        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6" id="committee-detail-panel">
            
            <button
              onClick={() => setViewMode('list')}
              className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-2 mb-4"
            >
              ← Volver al listado
            </button>

            {/* Header del Comité Seleccionado */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">{activeCommittee.name}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  👤 Tesorero a cargo: <span className="font-bold text-slate-700 dark:text-slate-300">{activeCommittee.treasurer || 'Sin asignar'}</span>
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block uppercase mb-1">Saldo Actual</span>
                  <p className={`text-3xl font-black ${activeBalance < 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(activeBalance)}
                  </p>
                  {activeBalance < 0 && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full inline-block mt-1">
                      ⚠️ Saldo Negativo Permitido
                    </span>
                  )}
                </div>

                {!isReadOnly && (
                  <button
                    onClick={() => setIsNewMovementOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Nuevo Movimiento</span>
                  </button>
                )}
              </div>
            </div>

            {/* Historial de Transacciones del Comité */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Historial de Transacciones</h3>
              
              {committeeMovements.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No hay movimientos registrados para este comité.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-xs">
                        <th className="pb-4">Fecha</th>
                        <th className="pb-4">Tipo</th>
                        <th className="pb-4">Descripción</th>
                        <th className="pb-4 text-right">Monto</th>
                        <th className="pb-4 text-center">Estado</th>
                        {!isReadOnly && <th className="pb-4 text-right">Acción</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {committeeMovements.map((mov) => (
                        <tr key={mov.id} className={mov.annulled ? 'opacity-50 bg-rose-50/30 dark:bg-rose-950/10' : ''}>
                          <td className="py-4 font-semibold text-slate-700 dark:text-slate-300">
                            {formatDate(mov.date)}
                          </td>
                          <td className="py-4 font-bold">
                            <span className={`px-3 py-1.5 rounded-lg text-[11px] ${
                              mov.type === 'INGRESO'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {mov.type}
                            </span>
                          </td>
                          <td className="py-4 font-medium text-slate-800 dark:text-slate-200">
                            <span className={mov.annulled ? 'line-through text-slate-400' : ''}>
                              {mov.description || 'Sin descripción'}
                            </span>
                            {mov.annulled && (
                              <p className="text-[11px] text-rose-500 font-bold italic mt-1">
                                Motivo anulación: {mov.annulReason}
                              </p>
                            )}
                          </td>
                          <td className={`py-4 font-bold text-right ${
                            mov.annulled 
                              ? 'line-through text-slate-400' 
                              : mov.type === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {mov.type === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.amount)}
                          </td>
                          <td className="py-4 text-center">
                            {mov.annulled ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-3 py-1 rounded-md">
                                <Ban className="w-3.5 h-3.5" /> Anulado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-md">
                                <CheckCircle className="w-3.5 h-3.5" /> Activo
                              </span>
                            )}
                          </td>
                          {!isReadOnly && (
                            <td className="py-4 text-right">
                              {!mov.annulled && (
                                <button
                                  onClick={() => setAnnulModalState({ isOpen: true, movementId: mov.id, reason: '' })}
                                  className="text-rose-600 hover:text-rose-800 text-xs font-bold underline"
                                >
                                  Anular
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Nuevo Comité */}
      {isNewCommitteeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Crear Nuevo Comité / Departamento</h3>
            <form onSubmit={handleCreateCommittee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nombre del Comité</label>
                <input
                  type="text"
                  value={newCommitteeName}
                  onChange={(e) => setNewCommitteeName(e.target.value)}
                  required
                  placeholder="Ej: Ministerio de Jóvenes, Damas Dorcas"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tesorero Encargado</label>
                <input
                  type="text"
                  value={newCommitteeTreasurer}
                  onChange={(e) => setNewCommitteeTreasurer(e.target.value)}
                  placeholder="Nombre del tesorero"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCommitteeOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                >
                  Guardar Comité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Movimiento */}
      {isNewMovementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Registrar Movimiento - {activeCommittee?.name}
            </h3>
            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('INGRESO')}
                  className={`py-2.5 rounded-xl font-bold text-xs border ${
                    movementType === 'INGRESO'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  🟢 Ingreso (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType('EGRESO')}
                  className={`py-2.5 rounded-xl font-bold text-xs border ${
                    movementType === 'EGRESO'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  🔴 Egreso (-)
                </button>
              </div>

              <MoneyInput
                label="Monto del Movimiento"
                value={movementAmount}
                onChange={setMovementAmount}
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Fecha</label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Descripción / Motivo</label>
                <input
                  type="text"
                  value={movementDescription}
                  onChange={(e) => setMovementDescription(e.target.value)}
                  placeholder="Detalle de la transacción"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMovementOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Anular Movimiento */}
      {annulModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <ShieldAlert className="w-7 h-7" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Anular Movimiento Financiero</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              El movimiento no se eliminará del registro; quedará marcado como anulado y el monto será revertido matemáticamente de los saldos del comité.
            </p>
            <form onSubmit={handleConfirmAnnul} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Motivo de la Anulación <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={annulModalState.reason}
                  onChange={(e) => setAnnulModalState({ ...annulModalState, reason: e.target.value })}
                  required
                  rows={3}
                  placeholder="Explique la razón de la anulación (error de tipeo, duplicado, etc.)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAnnulModalState({ isOpen: false, movementId: null, reason: '' })}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
                >
                  Confirmar Anulación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
