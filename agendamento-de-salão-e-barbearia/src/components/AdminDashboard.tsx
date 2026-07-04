import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Layers, Heart, Palette, Zap, 
  Calendar, Clock, Check, ChevronRight, User, Star, 
  Search, Filter, Plus, Edit, Trash2, DollarSign, 
  TrendingUp, Users, CheckCircle, XCircle, FileText, ArrowUpDown
} from 'lucide-react';
import { Service, Staff, Appointment, User as UserType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Icons mapping for services
const iconMap: { [key: string]: React.ComponentType<any> } = {
  Scissors,
  Sparkles,
  Layers,
  Heart,
  Palette,
  Zap,
};

function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = iconMap[name] || Scissors;
  return <IconComponent className={className} />;
}

interface AdminDashboardProps {
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  onUpdateAppointments: (apps: Appointment[]) => void;
  onUpdateServices: (services: Service[]) => void;
  onUpdateStaff: (staff: Staff[]) => void;
}

export default function AdminDashboard({
  services,
  staff,
  appointments,
  onUpdateAppointments,
  onUpdateServices,
  onUpdateStaff,
}: AdminDashboardProps) {
  const [adminTab, setAdminTab] = useState<'appointments' | 'services' | 'staff' | 'clients'>('appointments');

  // Search & Filter state for appointments
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appDateFilter, setAppDateFilter] = useState<string>(''); // YYYY-MM-DD

  // Search state for clients
  const [clientSearch, setClientSearch] = useState('');

  // Service Form Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState(50);
  const [serviceDuration, setServiceDuration] = useState(45);
  const [serviceCategory, setServiceCategory] = useState<'hair' | 'beard' | 'combo' | 'treatment' | 'color'>('hair');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceIcon, setServiceIcon] = useState('Scissors');

  // Staff Form Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffAvatar, setStaffAvatar] = useState('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200');
  const [staffSpecialties, setStaffSpecialties] = useState('');
  
  // Financial & Operational Metrics calculations
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed');
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

  const totalRevenue = completedAppointments.reduce((sum, a) => sum + a.servicePrice, 0);
  const averageTicket = completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0;
  const cancellationRate = appointments.length > 0 ? (cancelledAppointments.length / appointments.length) * 100 : 0;

  // Group clients by unique phone/email
  interface ClientStats {
    id: string;
    name: string;
    phone: string;
    email: string;
    totalVisits: number;
    totalSpent: number;
    lastVisitDate: string;
  }

  const clientStatsMap: { [key: string]: ClientStats } = {};
  appointments.forEach(app => {
    const key = app.clientPhone || app.clientId;
    if (!clientStatsMap[key]) {
      clientStatsMap[key] = {
        id: app.clientId,
        name: app.clientName,
        phone: app.clientPhone,
        email: app.clientEmail,
        totalVisits: 0,
        totalSpent: 0,
        lastVisitDate: app.date
      };
    }

    if (app.status === 'completed') {
      clientStatsMap[key].totalVisits += 1;
      clientStatsMap[key].totalSpent += app.servicePrice;
    }
    
    // Track most recent date
    if (new Date(app.date).getTime() > new Date(clientStatsMap[key].lastVisitDate).getTime()) {
      clientStatsMap[key].lastVisitDate = app.date;
    }
  });

  const clientsList = Object.values(clientStatsMap).sort((a, b) => b.totalSpent - a.totalSpent);

  // Filtered Appointments
  const filteredAppointments = appointments
    .filter(app => {
      const matchSearch = app.clientName.toLowerCase().includes(appSearch.toLowerCase()) || 
                          app.serviceName.toLowerCase().includes(appSearch.toLowerCase()) ||
                          app.staffName.toLowerCase().includes(appSearch.toLowerCase());
      
      const matchStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
      const matchDate = !appDateFilter || app.date === appDateFilter;

      return matchSearch && matchStatus && matchDate;
    })
    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

  // Filtered Clients
  const filteredClients = clientsList.filter(cli => 
    cli.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    cli.phone.includes(clientSearch) ||
    cli.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Status Action Handlers
  const handleUpdateStatus = (id: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    const updated = appointments.map(app => {
      if (app.id === id) {
        return { ...app, status };
      }
      return app;
    });
    onUpdateAppointments(updated);
  };

  // Service actions
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServiceId) {
      // Edit
      const updated = services.map(s => {
        if (s.id === editingServiceId) {
          return {
            ...s,
            name: serviceName,
            price: Number(servicePrice),
            duration: Number(serviceDuration),
            category: serviceCategory,
            description: serviceDescription,
            icon: serviceIcon
          };
        }
        return s;
      });
      onUpdateServices(updated);
    } else {
      // Create new
      const newService: Service = {
        id: 's_' + Date.now(),
        name: serviceName,
        price: Number(servicePrice),
        duration: Number(serviceDuration),
        category: serviceCategory,
        description: serviceDescription,
        icon: serviceIcon
      };
      onUpdateServices([...services, newService]);
    }
    setIsServiceModalOpen(false);
    clearServiceForm();
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServicePrice(service.price);
    setServiceDuration(service.duration);
    setServiceCategory(service.category);
    setServiceDescription(service.description);
    setServiceIcon(service.icon);
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Deseja realmente remover este serviço do catálogo?")) {
      onUpdateServices(services.filter(s => s.id !== id));
    }
  };

  const clearServiceForm = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServicePrice(50);
    setServiceDuration(45);
    setServiceCategory('hair');
    setServiceDescription('');
    setServiceIcon('Scissors');
  };

  // Staff actions
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const specialtiesArray = staffSpecialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    if (editingStaffId) {
      const updated = staff.map(s => {
        if (s.id === editingStaffId) {
          return {
            ...s,
            name: staffName,
            role: staffRole,
            avatar: staffAvatar,
            specialties: specialtiesArray
          };
        }
        return s;
      });
      onUpdateStaff(updated);
    } else {
      const newStaff: Staff = {
        id: 'p_' + Date.now(),
        name: staffName,
        role: staffRole,
        avatar: staffAvatar,
        rating: 5.0,
        specialties: specialtiesArray,
        availableDays: [1, 2, 3, 4, 5, 6],
        availableHours: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
      };
      onUpdateStaff([...staff, newStaff]);
    }
    setIsStaffModalOpen(false);
    clearStaffForm();
  };

  const handleEditStaffClick = (pro: Staff) => {
    setEditingStaffId(pro.id);
    setStaffName(pro.name);
    setStaffRole(pro.role);
    setStaffAvatar(pro.avatar);
    setStaffSpecialties(pro.specialties.join(', '));
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Tem certeza que deseja remover este profissional da equipe?")) {
      onUpdateStaff(staff.filter(s => s.id !== id));
    }
  };

  const clearStaffForm = () => {
    setEditingStaffId(null);
    setStaffName('');
    setStaffRole('');
    setStaffAvatar('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200');
    setStaffSpecialties('');
  };

  // SVG Area Revenue Chart calculations
  const getRevenueChartData = () => {
    // Generate dates of the last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      const rev = appointments
        .filter(app => app.date === dateString && app.status === 'completed')
        .reduce((sum, app) => sum + app.servicePrice, 0);

      const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      data.push({ dayLabel, revenue: rev, dateString });
    }
    return data;
  };

  const revenueChartData = getRevenueChartData();
  const maxRevenueVal = Math.max(...revenueChartData.map(d => d.revenue), 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Painel Administrativo
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Acompanhe o faturamento, controle a agenda da equipe de barbeiros/estilistas e gerencie o catálogo de serviços.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Faturamento Bruto</p>
            <h3 className="text-2xl font-black font-mono text-slate-900">R$ {totalRevenue.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center">
              <TrendingUp className="h-3 w-3 mr-0.5" /> +12.4% este mês
            </p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Concluídos / Pendentes</p>
            <h3 className="text-2xl font-black font-mono text-slate-900">
              {completedAppointments.length} <span className="text-slate-300 font-normal">/</span> <span className="text-amber-500">{pendingAppointments.length}</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Aguardando confirmação: {pendingAppointments.length}
            </p>
          </div>
          <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Ticket Médio</p>
            <h3 className="text-2xl font-black font-mono text-slate-900">R$ {averageTicket.toFixed(2)}</h3>
            <p className="text-[10px] text-slate-500 font-medium">Por cliente atendido</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Taxa de Desistência</p>
            <h3 className="text-2xl font-black font-mono text-slate-900">{cancellationRate.toFixed(1)}%</h3>
            <p className="text-[10px] text-red-500 font-semibold flex items-center">
              Total cancelados: {cancelledAppointments.length}
            </p>
          </div>
          <div className="p-4 bg-red-50/50 text-red-600 rounded-2xl">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* SVG Daily Revenue Chart */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider mb-6 flex items-center">
          <TrendingUp className="h-4 w-4 text-amber-500 mr-2" /> Desempenho Financeiro dos Últimos 7 Dias
        </h4>
        <div className="h-44 sm:h-56 relative flex items-end justify-between px-2 sm:px-6 pt-4 border-b border-slate-100">
          {revenueChartData.map((d, index) => {
            const heightPct = (d.revenue / maxRevenueVal) * 80 + 10; // min 10%, max 90%
            return (
              <div key={index} className="flex-1 flex flex-col items-center group h-full justify-end">
                {/* Tooltip on hover */}
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-amber-400 text-[10px] font-mono font-bold px-2 py-1.5 rounded-lg -translate-y-20 shadow-md pointer-events-none z-10">
                  R$ {d.revenue.toFixed(2)}
                </div>
                {/* Bar */}
                <div 
                  style={{ height: `${heightPct}%` }}
                  className="w-8 sm:w-16 rounded-t-lg bg-gradient-to-t from-slate-900 via-slate-800 to-amber-500 group-hover:to-amber-400 transition-all shadow-inner flex items-end justify-center"
                >
                  <span className="text-[9px] font-mono font-black text-amber-300 hidden sm:block mb-2 group-hover:text-white">
                    {d.revenue > 0 ? `R$${Math.round(d.revenue)}` : ''}
                  </span>
                </div>
                {/* Day label */}
                <span className="text-[10px] font-bold text-slate-400 mt-3 font-mono capitalize">
                  {d.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab select bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto pb-px mb-6 scrollbar-none">
        <button
          onClick={() => setAdminTab('appointments')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            adminTab === 'appointments'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Agenda &amp; Reservas</span>
          {pendingAppointments.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
              {pendingAppointments.length} novo
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('services')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            adminTab === 'services'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <Scissors className="h-4 w-4" />
          <span>Catálogo de Serviços</span>
        </button>
        <button
          onClick={() => setAdminTab('staff')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            adminTab === 'staff'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Equipe &amp; Barbeiros</span>
        </button>
        <button
          onClick={() => setAdminTab('clients')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            adminTab === 'clients'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Clientes (CRM)</span>
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {/* Module 1: Appointments List */}
        {adminTab === 'appointments' && (
          <motion.div
            key="appointments-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter Bar */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, serviço ou profissional..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                {/* Date input filter */}
                <div className="flex items-center space-x-1 border border-slate-200 bg-white p-1 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 px-2 font-mono uppercase">DATA:</span>
                  <input
                    type="date"
                    value={appDateFilter}
                    onChange={(e) => setAppDateFilter(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold focus:outline-none pr-2"
                  />
                  {appDateFilter && (
                    <button onClick={() => setAppDateFilter('')} className="text-[10px] font-bold text-red-500 hover:underline px-2">Limpar</button>
                  )}
                </div>

                {/* Status selector filter */}
                <div className="flex items-center border border-slate-200 bg-white p-1 rounded-xl">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'confirmed', label: 'Confirmados' },
                    { id: 'completed', label: 'Concluídos' },
                    { id: 'cancelled', label: 'Cancelados' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAppStatusFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all ${
                        appStatusFilter === f.id
                          ? 'bg-slate-900 text-amber-400'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            {filteredAppointments.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 bg-slate-50/50">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300 animate-bounce" />
                <h5 className="font-bold text-slate-900">Nenhum agendamento encontrado</h5>
                <p className="text-xs text-slate-500 mt-1">Experimente alterar os filtros de status, data ou busca acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 relative"
                  >
                    {/* ID & Date Label */}
                    <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">
                          #{app.id.substring(4, 9)}
                        </span>
                        <h5 className="font-bold text-slate-900 text-sm mt-1 flex items-center">
                          {app.serviceName}
                        </h5>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide border ${
                        app.status === 'confirmed'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : app.status === 'pending'
                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                            : app.status === 'completed'
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        {app.status === 'confirmed' ? 'Confirmado' : app.status === 'pending' ? 'Pendente' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Cliente:</span>
                        <span className="font-bold text-slate-900">{app.clientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contato:</span>
                        <span className="font-mono text-slate-700">{app.clientPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Profissional:</span>
                        <span className="font-bold text-slate-900">{app.staffName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Data e Horário:</span>
                        <span className="font-bold text-slate-900 font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {app.date.split('-').reverse().join('/')} às {app.time}
                        </span>
                      </div>
                      {app.notes && (
                        <div className="pt-2 border-t border-slate-50">
                          <p className="text-[10px] font-bold text-slate-400 font-mono uppercase">Nota do Cliente:</p>
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100/50">
                            &ldquo;{app.notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3.5 border-t border-slate-50 flex justify-between items-center">
                      <span className="font-mono font-extrabold text-slate-950">
                        R$ {app.servicePrice.toFixed(2)}
                      </span>
                      
                      <div className="flex space-x-1">
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                              className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-slate-900 text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase border border-red-200 text-red-600 bg-red-50/20 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Recusar
                            </button>
                          </>
                        )}
                        {app.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'completed')}
                              className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                            >
                              Concluir (Pago)
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Module 2: Services Catalogue */}
        {adminTab === 'services' && (
          <motion.div
            key="services-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Catálogo de Serviços ({services.length})</h3>
              <button
                id="btn-new-service"
                onClick={() => {
                  clearServiceForm();
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center space-x-1 px-4 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Serviço</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-slate-950 text-amber-400 rounded-xl">
                        <ServiceIcon name={service.icon} className="h-5 w-5" />
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/50">
                        {service.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{service.name}</h4>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                        {service.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="font-mono">
                      <span className="text-[10px] text-slate-400 block leading-none">Preço Cobrado</span>
                      <span className="text-base font-black text-slate-900">R$ {service.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <button
                        onClick={() => handleEditServiceClick(service)}
                        className="p-2 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 border border-red-100 hover:border-red-200 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Module 3: Staff/Team Manager */}
        {adminTab === 'staff' && (
          <motion.div
            key="staff-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-lg">Nossa Equipe de Profissionais ({staff.length})</h3>
              <button
                onClick={() => {
                  clearStaffForm();
                  setIsStaffModalOpen(true);
                }}
                className="flex items-center space-x-1 px-4 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Profissional</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {staff.map((pro) => (
                <div
                  key={pro.id}
                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={pro.avatar}
                      alt={pro.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">{pro.name}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{pro.role}</p>
                      <div className="flex items-center mt-1 text-amber-500 text-xs">
                        <Star className="h-3 w-3 fill-current mr-0.5" />
                        <span className="font-bold text-slate-800">{pro.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Especialidades</p>
                    <div className="flex flex-wrap gap-1">
                      {pro.specialties.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100/50 text-[10px] font-medium text-slate-600"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 leading-none">
                      Dias ativos: Seg a Sáb
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditStaffClick(pro)}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(pro.id)}
                        className="p-1.5 border border-red-100 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Module 4: Clients List CRM */}
        {adminTab === 'clients' && (
          <motion.div
            key="clients-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-extrabold text-slate-900 text-lg">Base de Clientes Cadastrados ({clientsList.length})</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar clientes por nome, celular ou email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs w-full sm:w-64 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            {/* Table layout on Desktop / Stack layout on Mobile */}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="hidden sm:block">
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-mono uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Cliente</th>
                      <th className="px-6 py-4 font-bold">Contato</th>
                      <th className="px-6 py-4 font-bold">Última Visita</th>
                      <th className="px-6 py-4 font-bold text-center">Visitas Concluídas</th>
                      <th className="px-6 py-4 text-right font-bold">Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((cli, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center border text-xs">
                            {cli.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{cli.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{cli.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          {cli.phone}
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {cli.lastVisitDate.split('-').reverse().join('/')}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                          {cli.totalVisits}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-950 font-mono">
                          R$ {cli.totalSpent.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="sm:hidden divide-y divide-slate-100">
                {filteredClients.map((cli, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center border text-xs">
                        {cli.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{cli.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{cli.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-slate-400">Celular</p>
                        <p className="font-semibold text-slate-700 font-mono">{cli.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Última Visita</p>
                        <p className="font-semibold text-slate-700 font-mono">{cli.lastVisitDate.split('-').reverse().join('/')}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Visitas</p>
                        <p className="font-bold text-slate-800">{cli.totalVisits}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Valor Total</p>
                        <p className="font-bold text-slate-950 font-mono">R$ {cli.totalSpent.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: CREATE/EDIT SERVICE */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingServiceId ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Preencha o formulário para atualizar o catálogo.</p>
                </div>
                <button
                  onClick={() => setIsServiceModalOpen(false)}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                >
                  <ArrowUpDown className="h-4 w-4 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Nome do Serviço</label>
                  <input
                    type="text"
                    required
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Ex: Corte Degradê Social"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Preço (R$)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Duração (min)</label>
                    <input
                      type="number"
                      required
                      min={15}
                      step={5}
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Categoria</label>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none bg-white"
                    >
                      <option value="hair">Corte (Cabelo)</option>
                      <option value="beard">Barba</option>
                      <option value="combo">Combo Completo</option>
                      <option value="treatment">Tratamento/Hidratação</option>
                      <option value="color">Coloração/Platinado</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Ícone Visual</label>
                    <select
                      value={serviceIcon}
                      onChange={(e) => setServiceIcon(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none bg-white"
                    >
                      <option value="Scissors">Tesoura</option>
                      <option value="Sparkles">Brilho/Barba</option>
                      <option value="Layers">Camadas</option>
                      <option value="Heart">Coração</option>
                      <option value="Palette">Paleta/Coloração</option>
                      <option value="Zap">Raio/Selagem</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Descrição Curta</label>
                  <textarea
                    rows={3}
                    required
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Descreva detalhes ou benefícios do serviço..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-save-service"
                    type="submit"
                    className="px-5 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl shadow-md"
                  >
                    Salvar Catálogo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CREATE/EDIT STAFF MEMBER */}
      <AnimatePresence>
        {isStaffModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingStaffId ? 'Editar Profissional' : 'Novo Profissional'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Preencha os dados do colaborador.</p>
                </div>
                <button
                  onClick={() => setIsStaffModalOpen(false)}
                  className="p-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400"
                >
                  <ArrowUpDown className="h-4 w-4 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSaveStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Nome do Profissional</label>
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Ex: Lucas Barba Silva"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Cargo / Título</label>
                  <input
                    type="text"
                    required
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    placeholder="Ex: Barbeiro Specialist"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Foto do Perfil (URL Unsplash)</label>
                  <input
                    type="text"
                    required
                    value={staffAvatar}
                    onChange={(e) => setStaffAvatar(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Especialidades (separadas por vírgula)</label>
                  <input
                    type="text"
                    required
                    value={staffSpecialties}
                    onChange={(e) => setStaffSpecialties(e.target.value)}
                    placeholder="Ex: Degradê, Pigmentação, Navalha"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl shadow-md"
                  >
                    Salvar Profissional
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
