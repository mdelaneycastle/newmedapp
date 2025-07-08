import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User, Medication } from '../types';

const API_BASE_URL = 'http://192.168.201.153:3000/api';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Network error');
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    await AsyncStorage.setItem('auth_token', response.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async register(
    email: string,
    password: string,
    name: string,
    role: 'carer' | 'dependant'
  ): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });

    await AsyncStorage.setItem('auth_token', response.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    
    return response;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User | null> {
    const userString = await AsyncStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  }

  // Medications
  async getDependantMedications(dependantId: number): Promise<Medication[]> {
    return this.request<Medication[]>(`/medications/dependant/${dependantId}`);
  }

  async getMyMedications(): Promise<Medication[]> {
    return this.request<Medication[]>('/medications/mine');
  }

  async createMedication(medication: {
    name: string;
    dosage?: string;
    instructions?: string;
    dependantId: number;
    schedules: Array<{
      time_of_day: string;
      days_of_week: number[];
    }>;
  }): Promise<{ message: string; medication: Medication }> {
    return this.request('/medications', {
      method: 'POST',
      body: JSON.stringify(medication),
    });
  }

  async updateMedicationSchedule(
    medicationId: number,
    schedules: Array<{
      time_of_day: string;
      days_of_week: number[];
    }>
  ): Promise<{ message: string }> {
    return this.request(`/medications/${medicationId}/schedule`, {
      method: 'PUT',
      body: JSON.stringify({ schedules }),
    });
  }

  // Relationships
  async getDependants(): Promise<Array<{
    id: number;
    email: string;
    name: string;
    created_at: string;
  }>> {
    return this.request('/relationships/dependants');
  }

  async addDependant(dependantEmail: string): Promise<{
    message: string;
    dependant: {
      id: number;
      email: string;
      name: string;
    };
  }> {
    return this.request('/relationships/add-dependant', {
      method: 'POST',
      body: JSON.stringify({ dependantEmail }),
    });
  }

  // Confirmations
  async getPendingConfirmations(): Promise<Array<{
    id: number;
    dependant_id: number;
    medication_id: number;
    schedule_id: number;
    photo_path: string;
    taken_at: string;
    confirmed_by_carer: boolean;
    notes?: string;
    medication_name: string;
    dependant_name: string;
  }>> {
    return this.request('/confirmations/pending');
  }

  async confirmMedication(confirmationId: number, notes?: string): Promise<{
    message: string;
  }> {
    return this.request(`/confirmations/${confirmationId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async submitMedicationConfirmation(
    medicationId: number,
    photoPath: string,
    scheduleId?: number
  ): Promise<{
    message: string;
    confirmation: any;
  }> {
    return this.request('/confirmations/submit', {
      method: 'POST',
      body: JSON.stringify({ medicationId, photoPath, scheduleId }),
    });
  }

  async getRecentConfirmations(): Promise<Array<{
    medication_id: number;
    schedule_id: number;
    taken_at: string;
    confirmed_by_carer: boolean;
    time_of_day: string;
    days_of_week: number[];
  }>> {
    return this.request('/confirmations/recent');
  }
}

export default new ApiService();