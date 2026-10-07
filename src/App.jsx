import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import ResetModal from './components/ResetModal';
import CashCountModal from './components/CashCountModal';
import DashboardView from './components/DashboardView';
import CommitteesView from './components/CommitteesView';
import TithesView from './components/TithesView';
import OfferingsView from './components/OfferingsView';
import ProjectsView from './components/ProjectsView';
import ReportsView from './components/ReportsView';
import StatisticsView from './components/StatisticsView';
import SettingsView from './components/SettingsView';
import AdminView from './components/AdminView';
import TesoritoAI from './components/TesoritoAI';
import useMediaQuery from './hooks/useMediaQuery';

import { supabase } from './services/supabaseClient';
import { hashPin } from './utils/security';
import { logAuditAction } from './utils/auditLogger';

import {
  Home,
  Users,
  Calculator,
  HandHeart,
  Target,
  FileText,
  PieChart,
  Settings,
  Crown,
  WifiOff
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function App() {
  // Estado de usuario y autenticación
  const [congregationId, setCongregationId] = useState('cong-zuluaga');
  const [congregationName, setCongregationName] = useState('Zuluaga-Central D21');
  const [userName, setUserName] = useState('Tesorero');
  const [userRole, setUserRole] = useState('TESORERO');
  const [userCommitteeId, setUserCommitteeId] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(true);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isCashCountOpen, setIsCashCountOpen] = useState(false);

  // Estado de Navegación
  const [activeTab, setActiveTab] = useState('dashboard');

  // Estado de Red y Sincronización
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectedUsers, setConnectedUsers] = useState(1);

  // Estado de Tema y Responsive
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('deborita_theme');
    if (saved && saved.includes('dark')) return 'modern-light'; // Forzar migración a claro
    return saved || 'modern-light';
  });
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

  // Entidades principales de la Base de Datos
  const [users, setUsers] = useState([]);
  const [congregations, setCongregations] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [movements, setMovements] = useState([]);
  const [tithes, setTithes] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [votes, setVotes] = useState([]);

  const loadAllData = async () => {
    if (!isOnline) return;
    try {
      const [
        { data: usrs },
        { data: congs },
        { data: coms },
        { data: movs },
        { data: tiths },
        { data: offs },
        { data: projs },
        { data: vts }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('congregations').select('*'),
        supabase.from('committees').select('*'),
        supabase.from('movements').select('*'),
        supabase.from('tithes').select('*'),
        supabase.from('offerings').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('votes').select('*')
      ]);

      // Migración de seguridad: Hashear PINs en texto plano (longitud < 64)
      let usersToUpdate = usrs || [];
      let migrationNeeded = false;
      
      let migratedUsers = usersToUpdate.map(u => {
        if (u.pin && u.pin.length < 64) {
          migrationNeeded = true;
          return { ...u, pin: hashPin(u.pin) };
        }
        return u;
      });

      // Garantizar que exista el usuario SuperAdmin Maestro
      let superUser = migratedUsers.find(u => u.role === 'SUPERADMIN');
      if (!superUser) {
        superUser = {
          id: 'u-superadmin-master',
          congregationId: 'global',
          name: 'SuperAdmin',
          role: 'SUPERADMIN',
          pin: hashPin('54321'),
          createdAt: Date.now()
        };
        await supabase.from('users').upsert(superUser);
        migratedUsers = [...migratedUsers, superUser];
      }

      if (migrationNeeded) {
        console.log('Realizando migración de seguridad de PINs en la nube...');
        for (const mu of migratedUsers) {
          await supabase.from('users').upsert(mu);
        }
        setUsers(migratedUsers);
      } else {
        setUsers(migratedUsers);
      }

      setCongregations(congs || []);
      setCommittees(coms || []);
      setMovements(movs || []);
      setTithes(tiths || []);
      setOfferings(offs || []);
      setProjects(projs || []);
      setVotes(vts || []);

      return { usrs: migratedUsers, congs, coms, movs, tiths, offs, projs, vts };
    } catch (err) {
      console.error('Error cargando datos desde Supabase:', err);
      toast.error('Error al descargar datos de la nube');
      return {};
    }
  };

  // Cargar datos iniciales y suscribir a eventos
  useEffect(() => {
    async function initApp() {
      const loadedData = await loadAllData();
      
      // Restaurar y VALIDAR sesión guardada
      const savedSession = localStorage.getItem('deborita_session');
      if (savedSession && loadedData?.usrs) {
        try {
          const parsed = JSON.parse(savedSession);
          // Validación estricta de sesión
          const validUser = loadedData.usrs.find(
            u => (u.role === 'SUPERADMIN' && parsed.role === 'SUPERADMIN') ||
                 (u.congregationId === parsed.congregationId && u.role === parsed.role && u.name === parsed.username)
          );

          if (validUser) {
            setCongregationId(parsed.congregationId || (loadedData?.congs?.[0]?.id || 'global'));
            setCongregationName(parsed.congregation || 'Panel General');
            setUserName(parsed.username);
            setUserRole(parsed.role);
            setUserCommitteeId(validUser.committeeId || parsed.committeeId || null);
            if (parsed.role === 'SUPERADMIN') {
              setActiveTab('admin');
            }
            setIsLoginOpen(false);
          } else {
            console.warn('Sesión local inválida o manipulada. Forzando re-autenticación.');
            localStorage.removeItem('deborita_session');
            setIsLoginOpen(true);
          }
        } catch (_) {
          localStorage.removeItem('deborita_session');
          setIsLoginOpen(true);
        }
      }
    }
    
    if (isOnline) {
      initApp();
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('¡Conexión restaurada! Sincronizando datos...');
      initApp();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Sin conexión a Internet. La aplicación está bloqueada.', { duration: 6000 });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Supabase Realtime (Cualquier cambio en la BD refresca los datos)
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Cambio detectado en Supabase:', payload);
        loadAllData();
      })
      .subscribe();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(channel);
    };
  }, [isOnline]);

  // --- FILTROS Y CÁLCULOS DINÁMICOS POR CONGREGACIÓN Y ROL ---
  const isCommitteeRole = userRole === 'COMITE';
  
  // Buscar usuario actual en la lista completa
  const currentUserObj = users.find(
    u => u.congregationId === congregationId && u.role === userRole && u.name === userName
  ) || users.find(u => u.role === 'COMITE' && (u.name === userName || (userCommitteeId && u.committeeId === userCommitteeId)));

  // Resolución inteligente del comité asignado (por ID, snake_case, coincidencia de nombre o primer comité)
  let resolvedCommitteeId = userCommitteeId || currentUserObj?.committeeId || currentUserObj?.committee_id || null;

  if (isCommitteeRole) {
    const congCommittees = committees.filter(c => c.congregationId === congregationId);
    
    // Buscar coincidencia exacta por ID o Nombre
    let matched = congCommittees.find(c => 
      resolvedCommitteeId && (
        c.id === resolvedCommitteeId || 
        c.name.toLowerCase().trim() === String(resolvedCommitteeId).toLowerCase().trim()
      )
    );

    // Si no hace match directo, buscar por coincidencia entre nombre de usuario y nombre del comité
    if (!matched && userName) {
      const uNameLower = userName.toLowerCase().trim();
      matched = congCommittees.find(c => 
        uNameLower.includes(c.name.toLowerCase().trim()) || 
        c.name.toLowerCase().trim().includes(uNameLower) ||
        (c.treasurer && c.treasurer.toLowerCase().trim() === uNameLower)
      );
    }

    // Fallback de seguridad: si no se encontró coincidencia pero hay comités, asignar el primero
    if (!matched && congCommittees.length > 0) {
      matched = congCommittees[0];
    }

    if (matched) {
      resolvedCommitteeId = matched.id;
    }
  }

  const activeCommittees = committees
    .filter(c => c.congregationId === congregationId && (!isCommitteeRole || c.id === resolvedCommitteeId))
    .map(c => {
      const commMovs = movements.filter(m => m.committeeId === c.id && m.congregationId === congregationId && !m.annulled);
      const movsIncome = commMovs.filter(m => m.type === 'INGRESO').reduce((acc, m) => acc + (m.amount || 0), 0);
      const movsExpense = commMovs.filter(m => m.type === 'EGRESO').reduce((acc, m) => acc + (m.amount || 0), 0);
      const commOfferings = offerings.filter(o => o.destinationCommitteeId === c.id && o.congregationId === congregationId);

      const computedBalance = movsIncome - movsExpense; // Ofrendas se manejan como cuentas separadas
      return {
        ...c,
        balance: computedBalance
      };
    });

  const activeMovements = movements.filter(m => 
    m.congregationId === congregationId && 
    (!isCommitteeRole || m.committeeId === resolvedCommitteeId || activeCommittees.some(c => c.id === m.committeeId))
  );
  const activeTithes = tithes.filter(t => t.congregationId === congregationId);
  const activeOfferings = offerings.filter(o => 
    o.congregationId === congregationId && 
    (!isCommitteeRole || o.destinationCommitteeId === resolvedCommitteeId || activeCommittees.some(c => c.id === o.destinationCommitteeId))
  );
  const activeProjects = projects.filter(p => p.congregationId === congregationId);
  const activeProjectIds = new Set(activeProjects.map(p => p.id));
  const activeVotes = votes.filter(v => activeProjectIds.has(v.projectId));

  // --- HANDLERS DE OPERACIONES DE NEGOCIO (OFFLINE-FIRST) ---

  const handleCreateCongregation = async (name, pastorName, treasurerName) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const id = `cong-${Date.now()}`;
    const newCong = { id, name, city: '' };
    
    const { error: congError } = await supabase.from('congregations').insert(newCong);
    if (congError) throw new Error(congError.message);

    const defaultUsers = [
      { id: `u-1-${id}`, congregationId: id, name: pastorName || 'Pastor', role: 'ADMIN', pin: hashPin('1234'), createdAt: Date.now() },
      { id: `u-2-${id}`, congregationId: id, name: treasurerName || 'Tesorero', role: 'TESORERO', pin: hashPin('1234'), createdAt: Date.now() },
      { id: `u-3-${id}`, congregationId: id, name: 'Visita', role: 'VISITA', pin: hashPin('1234'), createdAt: Date.now() }
    ];
    const { error: usrError } = await supabase.from('users').insert(defaultUsers);
    if (usrError) throw new Error(usrError.message);

    // Comités Base
    const baseCommittees = [
      'Alabanza', 'Escuela Dominical', 'Familia', 'Intercesión', 
      'Obra Social', 'Misiones', 'Damas Dorcas', 'Decom', 'Jóvenes', 'Ujieres'
    ];
    const comsToInsert = baseCommittees.map((name, i) => ({
      id: `com-${id}-${i}-${Date.now()}`,
      congregationId: id,
      name,
      treasurer: '',
      balance: 0,
      isOfferingOnly: false,
      updatedAt: Date.now()
    }));
    comsToInsert.push({
      id: `com-${id}-junta-${Date.now()}`,
      congregationId: id,
      name: 'Junta Local',
      treasurer: '',
      balance: 0,
      isOfferingOnly: true,
      updatedAt: Date.now()
    });
    
    const { error: comError } = await supabase.from('committees').insert(comsToInsert);
    if (comError) throw new Error(comError.message);

    // No need to loadAllData, Realtime will handle it, but we can call it to be safe
    // However, for immediate feedback before Realtime triggers:
    await loadAllData();
    return id;
  };

  const handleCreateCommittee = async (committeeData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const newCommittee = {
      id: `com-${Date.now()}`,
      congregationId: congregationId,
      name: committeeData.name,
      treasurer: committeeData.treasurer || '',
      balance: 0,
      isOfferingOnly: !!committeeData.isOfferingOnly,
      updatedAt: Date.now()
    };
    const { error } = await supabase.from('committees').insert(newCommittee);
    if (error) {
      toast.error('Error al crear comité: ' + error.message);
    } else {
      toast.success('Comité creado con éxito');
      loadAllData();
    }
  };

  const handleUpdateCommittee = async (id, data) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const { error } = await supabase.from('committees').update({
      name: data.name,
      treasurer: data.treasurer || '',
      updatedAt: Date.now()
    }).eq('id', id);
    if (error) {
      toast.error('Error al actualizar comité: ' + error.message);
    } else {
      toast.success('Comité actualizado correctamente');
      loadAllData();
    }
  };

  const handleDeleteCommittee = async (id) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const { error } = await supabase.from('committees').delete().eq('id', id);
    if (error) {
      toast.error('Error al eliminar comité: ' + error.message);
    } else {
      toast.success('Comité eliminado');
      loadAllData();
    }
  };

  const handleAddMovement = async (movementData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
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

    const { error } = await supabase.from('movements').insert(newMovement);
    if (error) {
      toast.error('Error al guardar movimiento: ' + error.message);
    } else {
      toast.success('Movimiento registrado con éxito');
      loadAllData();
    }
  };

  const handleUpdateMovement = async (movData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const updatedMov = {
      type: movData.type,
      amount: movData.amount,
      description: movData.description || 'Sin descripción',
      date: movData.date
    };

    const { error } = await supabase.from('movements').update(updatedMov).eq('id', movData.id);
    if (error) {
      toast.error('Error al actualizar movimiento: ' + error.message);
    } else {
      toast.success('Movimiento actualizado correctamente');
      loadAllData();
    }
  };

  const handleAnnulMovement = async (movementId, reason) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const { error } = await supabase.from('movements').update({ annulled: true, annulReason: reason }).eq('id', movementId);
    if (error) {
      toast.error('Error al anular movimiento: ' + error.message);
    } else {
      toast.success('Movimiento anulado correctamente');
      loadAllData();
    }
  };

  const handleSaveTithe = async (titheData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const newTithe = {
      id: `t-${Date.now()}`,
      congregationId: congregationId,
      date: titheData.date || new Date().toISOString().slice(0, 10),
      month: titheData.month || String(new Date().getMonth() + 1).padStart(2, '0'),
      year: parseInt(titheData.year) || new Date().getFullYear(),
      pastorName: titheData.pastorName || 'Pastor',
      smlv: Number(titheData.smlv) || 1750905,
      nationalPercentage: Number(titheData.nationalPercentage) || 10,
      grossTithe: Number(titheData.grossTithe) || 0,
      nationalTreasury: Number(titheData.nationalTreasury) || 0,
      localFundAport: Number(titheData.localFundAport) || 0,
      netIncome: Number(titheData.netIncome) || 0,
      calculatedPoint: Number(titheData.calculatedPoint) || 0,
      correctedPoint: Number(titheData.correctedPoint) || 0,
      pastorAllocation: Number(titheData.pastorAllocation) || 0,
      balanceGroup: titheData.pastorName || 'Pastor',
      archived: false,
      createdAt: Date.now()
    };

    const { error } = await supabase.from('tithes').insert(newTithe);
    if (error) {
      toast.error('Error al guardar diezmo: ' + error.message);
    } else {
      toast.success('Liquidación de diezmo guardada correctamente');
      loadAllData();
    }
  };

  const handleUpdateTithe = async (titheId, titheData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const updated = {
      date: titheData.date || new Date().toISOString().slice(0, 10),
      month: titheData.month || String(new Date().getMonth() + 1).padStart(2, '0'),
      year: String(titheData.year || new Date().getFullYear()),
      pastorName: titheData.pastorName || 'Pastor',
      smlv: Number(titheData.smlv) || 1750905,
      nationalPercentage: Number(titheData.nationalPercentage) || 10,
      grossTithe: Number(titheData.grossTithe) || 0,
      nationalTreasury: Number(titheData.nationalTreasury) || 0,
      localFundAport: Number(titheData.localFundAport) || 0,
      netIncome: Number(titheData.netIncome) || 0,
      calculatedPoint: Number(titheData.calculatedPoint) || 0,
      correctedPoint: Number(titheData.correctedPoint) || 0,
      pastorAllocation: Number(titheData.pastorAllocation) || 0,
      balanceGroup: titheData.pastorName || 'Pastor'
    };

    const { error } = await supabase.from('tithes').update(updated).eq('id', titheId);
    if (error) {
      toast.error('Error al actualizar diezmo: ' + error.message);
    } else {
      toast.success('Liquidación de diezmo actualizada correctamente');
      loadAllData();
    }
  };

  const handleAddOffering = async (offeringData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const descriptionStr = offeringData.notes || offeringData.description || '';
    const responsibleStr = offeringData.responsible ? `[${offeringData.responsible}] ` : '';
    
    const jsDate = new Date(offeringData.date + 'T12:00:00Z');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const calculatedDayOfWeek = dayNames[jsDate.getUTCDay()];

    const newOffering = {
      id: `off-${Date.now()}`,
      congregationId: congregationId,
      date: offeringData.date,
      dayOfWeek: offeringData.dayOfWeek || calculatedDayOfWeek,
      destinationCommitteeId: offeringData.destinationCommitteeId,
      amount: offeringData.amount,
      responsible: offeringData.responsible || 'Tesorero',
      description: `${responsibleStr}${descriptionStr}`.trim(),
      notes: descriptionStr,
      type: offeringData.type || 'OFRENDA',
      createdAt: Date.now()
    };

    const { error } = await supabase.from('offerings').insert(newOffering);
    if (error) {
      toast.error('Error al guardar ofrenda: ' + error.message);
    } else {
      toast.success('Ofrenda guardada correctamente');
      loadAllData();
    }
  };

  const handleUpdateOffering = async (offeringData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const descriptionStr = offeringData.notes || offeringData.description || '';
    const responsibleStr = offeringData.responsible ? `[${offeringData.responsible}] ` : '';

    const jsDate = new Date(offeringData.date + 'T12:00:00Z');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const calculatedDayOfWeek = dayNames[jsDate.getUTCDay()];

    const updatedOffering = {
      date: offeringData.date,
      dayOfWeek: offeringData.dayOfWeek || calculatedDayOfWeek,
      destinationCommitteeId: offeringData.destinationCommitteeId,
      amount: offeringData.amount,
      responsible: offeringData.responsible || 'Tesorero',
      description: `${responsibleStr}${descriptionStr}`.trim(),
      notes: descriptionStr,
      type: offeringData.type || 'OFRENDA'
    };

    const { error } = await supabase.from('offerings').update(updatedOffering).eq('id', offeringData.id);
    if (error) {
      toast.error('Error al actualizar ofrenda: ' + error.message);
    } else {
      toast.success('Ofrenda actualizada correctamente');
      loadAllData();
    }
  };

  const handleDeleteOffering = async (offering) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const { error } = await supabase.from('offerings').delete().eq('id', offering.id);
    if (error) {
      toast.error('Error al eliminar ofrenda: ' + error.message);
    } else {
      toast.success('Ofrenda eliminada correctamente');
      loadAllData();
    }
  };

  const handleDeleteTithe = async (tithe) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const { error } = await supabase.from('tithes').delete().eq('id', tithe.id);
    if (error) {
      toast.error('Error al eliminar diezmo: ' + error.message);
    } else {
      toast.success('Diezmo eliminado correctamente');
      loadAllData();
    }
  };

  const handleCreateProject = async (projectData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const newProject = {
      id: `proj-${Date.now()}`,
      congregationId: congregationId,
      name: projectData.name,
      description: projectData.description || '',
      targetAmount: Number(projectData.financialGoal ?? projectData.targetAmount) || 0,
      financialGoal: Number(projectData.financialGoal ?? projectData.targetAmount) || 0,
      totalRaised: 0,
      startDate: projectData.startDate || new Date().toISOString().slice(0, 10),
      endDate: projectData.endDate ? projectData.endDate : '',
      status: projectData.status || 'ACTIVO',
      createdAt: Date.now()
    };

    const { error } = await supabase.from('projects').insert(newProject);
    if (error) {
      toast.error('Error al crear proyecto: ' + error.message);
    } else {
      toast.success('Proyecto creado correctamente');
      loadAllData();
    }
  };

  const handleUpdateProject = async (projectId, projectData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const updated = {
      name: projectData.name,
      description: projectData.description || '',
      financialGoal: Number(projectData.financialGoal ?? projectData.targetAmount) || 0,
      targetAmount: Number(projectData.financialGoal ?? projectData.targetAmount) || 0,
      startDate: projectData.startDate || new Date().toISOString().slice(0, 10),
      endDate: projectData.endDate ? projectData.endDate : '',
      status: projectData.status || 'ACTIVO'
    };

    const { error } = await supabase.from('projects').update(updated).eq('id', projectId);
    if (error) {
      toast.error('Error al actualizar proyecto: ' + error.message);
    } else {
      toast.success('Proyecto actualizado correctamente');
      loadAllData();
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    // Primero eliminar votos asociados
    await supabase.from('votes').delete().eq('projectId', projectId);
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast.error('Error al eliminar proyecto: ' + error.message);
    } else {
      toast.success('Proyecto y votos eliminados');
      loadAllData();
    }
  };

  const handleAddVote = async (voteData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    
    // Validar y asegurar projectId válido
    const targetProjId = voteData.projectId || projects.find(p => p.congregationId === congregationId)?.id;
    if (!targetProjId) {
      toast.error('Debes seleccionar o crear un proyecto primero');
      return;
    }

    const newVote = {
      id: `v-${Date.now()}`,
      projectId: targetProjId,
      memberName: voteData.memberName || voteData.voterName || 'Anónimo',
      voterName: voteData.memberName || voteData.voterName || 'Anónimo',
      amount: Number(voteData.amount) || 0,
      notes: voteData.notes || '',
      date: voteData.date || new Date().toISOString().slice(0, 10),
      createdAt: Date.now()
    };

    const { error } = await supabase.from('votes').insert(newVote);
    if (error) {
      toast.error('Error al añadir voto: ' + error.message);
      return;
    }

    // Recalcular total recaudado del proyecto
    const { data: allProjVotes } = await supabase.from('votes').select('amount').eq('projectId', targetProjId);
    const newTotal = (allProjVotes || []).reduce((acc, v) => acc + (v.amount || 0), 0);
    await supabase.from('projects').update({ totalRaised: newTotal }).eq('id', targetProjId);

    toast.success('Voto registrado correctamente');
    loadAllData();
  };

  const handleUpdateVote = async (voteData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const updatedVote = {
      memberName: voteData.memberName || voteData.voterName || 'Anónimo',
      voterName: voteData.memberName || voteData.voterName || 'Anónimo',
      amount: Number(voteData.amount) || 0,
      notes: voteData.notes || '',
      date: voteData.date || new Date().toISOString().slice(0, 10)
    };

    const { error } = await supabase.from('votes').update(updatedVote).eq('id', voteData.id);
    if (error) {
      toast.error('Error al actualizar voto: ' + error.message);
      return;
    }

    // Recalcular total recaudado del proyecto
    if (voteData.projectId) {
      const { data: allProjVotes } = await supabase.from('votes').select('amount').eq('projectId', voteData.projectId);
      const newTotal = (allProjVotes || []).reduce((acc, v) => acc + (v.amount || 0), 0);
      await supabase.from('projects').update({ totalRaised: newTotal }).eq('id', voteData.projectId);
    }

    toast.success('Voto actualizado correctamente');
    loadAllData();
  };

  const handleDeleteVote = async (vote) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const { error } = await supabase.from('votes').delete().eq('id', vote.id);
    if (error) {
      toast.error('Error al eliminar voto: ' + error.message);
      return;
    }

    // Recalcular total recaudado del proyecto
    if (vote.projectId) {
      const { data: allProjVotes } = await supabase.from('votes').select('amount').eq('projectId', vote.projectId);
      const newTotal = (allProjVotes || []).reduce((acc, v) => acc + (v.amount || 0), 0);
      await supabase.from('projects').update({ totalRaised: newTotal }).eq('id', vote.projectId);
    }

    toast.success('Voto eliminado correctamente');
    loadAllData();
  };

  const handleUpdateCongregationSettings = async (congData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    const cong = congregations.find(c => c.id === congregationId);
    if (cong) {
      const { error } = await supabase.from('congregations').update({ name: congData.name, city: congData.city }).eq('id', congregationId);
      if (error) {
        toast.error('Error al actualizar congregación: ' + error.message);
      } else {
        setCongregationName(congData.name);
      }
    }
  };

  const handleUpdateUsersSettings = async (updatedUsers) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    for (const u of updatedUsers) {
      await supabase.from('users').upsert(u);
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
  };

  // --- HANDLERS SUPERADMIN DE GESTIÓN GLOBAL ---
  const handleUpdateCongregationByAdmin = async (congId, congData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    try {
      const { error } = await supabase.from('congregations').update({
        name: congData.name,
        city: congData.city
      }).eq('id', congId);
      if (error) throw error;
      toast.success('Congregación actualizada con éxito');
      loadAllData();
    } catch (err) {
      toast.error('Error al actualizar congregación: ' + err.message);
    }
  };

  const handleDeleteCongregation = async (congId) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    try {
      await supabase.from('users').delete().eq('congregationId', congId);
      await supabase.from('committees').delete().eq('congregationId', congId);
      await supabase.from('movements').delete().eq('congregationId', congId);
      await supabase.from('tithes').delete().eq('congregationId', congId);
      await supabase.from('offerings').delete().eq('congregationId', congId);
      await supabase.from('projects').delete().eq('congregationId', congId);
      const { error } = await supabase.from('congregations').delete().eq('id', congId);
      if (error) throw error;
      toast.success('Congregación y todos sus datos eliminados');
      loadAllData();
    } catch (err) {
      toast.error('Error al eliminar congregación: ' + err.message);
    }
  };

  const handleCreateUser = async (userData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    try {
      const newUser = {
        id: `u-${Date.now()}`,
        congregationId: userData.congregationId,
        name: userData.name,
        role: userData.role,
        pin: userData.pin,
        committeeId: userData.committeeId || null,
        createdAt: Date.now()
      };
      const { error } = await supabase.from('users').insert(newUser);
      if (error) throw error;
      toast.success('Usuario creado con éxito');
      loadAllData();
    } catch (err) {
      toast.error('Error al crear usuario: ' + err.message);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    try {
      const { error } = await supabase.from('users').update({
        name: userData.name,
        role: userData.role,
        congregationId: userData.congregationId,
        committeeId: userData.committeeId || null
      }).eq('id', userId);
      if (error) throw error;
      toast.success('Usuario actualizado con éxito');
      loadAllData();
    } catch (err) {
      toast.error('Error al actualizar usuario: ' + err.message);
    }
  };

  const handleResetPin = async (userId, newPinHashed) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    try {
      const { error } = await supabase.from('users').update({ pin: newPinHashed }).eq('id', userId);
      if (error) throw error;
      loadAllData();
    } catch (err) {
      toast.error('Error al restablecer PIN: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isOnline) { toast.error('Sin conexión a Internet'); return; }
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      toast.success('Usuario eliminado');
      loadAllData();
    } catch (err) {
      toast.error('Error al eliminar usuario: ' + err.message);
    }
  };

  const handleAIAction = async (action, rawData) => {
    try {
      // Desenvolver los datos si la IA los anidó en "data" (Groq Llama-3.1 suele hacer esto)
      const data = rawData.data && typeof rawData.data === 'object' ? rawData.data : rawData;

      const safeAmount = Number(data.amount) || 0;
      let safeDate = data.date;
      if (!safeDate || !safeDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        safeDate = new Date().toISOString().slice(0, 10);
      }

      // Inferencia inteligente por si la IA aplanó el JSON y perdió el campo "action"
      let finalAction = action;
      if (!finalAction || finalAction === 'UNKNOWN') {
        if (data.type === 'INGRESO' || data.type === 'EGRESO') finalAction = 'CREATE_MOVEMENT';
        else if (data.grossIncome || data.grossTithe) finalAction = 'CREATE_TITHE';
        else if (data.targetAmount !== undefined) finalAction = 'CREATE_PROJECT';
        else if (data.destinationCommitteeName || data.amount) finalAction = 'CREATE_OFFERING'; // Fallback
      }

      switch (finalAction) {
        case 'CREATE_MOVEMENT':
          const foundCommMov = activeCommittees.find(c => c.name.toLowerCase().includes(data.committeeName?.toLowerCase() || '')) || activeCommittees[0];
          await handleAddMovement({
            committeeId: foundCommMov ? foundCommMov.id : '',
            type: data.type === 'EGRESO' ? 'EGRESO' : 'INGRESO',
            amount: safeAmount,
            description: data.description || 'Movimiento generado por IA',
            date: safeDate
          });
          break;
        case 'CREATE_OFFERING':
          const foundCommOff = activeCommittees.find(c => c.name.toLowerCase().includes(data.destinationCommitteeName?.toLowerCase() || '')) || activeCommittees[0];
          await handleAddOffering({
            destinationCommitteeId: foundCommOff ? foundCommOff.id : '',
            type: 'OFRENDA',
            amount: safeAmount,
            responsible: '',
            description: data.description || 'Ofrenda generada por IA',
            date: safeDate
          });
          break;
        case 'CREATE_TITHE':
          const gross = safeAmount;
          const national = gross * 0.10;
          const local = gross * 0.10;
          const net = gross - national - local;
          const alloc = net * 0.50;
          await handleSaveTithe({
            date: safeDate,
            month: safeDate.substring(5, 7),
            year: safeDate.substring(0, 4),
            grossTithe: gross,
            nationalPercentage: 10,
            nationalTreasury: national,
            localFundAport: local,
            netIncome: net,
            pastorAllocation: alloc,
            correctedPoint: 50,
            pastorName: data.memberOrGroupName || 'Anónimo'
          });
          break;
        case 'CREATE_PROJECT':
          await handleCreateProject({
            name: data.name || 'Nuevo Proyecto IA',
            description: data.description || '',
            targetAmount: Number(data.targetAmount) || 0,
            status: 'ACTIVO',
            startDate: safeDate,
            endDate: null
          });
          break;
      }
    } catch (err) {
      console.error(err);
      throw new Error('Error ejecutando la acción de Tesorito: ' + err.message);
    }
  };

  const isCommitteeUser = userRole === 'COMITE';
  const navItems = [
    ...(userRole === 'SUPERADMIN' ? [{
      id: 'admin',
      label: 'Administración',
      icon: Crown,
      accent: 'indigo',
      activeGradient: 'from-indigo-600 to-purple-600 text-white shadow-indigo-500/30 ring-2 ring-indigo-400/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/70',
      hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-800'
    }] : []),
    { 
      id: 'dashboard', 
      label: 'Inicio', 
      icon: Home,
      accent: 'blue',
      activeGradient: 'from-blue-600 to-indigo-600 text-white shadow-blue-500/30 ring-2 ring-blue-400/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950/70',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-800'
    },
    { 
      id: 'committees', 
      label: 'Comités', 
      icon: Users,
      accent: 'emerald',
      activeGradient: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/70',
      hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-800'
    },
    ...(!isCommitteeUser && userRole !== 'VISITA' ? [{ 
      id: 'tithes', 
      label: 'Diezmos', 
      icon: Calculator,
      accent: 'indigo',
      activeGradient: 'from-indigo-600 to-purple-600 text-white shadow-indigo-500/30 ring-2 ring-indigo-400/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/70',
      hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-800'
    }] : []),
    { 
      id: 'offerings', 
      label: 'Ofrendas', 
      icon: HandHeart,
      accent: 'amber',
      activeGradient: 'from-amber-500 to-orange-500 text-white shadow-amber-500/30 ring-2 ring-amber-400/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950/70',
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-800'
    },
    ...(!isCommitteeUser ? [
      { 
        id: 'projects', 
        label: 'Proyectos', 
        icon: Target,
        accent: 'purple',
        activeGradient: 'from-purple-600 to-pink-600 text-white shadow-purple-500/30 ring-2 ring-purple-400/50',
        iconColor: 'text-purple-600 dark:text-purple-400',
        iconBg: 'bg-purple-100 dark:bg-purple-950/70',
        hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-800'
      },
      { 
        id: 'reports', 
        label: 'Reportes', 
        icon: FileText,
        accent: 'cyan',
        activeGradient: 'from-cyan-600 to-blue-600 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/50',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        iconBg: 'bg-cyan-100 dark:bg-cyan-950/70',
        hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-800'
      },
      { 
        id: 'statistics', 
        label: 'Estadísticas', 
        icon: PieChart,
        accent: 'rose',
        activeGradient: 'from-rose-600 to-red-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/50',
        iconColor: 'text-rose-600 dark:text-rose-400',
        iconBg: 'bg-rose-100 dark:bg-rose-950/70',
        hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-800'
      }
    ] : []),
    ...(!isCommitteeUser && userRole !== 'VISITA' ? [{ 
      id: 'settings', 
      label: 'Configuración', 
      icon: Settings,
      accent: 'slate',
      activeGradient: 'from-slate-700 to-slate-900 text-white shadow-slate-700/30 ring-2 ring-slate-400/50',
      iconColor: 'text-slate-600 dark:text-slate-300',
      iconBg: 'bg-slate-200 dark:bg-slate-800',
      hoverBorder: 'hover:border-slate-300 dark:hover:border-slate-700'
    }] : [])
  ];

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 ${isLoginOpen ? 'overflow-hidden' : ''}`}>
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-white',
          style: {
            borderRadius: '16px',
            background: theme.includes('dark') ? '#1e293b' : '#ffffff',
            color: theme.includes('dark') ? '#f8fafc' : '#0f172a',
          },
        }}
      />
      
      {!isOnline && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-red-500/20">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Sin Conexión</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Esta aplicación requiere conexión a internet permanente. No puedes realizar cambios mientras estés desconectado para evitar conflictos multidispositivo.
            </p>
            <div className="inline-flex items-center justify-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              Esperando red...
            </div>
          </div>
        </div>
      )}

      {userRole === 'ADMIN' && (
        <TesoritoAI onAIAction={handleAIAction} />
      )}

      {!isLoginOpen && (
        <>
          {/* Navbar Superior */}
      <Navbar
        congregationName={congregationName}
        userRole={userRole}
        userName={userName}
        networkStatus={{ isOnline, isSyncing: false, pendingCount: 0 }}
        connectedUsers={connectedUsers}
        theme={theme}
        setTheme={setTheme}
        isMobile={isMobile}
        onLogout={() => {
          localStorage.removeItem('deborita_session');
          setIsLoginOpen(true);
        }}
        onOpenDiagnostics={() => {}}
        onOpenReset={() => setIsResetOpen(true)}
        onOpenCashCount={() => setIsCashCountOpen(true)}
      />

      {/* Menú de Navegación por Pestañas (Estilo App Premium Vibrante y Colorido) */}
      <nav className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 px-3 py-2.5 sticky top-[61px] z-30 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-start sm:justify-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-1.5 min-w-[70px] sm:min-w-[100px] py-1.5 px-2.5 sm:px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `bg-gradient-to-r ${item.activeGradient} shadow-md scale-105 font-black`
                    : `bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 ${item.hoverBorder} hover:scale-105 hover:bg-white dark:hover:bg-slate-800/90 shadow-sm`
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-transform group-hover:scale-110 ${isActive ? 'bg-white/20 text-white' : `${item.iconBg} ${item.iconColor}`}`}>
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                </div>
                <span className={`text-[10px] sm:text-xs tracking-tight ${isActive ? 'font-black text-white' : 'font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        
        {/* MÓDULO SUPERADMIN: ADMINISTRACIÓN GLOBAL */}
        {activeTab === 'admin' && userRole === 'SUPERADMIN' && (
          <AdminView
            congregations={congregations}
            users={users}
            committees={committees}
            movements={movements}
            tithes={tithes}
            offerings={offerings}
            projects={projects}
            activeCongregationId={congregationId}
            onSelectCongregation={(id, name) => {
              setCongregationId(id);
              setCongregationName(name);
            }}
            onCreateCongregation={handleCreateCongregation}
            onUpdateCongregation={handleUpdateCongregationByAdmin}
            onDeleteCongregation={handleDeleteCongregation}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onResetPin={handleResetPin}
            onDeleteUser={handleDeleteUser}
            isMobile={isMobile}
          />
        )}

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
            congregationName={congregationName}
            isMobile={isMobile}
            onCreateCommittee={handleCreateCommittee}
            onUpdateCommittee={handleUpdateCommittee}
            onDeleteCommittee={handleDeleteCommittee}
            onAddMovement={handleAddMovement}
            onUpdateMovement={handleUpdateMovement}
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
            onUpdateTithe={handleUpdateTithe}
            onDeleteTithe={handleDeleteTithe}
          />
        )}

        {activeTab === 'offerings' && (
          <OfferingsView
            offerings={activeOfferings}
            committees={activeCommittees} // Aquí sí van todos, incluyendo Junta Local
            userRole={userRole}
            congregationName={congregationName}
            isMobile={isMobile}
            onAddOffering={handleAddOffering}
            onUpdateOffering={handleUpdateOffering}
            onDeleteOffering={handleDeleteOffering}
            onCreateCommittee={handleCreateCommittee}
            onUpdateCommittee={handleUpdateCommittee}
            onDeleteCommittee={handleDeleteCommittee}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={activeProjects}
            votes={activeVotes}
            userRole={userRole}
            isMobile={isMobile}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onAddVote={handleAddVote}
            onUpdateVote={handleUpdateVote}
            onDeleteVote={handleDeleteVote}
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
            committees={committees}
            userRole={userRole}
            currentUser={users.find(u => u.congregationId === congregationId && u.role === userRole)}
            isMobile={isMobile}
            onUpdateCongregation={handleUpdateCongregationSettings}
            onUpdateUsers={handleUpdateUsersSettings}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            onResetPin={handleResetPin}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold">Deborita Gestión Local - Sistema de Administración Financiera Congregacional</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Soporte Offline-First con sincronización en la nube e IndexedDB local</p>
      </footer>
        </>
      )}

      {/* Modales Auxiliares */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentCongregation={congregationName}
        currentRole={userRole}
        congregations={congregations}
        users={users}
        committees={committees}
        onLogin={({ congregation, congregationId: cId, username, role, committeeId, remember }) => {
          setCongregationName(congregation);
          setCongregationId(cId);
          setUserName(username);
          setUserRole(role);
          setUserCommitteeId(committeeId || null);
          
          if (role === 'SUPERADMIN') {
            setActiveTab('admin');
          } else if (activeTab === 'admin' || (role === 'COMITE' && !['dashboard', 'committees', 'offerings'].includes(activeTab))) {
            setActiveTab('dashboard');
          }

          if (remember) {
            localStorage.setItem('deborita_session', JSON.stringify({ congregation, congregationId: cId, username, role, committeeId }));
          }

          if (role === 'VISITA' && activeTab === 'tithes') {
            setActiveTab('dashboard');
          }
        }}
      />

      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        congregationId={congregationId}
        congregationName={congregationName}
        users={users}
        onResetComplete={loadAllData}
      />

      <CashCountModal
        isOpen={isCashCountOpen}
        onClose={() => setIsCashCountOpen(false)}
      />

    </div>
  );
}
