'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/Sidebar';
import { POS } from '@/components/POS';
import { ProductManagement } from '@/components/ProductManagement';
import { LogIn, LayoutGrid } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { user, loading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'pos' | 'products'>('pos');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
              <LayoutGrid className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-800">Modern ERP</h1>
            <p className="text-slate-500">Faça login para acessar o sistema de PDV e Estoque</p>
          </div>

          <button
            onClick={login}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            Entrar com Google
          </button>

          <p className="text-xs text-slate-400">
            Ao entrar, você concorda com os termos de serviço e política de privacidade.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'pos' ? <POS /> : <ProductManagement />}
      </div>
    </main>
  );
}
