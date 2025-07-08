export interface User {
  id: number;
  email: string;
  name: string;
  role: 'carer' | 'dependant';
  created_at: Date;
  updated_at: Date;
}

export interface Medication {
  id: number;
  name: string;
  dosage?: string;
  instructions?: string;
  dependant_id: number;
  carer_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface MedicationSchedule {
  id: number;
  medication_id: number;
  time_of_day: string;
  days_of_week: number[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  dependant_id: number;
  medication_id: number;
  schedule_id: number;
  message: string;
  type: 'medication_reminder' | 'schedule_update';
  read: boolean;
  scheduled_time: Date;
  created_at: Date;
}

export interface MedicationConfirmation {
  id: number;
  dependant_id: number;
  medication_id: number;
  schedule_id: number;
  photo_path: string;
  taken_at: Date;
  confirmed_by_carer: boolean;
  carer_confirmed_at?: Date;
  notes?: string;
}

export interface AuthTokenPayload {
  userId: number;
  role: 'carer' | 'dependant';
}