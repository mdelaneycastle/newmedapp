export interface User {
  id: number;
  email: string;
  name: string;
  role: 'carer' | 'dependant';
}

export interface Medication {
  id: number;
  name: string;
  dosage?: string;
  instructions?: string;
  dependant_id: number;
  carer_id: number;
  schedule_id?: number;
  time_of_day?: string;
  days_of_week?: number[];
  active?: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface MedicationConfirmation {
  id: number;
  dependant_id: number;
  medication_id: number;
  schedule_id: number;
  photo_path: string;
  taken_at: string;
  confirmed_by_carer: boolean;
  carer_confirmed_at?: string;
  notes?: string;
}

export interface Notification {
  id: number;
  dependant_id: number;
  medication_id: number;
  schedule_id: number;
  message: string;
  type: 'medication_reminder' | 'schedule_update';
  read: boolean;
  scheduled_time: string;
  created_at: string;
}