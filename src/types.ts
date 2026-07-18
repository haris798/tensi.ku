export interface BloodPressureLog {
  id: string;
  user_id: string;
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
