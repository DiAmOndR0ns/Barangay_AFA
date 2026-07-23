import React, { useState } from 'react';
import { User, OfficerRole } from '../types';
import { 
  Building, Lock, Shield, Sprout, Smartphone, CheckCircle, 
  UserPlus, ArrowRight, UserCheck, MapPin, Layers, Tag, Landmark, RefreshCw,
  User as UserIcon, HelpCircle, AlertTriangle, KeyRound
} from 'lucide-react';

interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (userData: Omit<User, 'id' | 'isApproved'>) => void;
  toast: (message: string, type: 'success' | 'warning' | 'info' | 'error') => void;
  onRequestPasswordReset?: (username: string) => void;
  onBackToGuest?: () => void;
}

const SITIOS = [
  'Sitio Proper (Centro)',
  'Sitio Fatima',
  'Sitio Huyong-Huyong',
  'Sitio Mahayahay',
  'Sitio Tuburan',
  'Sitio Ylaya'
];

const CROPS_AND_LIVESTOCK = [
  'Corn (Mais)',
  'Coconut (Lubi)',
  'Cacao',
  'Tuburan Coffee',
  'Vegetables (Utanon)',
  'Cassava (Kamoteng Kahoy)',
  'Hog Raising (Baboyan)',
  'Poultry Raising (Manokan)',
  'Goat Raising (Kanding)'
];

export default function AuthScreen({ 
  users, 
  onLogin, 
  onRegister, 
  toast,
  onRequestPasswordReset,
  onBackToGuest
}: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Password reset request modal/form state
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetUsername, setResetUsername] = useState('');

  // Sign-up State
  const [registerRole, setRegisterRole] = useState<'Member' | OfficerRole>('Member');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regSitio, setRegSitio] = useState(SITIOS[0]);
  const [regSize, setRegSize] = useState('1.5');
  const [regSelectedCrops, setRegSelectedCrops] = useState<string[]>([]);

  const handleCropToggle = (cropName: string) => {
    if (regSelectedCrops.includes(cropName)) {
      setRegSelectedCrops(regSelectedCrops.filter(c => c !== cropName));
    } else {
      setRegSelectedCrops([...regSelectedCrops, cropName]);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast('Palihug isulod ang imong username ug password (Please enter username and password).', 'error');
      return;
    }

    const matchedUser = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matchedUser) {
      toast('Wala makit-i ang account. Palihug irehistro o isusi usab (Account not found. Please register or check details).', 'error');
      return;
    }

    if (password !== 'password123' && matchedUser.password !== password) {
      toast('Sayo ang password. Sulayi ang "password123" o ipangutana sa Presidente (Incorrect password. Try password123 or ask the President).', 'error');
      return;
    }

    if (!matchedUser.isApproved) {
      toast('Ang imong rehistrasyon nagpaabot pa sa pag-aprobar ni Presidente Zenaida A. Elbiña (Awaiting President approval).', 'warning');
      return;
    }

    onLogin(matchedUser);
    toast(`Welcome back, ${matchedUser.name}!`, 'success');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword.trim() || !regName.trim()) {
      toast('Palihug sulati ang tanang kinahanglang dapit (Please fill out all required fields).', 'error');
      return;
    }

    const usernameExists = users.some(
      u => u.username.toLowerCase() === regUsername.trim().toLowerCase()
    );

    if (usernameExists) {
      toast('Nagamit na kini nga Username. Pagpili og lain (Username already taken).', 'error');
      return;
    }

    onRegister({
      username: regUsername.trim(),
      password: regPassword,
      name: regName.trim(),
      role: registerRole,
      contactNumber: regContact.trim(),
      farmLocation: registerRole === 'Member' ? regSitio : undefined,
      farmSize: registerRole === 'Member' ? parseFloat(regSize) || 0 : undefined,
      primaryCrops: registerRole === 'Member' ? regSelectedCrops : undefined,
    });

    // Reset fields
    setRegUsername('');
    setRegPassword('');
    setRegName('');
    setRegContact('');
    setRegSelectedCrops([]);
    setIsLogin(true);
  };

  const handleResetRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUsername.trim()) {
      toast('Palihug pili o isulod ang imong username.', 'error');
      return;
    }

    if (onRequestPasswordReset) {
      onRequestPasswordReset(resetUsername.trim());
      setShowResetForm(false);
      setResetUsername('');
    } else {
      toast('Dili pa magamit ang password reset request.', 'error');
    }
  };

  // Demo users for quick-login grid (makes testing very easy for non-tech users)
  const approvedUsers = users.filter(u => u.isApproved);

  return (
    <div id="auth-screen-root" className="min-h-screen bg-[#FAF7F2] text-[#2D3A22] flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch my-6">
        
        {/* LEFT COLUMN: HERO INFORMATION PANEL (5 Columns) */}
        <div className="md:col-span-5 flex flex-col justify-between bg-[#1B4332] text-[#F4EFE6] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#143326] relative overflow-hidden">
          {/* Subtle nature element overlay effect */}
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#2D6A4F] rounded-full opacity-20 pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#D8F3DC] p-3 rounded-2xl text-[#1B4332] shadow-inner">
                <Sprout className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white uppercase leading-none">BAFA</h1>
                <p className="text-[10px] text-[#D8F3DC] font-bold tracking-widest uppercase mt-0.5">Alegria, Tuburan, Cebu</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold font-display leading-tight text-white">
                Sistemang Alang sa mga Mag-uuma sa Alegria
              </h2>
              <p className="text-xs sm:text-sm text-[#B7E4C7] leading-relaxed font-normal">
                Kini nga sistema gidisenyo aron mahimong yano, sayon gamiton, ug daling masabtan sa atong mga kaubang mag-uuma.
              </p>
              
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#2D6A4F] p-1 rounded-full mt-0.5 text-white shrink-0">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <span><strong>Sayon nga Pag-login:</strong> Pindota lang ang imong ngalan sa dapit sa ubos aron daling makasulod.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#2D6A4F] p-1 rounded-full mt-0.5 text-white shrink-0">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <span><strong>Pagdumala sa Password:</strong> Kung makalimot, hangyoa lang si Presidente Zenaida para sa bag-ong password.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="bg-[#2D6A4F] p-1 rounded-full mt-0.5 text-white shrink-0">
                    <CheckCircle className="w-3 h-3" />
                  </div>
                  <span><strong>Balita ug Presyo:</strong> Makita dayon ang mga pinakabag-ong anunsyo mahitungod sa sementos, liso, ug presyo.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#2D6A4F] flex items-center justify-between text-[11px] text-[#B7E4C7]">
            <span className="font-medium">Tuburan, Cebu Province</span>
            <span className="font-bold flex items-center gap-1 bg-[#295A43] px-2 py-1 rounded border border-[#357256]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Lokal / Offline-Ok
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE FORM CONTAINER (7 Columns) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E9E4D9] flex flex-col justify-between">
          
          {/* Form Header Tabs */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#F0EBE1] pb-3">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setShowResetForm(false);
                  }}
                  className={`text-sm font-extrabold font-display pb-3 relative transition-all cursor-pointer ${
                    isLogin && !showResetForm
                      ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                      : 'text-[#85947E] hover:text-[#1B4332]'
                  }`}
                >
                  PAGSULOD (Log In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setShowResetForm(false);
                  }}
                  className={`text-sm font-extrabold font-display pb-3 relative transition-all cursor-pointer ${
                    !isLogin && !showResetForm
                      ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                      : 'text-[#85947E] hover:text-[#1B4332]'
                  }`}
                >
                  PAGREHISTRO (Register)
                </button>
              </div>

              {!isLogin && (
                <span className="hidden sm:inline bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider">
                  Bag-ong Miyembro
                </span>
              )}
            </div>

            {/* PASSWORD RESET APPLICATION BOX */}
            {showResetForm ? (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-4 flex gap-3 text-[#5D4037]">
                  <HelpCircle className="w-5 h-5 text-[#FFB300] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <strong className="font-extrabold block">Hangyo sa Bag-ong Password (Password Reset Request)</strong>
                    <p className="leading-relaxed text-[#6D4C41]">
                      Isulat ang imong Username sa ubos. Ang imong hangyo ipadala dayon ngadto kang Presidente Zenaida A. Elbiña. Siya ang muhatag kanimo og bag-ong password sa personal o pinaagi sa tawag.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleResetRequestSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                      Pilia ang imong Username o Account:
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-[#85947E]" />
                      <select
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold appearance-none"
                        required
                      >
                        <option value="">-- Pili og Username / Select --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.username}>
                            {u.name} ({u.username})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetForm(false)}
                      className="flex-1 py-3 bg-[#FAF8F5] border border-[#D5CFC1] hover:bg-[#F2ECE0] text-[#4F5E46] rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                    >
                      I-kansela (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-[#E65100] hover:bg-[#EF6C00] text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Ipadala Hangyo (Send)</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : isLogin ? (
              
              /* STANDARD SIMPLE LOGIN FORM */
              <div className="space-y-6 text-left">
                
                {/* QUICK SAMPLE DEMO USER SELECTOR (Super easy for farmers to click and enter) */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#4F5E46] uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-4 h-4 text-[#1B4332]" />
                    <span>Dali nga Pagsulod (Click your name to log in quickly):</span>
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {approvedUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setUsername(user.username);
                          setPassword('password123'); // seed preset
                          toast(`Nahi-select si ${user.name}! Pindota ang "Access Portal" sa ubos aron makasulod.`, 'info');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-[66px] relative group overflow-hidden ${
                          username.toLowerCase() === user.username.toLowerCase()
                            ? 'bg-[#EAF4EC] border-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                            : 'bg-[#FAF8F5] border-[#D5CFC1] hover:border-[#85947E] hover:bg-white'
                        }`}
                      >
                        <span className="block font-black text-[#2D3A22] text-[11px] truncate group-hover:text-[#1B4332]">
                          {user.name.split(' "')[0]}
                        </span>
                        <span className="block text-[8.5px] font-bold text-[#5D6B54] uppercase tracking-wider truncate">
                          {user.role.replace('_', ' ')}
                        </span>
                        
                        {user.resetRequested && (
                          <span className="absolute top-1 right-1 bg-amber-500 w-2 h-2 rounded-full" title="Forgot Password Request Pending" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                        Username (Ngalan sa Account)
                      </label>
                      <span className="text-[10px] text-[#85947E] italic">Sulata imong alyas</span>
                    </div>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 w-4 h-4 text-[#85947E]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. roberto"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                        Password (Koda / Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowResetForm(true)}
                        className="text-xs font-extrabold text-[#E65100] hover:underline cursor-pointer"
                      >
                        Nakalimot sa Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-[#85947E]" />
                      <input
                        type="password"
                        required
                        placeholder="Ipapilit ang imong koda (e.g. password123)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143326] text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>Mosulod sa Portal (Log In)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {onBackToGuest && (
                    <button
                      type="button"
                      onClick={onBackToGuest}
                      className="w-full py-3 bg-[#FAF8F5] border-2 border-[#9E9785] text-[#1B4332] hover:bg-[#D8F3DC] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2.5"
                    >
                      <Sprout className="w-4.5 h-4.5 text-[#1B4332]" />
                      <span className="font-display">BALIK SA PUBLIC PORTAL (Kasaysayan, Kalamposan, Produkto)</span>
                    </button>
                  )}
                </form>
              </div>
            ) : (
              
              /* REGISTER SIGNUP FORM (RE-STYLED TO EARTH THEME) */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left max-h-[62vh] overflow-y-auto pr-1">
                
                {/* Account Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#4F5E46] uppercase tracking-wider">
                    Unsang Matang sa Account? (Account Type)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('Member')}
                      className={`py-3 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        registerRole === 'Member'
                          ? 'bg-[#EAF4EC] border-[#1B4332] text-[#1B4332] shadow-sm'
                          : 'bg-[#FAF8F5] border-[#D5CFC1] text-[#85947E] hover:text-[#2D3A22]'
                      }`}
                    >
                      <Sprout className="w-4 h-4 text-[#1B4332]" />
                      <span>Regular Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('Secretary')}
                      className={`py-3 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        registerRole !== 'Member'
                          ? 'bg-[#E3F2FD] border-[#0D47A1] text-[#0D47A1] shadow-sm'
                          : 'bg-[#FAF8F5] border-[#D5CFC1] text-[#85947E] hover:text-[#2D3A22]'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-[#0D47A1]" />
                      <span>Officer Account</span>
                    </button>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                      Tibuok Ngalan (Full Name)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vicente Sanchez"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                      Numero sa Selpon (Mobile Number)
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-3 w-4 h-4 text-[#85947E]" />
                      <input
                        type="text"
                        placeholder="e.g. 0917-000-0000"
                        value={regContact}
                        onChange={(e) => setRegContact(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                      Username (Imo Alyas sa Pag-login)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. vicente"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                      Password (Koda o Password)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Paghimo og koda"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors"
                    />
                  </div>
                </div>

                {/* Role Specific details */}
                {registerRole !== 'Member' ? (
                  <div className="space-y-1 bg-[#F1F3F5] p-3 rounded-xl border border-[#D5CFC1]">
                    <label className="block text-xs font-bold text-[#4F5E46] uppercase">
                      Pilia ang Katungdanan isip Opisyal:
                    </label>
                    <select
                      value={registerRole}
                      onChange={(e) => setRegisterRole(e.target.value as OfficerRole)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CFC1] rounded-lg text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold"
                    >
                      <option value="Vice_President">Vice President (Bise Presidente)</option>
                      <option value="Secretary">Secretary (Kalihim)</option>
                      <option value="Treasurer">Treasurer (Tesorero)</option>
                      <option value="Auditor">Auditor (Tagasusi sa Panalapi)</option>
                      <option value="PIO">PIO (Public Information Officer / Tigpahayag)</option>
                    </select>
                    <p className="text-[10px] text-[#5D6B54] mt-1 italic">
                      *Ang Presidente lamang (Zenaida A. Elbiña) ang makahatag og pag-aprobar sa mga opisyal.
                    </p>
                  </div>
                ) : (
                  /* Member farm details */
                  <div className="space-y-4 border-t border-[#F0EBE1] pt-3 mt-1">
                    <h4 className="text-xs font-black text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-[#1B4332]" />
                      <span>Impormasyon sa Imong Uma (Farm Details)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#4F5E46] uppercase flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#1B4332]" />
                          <span>Hingtungdan nga Sitio (Sitio Location)</span>
                        </label>
                        <select
                          value={regSitio}
                          onChange={(e) => setRegSitio(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold"
                        >
                          {SITIOS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-[#4F5E46] uppercase flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#1B4332]" />
                          <span>Gidak-on sa Uma (Farm Size in Hectares)</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 1.5"
                          value={regSize}
                          onChange={(e) => setRegSize(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm bg-[#FAF8F5] border border-[#D5CFC1] rounded-xl text-[#2D3A22] focus:outline-none focus:border-[#1B4332] font-semibold transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#4F5E46] uppercase flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-[#1B4332]" />
                        <span>Unsay imong Gipananom o Gibuhi? (Products Raised)</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#FAF8F5] p-3 rounded-xl border border-[#D5CFC1] max-h-32 overflow-y-auto">
                        {CROPS_AND_LIVESTOCK.map((crop) => (
                          <label key={crop} className="flex items-center gap-2 cursor-pointer text-xs text-[#2D3A22] hover:text-[#1B4332] select-none font-medium">
                            <input
                              type="checkbox"
                              checked={regSelectedCrops.includes(crop)}
                              onChange={() => handleCropToggle(crop)}
                              className="rounded border-[#D5CFC1] bg-white text-[#1B4332] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                            />
                            <span>{crop}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143326] text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Isumite ang Pagparehistro (Submit Registration)</span>
                </button>
              </form>
            )}
          </div>

          <div className="text-center text-[10px] text-[#85947E] mt-6 border-t border-[#F0EBE1] pt-3">
            Sistemang BAFA v1.1 • Gidisenyo alang sa kasayon sa matag mag-uuma.
          </div>
        </div>

      </div>
    </div>
  );
}
