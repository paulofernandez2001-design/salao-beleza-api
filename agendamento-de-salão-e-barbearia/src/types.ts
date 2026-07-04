export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'admin';
  avatar: string;
  bio?: string;
  password?: string;
}

export interface Service {
  id: string;
  name: string;
  category: 'hair' | 'beard' | 'combo' | 'treatment' | 'color';
  price: number;
  duration: number; // in minutes
  description: string;
  icon: string; // lucide icon name
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  specialties: string[];
  availableDays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  availableHours: string[]; // ["09:00", "09:30", ...]
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  rating?: number; // 1-5
  review?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  clientName: string;
  clientAvatar: string;
  serviceName: string;
  rating: number;
  comment: string;
  date: string;
}
