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
import SettingsView from './components/SettingsView';
import DiagnosticsModal from './components/DiagnosticsModal';
import ResetModal from './components/ResetModal';
import useMediaQuery from './hooks/useMediaQuery';

import {
  seedInitialData,
  getAllFromStore,
  putRecord
} from './services/db';
import {
  subscribeNetworkStatus,
  queueOfflineAction,
  triggerBackgroundSync,
  fetchFreshDataFromCloud,
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
  PieChart,
  Settings
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

  // Estado de Tema y Responsive
  const [theme, setTheme] = useState(() => localStorage.getItem('deborita_theme') || 'dark-premium');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // Aplicar Tema al DOM
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark-premium' || theme === 'executive-graphite') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('deborita_theme', theme);
  }, [theme]);

  // Entidades principales de la Base de Datos Local (IndexedDB)
  const [users, setUsers] = useState([]);
  const [congregations, setCongregations] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [movements, setMovements] = useState([]);
  const [tithes, setTithes] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [votes, setVotes] = useState([]);

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

      return { usrs, congs, coms, movs, tiths, offs, projs, vts };
    } catch (err) {
      console.error('Error cargando datos desde IndexedDB:', err);
      return {};
    }
  };

  // Cargar datos iniciales y suscribir a eventos
  useEffect(() => {
    async function initApp() {
      await seedInitialData();
      const loadedData = await loadAllData();
      setupRealtimeListeners();
      
      // Restaurar y VALIDAR sesión guardada
      const savedSession = localStorage.getItem('deborita_session');
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          // Validación estricta de sesión (Evita Privilege Escalation via LocalStorage)
          const validUser = (loadedData?.usrs || []).find(
            u => u.congregationId === parsed.congregationId && u.role === parsed.role && u.name === parsed.username
          );

          if (validUser) {
            setCongregationId(parsed.congregationId);
            setCongregationName(parsed.congregation);
            setUserName(parsed.username);
            setUserRole(parsed.role);
            setIsLoginOpen(false);
          } else {
            console.warn('Sesión local inválida o manipulada. Forzando re-autenticación.');
            localStorage.removeItem('deborita_session');
            setIsLoginOpen(true);
          }
        } catch (e) {
          localStorage.removeItem('deborita_session');
          setIsLoginOpen(true);
        }
      }

      // Iniciar sincronización (para que baje datos si estaba offline)
      triggerBackgroundSync()
        .then(() => {
          fetchFreshDataFromCloud();
        })
        .catch((err) => {
          console.warn('La sincronización falló al iniciar. Se conserva la caché local intacta.', err);
        });
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

  // --- FILTROS Y CÁLCULOS DINÁMICOS POR CONGREGACIÓN ---
  const activeCommittees = committees
    .filter(c => c.congregationId === congregationId)
    .map(c => {
      const commMovs = movements.filter(m => m.committeeId === c.id && m.congregationId === congregationId && !m.annulled);
      const movsIncome = commMovs.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + (m.amount || 0), 0);
      const movsExpense = commMovs.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + (m.amount || 0), 0);
      const commOfferings = offerings.filter(o => o.destinationCommitteeId === c.id && o.congregationId === congregationId);
      const offeringsIncome = commOfferings.reduce((acc, o) => acc + (o.amount || 0), 0);

      const computedBalance = movsIncome - movsExpense; // Ofrendas se manejan como cuentas separadas
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

  const handleCreateCongregation = async (name, pastorName, treasurerName) => {
    const id = `cong-${Date.now()}`;
    const newCong = { id, name, city: '' };
    
    await putRecord('congregations', newCong);
    await queueOfflineAction('CREATE', 'congregations', newCong);

    const defaultUsers = [
      { id: `u-1-${id}`, congregationId: id, name: pastorName || 'Pastor', role: 'ADMIN', pin: '1234', createdAt: Date.now() },
      { id: `u-2-${id}`, congregationId: id, name: treasurerName || 'Tesorero', role: 'TESORERO', pin: '1234', createdAt: Date.now() },
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

    // UI dinámicamente calcula saldos vía 'activeCommittees', no necesitamos alterar 'committees' en la DB
    // Esto evita condiciones de carrera (Lost Update) en escenarios multi-dispositivo offline

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
      annulReason: reason
    };

    // UI dinámicamente calcula saldos, no necesitamos alterar 'committees' en la DB

    await putRecord('movements', updatedMov);
    await queueOfflineAction('ANNUL', 'movements', updatedMov);
    await loadAllData();
  };

  const handleSaveTithe = async (titheData) => {
    // Mapeo estricto al esquema de Supabase public.tithes
    const newTithe = {
      id: `t-${Date.now()}`,
      congregationId: congregationId,
      date: titheData.date,
      month: titheData.month,
      year: parseInt(titheData.year) || new Date().getFullYear(),
      grossIncome: titheData.grossTithe, // TithesView envía grossTithe, DB espera grossIncome
      nationalPercentage: titheData.nationalPercentage,
      nationalShare: titheData.nationalTreasury, // TithesView envía nationalTreasury, DB espera nationalShare
      localShare: titheData.localFundAport, // TithesView envía localFundAport, DB espera localShare
      pastorTithe: 0,
      pastorTithePercentage: 0,
      netIncome: titheData.netIncome,
      pastorAllocation: titheData.pastorAllocation,
      pastorAllocationPercentage: titheData.correctedPoint, // Mapeamos correctedPoint aquí para no perderlo
      balanceGroup: titheData.pastorName, // Mapeamos pastorName aquí ya que no existe columna pastorName
      archived: false,
      createdAt: Date.now()
    };

    await putRecord('tithes', newTithe);
    await queueOfflineAction('CREATE', 'tithes', newTithe);
    await loadAllData();
  };

  const handleAddOffering = async (offeringData) => {
    // Solo enviamos a la DB los campos que existen en la tabla Supabase para evitar fallos de sincronización
    const descriptionStr = offeringData.notes || offeringData.description || '';
    const responsibleStr = offeringData.responsible ? `[${offeringData.responsible}] ` : '';
    
    const newOffering = {
      id: `o-${Date.now()}`,
      congregationId: congregationId,
      destinationCommitteeId: offeringData.destinationCommitteeId || null,
      type: offeringData.type || 'OFRENDA',
      amount: offeringData.amount,
      description: (responsibleStr + descriptionStr).trim() || null,
      date: offeringData.date,
      createdAt: Date.now()
    };

    // UI dinámicamente calcula saldos, no necesitamos alterar 'committees' en la DB

    await putRecord('offerings', newOffering);
    await queueOfflineAction('CREATE', 'offerings', newOffering);
    await loadAllData();
  };

  const handleCreateProject = async (projectData) => {
    // Mapeo estricto al esquema de Supabase public.projects
    const newProject = {
      id: `proj-${Date.now()}`,
      congregationId: congregationId,
      name: projectData.name,
      description: projectData.description || null,
      targetAmount: projectData.targetAmount || 0,
      totalRaised: 0,
      status: projectData.status || 'ACTIVO',
      createdAt: Date.now()
    };

    await putRecord('projects', newProject);
    await queueOfflineAction('CREATE', 'projects', newProject);
    await loadAllData();
  };

  const handleAddVote = async (voteData) => {
    // Mapeo estricto al esquema de Supabase public.votes
    const newVote = {
      id: `v-${Date.now()}`,
      projectId: voteData.projectId,
      voterName: voteData.memberName || voteData.voterName || 'Anónimo', // ProjectsView envía memberName
      amount: voteData.amount,
      date: voteData.date || new Date().toISOString().slice(0, 10),
      createdAt: Date.now()
    };

    // Actualizar total recaudado del proyecto
    const proj = projects.find(p => p.id === voteData.projectId);
    if (proj) {
      const updatedProj = {
        ...proj,
        totalRaised: (proj.totalRaised || 0) + voteData.amount
        // updatedAt: Date.now() -> No existe en el esquema public.projects
      };
      await putRecord('projects', updatedProj);
      await queueOfflineAction('UPDATE', 'projects', updatedProj);
    }

    await putRecord('votes', newVote);
    await queueOfflineAction('CREATE', 'votes', newVote);
    await loadAllData();
  };

  const handleUpdateCongregationSettings = async (congData) => {
    const cong = congregations.find(c => c.id === congregationId);
    if (cong) {
      const updatedCong = { ...cong, name: congData.name, city: congData.city };
      await putRecord('congregations', updatedCong);
      await queueOfflineAction('UPDATE', 'congregations', updatedCong);
      setCongregationName(updatedCong.name);
      await loadAllData();
    }
  };

  const handleUpdateUsersSettings = async (updatedUsers) => {
    for (const u of updatedUsers) {
      await putRecord('users', u);
      await queueOfflineAction('UPDATE', 'users', u);
    }
    
    // Si el usuario actual cambió su nombre o PIN, actualizar sesión
    const currentUserUpdate = updatedUsers.find(
      u => u.congregationId === congregationId && u.role === userRole
    );
    if (currentUserUpdate) {
      setUserName(currentUserUpdate.name);
      const session = {
        congregationId: currentUserUpdate.congregationId,
        congregation: congregationName,
        username: currentUserUpdate.name,
        role: currentUserUpdate.role
      };
      localStorage.setItem('deborita_session', JSON.stringify(session));
    }
    await loadAllData();
  };

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'committees', label: 'Comités', icon: Users },
    ...(userRole !== 'VISITA' ? [{ id: 'tithes', label: 'Diezmos', icon: Calculator }] : []),
    { id: 'offerings', label: 'Ofrendas', icon: HandHeart },
    { id: 'projects', label: 'Proyectos', icon: Target },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'statistics', label: 'Estadísticas', icon: PieChart },
    ...(userRole !== 'VISITA' ? [{ id: 'settings', label: 'Configuración', icon: Settings }] : [])
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
        theme={theme}
        setTheme={setTheme}
        isMobile={isMobile}
        onLogout={() => {
          localStorage.removeItem('deborita_session');
          setIsLoginOpen(true);
        }}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenReset={() => setIsResetOpen(true)}
      />

      {/* Menú de Navegación por Pestañas (Estilo App Premium) */}
      <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 px-4 py-3 sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 min-w-[72px] py-2 px-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-800 text-blue-500 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
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
            allCommittees={activeCommittees}
            movements={activeMovements}
            offerings={activeOfferings}
            userRole={userRole}
            congregationName={congregationName}
            isMobile={isMobile}
            onSelectTab={setActiveTab}
            onAddMovement={handleAddMovement}
            onAddOffering={handleAddOffering}
          />
        )}

        {activeTab === 'committees' && (
          <CommitteesView
            committees={activeCommittees.filter(c => !c.isOfferingOnly)}
            movements={activeMovements}
            userRole={userRole}
            isMobile={isMobile}
            onCreateCommittee={handleCreateCommittee}
            onAddMovement={handleAddMovement}
            onAnnulMovement={handleAnnulMovement}
          />
        )}

        {activeTab === 'tithes' && (
          <TithesView
            tithes={activeTithes}
            userRole={userRole}
            isMobile={isMobile}
            pastorName={users.find(u => u.congregationId === congregationId && u.role === 'ADMIN')?.name || 'Pastor'}
            onSaveTithe={handleSaveTithe}
          />
        )}

        {activeTab === 'offerings' && (
          <OfferingsView
            offerings={activeOfferings}
            committees={activeCommittees} // Aquí sí van todos, incluyendo Junta Local
            userRole={userRole}
            isMobile={isMobile}
            onAddOffering={handleAddOffering}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={activeProjects}
            votes={activeVotes}
            userRole={userRole}
            isMobile={isMobile}
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
            isMobile={isMobile}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsView
            movements={activeMovements}
            committees={activeCommittees}
            tithes={activeTithes}
            offerings={activeOfferings}
            userRole={userRole}
            isMobile={isMobile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            congregationId={congregationId}
            congregationName={congregationName}
            congregationCity={congregations.find(c => c.id === congregationId)?.city}
            users={users}
            userRole={userRole}
            currentUser={users.find(u => u.congregationId === congregationId && u.role === userRole)}
            isMobile={isMobile}
            onUpdateCongregation={handleUpdateCongregationSettings}
            onUpdateUsers={handleUpdateUsersSettings}
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
