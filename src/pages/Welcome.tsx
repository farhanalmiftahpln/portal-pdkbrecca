import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutDashboard, LogIn } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        if (user?.bidang?.toUpperCase() === 'BAKTI') {
          navigate('/welcome-guild');
        } else {
          navigate('/office');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigate, user]);

  return (
    <div className="relative min-h-screen bg-[#0a0f12] flex flex-col items-center justify-center p-4 text-center overflow-hidden">
      {/* Background Animated Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] sm:blur-[150px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0d8291]/20 rounded-full blur-[100px] sm:blur-[150px] animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-[#ff5e00]/10 rounded-full blur-[80px] sm:blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 animate-fade-in-up">
        <img 
          src="https://lh3.googleusercontent.com/d/1N2E29tQtPDW9kN82rA4R1W8NqSKLq-xg" 
          alt="Portal PDKB Recca Logo" 
          className="h-24 sm:h-32 w-auto object-contain mx-auto mb-6 drop-shadow-[0_0_15px_rgba(13,130,145,0.5)]"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wide mb-1">
          Selamat Datang di
        </h1>
        <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-10">
          Portal <span className="text-primary">PDKB</span> Recca
        </h2>

        {isAuthenticated ? (
          <div className="text-gray-400 text-sm animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            Mengarahkan ke Office...
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold uppercase tracking-widest text-xs transition-all border border-white/10 flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Lihat Dashboard
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-dark text-black rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(255,94,0,0.3)] hover:shadow-[0_0_30px_rgba(255,94,0,0.5)] flex items-center justify-center gap-2 hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
