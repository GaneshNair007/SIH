-- Enable pgcrypto for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. users (References Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('SHIFT_MANAGER', 'CONTROL_ROOM_MANAGER', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_company ON users(company_id);

-- 3. workers
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  worker_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_hr_id TEXT,
  phone TEXT,
  email TEXT,
  department TEXT,
  designation TEXT,
  plant_id UUID,
  default_region_id UUID,
  default_work_area_id UUID,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workers_company ON workers(company_id);
CREATE UNIQUE INDEX idx_workers_company_code ON workers(company_id, worker_code);

-- 4. bands
CREATE TABLE bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  band_code TEXT UNIQUE NOT NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  batch_id UUID,
  qr_payload TEXT,
  issued_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('UNREGISTERED', 'REGISTERED', 'ACTIVE', 'WARNING', 'RETIRED', 'EXPIRED', 'COMPROMISED')),
  retirement_reason TEXT,
  working_day_count INTEGER DEFAULT 0,
  current_cumulative_low NUMERIC,
  current_cumulative_high NUMERIC,
  current_confidence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bands_company ON bands(company_id);
CREATE INDEX idx_bands_worker ON bands(worker_id);

-- 5. shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  band_id UUID REFERENCES bands(id) ON DELETE SET NULL,
  manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  plant_id UUID,
  region_id UUID,
  work_area_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  working_day_index INTEGER,
  start_reading_id UUID,
  end_reading_id UUID,
  exposure_low NUMERIC,
  exposure_high NUMERIC,
  confidence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_company ON shifts(company_id);
CREATE INDEX idx_shifts_worker ON shifts(worker_id);
CREATE UNIQUE INDEX idx_one_active_shift_per_worker ON shifts(worker_id) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX idx_one_active_shift_per_band ON shifts(band_id) WHERE status = 'ACTIVE';

-- 6. readings
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  band_id UUID REFERENCES bands(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reading_type TEXT CHECK (reading_type IN ('START', 'END')),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  work_date DATE,
  plant_id UUID,
  region_id UUID,
  work_area_id UUID,
  working_day_index INTEGER,
  image_storage_path TEXT,
  patch_a_rgb JSONB,
  patch_b_rgb JSONB,
  patch_c_rgb JSONB,
  patch_a_lab JSONB,
  patch_b_lab JSONB,
  patch_c_lab JSONB,
  delta_e NUMERIC,
  patch_c_status TEXT,
  measurement_status TEXT,
  confidence TEXT CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW', 'INVALID')),
  calibration_version_id UUID,
  dose_low_ppm_h NUMERIC,
  dose_high_ppm_h NUMERIC,
  saturation_detected BOOLEAN DEFAULT FALSE,
  out_of_range BOOLEAN DEFAULT FALSE,
  reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_readings_company ON readings(company_id);
CREATE INDEX idx_readings_worker ON readings(worker_id);
CREATE INDEX idx_readings_shift ON readings(shift_id);

-- 7. exposure_daily
CREATE TABLE exposure_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  date DATE,
  exposure_low_ppm_h NUMERIC,
  exposure_high_ppm_h NUMERIC,
  reading_count INTEGER,
  shift_count INTEGER,
  high_event_count INTEGER,
  critical_event_count INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, worker_id, date)
);

CREATE INDEX idx_exposure_daily_company ON exposure_daily(company_id);
CREATE INDEX idx_exposure_daily_worker ON exposure_daily(worker_id);

-- 8. alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  band_id UUID REFERENCES bands(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  reading_id UUID REFERENCES readings(id) ON DELETE SET NULL,
  severity TEXT CHECK (severity IN ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL')),
  rule_id TEXT,
  message TEXT,
  status TEXT CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED')),
  requires_ack BOOLEAN,
  requires_action BOOLEAN,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  action_type TEXT,
  action_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_company ON alerts(company_id);
CREATE INDEX idx_alerts_worker ON alerts(worker_id);
CREATE INDEX idx_alerts_open_company ON alerts(company_id, created_at DESC) WHERE status = 'OPEN';

-- 9. calibration_versions
CREATE TABLE calibration_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  version_label TEXT NOT NULL,
  chemistry_version TEXT,
  batch_scope TEXT,
  status TEXT CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),
  valid_from DATE,
  valid_until DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB
);

CREATE INDEX idx_cal_versions_company ON calibration_versions(company_id);

-- 10. calibration_points
CREATE TABLE calibration_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calibration_version_id UUID REFERENCES calibration_versions(id) ON DELETE CASCADE,
  delta_e NUMERIC NOT NULL,
  dose_low_ppm_h NUMERIC NOT NULL,
  dose_high_ppm_h NUMERIC NOT NULL,
  sequence INTEGER,
  metadata JSONB
);

CREATE INDEX idx_cal_points_version ON calibration_points(calibration_version_id);

-------------------------------------------------------
-- RPC FUNCTIONS
-------------------------------------------------------
CREATE OR REPLACE FUNCTION get_manager_stats(target_company_id UUID)
RETURNS TABLE (
  active_workers INTEGER,
  active_bands INTEGER,
  active_shifts INTEGER,
  readings_today INTEGER,
  open_alerts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM workers WHERE workers.company_id = target_company_id AND workers.status = 'ACTIVE') as active_workers,
    (SELECT COUNT(*)::INTEGER FROM bands WHERE bands.company_id = target_company_id AND bands.status IN ('ACTIVE', 'WARNING')) as active_bands,
    (SELECT COUNT(*)::INTEGER FROM shifts WHERE shifts.company_id = target_company_id AND shifts.status = 'ACTIVE') as active_shifts,
    (SELECT COUNT(*)::INTEGER FROM readings WHERE readings.company_id = target_company_id AND readings.work_date = CURRENT_DATE) as readings_today,
    (SELECT COUNT(*)::INTEGER FROM alerts WHERE alerts.company_id = target_company_id AND alerts.status = 'OPEN') as open_alerts;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_worker_exposure(target_worker_id UUID)
RETURNS TABLE (
  today_low NUMERIC,
  today_high NUMERIC,
  week_low NUMERIC,
  week_high NUMERIC,
  month_low NUMERIC,
  month_high NUMERIC,
  long_term_low NUMERIC,
  long_term_high NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date = CURRENT_DATE), 0) as today_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date = CURRENT_DATE), 0) as today_high,
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '7 days'), 0) as week_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '7 days'), 0) as week_high,
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '30 days'), 0) as month_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id AND date >= CURRENT_DATE - INTERVAL '30 days'), 0) as month_high,
    COALESCE((SELECT SUM(exposure_low_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id), 0) as long_term_low,
    COALESCE((SELECT SUM(exposure_high_ppm_h) FROM exposure_daily WHERE exposure_daily.worker_id = target_worker_id), 0) as long_term_high;
END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE exposure_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_points ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;

-- Internal helpers are outside the exposed schema and callable only by authenticated users.
CREATE OR REPLACE FUNCTION private.get_auth_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id FROM public.users WHERE id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION private.get_auth_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.users WHERE id = (SELECT auth.uid()) AND (SELECT auth.uid()) IS NOT NULL;
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
REVOKE EXECUTE ON FUNCTION private.get_auth_company_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.get_auth_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_auth_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_auth_role() TO authenticated;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT ON companies, users, workers, bands, shifts, readings, exposure_daily, alerts, calibration_versions, calibration_points TO authenticated;
GRANT UPDATE(name) ON users TO authenticated;
GRANT INSERT, UPDATE ON workers, bands, shifts, readings, exposure_daily, alerts TO authenticated;

-- Users can read their own company
CREATE POLICY "Users can read own company" ON companies
  FOR SELECT TO authenticated USING (id = (SELECT private.get_auth_company_id()));

-- Users can read profiles in their company
CREATE POLICY "Users can read co-workers" ON users
  FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()) AND company_id = (SELECT private.get_auth_company_id()));

-- All tables: Users can select/insert/update within their own company
-- For a production app, we would restrict INSERT/UPDATE to Managers only, but this provides baseline isolation
CREATE POLICY "Company isolation select workers" ON workers FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Managers insert workers" ON workers FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));
CREATE POLICY "Managers update workers" ON workers FOR UPDATE TO authenticated USING (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN')) WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));

CREATE POLICY "Company isolation select bands" ON bands FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Managers insert bands" ON bands FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));
CREATE POLICY "Managers update bands" ON bands FOR UPDATE TO authenticated USING (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN')) WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));

CREATE POLICY "Company isolation select shifts" ON shifts FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Managers insert shifts" ON shifts FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));
CREATE POLICY "Managers update shifts" ON shifts FOR UPDATE TO authenticated USING (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN')) WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));

CREATE POLICY "Company isolation select readings" ON readings FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Managers insert readings" ON readings FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));

CREATE POLICY "Company isolation select exposure_daily" ON exposure_daily FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Managers insert exposure_daily" ON exposure_daily FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));
CREATE POLICY "Managers update exposure_daily" ON exposure_daily FOR UPDATE TO authenticated USING (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN')) WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));

CREATE POLICY "Company isolation select alerts" ON alerts FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Managers insert alerts" ON alerts FOR INSERT TO authenticated WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'ADMIN'));
CREATE POLICY "Staff update alerts" ON alerts FOR UPDATE TO authenticated USING (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'CONTROL_ROOM_MANAGER', 'ADMIN')) WITH CHECK (company_id = (SELECT private.get_auth_company_id()) AND (SELECT private.get_auth_role()) IN ('SHIFT_MANAGER', 'CONTROL_ROOM_MANAGER', 'ADMIN'));

CREATE POLICY "Company isolation select calibration versions" ON calibration_versions FOR SELECT TO authenticated USING (company_id = (SELECT private.get_auth_company_id()));
CREATE POLICY "Company isolation select calibration points" ON calibration_points FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM calibration_versions cv WHERE cv.id = calibration_points.calibration_version_id AND cv.company_id = (SELECT private.get_auth_company_id())));

REVOKE EXECUTE ON FUNCTION get_manager_stats(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION get_worker_exposure(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_manager_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_worker_exposure(UUID) TO authenticated;
