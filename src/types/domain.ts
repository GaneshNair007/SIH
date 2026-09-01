import type {
  UserRole,
  BandStatus,
  ShiftStatus,
  ReadingType,
  ConfidenceLevel,
  AlertSeverity,
  AlertStatus,
  CalibrationStatus,
  Company,
  UserProfile,
  Worker,
  Band,
  Shift,
  Reading,
  ExposureDaily,
  Alert,
  CalibrationVersion,
  CalibrationPoint,
  CompanyInsert,
  CompanyUpdate,
  UserProfileInsert,
  UserProfileUpdate,
  WorkerInsert,
  WorkerUpdate,
  BandInsert,
  BandUpdate,
  ShiftInsert,
  ShiftUpdate,
  ReadingInsert,
  ReadingUpdate,
  ExposureDailyInsert,
  ExposureDailyUpdate,
  AlertInsert,
  AlertUpdate,
  CalibrationVersionInsert,
  CalibrationVersionUpdate,
  CalibrationPointInsert,
  CalibrationPointUpdate,
  Json,
} from './database';

export type {
  Json,
  UserRole,
  BandStatus,
  ShiftStatus,
  ReadingType,
  ConfidenceLevel,
  AlertSeverity,
  AlertStatus,
  CalibrationStatus,
  Company,
  UserProfile,
  Worker,
  Band,
  Shift,
  Reading,
  ExposureDaily,
  Alert,
  CalibrationVersion,
  CalibrationPoint,
  CompanyInsert,
  CompanyUpdate,
  UserProfileInsert,
  UserProfileUpdate,
  WorkerInsert,
  WorkerUpdate,
  BandInsert,
  BandUpdate,
  ShiftInsert,
  ShiftUpdate,
  ReadingInsert,
  ReadingUpdate,
  ExposureDailyInsert,
  ExposureDailyUpdate,
  AlertInsert,
  AlertUpdate,
  CalibrationVersionInsert,
  CalibrationVersionUpdate,
  CalibrationPointInsert,
  CalibrationPointUpdate,
};

export type ExposureZone = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

export interface ExposureDoseCalculation {
  deltaE: number;
  doseLowPpmH: number;
  doseHighPpmH: number;
  zone: ExposureZone;
  confidence: ConfidenceLevel;
  saturationDetected: boolean;
  outOfRange: boolean;
  reasons?: string[];
}

export interface WorkerExposureSummary {
  today_low: number;
  today_high: number;
  week_low: number;
  week_high: number;
  month_low: number;
  month_high: number;
  long_term_low: number;
  long_term_high: number;
}

export interface ManagerStatsSummary {
  active_workers: number;
  active_bands: number;
  active_shifts: number;
  readings_today: number;
  open_alerts: number;
}

export interface EnrichedWorker extends Worker {
  active_band?: Band | null;
  active_shift?: Shift | null;
  today_exposure_low?: number;
  today_exposure_high?: number;
  open_alerts_count?: number;
}

export interface EnrichedShift extends Shift {
  worker?: Worker | null;
  band?: Band | null;
  manager?: UserProfile | null;
  start_reading?: Reading | null;
  end_reading?: Reading | null;
}

export interface EnrichedAlert extends Alert {
  worker?: Worker | null;
  band?: Band | null;
  shift?: Shift | null;
  reading?: Reading | null;
}

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  workerId?: string;
  workerCode?: string;
  department?: string;
  designation?: string;
  avatarInitials: string;
  defaultRoute: string;
  description: string;
}

export type DemoRoleProfile = Record<UserRole, DemoUser>;
