import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { gasService } from "../services/gasService";
import { LogIn, KeyRound, User as UserIcon, Loader2, X, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";

export default function Login() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Admin form state
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminNip, setAdminNip] = useState("");
  const [adminNama, setAdminNama] = useState("");
  const [adminUnit, setAdminUnit] = useState("");
  const [adminTipe, setAdminTipe] = useState("Request Akun"); // Request Akun, Lupa Password, Lupa PIN
  const [adminPass, setAdminPass] = useState("");
  const [adminPassConfirm, setAdminPassConfirm] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [adminPinConfirm, setAdminPinConfirm] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showAdminPassConfirm, setShowAdminPassConfirm] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showAdminPinConfirm, setShowAdminPinConfirm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nip || !password) {
      setError("Mohon isi NIP dan Password.");
      return;
    }

    setLoading(true);

    // Call our GAS Service
    const res = await gasService.post("login", { nip, password });

    if (res.success && res.data) {
      // Mock log activity
      await gasService.post("logActivity", { nip, action: "LOGIN" });
      login(res.data);
      if (res.data.bidang?.toUpperCase() === 'BAKTI') {
        navigate("/welcome-guild");
      } else {
        navigate("/office");
      }
    } else {
      setError((res.message || res.error || JSON.stringify(res)) || res.error || "Login gagal.");
    }

    setLoading(false);
  };

  const handleHubungiAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNip || !adminNama) {
      alert("NIP dan Nama wajib diisi.");
      return;
    }
    
    if (adminTipe === "Request Akun") {
      if (!adminUnit) {
        alert("UNIT wajib diisi untuk Request Akun.");
        return;
      }
      if (!adminPass || !adminPassConfirm || !adminPin || !adminPinConfirm) {
        alert("Semua field Password dan PIN wajib diisi untuk Request Akun.");
        return;
      }
      if (adminPass !== adminPassConfirm) {
        alert("Password dan Ulangi Password tidak cocok.");
        return;
      }
      if (adminPin.length !== 6 || adminPinConfirm.length !== 6) {
        alert("PIN harus berupa 6 digit angka.");
        return;
      }
      if (adminPin !== adminPinConfirm) {
        alert("PIN dan Ulangi PIN tidak cocok.");
        return;
      }

      // Add to Auth sheet
      const reqRes = await gasService.post("requestAkun", {
        nip: adminNip,
        nama: adminNama,
        password: adminPass,
        pin: adminPin,
        unit: adminUnit
      });

      if (!reqRes.success) {
         alert("Gagal menambahkan akun ke sistem: " + (reqRes.message || "Error"));
         return; 
      } else {
         alert("Permohonan Akun terkirim, mohon tunggu Persetujuan dari Admin");
         setShowAdminForm(false);
         return; // Do NOT send to whatsapp
      }
    }

    let text = `Saya ${adminNama} ${adminNip} , melakukan permintaan ${adminTipe}.`;
    text += `\nTerimakasih`;

    const url = `https://api.whatsapp.com/send?phone=+6285242054794&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowAdminForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f12] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Decorative background vectors */}
      <div className="absolute top-0 right-0 -m-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -m-32 w-80 h-80 rounded-full bg-secondary/5 blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full max-w-[90%] mx-auto">
        <div className="flex justify-center flex-col items-center">
          <img
            src="https://lh3.googleusercontent.com/d/1N2E29tQtPDW9kN82rA4R1W8NqSKLq-xg"
            alt="Portal PDKB Recca Logo"
            className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_0_20px_rgba(255,94,0,0.4)]"
            referrerPolicy="no-referrer"
          />
          <h2 className="mt-6 text-center text-2xl tracking-tighter font-extrabold text-white uppercase">
            Portal <span className="text-primary">PDKB</span> Recca
          </h2>
          <p className="mt-1 text-center text-[10px] uppercase font-bold tracking-widest text-gray-500">
            Sistem Manajemen Pekerjaan & Pegawai
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full max-w-[90%] mx-auto">
        <div className="bg-[#0d161a] py-8 px-5 rounded-xl border border-white/5 sm:px-10 shadow-2xl">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded flex items-center">
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="nip"
                className="block text-[11px] font-bold uppercase tracking-widest text-gray-400"
              >
                User ID / NIP
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="nip"
                  name="nip"
                  type="text"
                  required
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="block w-full pl-10 sm:text-sm bg-[#1a252b] border border-white/10 text-white rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-600"
                  placeholder="Masukkan User ID atau NIP"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold uppercase tracking-widest text-gray-400"
              >
                Password
              </label>
              <div className="mt-1 relative shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 sm:text-sm bg-[#1a252b] border border-white/10 text-white rounded px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-gray-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 text-primary border-white/10 bg-[#1a252b] rounded outline-none focus:ring-primary focus:ring-offset-0 focus:ring-offset-[#0d161a]"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs text-gray-400"
                >
                  Ingat saya
                </label>
              </div>

              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => setShowAdminForm(true)}
                  className="font-bold text-[#0d8291] hover:text-white transition-colors"
                >
                  Hubungi Admin !
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full flex justify-center py-2.5 px-4 rounded shadow-[0_0_15px_rgba(255,94,0,0.2)] text-xs font-bold uppercase tracking-widest text-black bg-primary hover:bg-primary-dark transition-all",
                  loading && "opacity-70 cursor-not-allowed shadow-none",
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Masuk ke Office <LogIn className="h-4 w-4" />
                  </span>
                )}
              </button>
            </div>

            <div className="pt-2 flex justify-center border-t border-white/5 mt-6">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs font-bold uppercase mt-4 text-gray-500 hover:text-white transition-colors flex flex-col items-center group"
              >
                <span className="mb-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  Kembali
                </span>
                <span className="w-5 h-5 flex items-center justify-center rounded bg-white/5 text-gray-400 group-hover:bg-[#0d8291] group-hover:text-white transition-all">
                  &larr;
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Admin Contact Modal */}
      {showAdminForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-[#0d161a] border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                Hubungi Admin
              </h3>
              <button
                onClick={() => setShowAdminForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleHubungiAdmin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  required
                  value={adminNip}
                  onChange={(e) => setAdminNip(e.target.value.toUpperCase())}
                  className="block w-full bg-[#1a252b] border border-white/10 text-white rounded px-3 py-2 text-xs outline-none focus:border-primary"
                  placeholder="Masukkan NIP"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  required
                  value={adminNama}
                  onChange={(e) => setAdminNama(e.target.value.toUpperCase())}
                  className="block w-full bg-[#1a252b] border border-white/10 text-white rounded px-3 py-2 text-xs outline-none focus:border-primary"
                  placeholder="Masukkan Nama Lengkap"
                />
              </div>

              {adminTipe === "Request Akun" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    UNIT
                  </label>
                  <input
                    type="text"
                    required={adminTipe === "Request Akun"}
                    value={adminUnit}
                    onChange={(e) => setAdminUnit(e.target.value.toUpperCase())}
                    className="block w-full bg-[#1a252b] border border-white/10 text-white rounded px-3 py-2 text-xs outline-none focus:border-primary"
                    placeholder="Masukkan Unit"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Pilih Permintaan
                </label>
                <div className="flex flex-col gap-2">
                  {["Request Akun", "Lupa Password", "Lupa PIN"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="adminTipe"
                        value={opt}
                        checked={adminTipe === opt}
                        onChange={(e) => setAdminTipe(e.target.value)}
                        className="text-primary bg-[#1a252b] border-white/10 focus:ring-primary focus:ring-offset-[#0d161a]"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {adminTipe === "Request Akun" && (
                <div className="pt-2 border-t border-white/5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPass ? "text" : "password"}
                          required
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          className="block w-full bg-[#1a252b] border border-white/10 text-white rounded pl-3 pr-8 py-2 text-xs outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPass(!showAdminPass)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-white transition-colors"
                        >
                          {showAdminPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Ulangi Password
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPassConfirm ? "text" : "password"}
                          required
                          value={adminPassConfirm}
                          onChange={(e) => setAdminPassConfirm(e.target.value)}
                          className="block w-full bg-[#1a252b] border border-white/10 text-white rounded pl-3 pr-8 py-2 text-xs outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassConfirm(!showAdminPassConfirm)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-white transition-colors"
                        >
                          {showAdminPassConfirm ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        PIN <span className="text-[8px] text-gray-500 normal-case">(6 Angka)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPin ? "text" : "password"}
                          required
                          value={adminPin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 6) setAdminPin(val);
                          }}
                          className="block w-full bg-[#1a252b] border border-white/10 text-white rounded pl-3 pr-8 py-2 text-xs outline-none focus:border-primary tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPin(!showAdminPin)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-white transition-colors"
                        >
                          {showAdminPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                        Ulangi PIN
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminPinConfirm ? "text" : "password"}
                          required
                          value={adminPinConfirm}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 6) setAdminPinConfirm(val);
                          }}
                          className="block w-full bg-[#1a252b] border border-white/10 text-white rounded pl-3 pr-8 py-2 text-xs outline-none focus:border-primary tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPinConfirm(!showAdminPinConfirm)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-500 hover:text-white transition-colors"
                        >
                          {showAdminPinConfirm ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminForm(false)}
                  className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-black rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90"
                >
                  Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
