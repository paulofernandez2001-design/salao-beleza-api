import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Scissors, Mail, Lock, Phone, User, Eye, EyeOff, Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
];

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'client' | 'admin'>('client');
  const [regBio, setRegBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Load / Seed users list
  const getUsersFromStorage = (): UserType[] => {
    try {
      const stored = localStorage.getItem('salon_registered_users');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }

    // Default seed users if none exist
    const defaultUsers: UserType[] = [
      {
        id: 'u_client',
        name: 'Paulo Fernandez',
        email: 'fernandezpaulo214@gmail.com',
        phone: '(11) 98765-4321',
        role: 'client',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        bio: 'Cliente assíduo buscando sempre manter o corte alinhado.',
        password: '123456'
      },
      {
        id: 'u_admin',
        name: 'Roberto Cortês',
        email: 'roberto.cortes@barbearia.com',
        phone: '(11) 99999-8888',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
        bio: 'Gerente geral do Corte & Estilo, focado na melhor experiência.',
        password: '123456'
      }
    ];
    localStorage.setItem('salon_registered_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  };

  const saveUserToStorage = (user: UserType) => {
    const current = getUsersFromStorage();
    const updated = [...current.filter(u => u.email.toLowerCase() !== user.email.toLowerCase()), user];
    localStorage.setItem('salon_registered_users', JSON.stringify(updated));
  };

  // Quick Login Helper
  const handleQuickLogin = async (role: 'client' | 'admin') => {
    const email = role === 'client' ? 'fernandezpaulo214@gmail.com' : 'roberto.cortes@barbearia.com';
    const password = '123456';
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const user = await res.json();
        onLoginSuccess(user);
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Erro ao realizar login rápido.');
      }
    } catch (err) {
      setLoginError('Falha na comunicação com o servidor backend.');
    }
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        const user = await res.json();
        onLoginSuccess(user);
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'E-mail ou senha incorretos.');
      }
    } catch (err) {
      setLoginError('Erro ao comunicar com o servidor backend.');
    }
  };

  // Handle Register Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    if (!regName || !regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setRegError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('As senhas não coincidem.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          role: regRole,
          avatar: selectedAvatar,
          bio: regBio || (regRole === 'admin' ? 'Administrador do sistema' : 'Cliente Prestige Barber'),
          password: regPassword
        })
      });

      if (res.ok) {
        const newUser = await res.json();
        setRegSuccess(true);
        
        // Clear registration fields
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegBio('');

        // Automatically transition to login after 1.5 seconds and pre-fill credentials
        setTimeout(() => {
          setLoginEmail(newUser.email);
          setLoginPassword(regPassword);
          setActiveTab('login');
          setRegSuccess(false);
        }, 1500);
      } else {
        const errData = await res.json();
        setRegError(errData.error || 'Erro ao realizar cadastro.');
      }
    } catch (err) {
      setRegError('Erro ao comunicar com o servidor backend.');
    }
  };

  // Initialize storage once on mount
  useEffect(() => {
    getUsersFromStorage();
  }, []);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] border border-slate-200">
        
        {/* Left Visual Banner */}
        <div className="lg:col-span-5 bg-[#0F172A] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Ambient graphics / lines */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border border-amber-400/20">
                P
              </div>
              <div>
                <h1 className="font-black text-2xl tracking-tight uppercase">
                  Prestige <span className="text-amber-500">Barber</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Elegância e Precisão</p>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Agendamentos premium ao alcance de um toque.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Acesse o painel para agendar serviços exclusivos, gerenciar seus horários de preferência ou, caso administrador, controlar a operação diária da barbearia.
              </p>
            </div>
          </div>

          {/* Quick Access Helper */}
          <div className="mt-12 lg:mt-0 relative z-10 pt-6 border-t border-slate-800">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3">
              Acesso Rápido para Teste
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('client')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-xs font-bold text-white rounded-lg border border-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-amber-500" />
                Cliente de Teste
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-xs font-bold text-white rounded-lg border border-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                Admin de Teste
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
              Senha padrão para contas de teste: <span className="text-white font-bold">123456</span>
            </p>
          </div>
        </div>

        {/* Right Auth Forms Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-slate-50">
          
          {/* Header tabs toggle */}
          <div className="flex border-b border-slate-200 mb-8 max-w-sm">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
              }}
              className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'border-amber-500 text-[#0F172A]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setRegError('');
              }}
              className={`flex-1 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'border-amber-500 text-[#0F172A]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 flex flex-col justify-center">
            {activeTab === 'login' ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-extrabold text-[#0F172A]">Acesse sua conta</h3>
                  <p className="text-sm text-slate-500 mt-1">Insira suas credenciais abaixo para continuar.</p>
                </div>

                {loginError && (
                  <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs font-semibold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 active:bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    <span>Entrar no Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin"
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-extrabold text-[#0F172A]">Cadastre-se hoje</h3>
                  <p className="text-sm text-slate-500 mt-1">Crie sua conta para desfrutar de toda a nossa experiência.</p>
                </div>

                {regError && (
                  <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs font-semibold text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="mb-5 p-3.5 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-xs font-semibold text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Cadastro realizado com sucesso! Redirecionando...</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Account Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Tipo de Perfil
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRegRole('client')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          regRole === 'client'
                            ? 'bg-amber-50 border-amber-500 text-[#0F172A]'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        Cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('admin')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          regRole === 'admin'
                            ? 'bg-slate-900 border-[#0F172A] text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Administrador
                      </button>
                    </div>
                  </div>

                  {/* Preset Avatar Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Escolha seu Avatar
                    </label>
                    <div className="flex gap-2.5 items-center">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedAvatar(url)}
                          className={`relative rounded-full border-2 transition-all p-0.5 overflow-hidden cursor-pointer ${
                            selectedAvatar === url ? 'border-amber-500 scale-110 shadow' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="preset avatar" className="w-8 h-8 rounded-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="seu.email@exemplo.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Celular / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Bio / Sobre você (Opcional)
                    </label>
                    <textarea
                      value={regBio}
                      onChange={(e) => setRegBio(e.target.value)}
                      placeholder="Conte um pouco sobre sua preferência de estilo..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800 h-20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#0F172A] hover:bg-slate-800 active:bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    <span>Criar Conta & Acessar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
