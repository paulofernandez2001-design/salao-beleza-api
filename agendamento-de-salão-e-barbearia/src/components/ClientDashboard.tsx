import React, { useState } from 'react';
import { 
  Scissors, Sparkles, Layers, Heart, Palette, Zap, 
  Calendar, Clock, Check, ChevronRight, User, Star, 
  MessageSquare, Phone, Mail, AlertCircle, Trash2, Shield, Info, MapPin, Award
} from 'lucide-react';
import { Service, Staff, Appointment, User as UserType, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';

// Dynamically render lucide icons
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

interface ClientDashboardProps {
  services: Service[];
  staff: Staff[];
  appointments: Appointment[];
  reviews: Review[];
  clientUser: UserType;
  onUpdateProfile: (updatedProfile: UserType) => void;
  onAddAppointment: (appointment: Appointment) => void;
  onCancelAppointment: (id: string) => void;
  onAddReview: (review: Review, appointmentId: string) => void;
}

export default function ClientDashboard({
  services,
  staff,
  appointments,
  reviews,
  clientUser,
  onUpdateProfile,
  onAddAppointment,
  onCancelAppointment,
  onAddReview,
}: ClientDashboardProps) {
  const [activeTab, setActiveTab] = useState<'book' | 'my-bookings' | 'profile' | 'about'>('book');

  // Booking Wizard State
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:MM
  const [bookingNotes, setBookingNotes] = useState<string>('');
  
  // Category filter for services
  const [serviceCategory, setServiceCategory] = useState<string>('all');

  // Review Form State
  const [reviewingAppointmentId, setReviewingAppointmentId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  // Profile Edit State
  const [profileName, setProfileName] = useState(clientUser.name);
  const [profilePhone, setProfilePhone] = useState(clientUser.phone);
  const [profileEmail, setProfileEmail] = useState(clientUser.email);
  const [profileBio, setProfileBio] = useState(clientUser.bio || '');
  const [profileAvatar, setProfileAvatar] = useState(clientUser.avatar);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Filter services
  const filteredServices = serviceCategory === 'all' 
    ? services 
    : services.filter(s => s.category === serviceCategory);

  // Generate next 14 days for booking (skipping Sundays)
  const getNextAvailableDays = () => {
    const days = [];
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Skip Sundays (0)
      if (dayOfWeek !== 0) {
        const dateString = date.toISOString().split('T')[0];
        days.push({
          dateString,
          dayNum: date.getDate(),
          dayName: weekdays[dayOfWeek],
          monthName: months[date.getMonth()],
          dayIndex: dayOfWeek
        });
      }
    }
    return days;
  };

  const availableDaysList = getNextAvailableDays();

  // Get available hours for chosen professional & check duplicates/bookings
  const getAvailableHoursForStaffAndDate = () => {
    if (!selectedStaff || !selectedDate) return [];
    
    // Check which hours are already booked for this staff on this date
    const bookedHours = appointments
      .filter(app => 
        app.date === selectedDate && 
        app.staffId === selectedStaff.id && 
        app.status !== 'cancelled'
      )
      .map(app => app.time);

    return selectedStaff.availableHours.map(hour => ({
      hour,
      isBooked: bookedHours.includes(hour)
    }));
  };

  const timeSlots = getAvailableHoursForStaffAndDate();

  // Reset Booking Wizard
  const resetBookingWizard = () => {
    setBookingStep(1);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate('');
    setSelectedTime('');
    setBookingNotes('');
  };

  // Submit Booking
  const handleConfirmBooking = () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;

    const newAppointment: Appointment = {
      id: 'app_' + Date.now(),
      clientId: clientUser.id,
      clientName: clientUser.name,
      clientPhone: clientUser.phone,
      clientEmail: clientUser.email,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.duration,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      date: selectedDate,
      time: selectedTime,
      status: 'pending',
      notes: bookingNotes,
      createdAt: new Date().toISOString()
    };

    onAddAppointment(newAppointment);
    setBookingStep(5); // Show success screen
  };

  // Handle profile update
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...clientUser,
      name: profileName,
      phone: profilePhone,
      email: profileEmail,
      bio: profileBio,
      avatar: profileAvatar,
    });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  // Handle Review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingAppointmentId) return;

    const app = appointments.find(a => a.id === reviewingAppointmentId);
    if (!app) return;

    const newReview: Review = {
      id: 'rev_' + Date.now(),
      clientName: clientUser.name,
      clientAvatar: clientUser.avatar,
      serviceName: app.serviceName,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString().split('T')[0]
    };

    onAddReview(newReview, reviewingAppointmentId);
    setReviewingAppointmentId(null);
    setReviewComment('');
    setReviewRating(5);
  };

  // Filter client's own appointments
  const clientAppointments = appointments.filter(app => app.clientId === clientUser.id)
    .sort((a, b) => {
      // Sort upcoming first, newest date first
      if (a.status === 'pending' || a.status === 'confirmed') return -1;
      if (b.status === 'pending' || b.status === 'confirmed') return 1;
      return new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime();
    });

  const upcomingAppointments = clientAppointments.filter(app => app.status === 'pending' || app.status === 'confirmed');
  const pastAppointments = clientAppointments.filter(app => app.status === 'completed' || app.status === 'cancelled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 overflow-x-auto pb-px mb-8 scrollbar-none">
        <button
          onClick={() => setActiveTab('book')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'book'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Agendar Online</span>
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap relative transition-all ${
            activeTab === 'my-bookings'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Meus Agendamentos</span>
          {upcomingAppointments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
              {upcomingAppointments.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Meu Perfil</span>
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'about'
              ? 'border-amber-500 text-[#0F172A]'
              : 'border-transparent text-slate-500 hover:text-[#0F172A] hover:border-slate-300'
          }`}
        >
          <Info className="h-4 w-4" />
          <span>Sobre o Salão</span>
        </button>
      </div>

      {/* Tabs Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'book' && (
          <motion.div
            key="book-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-8 sm:p-12 text-white shadow-xl border border-slate-800">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 blur-xl w-72 h-72 bg-amber-400 rounded-full" />
              <div className="relative max-w-xl space-y-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="h-3 w-3 mr-1.5" /> Estilo &amp; Cuidado
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Reserve o seu horário com os melhores profissionais
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Escolha o serviço desejado, selecione seu barbeiro ou estilista de preferência e agende de forma fácil em poucos segundos.
                </p>
              </div>
            </div>

            {/* Quick alert of upcoming schedule */}
            {upcomingAppointments.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900">Você tem agendamentos marcados!</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Próximo serviço: <span className="font-semibold text-slate-900">{upcomingAppointments[0].serviceName}</span> com <span className="font-semibold text-slate-900">{upcomingAppointments[0].staffName}</span> no dia <span className="font-semibold text-slate-900">{upcomingAppointments[0].date.split('-').reverse().join('/')} às {upcomingAppointments[0].time}</span>.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('my-bookings')} 
                  className="text-xs font-bold text-slate-900 hover:underline px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
                >
                  Ver Todos
                </button>
              </div>
            )}

            {/* Booking Wizard Header Steps */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex justify-between items-center max-w-2xl mx-auto">
                {[
                  { step: 1, label: 'Serviço' },
                  { step: 2, label: 'Profissional' },
                  { step: 3, label: 'Data e Hora' },
                  { step: 4, label: 'Confirmação' }
                ].map((s) => (
                  <div key={s.step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                        bookingStep > s.step 
                          ? 'bg-slate-900 border-slate-900 text-amber-400'
                          : bookingStep === s.step
                            ? 'border-slate-900 text-slate-900 bg-amber-50 font-extrabold'
                            : 'border-slate-200 text-slate-400 bg-white'
                      }`}>
                        {bookingStep > s.step ? <Check className="h-5 w-5" /> : s.step}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-medium mt-2 whitespace-nowrap ${
                        bookingStep === s.step ? 'text-slate-900 font-bold' : 'text-slate-400'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {s.step < 4 && (
                      <div className={`h-0.5 mx-2 sm:mx-4 flex-1 transition-colors ${
                        bookingStep > s.step ? 'bg-slate-900' : 'bg-slate-100'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Services Selection */}
            {bookingStep === 1 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Passo 1: Selecione o Serviço</h3>
                    <p className="text-sm text-slate-500 mt-1">Selecione o corte ou tratamento que deseja realizar hoje.</p>
                  </div>
                  {/* Category Pill Filters */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'hair', label: 'Corte' },
                      { id: 'beard', label: 'Barba' },
                      { id: 'combo', label: 'Combos' },
                      { id: 'treatment', label: 'Tratamentos' },
                      { id: 'color', label: 'Coloração' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setServiceCategory(cat.id)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                          serviceCategory === cat.id
                            ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setBookingStep(2);
                      }}
                      className={`group cursor-pointer rounded-2xl p-6 border-2 text-left transition-all hover:shadow-md ${
                        selectedService?.id === service.id
                          ? 'border-slate-900 bg-amber-50/20'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-slate-900 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                          <ServiceIcon name={service.icon} className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-extrabold text-slate-900 font-mono">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-5 mb-1.5">
                        {service.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" /> {service.duration} minutos
                        </span>
                        <span className="text-slate-900 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Selecionar <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Professionals Selection */}
            {bookingStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Passo 2: Escolha o Profissional</h3>
                  <p className="text-sm text-slate-500 mt-1">Com quem você deseja realizar o serviço: <span className="font-semibold text-slate-900">{selectedService?.name}</span>?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {staff.map((pro) => (
                    <div
                      key={pro.id}
                      onClick={() => {
                        setSelectedStaff(pro);
                        setBookingStep(3);
                      }}
                      className={`group cursor-pointer rounded-2xl p-6 border-2 text-left transition-all hover:shadow-md bg-white ${
                        selectedStaff?.id === pro.id
                          ? 'border-slate-900 bg-amber-50/20'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={pro.avatar}
                          alt={pro.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-amber-400 transition-colors"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {pro.name}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">{pro.role}</p>
                          <div className="flex items-center mt-1 text-amber-500">
                            <Star className="h-3 w-3 fill-current mr-1" />
                            <span className="text-xs font-bold text-slate-700">{pro.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Especialidades</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pro.specialties.map((spec, index) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 border border-slate-100 text-slate-600"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-5 text-xs">
                        <span className="text-slate-400">Próxima vaga hoje</span>
                        <span className="text-slate-900 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Ver horários <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setBookingStep(1)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-sm text-slate-600 transition-all"
                  >
                    Voltar para Serviços
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Date & Time Selection */}
            {bookingStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Passo 3: Data &amp; Horário</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Agendando <span className="font-semibold text-slate-900">{selectedService?.name}</span> com <span className="font-semibold text-slate-900">{selectedStaff?.name}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Custom Calendar Card Picker */}
                  <div className="lg:col-span-7 space-y-4">
                    <label className="block text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">1. Escolha a Data</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {availableDaysList.map((day) => {
                        const isSelected = selectedDate === day.dateString;
                        return (
                          <button
                            key={day.dateString}
                            onClick={() => {
                              setSelectedDate(day.dateString);
                              setSelectedTime(''); // Reset selected time when date changes
                            }}
                            className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                              isSelected
                                ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md transform -translate-y-0.5'
                                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-amber-400/80' : 'text-slate-400'}`}>
                              {day.dayName}
                            </span>
                            <span className="text-2xl font-extrabold font-mono tracking-tight leading-none">
                              {day.dayNum}
                            </span>
                            <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-amber-400/80' : 'text-slate-500'}`}>
                              {day.monthName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hour slots picker */}
                  <div className="lg:col-span-5 space-y-4">
                    <label className="block text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">2. Escolha o Horário</label>
                    {!selectedDate ? (
                      <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 text-slate-400 text-sm">
                        Selecione uma data à esquerda para ver os horários disponíveis.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((slot) => {
                          const isHourSelected = selectedTime === slot.hour;
                          return (
                            <button
                              key={slot.hour}
                              disabled={slot.isBooked}
                              onClick={() => setSelectedTime(slot.hour)}
                              className={`py-3 rounded-xl border text-center font-mono font-bold text-sm transition-all flex items-center justify-center ${
                                slot.isBooked
                                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                                  : isHourSelected
                                    ? 'bg-slate-900 border-slate-900 text-amber-400 shadow-md'
                                    : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5 mr-1 opacity-60" />
                              {slot.hour}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setBookingStep(2)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-sm text-slate-600 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setBookingStep(4)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      selectedDate && selectedTime
                        ? 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Prosseguir
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Notes and Final Review */}
            {bookingStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Passo 4: Confirmar Agendamento</h3>
                  <p className="text-sm text-slate-500 mt-1">Revise as informações do seu agendamento antes de finalizar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Summary receipt card */}
                  <div className="md:col-span-7 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-800 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Scissors className="h-40 w-40" />
                    </div>
                    <h4 className="text-amber-400 font-mono text-xs uppercase tracking-wider mb-6 pb-2 border-b border-white/10 flex justify-between">
                      <span>Resumo do Serviço</span>
                      <span>AGENDAMENTO</span>
                    </h4>

                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-slate-400">Serviço solicitado</p>
                          <h5 className="text-lg font-bold mt-1 text-white">{selectedService?.name}</h5>
                          <p className="text-xs text-slate-400 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> {selectedService?.duration} minutos de duração
                          </p>
                        </div>
                        <span className="text-2xl font-mono font-extrabold text-amber-400">
                          R$ {selectedService?.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                          <p className="text-xs text-slate-400">Profissional</p>
                          <p className="text-sm font-bold mt-1 text-white">{selectedStaff?.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{selectedStaff?.role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Data e Hora</p>
                          <p className="text-sm font-bold mt-1 text-white">
                            {selectedDate.split('-').reverse().join('/')}
                          </p>
                          <p className="text-xs text-amber-400 font-mono mt-0.5 flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> {selectedTime}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
                        <span className="text-slate-400">Forma de Pagamento</span>
                        <span className="font-bold text-white">Pagar no Salão (PIX/Cartão)</span>
                      </div>
                    </div>
                  </div>

                  {/* Add notes form */}
                  <div className="md:col-span-5 space-y-4">
                    <label className="block text-sm font-bold text-slate-900 uppercase font-mono tracking-wider">
                      Instruções Especiais (Opcional)
                    </label>
                    <textarea
                      placeholder="Ex: 'Cabelo sensível', 'Gostaria de lavar antes do corte', 'Preciso terminar até as 12:00', etc."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      rows={4}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-slate-400 focus:outline-none text-sm leading-relaxed"
                    />
                    <div className="p-3.5 bg-slate-50 rounded-xl flex gap-2.5 items-start text-xs text-slate-500 border border-slate-100">
                      <AlertCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p>
                        Seu agendamento será enviado em estado <strong>Pendente</strong> e atualizado para <strong>Confirmado</strong> pela nossa gerência assim que possível. Você receberá atualizações no seu painel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setBookingStep(3)}
                    className="px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 font-bold text-sm text-slate-600 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    className="px-8 py-3 rounded-xl font-bold text-sm bg-slate-900 text-amber-400 hover:bg-slate-800 transition-all shadow-md"
                  >
                    Confirmar e Agendar
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Success Screen */}
            {bookingStep === 5 && (
              <div className="max-w-md mx-auto text-center py-12 space-y-6">
                <div className="inline-flex p-4 bg-emerald-100 text-emerald-800 rounded-full">
                  <Check className="h-10 w-10 stroke-[3]" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-slate-900">Agendamento Solicitado!</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Sua reserva foi enviada com sucesso. Você pode acompanhar o status na aba <strong>Meus Agendamentos</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3 font-mono text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>PROFISSIONAL:</span>
                    <span className="font-bold text-slate-950">{selectedStaff?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SERVIÇO:</span>
                    <span className="font-bold text-slate-950">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATA/HORA:</span>
                    <span className="font-bold text-slate-950">
                      {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>VALOR:</span>
                    <span className="font-bold text-slate-950">R$ {selectedService?.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={() => {
                      resetBookingWizard();
                      setActiveTab('my-bookings');
                    }}
                    className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-sm transition-all shadow-sm"
                  >
                    Ver Meus Agendamentos
                  </button>
                  <button
                    onClick={resetBookingWizard}
                    className="w-full py-3 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm transition-all"
                  >
                    Agendar outro Serviço
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: My Bookings */}
        {activeTab === 'my-bookings' && (
          <motion.div
            key="bookings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 text-left"
          >
            <div>
              <h3 className="text-xl font-bold text-slate-900">Meus Agendamentos</h3>
              <p className="text-sm text-slate-500 mt-1">Histórico completo de reservas e agendamentos solicitados no seu perfil.</p>
            </div>

            {/* Upcoming Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mr-2" /> Próximos Serviços ({upcomingAppointments.length})
              </h4>

              {upcomingAppointments.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50 text-slate-400 text-sm">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum agendamento futuro marcado.</p>
                  <button 
                    onClick={() => setActiveTab('book')}
                    className="mt-3 inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5"
                  >
                    Agendar agora <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                    >
                      {/* Top bar */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">ID: #{app.id.substring(4, 9)}</span>
                          <h5 className="font-bold text-slate-900 text-base mt-0.5">{app.serviceName}</h5>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          app.status === 'confirmed'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          {app.status === 'confirmed' ? 'Confirmado' : 'Aguardando Aprovação'}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <div>
                          <p className="text-slate-400">Data e Hora</p>
                          <p className="font-extrabold text-slate-900 mt-0.5">
                            {app.date.split('-').reverse().join('/')} às {app.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Profissional</p>
                          <p className="font-bold text-slate-900 mt-0.5">{app.staffName}</p>
                        </div>
                      </div>

                      {app.notes && (
                        <p className="text-xs text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 italic">
                          &ldquo;{app.notes}&rdquo;
                        </p>
                      )}

                      {/* Footer actions */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                        <span className="font-mono font-bold text-slate-950 text-sm">
                          R$ {app.servicePrice.toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            if(confirm("Tem certeza que deseja cancelar seu agendamento?")) {
                              onCancelAppointment(app.id);
                            }
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-red-100 text-red-600 bg-red-50/50 hover:bg-red-50 hover:border-red-200 transition-colors font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Desistir</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Section */}
            <div className="space-y-4 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-2" /> Histórico de Serviços ({pastAppointments.length})
              </h4>

              {pastAppointments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Nenhum agendamento anterior registrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 opacity-90 hover:opacity-100 transition-opacity"
                    >
                      {/* Top bar */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">ID: #{app.id.substring(4, 9)}</span>
                          <h5 className="font-bold text-slate-900 text-base mt-0.5">{app.serviceName}</h5>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          app.status === 'completed'
                            ? 'bg-slate-100 border-slate-200 text-slate-600'
                            : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                          {app.status === 'completed' ? 'Realizado' : 'Cancelado'}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <div>
                          <p className="text-slate-400">Data e Hora</p>
                          <p className="font-bold text-slate-700 mt-0.5">
                            {app.date.split('-').reverse().join('/')} às {app.time}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Profissional</p>
                          <p className="font-bold text-slate-700 mt-0.5">{app.staffName}</p>
                        </div>
                      </div>

                      {/* Price & Review Footer */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono font-semibold text-slate-600">
                            Preço: R$ {app.servicePrice.toFixed(2)}
                          </span>
                          
                          {/* Review/Rating UI */}
                          {app.status === 'completed' && !app.rating && (
                            <button
                              onClick={() => {
                                setReviewingAppointmentId(app.id);
                                setReviewRating(5);
                                setReviewComment('');
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 font-bold"
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>Avaliar Serviço</span>
                            </button>
                          )}
                        </div>

                        {app.rating && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Sua Avaliação</span>
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < (app.rating || 0) ? 'fill-current' : 'opacity-20'}`} />
                                ))}
                              </div>
                            </div>
                            {app.review && (
                              <p className="text-xs text-slate-600 mt-1.5 italic">&ldquo;{app.review}&rdquo;</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanding Review Form */}
                      <AnimatePresence>
                        {reviewingAppointmentId === app.id && (
                          <motion.form
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            onSubmit={handleSubmitReview}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 space-y-4 text-left overflow-hidden"
                          >
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Nota do Serviço:</label>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    className="p-0.5 text-amber-400 focus:outline-none"
                                  >
                                    <Star className={`h-6 w-6 ${star <= reviewRating ? 'fill-current' : 'opacity-20'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block">O que você achou?</label>
                              <textarea
                                required
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Fale um pouco sobre o corte, o atendimento do profissional e o ambiente..."
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-slate-400"
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-2 text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => setReviewingAppointmentId(null)}
                                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-lg"
                              >
                                Enviar Avaliação
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 3: Profile Settings */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm text-left"
          >
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Meu Perfil de Cliente</h3>
              <p className="text-sm text-slate-500 mt-1">Gerencie suas informações pessoais e visualize seus detalhes cadastrados.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Avatar Select */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                <img
                  src={profileAvatar}
                  alt="Seu Avatar"
                  className="w-20 h-20 rounded-full object-cover border-4 border-amber-400/30 shadow-md"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Escolher Avatar</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {[
                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
                      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                    ].map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfileAvatar(url)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                          profileAvatar === url ? 'border-slate-900 scale-110 shadow-sm' : 'border-slate-200 opacity-60'
                        }`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Telefone</label>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Email para Notificações</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">Biografia / Nota Pessoal</label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Conte-nos um pouco sobre suas preferências..."
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                {profileSuccess ? (
                  <p className="text-xs font-bold text-emerald-600 flex items-center">
                    <Check className="h-4 w-4 mr-1.5" /> Informações atualizadas com sucesso!
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Seus dados são salvos localmente e persistem nas suas sessões de teste.
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl font-bold text-sm transition-all shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Tab 4: About / Reviews Section */}
        {activeTab === 'about' && (
          <motion.div
            key="about-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 text-left"
          >
            {/* Salon Stats / Details Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Nosso Endereço</h4>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Av. Paulista, 1000 - Bela Vista<br />
                    São Paulo - SP, 01310-100
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-mono">Próximo ao Metrô Trianon-Masp</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="inline-flex p-3 bg-slate-100 text-slate-900 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Horário de Funcionamento</h4>
                  <p className="text-sm text-slate-600 mt-1 space-y-1">
                    <span className="flex justify-between"><span>Segunda - Sexta:</span> <span className="font-semibold text-slate-900">09:00 às 20:00</span></span>
                    <span className="flex justify-between"><span>Sábado:</span> <span className="font-semibold text-slate-900">09:00 às 18:00</span></span>
                    <span className="flex justify-between text-slate-400"><span>Domingo:</span> <span className="font-semibold">Fechado</span></span>
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Por que escolher o Corte &amp; Estilo?</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Trabalhamos apenas com profissionais de elite e produtos importados certificados. Oferecemos café expresso gourmet, cerveja artesanal e um ambiente climatizado super aconchegante para tornar o seu momento único.
                  </p>
                </div>
              </div>
            </div>

            {/* Our Team Grid */}
            <div className="space-y-4 pt-4">
              <h4 className="text-lg font-bold text-slate-900">Conheça Nossa Equipe de Elite</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {staff.map((pro) => (
                  <div key={pro.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
                    <img src={pro.avatar} alt={pro.name} className="w-14 h-14 rounded-full object-cover border" />
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm leading-tight">{pro.name}</h5>
                      <p className="text-xs text-slate-500 mt-0.5 leading-none">{pro.role}</p>
                      <div className="flex items-center mt-1.5 text-amber-500 text-xs">
                        <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                        <span className="font-bold text-slate-800">{pro.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews Feed */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-900">Opinião de Quem Frequenta ({reviews.length})</h4>
                <div className="flex items-center text-amber-500 font-bold text-sm bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  <span>4.8 / 5.0 (Média Geral)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <img
                          src={rev.clientAvatar}
                          alt={rev.clientName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                        />
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm">{rev.clientName}</h5>
                          <span className="text-[10px] text-slate-400 font-mono">Serviço: {rev.serviceName}</span>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < rev.rating ? 'fill-current' : 'opacity-20'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                    <p className="text-[10px] text-slate-400 text-right font-mono">
                      {rev.date.split('-').reverse().join('/')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
