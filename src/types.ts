export interface BloodPressureLog {
  id: number | string;
  user_id: number | string;
  systolic: number;
  diastolic: number;
  pulse: number;
  logged_at: string;
  notes: string;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  logged_at: string;
  notes: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  updated_at: string;
  target_weight?: number | null;
  height?: number | null;
}

export type BPCategory = 'Optimal' | 'Normal' | 'Normal tinggi' | 'Hipertensi 1' | 'Hipertensi 2' | 'Hipertensi 3' | 'Hipertensi sistolik terisolasi';

export interface MonthlyTrendData {
  name: string;
  value: number;
  color: string;
}

export interface AITipLog {
  id: string;
  tip: string;
  focus: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  amount_ml: number;
  logged_at: string; // ISO string
}

export interface WaterReminderConfig {
  enabled: boolean;
  daily_goal_ml: number; // e.g. 2000 ml
  interval_minutes: number; // e.g. 60 or 120
  start_time: string; // e.g. "07:00"
  end_time: string; // e.g. "21:00"
  sound_enabled: boolean;
}
