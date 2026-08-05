-- Esquema inicial para Supabase de Deborita Gestión Local
-- Copia y pega este script en el "SQL Editor" de tu panel de Supabase y ejecútalo ("Run").

-- 0. Tabla de Usuarios
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TESORERO', 'VISITA')),
  pin TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL
);

-- 1. Tabla de Congregaciones
CREATE TABLE public.congregations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

-- 2. Tabla de Comités
CREATE TABLE public.committees (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL REFERENCES public.congregations(id),
  name TEXT NOT NULL,
  treasurer TEXT,
  balance NUMERIC DEFAULT 0,
  "isOfferingOnly" BOOLEAN DEFAULT false,
  "updatedAt" BIGINT NOT NULL
);

-- 3. Tabla de Movimientos
CREATE TABLE public.movements (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL REFERENCES public.congregations(id),
  "committeeId" TEXT NOT NULL REFERENCES public.committees(id),
  type TEXT NOT NULL CHECK (type IN ('INGRESO', 'EGRESO')),
  amount NUMERIC NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  annulled BOOLEAN DEFAULT false,
  "annulReason" TEXT,
  "createdAt" BIGINT NOT NULL
);

-- 4. Tabla de Diezmos
CREATE TABLE public.tithes (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL REFERENCES public.congregations(id),
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  "pastorName" TEXT NOT NULL,
  smlv NUMERIC NOT NULL,
  "nationalPercentage" NUMERIC NOT NULL,
  "grossTithe" NUMERIC NOT NULL,
  "nationalTreasury" NUMERIC NOT NULL,
  "netIncome" NUMERIC NOT NULL,
  "calculatedPoint" NUMERIC,
  "correctedPoint" NUMERIC,
  "localFundAport" NUMERIC NOT NULL,
  "pastorAllocation" NUMERIC NOT NULL,
  date TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL
);

-- 5. Tabla de Ofrendas
CREATE TABLE public.offerings (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL REFERENCES public.congregations(id),
  date TEXT NOT NULL,
  "dayOfWeek" TEXT NOT NULL,
  "destinationCommitteeId" TEXT REFERENCES public.committees(id),
  amount NUMERIC NOT NULL,
  responsible TEXT,
  notes TEXT,
  "createdAt" BIGINT NOT NULL
);

-- 6. Tabla de Proyectos Pro-Templo
CREATE TABLE public.projects (
  id TEXT PRIMARY KEY,
  "congregationId" TEXT NOT NULL REFERENCES public.congregations(id),
  name TEXT NOT NULL,
  description TEXT,
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "financialGoal" NUMERIC,
  "totalRaised" NUMERIC DEFAULT 0,
  "createdAt" BIGINT NOT NULL
);

-- 7. Tabla de Votos/Promesas
CREATE TABLE public.votes (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id),
  "memberName" TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TEXT NOT NULL,
  notes TEXT,
  "createdAt" BIGINT NOT NULL
);

-- Configurar Políticas RLS (Row Level Security) básicas
-- Temporalmente permitiremos lectura y escritura total para facilitar la integración inicial
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.congregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tithes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en users" ON public.users FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en congregations" ON public.congregations FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en committees" ON public.committees FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en movements" ON public.movements FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en tithes" ON public.tithes FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en offerings" ON public.offerings FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Permitir todo a usuarios anonimos (temporal) en votes" ON public.votes FOR ALL USING (true);
