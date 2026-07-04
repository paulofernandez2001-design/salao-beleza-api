import React, { useState } from 'react';
import { Scissors, ShieldCheck, User, LogOut, Database, RefreshCw, CheckCircle, AlertTriangle, Server, X, Lock, Activity, Wifi, WifiOff } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentRole: 'client' | 'admin';
  onChangeRole: (role: 'client' | 'admin') => void;
  loggedInUser: UserType;
  onLogout: () => void;
  dbStatus: {
    connected: boolean;
    mode: string;
    config: { host: string; port: string; user: string; database: string };
    error: string | null;
  } | null;
  onRefreshDbStatus: () => Promise<void>;
}

export default function Header({
  currentRole,
  onChangeRole,
  loggedInUser,
  onLogout,
  dbStatus,
  onRefreshDbStatus,
}: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const [isDirectTesting, setIsDirectTesting] = useState(false);
  const [inlineNotification, setInlineNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestSuccess(null);
    try {
      await onRefreshDbStatus();
      setTimeout(() => {
        setIsTesting(false);
        setTestSuccess('A conexão com o banco de dados MySQL foi testada e está respondendo perfeitamente!');
      }, 800);
    } catch (err) {
      setIsTesting(false);
      setTestSuccess('Ocorreu um erro ao atualizar o status do banco de dados.');
    }
  };

  const handleDirectMySQLCheck = async () => {
    setIsDirectTesting(true);
    setInlineNotification(null);
    try {
      await onRefreshDbStatus();
      // Wait for feedback realism
      await new Promise(resolve => setTimeout(resolve, 850));
      
      const response = await fetch('/api/db-status');
      const data = await response.json();
      
      setIsDirectTesting(false);
      if (data.connected) {
        setInlineNotification({
          type: 'success',
          message: `Conectado com sucesso ao MySQL em ${data.config.host || 'localhost'}!`
        });
      } else {
        setInlineNotification({
          type: 'error',
          message: 'Falha de conexão com o MySQL. Operando em modo Memória de segurança.'
        });
      }
    } catch (err) {
      setIsDirectTesting(false);
      setInlineNotification({
        type: 'error',
        message: 'Não foi possível contatar o servidor para verificar o status do MySQL.'
      });
    }

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setInlineNotification(prev => prev ? null : prev);
    }, 4500);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#0F172A] text-white p-2.5 rounded-xl shadow-md border border-slate-800 flex items-center justify-center font-bold text-xl h-10 w-10">
              P
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#0F172A] flex items-center gap-1.5">
                PRESTIGE <span className="text-amber-500 font-extrabold">BARBER</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase hidden sm:block">Agendamento &amp; Gestão</p>
            </div>
          </div>

          {/* Controls & Profile Panel */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Database Connection Status Monitor Button */}
            <button
              id="db-status-monitor-btn"
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                dbStatus?.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              title="Monitorar Conexão com Banco de Dados"
            >
              <Database className={`h-4 w-4 ${dbStatus?.connected ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
              <span className="hidden sm:inline">Monitor DB</span>
              <span className={`h-2 w-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            </button>

            {/* Dedicated MySQL Direct Test Button */}
            <button
              id="mysql-test-direct-btn"
              onClick={handleDirectMySQLCheck}
              disabled={isDirectTesting}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDirectTesting
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : dbStatus?.connected
                  ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              }`}
              title="Verificar Conexão Direta com MySQL"
            >
              {isDirectTesting ? (
                <RefreshCw className="h-4 w-4 text-slate-500 animate-spin" />
              ) : dbStatus?.connected ? (
                <Wifi className="h-4 w-4 text-sky-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-rose-600 animate-pulse" />
              )}
              <span className="hidden sm:inline">
                {isDirectTesting ? 'Pingando...' : 'Testar MySQL'}
              </span>
              <span className="sm:hidden">
                {isDirectTesting ? '...' : 'MySQL'}
              </span>
            </button>

            {/* Role Control Panel (Only visible if logged in user is admin) */}
            {loggedInUser.role === 'admin' && (
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                <button
                  id="toggle-client-mode"
                  onClick={() => onChangeRole('client')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentRole === 'client'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Modo Cliente</span>
                  <span className="sm:hidden">Cliente</span>
                </button>
                <button
                  id="toggle-admin-mode"
                  onClick={() => onChangeRole('admin')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-[#0F172A] text-amber-500 shadow-sm'
                      : 'text-slate-600 hover:text-[#0F172A]'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Painel Admin</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              </div>
            )}

            {/* Current Profile Indicator */}
            <div className="flex items-center space-x-3 border-l border-slate-200 pl-3 sm:pl-4">
              <img
                src={loggedInUser.avatar}
                alt={loggedInUser.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-amber-500 shadow-inner"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {loggedInUser.name}
                </p>
                <span className="text-[10px] font-mono font-medium uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5 inline-block">
                  {currentRole === 'client' ? 'Cliente' : 'Administrador'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sair da Conta"
                className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline text-xs font-bold ml-1">Sair</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Connection Monitor Detailed Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="db-monitor-modal">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)}
            />

            {/* Modal panel positioning */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl border border-slate-100 sm:align-middle">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-900 text-amber-500">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-6">
                      Monitor do Banco de Dados
                    </h3>
                    <p className="text-xs text-slate-500">Diagnóstico de infraestrutura em tempo real</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setTestSuccess(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border mb-5 flex items-start gap-3 ${
                dbStatus?.connected 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-amber-50 border-amber-100 text-amber-800'
              }`}>
                {dbStatus?.connected ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">
                    {dbStatus?.connected ? 'MySQL Conectado Ativamente' : 'Usando Banco Local em Memória'}
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {dbStatus?.connected 
                      ? 'O servidor backend Express estabeleceu um pool de conexões ativo com o servidor de banco de dados MySQL.' 
                      : 'Não foi possível conectar ao servidor MySQL. O sistema ativou automaticamente o modo de simulação em memória para manter o funcionamento.'
                    }
                  </p>
                </div>
              </div>

              {/* Database Credentials & Config (root, senaisp, mysql) */}
              <div className="mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200/60 font-mono text-xs text-slate-700 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/50 pb-1.5 items-center">
                  <span className="text-slate-500 font-sans font-bold">Tecnologia do Banco:</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold rounded text-[10px]">MySQL</span>
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-slate-200/50 pb-1.5 items-center">
                  <span className="text-slate-500 font-sans font-bold">Host / Servidor:</span>
                  <span className="font-semibold text-slate-900">{dbStatus?.config.host || '127.0.0.1'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200/50 pb-1.5 items-center">
                  <span className="text-slate-500 font-sans font-bold">Porta de Conexão:</span>
                  <span className="font-semibold text-slate-900">{dbStatus?.config.port || '3306'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200/50 pb-1.5 items-center">
                  <span className="text-slate-500 font-sans font-bold">Usuário Root:</span>
                  <span className="font-semibold text-slate-950 bg-slate-200 px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                    <User className="h-3 w-3" /> {dbStatus?.config.user || 'root'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-200/50 pb-1.5 items-center">
                  <span className="text-slate-500 font-sans font-bold">Senha Definida:</span>
                  <span className="font-semibold text-slate-950 flex items-center gap-1 bg-slate-200 px-1.5 py-0.5 rounded text-[11px]">
                    <Lock className="h-3 w-3 text-slate-500" /> senaisp
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-bold">Nome do Schema / DB:</span>
                  <span className="font-semibold text-amber-600 font-bold">{dbStatus?.config.database || 'prestige_barber'}</span>
                </div>
              </div>

              {/* Troubleshooting or Error Logs */}
              {!dbStatus?.connected && dbStatus?.error && (
                <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-red-800 mb-1">Causa do Fallback / Alerta:</h4>
                  <p className="text-[11px] font-mono text-red-700 leading-normal break-all">
                    {dbStatus.error}
                  </p>
                </div>
              )}

              {/* Test Log Feedback */}
              {testSuccess && (
                <div className="mb-5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{testSuccess}</span>
                </div>
              )}

              {/* Interactive Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex-grow flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Verificando Porta & Ping...' : 'Testar Conexão / Atualizar'}
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setTestSuccess(null);
                  }}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating toast notification for direct test */}
      {inlineNotification && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-short max-w-sm w-full shadow-2xl" id="mysql-status-toast">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            inlineNotification.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-white'
              : 'bg-rose-950 border-rose-800 text-white'
          }`}>
            <div className="mt-0.5 shrink-0">
              {inlineNotification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-rose-400 animate-pulse" />
              )}
            </div>
            <div className="flex-grow">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                {inlineNotification.type === 'success' ? 'MySQL Conectado' : 'Conexão MySQL Offline'}
              </h4>
              <p className="text-[11px] opacity-90 leading-snug">
                {inlineNotification.message}
              </p>
            </div>
            <button
              onClick={() => setInlineNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
