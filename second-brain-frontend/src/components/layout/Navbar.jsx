import React from 'react';
import { useLogout } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { BrainCircuit, LogOut } from 'lucide-react';

const Navbar = () => {
  const { performLogout, loading } = useLogout();

  const handleLogout = () => {
    performLogout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-6 md:px-12">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="bg-primary p-1.5 rounded-lg">
          <BrainCircuit className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
          Second Brain
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" className="text-sm font-semibold !px-3" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
