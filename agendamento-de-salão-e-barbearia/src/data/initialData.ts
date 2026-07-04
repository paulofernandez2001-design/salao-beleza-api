import { Service, Staff, Appointment, User, Review } from '../types';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Corte de Cabelo Moderno',
    category: 'hair',
    price: 60.00,
    duration: 45,
    description: 'Corte personalizado (degradê, social, pompadour) adaptado ao seu estilo e formato de rosto.',
    icon: 'Scissors'
  },
  {
    id: 's2',
    name: 'Barba Completa & Barboterapia',
    category: 'beard',
    price: 45.00,
    duration: 30,
    description: 'Modelagem de barba com toalha quente, óleos essenciais, massagem facial e navalha afiada.',
    icon: 'Sparkles'
  },
  {
    id: 's3',
    name: 'Combo Cabelo & Barba',
    category: 'combo',
    price: 95.00,
    duration: 75,
    description: 'O serviço completo da casa. Corte de cabelo premium mais barboterapia completa com desconto especial.',
    icon: 'Layers'
  },
  {
    id: 's4',
    name: 'Tratamento de Hidratação Profunda',
    category: 'treatment',
    price: 70.00,
    duration: 40,
    description: 'Lavagem especial com shampoo de menta e aplicação de máscara reconstrutora para dar brilho e força aos fios.',
    icon: 'Heart'
  },
  {
    id: 's5',
    name: 'Coloração & Platinado (Global)',
    category: 'color',
    price: 150.00,
    duration: 120,
    description: 'Descoloração global e matização platinada ou aplicação de tinturas profissionais com proteção do couro cabeludo.',
    icon: 'Palette'
  },
  {
    id: 's6',
    name: 'Selagem Térmica / Alinhamento',
    category: 'treatment',
    price: 130.00,
    duration: 90,
    description: 'Redução de volume dos fios e alinhamento térmico com produtos sem formol de alta performance.',
    icon: 'Zap'
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'p1',
    name: 'Lucas "Barba" Silva',
    role: 'Barbeiro Master & Visagista',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    rating: 4.9,
    specialties: ['Degradê Navalhado', 'Barboterapia', 'Corte Clássico'],
    availableDays: [1, 2, 3, 4, 5, 6], // Seg a Sáb
    availableHours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
  },
  {
    id: 'p2',
    name: 'Carolina Costa',
    role: 'Stylist & Colorista',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
    specialties: ['Coloração Platinada', 'Corte Moderno', 'Hidratação e Selagem'],
    availableDays: [2, 3, 4, 5, 6], // Ter a Sáb
    availableHours: ['09:30', '10:30', '11:30', '13:30', '14:30', '15:30', '16:30', '17:30']
  },
  {
    id: 'p3',
    name: 'Thiago Rodrigues',
    role: 'Barbeiro Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 4.7,
    specialties: ['Risquinhos', 'Corte Americano (Fade)', 'Pigmentação'],
    availableDays: [1, 2, 3, 4, 5], // Seg a Sex
    availableHours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  }
];

export const DEFAULT_CLIENT: User = {
  id: 'u_client',
  name: 'Paulo Fernandez',
  email: 'fernandezpaulo214@gmail.com',
  phone: '(11) 98765-4321',
  role: 'client',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  bio: 'Cliente assíduo buscando sempre manter o corte alinhado.'
};

export const DEFAULT_ADMIN: User = {
  id: 'u_admin',
  name: 'Roberto Cortês',
  email: 'roberto.cortes@barbearia.com',
  phone: '(11) 99999-8888',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
  bio: 'Gerente geral do Corte & Estilo, focado na melhor experiência.'
};

// Generates some mock dates (including past and future dates based on current local time)
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const getFutureDateStr = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clientId: 'u_client',
    clientName: 'Paulo Fernandez',
    clientPhone: '(11) 98765-4321',
    clientEmail: 'fernandezpaulo214@gmail.com',
    serviceId: 's3',
    serviceName: 'Combo Cabelo & Barba',
    servicePrice: 95.00,
    serviceDuration: 75,
    staffId: 'p1',
    staffName: 'Lucas "Barba" Silva',
    date: getPastDateStr(14),
    time: '10:00',
    status: 'completed',
    notes: 'Cortar baixo nas laterais e acertar a barba com máquina 1.5.',
    rating: 5,
    review: 'O Lucas é fenomenal! A massagem com toalha quente na barba é relaxante demais.',
    createdAt: new Date(getPastDateStr(15)).toISOString()
  },
  {
    id: 'a2',
    clientId: 'c2',
    clientName: 'Mariana Santos',
    clientPhone: '(11) 91234-5678',
    clientEmail: 'mariana.santos@gmail.com',
    serviceId: 's4',
    serviceName: 'Tratamento de Hidratação Profunda',
    servicePrice: 70.00,
    serviceDuration: 40,
    staffId: 'p2',
    staffName: 'Carolina Costa',
    date: getPastDateStr(7),
    time: '14:30',
    status: 'completed',
    notes: 'Cabelos secos nas pontas.',
    rating: 4,
    review: 'Muito atenciosa, meu cabelo ficou super leve e cheiroso!',
    createdAt: new Date(getPastDateStr(8)).toISOString()
  },
  {
    id: 'a3',
    clientId: 'c3',
    clientName: 'Bruno Alencar',
    clientPhone: '(11) 95555-4444',
    clientEmail: 'bruno.alen@outlook.com',
    serviceId: 's1',
    serviceName: 'Corte de Cabelo Moderno',
    servicePrice: 60.00,
    serviceDuration: 45,
    staffId: 'p3',
    staffName: 'Thiago Rodrigues',
    date: getPastDateStr(3),
    time: '16:00',
    status: 'completed',
    notes: 'Degradê em V no cabelo raspado.',
    rating: 5,
    review: 'Trabalho de artista, riscos simétricos e fade perfeito.',
    createdAt: new Date(getPastDateStr(4)).toISOString()
  },
  {
    id: 'a4',
    clientId: 'u_client',
    clientName: 'Paulo Fernandez',
    clientPhone: '(11) 98765-4321',
    clientEmail: 'fernandezpaulo214@gmail.com',
    serviceId: 's1',
    serviceName: 'Corte de Cabelo Moderno',
    servicePrice: 60.00,
    serviceDuration: 45,
    staffId: 'p1',
    staffName: 'Lucas "Barba" Silva',
    date: getFutureDateStr(2),
    time: '11:00',
    status: 'confirmed',
    notes: 'Degradê médio, mesmo estilo da última vez.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'a5',
    clientId: 'c4',
    clientName: 'Gustavo Lima',
    clientPhone: '(11) 97777-6666',
    clientEmail: 'gustavo.lima@yahoo.com',
    serviceId: 's2',
    serviceName: 'Barba Completa & Barboterapia',
    servicePrice: 45.00,
    serviceDuration: 30,
    staffId: 'p3',
    staffName: 'Thiago Rodrigues',
    date: getFutureDateStr(1),
    time: '14:00',
    status: 'pending',
    notes: 'Apenas aparar um pouco o bigode.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'a6',
    clientId: 'c5',
    clientName: 'Camila Ribeiro',
    clientPhone: '(11) 96666-3333',
    clientEmail: 'camila.ribeiro@gmail.com',
    serviceId: 's5',
    serviceName: 'Coloração & Platinado (Global)',
    servicePrice: 150.00,
    serviceDuration: 120,
    staffId: 'p2',
    staffName: 'Carolina Costa',
    date: getFutureDateStr(3),
    time: '10:00',
    status: 'pending',
    notes: 'Gostaria de platinar o cabelo curto.',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    clientName: 'Paulo Fernandez',
    clientAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    serviceName: 'Combo Cabelo & Barba',
    rating: 5,
    comment: 'O Lucas é fenomenal! A massagem com toalha quente na barba é relaxante demais. Atendimento nota 10.',
    date: getPastDateStr(14)
  },
  {
    id: 'r2',
    clientName: 'Mariana Santos',
    clientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    serviceName: 'Tratamento de Hidratação Profunda',
    rating: 4,
    comment: 'Muito atenciosa, meu cabelo ficou super leve, sedoso e muito cheiroso! Recomendo Carolina.',
    date: getPastDateStr(7)
  },
  {
    id: 'r3',
    clientName: 'Bruno Alencar',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    serviceName: 'Corte de Cabelo Moderno',
    rating: 5,
    comment: 'Trabalho de artista do Thiago Rodrigues, riscos simétricos e fade perfeito! Melhor barbearia da região.',
    date: getPastDateStr(3)
  }
];
