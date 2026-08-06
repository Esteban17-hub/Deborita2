import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import DashboardView from './components/DashboardView';
import CommitteesView from './components/CommitteesView';
import TithesView from './components/TithesView';
import OfferingsView from './components/OfferingsView';
import ProjectsView from './components/ProjectsView';
import ReportsView from './components/ReportsView';
import StatisticsView from './components/StatisticsView';
import DiagnosticsModal from './components/DiagnosticsModal';
import ResetModal from './components/ResetModal';

import {
  seedInitialData,
  getAllFromStore,
  putRecord
} from './services/db';
import {
  subscribeNetworkStatus,
  queueOfflineAction,
  triggerBackgroundSync,
  setupRealtimeListeners,
  subscribePresence
} from './services/syncEngine';
import { subscribeToSyncEvents, notifyDataChange } from './services/broadcast';

import {
  LayoutDashboard,
  Home,
  Users,
  Calculator,
  HandHeart,
  Target,
  FileText,
  PieChart
} from 'lucide-react';

export default function App() {
  // Estado de usuario y autenticación
  const [congregationId, setCongregationId] = useState('cong-zuluaga');
  const [congregationName, setCongregationName] = useState('Zuluaga-Central D21');
  const [userName, setUserName] = useState('Tesorero');
  const [userRole, setUserRole] = useState('TESORERO');
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Estado de Navegación
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estado de Red y Sincronización
  const [networkStatus, setNetworkStatus] = useState({ isOnline: true, isSyncing: false, pendingCount: 0 });
  const [connectedUsers, setConnectedUsers] = useState(1);

  // Entidades principales de la Base de Datos Local (IndexedDB)
  const [users, setUsers] = useState([]);
  const [congregations, setCongregations] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [movements, setMovements] = useState([]);
  const [tithes, setTithes] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [votes, setVotes] = useState([]);

  // Cargar datos iniciales y suscribir a eventos
  useEffect(() => {
    async function initApp() {
      await seedInitialData();
      await loadAllData();
      setupRealtimeListeners();
      
      // Restaurar sesión guardada
      const savedSession = localStorage.getItem('deborita_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setCongregationId(parsed.congregationId);
        setCongregationName(parsed.congregation);
        setUserName(parsed.username);
        setUserRole(parsed.role);
        setIsLoginOpen(false); // No abrir modal si ya hay sesión
      }

      // Iniciar sincronización (para que baje datos si estaba offline)
      triggerBackgroundSync();
    }
    initApp();

    const unsubNetwork = subscribeNetworkStatus((status) => {
      setNetworkStatus(status);
    });

    const unsubPresence = subscribePresence((count) => {
      setConnectedUsers(count);
    });

    const unsubBroadcast = subscribeToSyncEvents((event) => {
      loadAllData();
    });

    return () => {
      unsubNetwork();
      unsubPresence();
      unsubBroadcast();
    };
  }, []);

  const loadAllData = async () => {
    try {
      const usrs = await getAllFromStore('users');
      const congs = await getAllFromStore('congregations');
      const coms = await getAllFromStore('committees');
      const movs = await getAllFromStore('movements');
      const tiths = await getAllFromStore('tithes');
      const offs = await getAllFromStore('offerings');
      const projs = await getAllFromStore('projects');
      const vts = await getAllFromStore('votes');

      setUsers(usrs || []);
      setCongregations(congs || []);
      setCommittees(coms || []);
      setMovements(movs || []);
      setTithes(tiths || []);
      setOfferings(offs || []);
      setProjects(projs || []);
      setVotes(vts || []);
    } catch (err) {
      console.error('Error cargando datos desde IndexedDB:', err);
    }
  };

  // --- FILTROS Y CÁLCULOS DINÁMICOS POR CONGREGACIÓN ---
  const activeCommittees = committees
    .filter(c => c.congregationId === congregationId)
    .map(c => {
      const commMovs = movements.filter(m => m.committeeId === c.id && m.congregationId === congregationId && !m.annulled);
      const movsIncome = commMovs.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + (m.amount || 0), 0);
      const movsExpense = commMovs.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + (m.amount || 0), 0);
      const commOfferings = offerings.filter(o => o.destinationCommitteeId === c.id && o.congregationId === congregationId);
      const offeringsIncome = commOfferings.reduce((acc, o) => acc + (o.amount || 0), 0);

      const computedBalance = movsIncome - movsExpense + offeringsIncome;
      return {
        ...c,
        balance: computedBalance
      };
    });

  const activeMovements = movements.filter(m => m.congregationId === congregationId);
  const activeTithes = tithes.filter(t => t.congregationId === congregationId);
  const activeOfferings = offerings.filter(o => o.congregationId === congregationId);
  const activeProjects = projects.filter(p => p.congregationId === congregationId);
  const activeProjectIds = new Set(activeProjects.map(p => p.id));
  const activeVotes = votes.filter(v => activeProjectIds.has(v.projectId));

  // --- HANDLERS DE OPERACIONES DE NEGOCIO (OFFLINE-FIRST) ---

  const handleCreateCongregation = async (name) => {
    const id = `cong-${Date.now()}`;
    const newCong = { id, name, city: '' };
    
    await putRecord('congregations', newCong);
    await queueOfflineAction('CREATE', 'congregations', newCong);

    const defaultUsers = [
      { id: `u-1-${id}`, congregationId: id, name: 'Pastor', role: 'ADMIN', pin: '1234', createdAt: Date.now() },
      { id: `u-2-${id}`, congregationId: id, name: 'Tesorero', role: 'TESORERO', pin: '1234', createdAt: Date.now() },
      { id: `u-3-${id}`, congregationId: id, name: 'Visita', role: 'VISITA', pin: '1234', createdAt: Date.now() }
    ];
    for (const u of defaultUsers) {
      await putRecord('users', u);
      await queueOfflineAction('CREATE', 'users', u);
    }

    // Comités Base
    const baseCommittees = [
      'Alabanza', 'Escuela Dominical', 'Familia', 'Intercesión', 
      'Obra Social', 'Misiones', 'Damas Dorcas', 'Decom', 'Jóvenes', 'Ujieres'
    ];
    for (let i = 0; i < baseCommittees.length; i++) {
      const c = {
        id: `com-${id}-${i}-${Date.now()}`,
        congregationId: id,
        name: baseCommittees[i],
        treasurer: '',
        balance: 0,
        isOfferingOnly: false,
        updatedAt: Date.now()
      };
      await putRecord('committees', c);
      await queueOfflineAction('CREATE', 'committees', c);
    }

    const junta = {
      id: `com-${id}-junta-${Date.now()}`,
      congregationId: id,
      name: 'Junta Local',
      treasurer: '',
      balance: 0,
      isOfferingOnly: true,
      updatedAt: Date.now()
    };
    await putRecord('committees', junta);
    await queueOfflineAction('CREATE', 'committees', junta);

    await loadAllData();
    return id;
  };

  const handleCreateCommittee = async (committeeData) => {
    const newCommittee = {
      id: `com-${Date.now()}`,
      congregationId: congregationId,
      name: committeeData.name,
      treasurer: committeeData.treasurer,
      balance: 0,
      updatedAt: Date.now()
    };

    await putRecord('committees', newCommittee);
    await queueOfflineAction('CREATE', 'committees', newCommittee);
    await loadAllData();
  };

  const handleAddMovement = async (movementData) => {
    const newMovement = {
      id: `mov-${Date.now()}`,
      congregationId: congregationId,
      committeeId: movementData.committeeId,
      type: movementData.type, // 'INGRESO' | 'EGRESO'
      amount: movementData.amount,
      description: movementData.description,
      date: movementData.date,
      annulled: false,
      annulReason: '',
      createdAt: Date.now()
    };

    // Actualizar saldo del comité (Regla de Oro: Permite saldo negativo)
    const committee = committees.find(c => c.id === movementData.committeeId);
    if (committee) {
      const delta = movementData.type === 'INGRESO' ? movementData.amount : -movementData.amount;
      const updatedCommittee = {
        ...committee,
        balance: (committee.balance || 0) + delta,
        updatedAt: Date.now()
      };
      await putRecord('committees', updatedCommittee);
      await queueOfflineAction('UPDATE', 'committees', updatedCommittee);
    }

    await putRecord('movements', newMovement);
    await queueOfflineAction('CREATE', 'movements', newMovement);
    await loadAllData();
  };

  const handleAnnulMovement = async (movementId, reason) => {
    const mov = movements.find(m => m.id === movementId);
    if (!mov || mov.annulled) return;

    const updatedMov = {
      ...mov,
      annulled: true,
      annulReason: reason,
      updatedAt: Date.now()
    };

    // Revertir cálculo matemático en el saldo del comité
    const committee = committees.find(c => c.id === mov.committeeId);
    if (committee) {
      const reverseDelta = mov.type === 'INGRESO' ? -mov.amount : mov.amount;
      const updatedCommittee = {
        ...committee,
        balance: (committee.balance || 0) + reverseDelta,
        updatedAt: Date.now()
      };
      await putRecord('committees', updatedCommittee);
      await queueOfflineAction('UPDATE', 'committees', updatedCommittee);
    }

    await putRecord('movements', updatedMov);
    await queueOfflineAction('ANNUL', 'movements', updatedMov);
    await loadAllData();
  };

  const handleSaveTithe = async (titheData) => {
    const newTithe = {
      id: `t-${Date.now()}`,
      congregationId: congregationId,
      ...titheData,
      createdAt: Date.now()
    };

    await putRecord('tithes', newTithe);
    await queueOfflineAction('CREATE', 'tithes', newTithe);
    await loadAllData();
  };

  const handleAddOffering = async (offeringData) => {
    const newOffering = {
      id: `o-${Date.now()}`,
      congregationId: congregationId,
      ...offeringData,
      createdAt: Date.now()
    };

    // Si la ofrenda va a un comité específico, sumar al saldo del comité
    if (offeringData.destinationCommitteeId) {
      const com = committees.find(c => c.id === offeringData.destinationCommitteeId);
      if (com) {
        const updatedCom = {
          ...com,
          balance: (com.balance || 0) + offeringData.amount,
          updatedAt: Date.now()
        };
        await putRecord('committees', updatedCom);
        await queueOfflineAction('UPDATE', 'committees', updatedCom);
      }
    }

    await putRecord('offerings', newOffering);
    await queueOfflineAction('CREATE', 'offerings', newOffering);
    await loadAllData();
  };

  const handleCreateProject = async (projectData) => {
    const newProject = {
      id: `proj-${Date.now()}`,
      congregationId: congregationId,
      ...projectData,
      totalRaised: 0,
      createdAt: Date.now()
    };

    await putRecord('projects', newProject);
    await queueOfflineAction('CREATE', 'projects', newProject);
    await loadAllData();
  };

  const handleAddVote = async (voteData) => {
    const newVote = {
      id: `v-${Date.now()}`,
      ...voteData,
      createdAt: Date.now()
    };

    // Actualizar total recaudado del proyecto
    const proj = projects.find(p => p.id === voteData.projectId);
    if (proj) {
      const updatedProj = {
        ...proj,
        totalRaised: (proj.totalRaised || 0) + voteData.amount,
        updatedAt: Date.now()
      };
      await putRecord('projects', updatedProj);
      await queueOfflineAction('UPDATE', 'projects', updatedProj);
    }

    await putRecord('votes', newVote);
    await queueOfflineAction('CREATE', 'votes', newVote);
    await loadAllData();
  };

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'committees', label: 'Comités', icon: Users },
    ...(userRole !== 'VISITA' ? [{ id: 'tithes', label: 'Diezmos', icon: Calculator }] : []),
    { id: 'offerings', label: 'Ofrendas', icon: HandHeart },
    { id: 'projects', label: 'Proyectos', icon: Target },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'statistics', label: 'Estadísticas', icon: PieChart }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans transition-colors">
      
      {/* Navbar Superior */}
      <Navbar
        congregationName={congregationName}
        userRole={userRole}
        userName={userName}
        networkStatus={networkStatus}
        connectedUsers={connectedUsers}
        onLogout={() => {
          localStorage.removeItem('deborita_session');
          setIsLoginOpen(true);
        }}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
      />

      {/* Menú de Navegación por Pestañas */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 sticky top-[61px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView
            committees={activeCommittees.filter(c => !c.isOfferingOnly)}
            movements={activeMovements}
            offerings={activeOfferings}
            userRole={userRole}
            onOpenMovementModal={() => setActiveTab('committees')}
            onOpenOfferingModal={() => setActiveTab('offerings')}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'committees' && (
          <CommitteesView
            committees={activeCommittees.filter(c => !c.isOfferingOnly)}
            movements={activeMovements}
            userRole={userRole}
            onCreateCommittee={handleCreateCommittee}
            onAddMovement={handleAddMovement}
            onAnnulMovement={handleAnnulMovement}
          />
        )}

        {activeTab === 'tithes' && (
          <TithesView
            tithes={activeTithes}
            userRole={userRole}
            onSaveTithe={handleSaveTithe}
          />
        )}

        {activeTab === 'offerings' && (
          <OfferingsView
            offerings={activeOfferings}
            committees={activeCommittees} // Aquí sí van todos, incluyendo Junta Local
            userRole={userRole}
            onAddOffering={handleAddOffering}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={activeProjects}
            votes={activeVotes}
            userRole={userRole}
            onCreateProject={handleCreateProject}
            onAddVote={handleAddVote}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            movements={activeMovements}
            committees={activeCommittees}
            tithes={activeTithes}
            offerings={activeOfferings}
            congregationName={congregationName}
            userRole={userRole}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsView
            movements={activeMovements}
            committees={activeCommittees}
            tithes={activeTithes}
            offerings={activeOfferings}
            userRole={userRole}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold">Deborita Gestión Local - Sistema de Administración Financiera Congregacional</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Soporte Offline-First con sincronización en la nube e IndexedDB local</p>
      </footer>

      {/* Modales Auxiliares */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentCongregation={congregationName}
        currentRole={userRole}
        congregations={congregations}
        users={users}
        onCreateCongregation={handleCreateCongregation}
        onLogin={({ congregation, congregationId, username, role, remember }) => {
          setCongregationName(congregation);
          setCongregationId(congregationId);
          setUserName(username);
          setUserRole(role);
          
          if (remember) {
            localStorage.setItem('deborita_session', JSON.stringify({ congregation, congregationId, username, role }));
          }

          if (role === 'VISITA' && activeTab === 'tithes') {
            setActiveTab('dashboard');
          }
        }}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        congregationId={congregationId}
        congregationName={congregationName}
        onResetComplete={loadAllData}
      />

    </div>
  );
}
