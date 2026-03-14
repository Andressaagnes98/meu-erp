'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutGrid, 
  Package, 
  ShoppingCart, 
  LogOut,
  User as UserIcon
} from 'lucide-react';
import Image from 'next/image';

interface SidebarProps {
  activeTab: 'pos' | 'products';
  setActiveTab: (tab: 'pos' | 'products') => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'pos', label: 'PDV', icon: ShoppingCart },
    { id: 'products', label: 'Produtos', icon: Package },
  ];

  return (
    <div className="w-72 h-screen bg-white border-r border-slate-200 flex flex-col p-6 space-y-8">
      <div className="flex items-center gap-3 px-2">
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
          <LayoutGrid className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-black text-slate-800 tracking-tight">Modern ERP</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        <div className="flex items-center gap-4 px-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden relative border-2 border-white shadow-md">
            {user?.user_metadata?.avatar_url ? (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt="Profile" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                <UserIcon className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-xs text-slate-500 truncate">Admin</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </button>
      </div>
    </div>
  );
}
