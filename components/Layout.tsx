import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, LayoutDashboard, FileText, PieChart, PlusCircle, Users, Package, Settings, Warehouse } from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, activeTab, setActiveTab, children }) => {
  const isAdmin = user.role === UserRole.ADMIN;

  const adminMenu = [
    { id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
    { id: 'warehouse', label: 'Omborxona (Markaz)', icon: Warehouse },
    { id: 'statistics', label: 'Statistika', icon: PieChart },
    { id: 'organizations', label: 'Tashkilotlar', icon: Users },
    { id: 'products', label: 'Mahsulotlar', icon: Package },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ];

  const orgMenu = [
    { id: 'new-request', label: 'Yangi Talabnoma', icon: PlusCircle },
    { id: 'warehouse', label: 'Omborxona', icon: Warehouse },
    { id: 'statistics', label: 'Statistika', icon: PieChart },
    { id: 'history', label: 'Mening Tarixim', icon: FileText },
  ];

  const menuItems = isAdmin ? adminMenu : orgMenu;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-800 text-white flex-shrink-0">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wider">Taminot<span className="text-blue-400">Manager</span></h1>
          <p className="text-sm text-slate-400 mt-1">{isAdmin ? 'Admin Panel' : 'Tashkilot Paneli'}</p>
          <p className="text-xs text-slate-500 mt-2 font-mono truncate">{user.name}</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full md:w-64 p-4 border-t border-slate-700 bg-slate-900">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white shadow-sm p-4 md:px-8 flex items-center justify-between md:hidden">
          <span className="font-bold text-slate-800">TaminotManager</span>
          <button onClick={onLogout}><LogOut size={20} className="text-red-500"/></button>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};