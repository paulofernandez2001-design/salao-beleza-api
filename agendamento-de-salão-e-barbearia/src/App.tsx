import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ClientDashboard from './components/ClientDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthScreen from './components/AuthScreen';
import { User, Service, Staff, Appointment, Review } from './types';
import { 
  INITIAL_SERVICES, 
  INITIAL_STAFF, 
  INITIAL_APPOINTMENTS, 
  INITIAL_REVIEWS 
} from './data/initialData';

// Helper to safely load localStorage for user session persistency
const getLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return defaultValue;
  }
};

export default function App() {
  // 0. Active Logged In User State
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => 
    getLocalStorage<User | null>('salon_logged_in_user', null)
  );

  // 1. Core Role State (Current Active Mode)
  const [currentRole, setCurrentRole] = useState<'client' | 'admin'>(() => 
    getLocalStorage<'client' | 'admin'>('salon_current_role', 'client')
  );

  // 2. Database entities (initialized with default mocks, refreshed from backend API)
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [staff, setStaff] = useState<Staff[]>(INITIAL_STAFF);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  // 3. Backend DB Status
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    mode: string;
    config: { host: string; port: string; user: string; database: string };
    error: string | null;
  } | null>(null);

  // Fetch all entities from Express backend on mount
  const refreshAllData = async () => {
    try {
      const [statusRes, servicesRes, staffRes, appointmentsRes, reviewsRes] = await Promise.all([
        fetch('/api/db-status').then(res => res.json()),
        fetch('/api/services').then(res => res.json()),
        fetch('/api/staff').then(res => res.json()),
        fetch('/api/appointments').then(res => res.json()),
        fetch('/api/reviews').then(res => res.json())
      ]);
      
      setDbStatus(statusRes);
      setServices(servicesRes);
      setStaff(staffRes);
      setAppointments(appointmentsRes);
      setReviews(reviewsRes);
    } catch (err) {
      console.error('Error fetching data from server, falling back to local mocks:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Synchronize User session to LocalStorage for persistence across tab refresh
  useEffect(() => {
    localStorage.setItem('salon_logged_in_user', JSON.stringify(loggedInUser));
  }, [loggedInUser]);

  useEffect(() => {
    localStorage.setItem('salon_current_role', JSON.stringify(currentRole));
  }, [currentRole]);

  // Auth Handling
  const handleLoginSuccess = (user: User) => {
    setLoggedInUser(user);
    setCurrentRole(user.role);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentRole('client');
    localStorage.removeItem('salon_logged_in_user');
  };

  const handleUpdateProfile = async (updated: User) => {
    setLoggedInUser(updated);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const freshUser = await res.json();
        setLoggedInUser(freshUser);
      }
    } catch (err) {
      console.error('Error updating profile in MySQL backend:', err);
    }
  };

  // Appointment handler methods (synchronizes live with Express + MySQL)
  const handleAddAppointment = async (newApp: Appointment) => {
    setAppointments(prev => [newApp, ...prev]);
    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp)
      });
    } catch (err) {
      console.error('Error saving appointment to backend:', err);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    setAppointments(prev => 
      prev.map(app => app.id === id ? { ...app, status: 'cancelled' } : app)
    );
    try {
      await fetch(`/api/appointments/${id}/cancel`, { method: 'PUT' });
    } catch (err) {
      console.error('Error cancelling appointment on backend:', err);
    }
  };

  // Review submission appends review to database, and recalculates ratings in real-time
  const handleAddReview = async (newReview: Review, appointmentId: string) => {
    // Append review locally
    setReviews(prev => [newReview, ...prev]);
    
    // Update appointment locally
    setAppointments(prev => 
      prev.map(app => 
        app.id === appointmentId 
          ? { ...app, rating: newReview.rating, review: newReview.comment } 
          : app
      )
    );

    try {
      // 1. Submit review
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });

      // 2. Update appointment
      await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newReview.rating,
          review: newReview.comment
        })
      });

      // 3. Reload staff to sync recalculated staff rating
      const staffRes = await fetch('/api/staff').then(r => r.json());
      setStaff(staffRes);
    } catch (err) {
      console.error('Error adding review and rating to MySQL backend:', err);
    }
  };

  // Delta Sync Wrapper for Admin Service Changes
  const handleUpdateServicesState = async (newServices: Service[]) => {
    setServices(newServices);
    try {
      if (newServices.length > services.length) {
        const added = newServices.find(ns => !services.some(s => s.id === ns.id));
        if (added) {
          await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(added)
          });
        }
      } else if (newServices.length < services.length) {
        const deleted = services.find(s => !newServices.some(ns => ns.id === s.id));
        if (deleted) {
          await fetch(`/api/services/${deleted.id}`, { method: 'DELETE' });
        }
      } else {
        const edited = newServices.find(ns => {
          const original = services.find(s => s.id === ns.id);
          return original && JSON.stringify(original) !== JSON.stringify(ns);
        });
        if (edited) {
          await fetch(`/api/services/${edited.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(edited)
          });
        }
      }
    } catch (err) {
      console.error('Error syncing service changes with backend:', err);
    }
  };

  // Delta Sync Wrapper for Admin Staff Changes
  const handleUpdateStaffState = async (newStaff: Staff[]) => {
    setStaff(newStaff);
    try {
      if (newStaff.length > staff.length) {
        const added = newStaff.find(ns => !staff.some(s => s.id === ns.id));
        if (added) {
          await fetch('/api/staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(added)
          });
        }
      } else if (newStaff.length < staff.length) {
        const deleted = staff.find(s => !newStaff.some(ns => ns.id === s.id));
        if (deleted) {
          await fetch(`/api/staff/${deleted.id}`, { method: 'DELETE' });
        }
      } else {
        const edited = newStaff.find(ns => {
          const original = staff.find(s => s.id === ns.id);
          return original && JSON.stringify(original) !== JSON.stringify(ns);
        });
        if (edited) {
          await fetch(`/api/staff/${edited.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(edited)
          });
        }
      }
    } catch (err) {
      console.error('Error syncing staff changes with backend:', err);
    }
  };

  // Delta Sync Wrapper for Admin Appointment Changes (status adjustments)
  const handleUpdateAppointmentsState = async (newApps: Appointment[]) => {
    setAppointments(newApps);
    try {
      const changed = newApps.find(na => {
        const original = appointments.find(a => a.id === na.id);
        return original && (original.status !== na.status || original.rating !== na.rating || original.review !== na.review);
      });
      if (changed) {
        await fetch(`/api/appointments/${changed.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: changed.status,
            rating: changed.rating,
            review: changed.review
          })
        });

        if (changed.rating) {
          const staffRes = await fetch('/api/staff').then(r => r.json());
          setStaff(staffRes);
        }
      }
    } catch (err) {
      console.error('Error syncing appointment updates with backend:', err);
    }
  };

  // If not logged in, render the login screen
  if (!loggedInUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col text-slate-900 selection:bg-[#0F172A] selection:text-amber-500">
      {/* Top Header Navigation */}
      <Header
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        dbStatus={dbStatus}
        onRefreshDbStatus={refreshAllData}
      />

      {/* Main Container */}
      <main className="flex-grow">
        {currentRole === 'client' ? (
          <ClientDashboard
            services={services}
            staff={staff}
            appointments={appointments}
            reviews={reviews}
            clientUser={loggedInUser}
            onUpdateProfile={handleUpdateProfile}
            onAddAppointment={handleAddAppointment}
            onCancelAppointment={handleCancelAppointment}
            onAddReview={handleAddReview}
          />
        ) : (
          <AdminDashboard
            services={services}
            staff={staff}
            appointments={appointments}
            onUpdateAppointments={handleUpdateAppointmentsState}
            onUpdateServices={handleUpdateServicesState}
            onUpdateStaff={handleUpdateStaffState}
          />
        )}
      </main>

      {/* Footer with Live MySQL connection status indicator */}
      <footer className="bg-[#0F172A] border-t border-slate-800 py-6 text-center text-slate-400 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Prestige Barber. Todos os direitos reservados.</p>
          
          <div className="flex items-center gap-2">
            {dbStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-emerald-400 bg-emerald-950 border border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                MySQL Conectado &bull; root@{dbStatus.config.host}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-amber-400 bg-amber-950 border border-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                In-Memory Fallback &bull; Config: root@{dbStatus?.config.host || '127.0.0.1'}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
