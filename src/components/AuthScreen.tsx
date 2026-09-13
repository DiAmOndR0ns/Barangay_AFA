import React, { useState } from 'react';
import { User, OfficerRole } from '../types';
import { verifyPassword, hashPassword } from '../utils/audit';
import { 
  Building, Lock, Shield, Sprout, Smartphone, CheckCircle, 
  UserPlus, ArrowRight, UserCheck, MapPin, Layers, Tag, Landmark, RefreshCw,
  User as UserIcon, HelpCircle, AlertTriangle, KeyRound, Eye, EyeOff,
  ShieldCheck, Phone, Check, Info, FileText
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
  'Sitio Tapon',
  'Sitio Pundok 1',
  'Sitio Pundok 2',
  'Sitio Lamak'
];

const OFFICER_ROLES_INFO: { 
  role: OfficerRole; 
  label: string; 
  cebLabel: string; 
  desc: string; 
}[] = [
  { 
    role: 'Vice_President', 
    label: 'Vice President', 
    cebLabel: 'Bise Presidente',
    desc: 'Mopuli ug motabang sa Presidente sa pagdumala sa mga komite ug operasyon sa asosasyon.'
  },
  { 
    role: 'Secretary', 
    label: 'Secretary', 
    cebLabel: 'Kalihim',
    desc: 'Tigtipig sa mga opisyal nga rekord, minutes sa panagtigom, resolusyon, ug listahan sa miyembro.'
  },
  { 
    role: 'Treasurer', 
    label: 'Treasurer', 
    cebLabel: 'Mamahandi',
    desc: 'Tigtipig sa pundo, koleksyon sa amot, disbursements, ug pinansyal nga libro sa AFA.'
  },
  { 
    role: 'Auditor', 
    label: 'Auditor', 
    cebLabel: 'Auditor (Tigsusi)',
    desc: 'Pagsusi ug pag-audit sa tanang pinansyal nga transaksyon, resibo, asset, ug pundo.'
  },
  { 
    role: 'PIO', 
    label: 'Public Information Officer (PIO)', 
    cebLabel: 'Opisyal sa Impormasyon',
    desc: 'Pagpagawas sa mga pahibalo, anunsyo sa komunidad, ug pakig-alayon sa mga mag-uuma.'
  },
  { 
    role: 'President', 
    label: 'President', 
    cebLabel: 'Presidente',
    desc: 'Pangulo sa asosasyon, tigdumala sa mga opisyal, ug tig-aprobar sa mga kalihokan.'
  }
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

  // Sign-up State (STRICTLY FOR OFFICERS ONLY)
  const [registerRole, setRegisterRole] = useState<OfficerRole>('Vice_President');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regSitio, setRegSitio] = useState(SITIOS[0]);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showMemberGuide, setShowMemberGuide] = useState(false);

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

    if (!verifyPassword(password, matchedUser.passwordHash, matchedUser.password)) {
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
    
    if (!regName.trim()) {
      toast('Palihug isulod ang imong tibuok ngalan (Please enter your full name).', 'error');
      return;
    }

    if (!regUsername.trim()) {
      toast('Palihug paghimo og username (Please enter a username).', 'error');
      return;
    }

    const cleanUsername = regUsername.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      toast('Ang username kinahanglan labing menus 3 ka letra (Username must be at least 3 characters).', 'error');
      return;
    }

    const usernameExists = users.some(
      u => u.username.toLowerCase() === cleanUsername
    );

    if (usernameExists) {
      toast('Nagamit na kini nga Username. Palihug pagpili og lain (Username already taken).', 'error');
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 6) {
      toast('Ang password kinahanglan labing menus 6 ka letra o numero (Password must be at least 6 characters).', 'error');
      return;
    }

    if (regPassword.trim() !== regConfirmPassword.trim()) {
      toast('Dili managsama ang Password ug Confirm Password (Passwords do not match).', 'error');
      return;
    }

    if (!regContact.trim()) {
      toast('Palihug ibutang ang imong contact number para sa beripikasyon (Please provide contact number).', 'error');
      return;
    }

    // Submit strictly as Officer
    onRegister({
      username: cleanUsername,
      passwordHash: hashPassword(regPassword.trim()),
      name: regName.trim(),
      role: registerRole, // strictly OfficerRole
      contactNumber: regContact.trim(),
      farmLocation: regSitio,
    });

    // Reset fields
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegName('');
    setRegContact('');
    setIsLogin(true);
    toast('Malampusong napadala ang rehistrasyon sa Opisyal! Palihug hulata ang pag-aprobar ni Presidente Zenaida (Officer registration submitted! Awaiting President approval).', 'success');
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
    <div id="auth-screen-root" className="min-h-screen bg-bafa-50 text-bafa-800 flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch my-6">
        
        {/* LEFT COLUMN: HERO INFORMATION PANEL (5 Columns) */}
        <div className="md:col-span-5 flex flex-col justify-between bg-bafa-800 text-bafa-50 rounded-[28px] p-6 sm:p-7 shadow-[0_24px_60px_rgba(18,51,38,0.16)] border border-bafa-700 relative overflow-hidden">
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-bafa-600 rounded-full opacity-20 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,199,159,0.18),transparent_38%)]" />
          
          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-bafa-100 p-2 rounded-2xl text-bafa-700 shadow-inner overflow-hidden border border-bafa-300">
                <img src="/logo.svg" alt="Alegria Farmers Association logo" className="w-11 h-11 sm:w-12 sm:h-12 object-cover block rounded-xl" />
              </div>
              <div>
<<<<<<< Updated upstream
                <h1 className="text-2xl sm:text-[2rem] font-black font-display tracking-tight text-white uppercase leading-none">AFA</h1>
                <p className="text-[10px] text-[#D9F5E3] font-bold tracking-[0.18em] uppercase mt-1">Alegria, Tuburan, Cebu</p>
=======
                <h1 className="text-2xl sm:text-[2rem] font-black font-display tracking-tight text-white uppercase leading-none">BAFA</h1>
                <p className="text-[10px] text-bafa-100 font-bold tracking-[0.18em] uppercase mt-1">Alegria, Tuburan, Cebu</p>
>>>>>>> Stashed changes
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black font-display leading-tight text-white">
                Farmer Access Portal
              </h2>
<<<<<<< Updated upstream
              <p className="text-sm sm:text-[15px] text-[#D7F0DF] leading-relaxed font-medium">
                Kini nga sistema gidisenyo aron mahimong yano, sayon gamiton, ug daling masabtan sa atong mga kaubang mag-uuma ug opisyal.
              </p>
=======
>>>>>>> Stashed changes
              
              <div className="space-y-3 pt-2 text-sm text-white">
                <div className="flex items-start gap-3 rounded-2xl bg-bafa-700 border border-bafa-600 p-3">
                  <div className="bg-bafa-600 p-1.5 rounded-full mt-0.5 text-white shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <span><strong className="font-extrabold text-white">Quick sign in:</strong> Enter your username and password below to access your member or officer dashboard.</span>
                </div>
<<<<<<< Updated upstream
                <div className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                  <div className="bg-[#2D6A4F] p-1.5 rounded-full mt-0.5 text-white shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span><strong className="font-extrabold text-white">Rehistro sa Opisyal:</strong> Ang mga bag-ong napili nga opisyal mahimong mag-rehistro dinhi alang sa pag-aprobar sa Presidente.</span>
=======
                <div className="flex items-start gap-3 rounded-2xl bg-bafa-700 border border-bafa-600 p-3">
                  <div className="bg-bafa-600 p-1.5 rounded-full mt-0.5 text-white shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <span><strong className="font-extrabold text-white">Password help:</strong> If needed, ask the President for a password reset or confirmation.</span>
>>>>>>> Stashed changes
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-bafa-700 border border-bafa-600 p-3">
                  <div className="bg-bafa-600 p-1.5 rounded-full mt-0.5 text-white shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
<<<<<<< Updated upstream
                  <span><strong className="font-extrabold text-white">Pagpasakop sa Miyembro:</strong> Ang mga regular nga mag-uuma iparehistro sa Opisina sa Kalihim (Secretary Desk).</span>
=======
                  <span><strong className="font-extrabold text-white">Updates:</strong> View announcements, farm assistance notices, and current market information in one place.</span>
>>>>>>> Stashed changes
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 pt-4 border-t border-bafa-600 flex items-center justify-between text-[11px] text-bafa-100">
            <span className="font-medium">Tuburan, Cebu Province</span>
            <span className="font-bold flex items-center gap-1 bg-bafa-700 px-2.5 py-1.5 rounded-full border border-bafa-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Lokal / Offline-Ok
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE FORM CONTAINER (7 Columns) */}
        <div className="md:col-span-7 bg-white rounded-[28px] p-5 sm:p-7 shadow-[0_24px_60px_rgba(19,39,31,0.10)] border-2 border-bafa-200 flex flex-col justify-between">
          
          {/* Form Header Tabs */}
          <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-bafa-100 pb-3">
              <div className="flex gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setShowResetForm(false);
                    setShowMemberGuide(false);
                  }}
                  className={`text-sm font-extrabold font-display pb-3 relative transition-all cursor-pointer tracking-[0.08em] ${
                    isLogin && !showResetForm
                      ? 'text-bafa-800 border-b-2 border-bafa-800'
                      : 'text-bafa-neutral-700 hover:text-bafa-700'
                  }`}
                >
                  PAGSULOD (Log In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setShowResetForm(false);
                    setShowMemberGuide(false);
                  }}
                  className={`text-sm font-extrabold font-display pb-3 relative transition-all cursor-pointer tracking-[0.08em] ${
                    !isLogin && !showResetForm
                      ? 'text-bafa-800 border-b-2 border-bafa-800'
                      : 'text-bafa-neutral-700 hover:text-bafa-700'
                  }`}
                >
                  REHISTRO SA OPISYAL (Officer Sign Up)
                </button>
              </div>

<<<<<<< Updated upstream
              {!isLogin && (
                <span className="hidden sm:inline bg-[#EAF6EE] text-[#1D5B42] text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-[0.14em] border border-[#B7E3C4]">
                  Opisyal Lamang (Officers Only)
                </span>
              )}
=======
              {!isLogin && null}
>>>>>>> Stashed changes
            </div>

            {/* PASSWORD RESET APPLICATION BOX */}
            {showResetForm ? (
              <div className="space-y-4 animate-fade-in text-left">
                <div className="bg-bafa-gold-200 border border-bafa-gold-400 rounded-2xl p-4 flex gap-3 text-bafa-neutral-800">
                  <HelpCircle className="w-5 h-5 text-bafa-gold-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <strong className="font-extrabold block">Hangyo sa Bag-ong Password (Password Reset Request)</strong>
                    <p className="leading-relaxed text-bafa-neutral-700">
                      Isulat ang imong Username sa ubos. Ang imong hangyo ipadala dayon ngadto kang Presidente Zenaida A. Elbiña. Siya ang muhatag kanimo og bag-ong password sa personal o pinaagi sa tawag.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleResetRequestSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-bafa-neutral-700 uppercase">
                      Pilia ang imong Username o Account:
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-bafa-neutral-500" />
                      <select
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm bg-bafa-neutral-50 border border-bafa-neutral-300 rounded-xl text-bafa-neutral-800 focus:outline-none focus:border-bafa-700 font-semibold appearance-none"
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
                      className="flex-1 py-3 bg-bafa-neutral-50 border border-bafa-neutral-300 hover:bg-bafa-neutral-100 text-bafa-neutral-700 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                    >
                      I-kansela (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-bafa-coral-600 hover:bg-bafa-coral-500 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
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
                  <span className="flex items-center gap-1 text-xs font-extrabold text-bafa-neutral-800 uppercase tracking-wider">
                    <UserCheck className="w-4 h-4 text-bafa-700" />
                    <span>Quick Login</span>
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {approvedUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setUsername(user.username);
                          setPassword('password123'); // seed preset
                          toast(`Nahi-select si ${user.name}! Pindota ang "Mosulod sa Portal" sa ubos aron makasulod.`, 'info');
                        }}
                        className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[76px] h-20 relative group overflow-hidden ${
                          username.toLowerCase() === user.username.toLowerCase()
                            ? 'bg-[#EAF5EE] border-[#2D6A4F] shadow-sm'
                            : 'bg-[#F9FBF9] border-[#D8E7D9] hover:border-[#8EBDA2] hover:bg-white'
                        }`}
                      >
                        <span className="block font-black text-[#18372d] text-sm leading-tight truncate group-hover:text-[#123326]">
                          {user.name.split(' "')[0]}
                        </span>
                        <span className="block text-[9px] font-bold text-[#536A5D] uppercase tracking-[0.12em] truncate">
                          {user.role.replace('_', ' ')}
                        </span>
                        
                        {user.resetRequested && (
                          <span className="absolute top-2 right-2 bg-amber-500 w-2 h-2 rounded-full" title="Forgot Password Request Pending" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-black text-bafa-neutral-800 uppercase tracking-[0.12em]">
                        Username
                      </label>
                      <span className="text-[10px] text-bafa-neutral-700 italic">Use your username</span>
                    </div>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-[#4D615A]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. roberto"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-base bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-2xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-4 focus:ring-[#D8F3DC] font-semibold transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-black text-bafa-neutral-800 uppercase tracking-[0.12em]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowResetForm(true)}
                        className="text-xs font-extrabold text-[#D76B3F] hover:text-[#B85835] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#4D615A]" />
                      <input
                        type="password"
                        required
                        placeholder="Ipapilit ang imong koda (e.g. password123)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-base bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-2xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-4 focus:ring-[#D8F3DC] font-semibold transition-all font-sans"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143326] text-white rounded-2xl font-black text-sm transition-all shadow-[0_12px_28px_rgba(27,67,50,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {onBackToGuest && (
                    <button
                      type="button"
                      onClick={onBackToGuest}
                      className="w-full py-3 bg-[#FAF8F5] border-2 border-[#9E9785] text-[#1B4332] hover:bg-[#D8F3DC] rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2.5"
                    >
                      <Sprout className="w-4.5 h-4.5 text-[#1B4332]" />
                      <span className="font-display">Back to Public Portal</span>
                    </button>
                  )}
                </form>
              </div>
            ) : showMemberGuide ? (
              
<<<<<<< Updated upstream
              /* OPTIONAL SECRETARY-LED MEMBERSHIP ENROLLMENT INFO FOR REGULAR FARMERS */
              <div className="space-y-4 text-left animate-fade-in max-h-[64vh] overflow-y-auto pr-1">
                <div className="bg-[#EAF6EE] border-2 border-[#52B788]/40 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-5 h-5 text-[#52B788]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#1B4332] bg-white px-2 py-0.5 rounded-md border border-[#A7D7B5]">
                        Opisyal nga Polisa sa Asosasyon
                      </span>
                      <h4 className="text-base font-extrabold text-[#123326] mt-1 font-display">
                        Pagpasakop sa Miyembro: Pinaagi sa Kalihim Lamang
                      </h4>
                      <p className="text-xs text-[#2D5A43] leading-relaxed mt-1">
                        Aron masiguro ang husto nga RSBSA verification ug audit trails, ang mga regular nga mag-uuma <strong>dili kinahanglan mag-sign up sa online form</strong>. Ang <strong>Kalihim (Jennylyn S. Lumactao)</strong> lamang ang awtorisado nga mopasakop ug mohatag og Login Slip credentials.
                      </p>
=======
              /* REGISTER SIGNUP FORM (RE-STYLED TO EARTH THEME) */
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left max-h-[62vh] overflow-y-auto pr-1">
                
                {/* Account Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-bafa-neutral-800 uppercase tracking-wider">
                    Account Type
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
                    <label className="block text-xs font-bold text-bafa-neutral-800 uppercase">
                      Full Name
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
                    <label className="block text-xs font-bold text-bafa-neutral-800 uppercase">
                      Mobile Number
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
>>>>>>> Stashed changes
                    </div>
                  </div>
                </div>

<<<<<<< Updated upstream
                {/* 4-STEP OFFICIAL PROCESS */}
                <div className="bg-[#FAF8F5] border border-[#E2DDD3] rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-black text-[#1B4332] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#1B4332]" />
                    <span>Sayon nga mga Lakang sa Pagpasakop:</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#3E4C3A]">
                    <div className="bg-white p-3 rounded-xl border border-[#E8E3D8] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-[10px] font-black flex items-center justify-center">1</span>
                        <strong className="text-[#123326] font-bold">Bisitaha ang Kalihim</strong>
                      </div>
                      <p className="text-[11px] text-[#556551] pl-7">
                        Adto sa Alegria Farmers Center o pakigkita kang Kalihim Jennylyn S. Lumactao.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E8E3D8] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-[10px] font-black flex items-center justify-center">2</span>
                        <strong className="text-[#123326] font-bold">RSBSA & Farm Record</strong>
                      </div>
                      <p className="text-[11px] text-[#556551] pl-7">
                        Ihatag ang imong RSBSA Control Number, gidak-on sa uma, sitio, ug produkto.
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E8E3D8] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-[10px] font-black flex items-center justify-center">3</span>
                        <strong className="text-[#123326] font-bold">Dawat og Login Slip</strong>
                      </div>
                      <p className="text-[11px] text-[#556551] pl-7">
                        Direkta nga i-isyu sa Kalihim ang imong opisyal nga Username ug Koda (Password).
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-[#E8E3D8] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white text-[10px] font-black flex items-center justify-center">4</span>
                        <strong className="text-[#123326] font-bold">Diretsong Pagsulod</strong>
                      </div>
                      <p className="text-[11px] text-[#556551] pl-7">
                        Gamita ang imong koda aron makasulod sa Member Portal ug makita ang imong tinigom.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECRETARY OFFICE INFO CARD */}
                <div className="bg-white border border-[#D5CFC1] rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Building className="w-5 h-5 text-[#1B4332] shrink-0" />
                    <div>
                      <p className="font-extrabold text-[#123326]">Opisina sa Kalihim (Secretary Desk)</p>
                      <p className="text-[#556551] text-[11px]">Jennylyn S. Lumactao • Alegria Farmers Center, Tuburan, Cebu</p>
                    </div>
=======
                {/* Credentials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-bafa-neutral-800 uppercase">
                      Username
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
                    <label className="block text-xs font-bold text-bafa-neutral-800 uppercase">
                      Password
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
                    <label className="block text-xs font-bold text-bafa-neutral-800 uppercase">
                      Select Officer Role:
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
                    <p className="text-[10px] text-bafa-neutral-700 mt-1 italic">
                      *Only the President can approve officer accounts.
                    </p>
>>>>>>> Stashed changes
                  </div>
                  <span className="bg-[#FAF8F5] text-[#1B4332] text-[10px] font-bold px-2 py-1 rounded-lg border border-[#D5CFC1] shrink-0">
                    Lunes - Biyernes
                  </span>
                </div>

<<<<<<< Updated upstream
                {/* BUTTON TO RETURN TO OFFICER SIGN UP */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMemberGuide(false)}
                    className="flex-1 py-3 bg-[#1B4332] hover:bg-[#143326] text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Balik sa Rehistro sa Opisyal (Officer Sign Up)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setShowMemberGuide(false);
                    }}
                    className="py-3 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#4F5E46] border border-[#D5CFC1] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Mosulod sa Portal (Log In)</span>
                  </button>
                </div>
              </div>
            ) : (
              
              /* STRICTLY OFFICER REGISTRATION FORM */
              <div className="space-y-4 text-left animate-fade-in max-h-[64vh] overflow-y-auto pr-1">
                
                {/* OFFICER ONLY BANNER */}
                <div className="bg-[#EAF6EE] border-2 border-[#52B788]/40 rounded-2xl p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-5 h-5 text-[#52B788]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#1B4332] bg-white px-2 py-0.5 rounded-md border border-[#A7D7B5]">
                          Opisyal Lamang
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          Nagkinahanglan og Pag-aprobar
                        </span>
=======
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="flex items-center gap-1 text-xs font-bold text-bafa-neutral-800 uppercase">
                          <MapPin className="w-3.5 h-3.5 text-[#1B4332]" />
                          <span>Sitio Location</span>
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
>>>>>>> Stashed changes
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#123326] mt-1 font-display">
                        Rehistrasyon Alang sa mga Opisyal Lamang
                      </h4>
                      <p className="text-xs text-[#2D5A43] leading-relaxed mt-0.5">
                        Kini nga porma gigahin lamang sa pagrehistro sa mga piniling opisyal sa AFA. Ang matag bag-ong account kinahanglan una aprobahan ni Presidente Zenaida A. Elbiña sa dili pa makasulod.
                      </p>
                    </div>
                  </div>

<<<<<<< Updated upstream
                  <div className="pt-2 border-t border-[#B7E3C4] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setShowMemberGuide(true)}
                      className="font-bold text-[#1B4332] hover:text-[#0f241a] hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <Info className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Dili opisyal? Tan-awa unsaon pagpasakop ang regular nga miyembro</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  
                  {/* ROLE SELECTION */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                      Pilia ang Katungdanan (Officer Position) *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {OFFICER_ROLES_INFO.map(item => {
                        const isSelected = registerRole === item.role;
                        const incumbent = users.find(u => u.role === item.role && u.isApproved);
                        return (
                          <button
                            key={item.role}
                            type="button"
                            onClick={() => setRegisterRole(item.role)}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between min-h-[66px] ${
                              isSelected 
                                ? 'bg-[#EAF5EE] border-[#1B4332] shadow-sm' 
                                : 'bg-[#F9FBF9] border-[#D8E7D9] hover:border-[#8EBDA2]'
                            }`}
                          >
                            <div>
                              <span className={`block font-black text-xs leading-tight ${isSelected ? 'text-[#1B4332]' : 'text-slate-800'}`}>
                                {item.cebLabel}
                              </span>
                              <span className="block text-[10px] text-slate-500 font-semibold truncate">
                                {item.label}
                              </span>
                            </div>
                            {incumbent && (
                              <span className="text-[9px] text-[#2D6A4F] font-bold truncate mt-1 block">
                                Karon: {incumbent.name.split(' ')[0]}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Role Description Card */}
                    <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E2DDD3] text-[11px] text-[#4F5E46] flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#1B4332] shrink-0" />
                      <span>
                        <strong className="text-[#1B4332]">{OFFICER_ROLES_INFO.find(r => r.role === registerRole)?.cebLabel}:</strong>{' '}
                        {OFFICER_ROLES_INFO.find(r => r.role === registerRole)?.desc}
                      </span>
                    </div>
                  </div>

                  {/* NAME & USERNAME */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                        Tibuok Ngalan sa Opisyal *
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 w-4 h-4 text-[#4D615A]" />
=======
                      <div className="space-y-1">
                        <label className="flex items-center gap-1 text-xs font-bold text-bafa-neutral-800 uppercase">
                          <Layers className="w-3.5 h-3.5 text-[#1B4332]" />
                          <span>Farm Size (Hectares)</span>
                        </label>
>>>>>>> Stashed changes
                        <input
                          type="text"
                          required
                          placeholder="e.g. Roberto S. Santos"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#D8F3DC] font-semibold"
                        />
                      </div>
                    </div>

<<<<<<< Updated upstream
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                          Username (Account) *
                        </label>
                        {regUsername && users.some(u => u.username.toLowerCase() === regUsername.trim().toLowerCase()) && (
                          <span className="text-[10px] text-red-600 font-bold">Nagamit na</span>
                        )}
                      </div>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-3 w-4 h-4 text-[#4D615A]" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. roberto.santos"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#D8F3DC] font-semibold font-mono"
                        />
=======
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1 text-xs font-bold text-bafa-neutral-800 uppercase">
                        <Tag className="w-3.5 h-3.5 text-[#1B4332]" />
                        <span>Products Raised</span>
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
>>>>>>> Stashed changes
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD & CONFIRM PASSWORD */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                        Password / Koda * (min. 6)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-[#4D615A]" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          placeholder="Isulod ang koda"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-9 pr-9 py-2.5 text-sm bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#D8F3DC] font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-3 text-[#4D615A] hover:text-[#1B4332] cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                          Kumpirmaha ang Password *
                        </label>
                        {regConfirmPassword && (
                          regPassword === regConfirmPassword ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Sakto
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-600 font-bold">Dili pareha</span>
                          )
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-[#4D615A]" />
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Isulod pag-usab"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-9 py-2.5 text-sm bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#D8F3DC] font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-3 top-3 text-[#4D615A] hover:text-[#1B4332] cursor-pointer"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CONTACT NUMBER & SITIO */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                        Contact Number (Mobile) *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-[#4D615A]" />
                        <input
                          type="tel"
                          required
                          placeholder="0917-123-4567"
                          value={regContact}
                          onChange={(e) => setRegContact(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#D8F3DC] font-semibold font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-[#425A50] uppercase tracking-[0.12em]">
                        Sitio sa Alegria (Puy-anan) *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#4D615A]" />
                        <select
                          value={regSitio}
                          onChange={(e) => setRegSitio(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 text-sm bg-[#F8FAF8] border-2 border-[#D8E7D9] rounded-xl text-[#1E352E] focus:outline-none focus:border-[#1B4332] font-semibold appearance-none cursor-pointer"
                        >
                          {SITIOS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#1B4332] hover:bg-[#143326] text-white rounded-2xl font-black text-sm transition-all shadow-[0_12px_28px_rgba(27,67,50,0.25)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4.5 h-4.5 text-[#52B788]" />
                      <span>Ipadala ang Rehistrasyon sa Opisyal</span>
                    </button>

                    <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="font-bold text-[#1B4332] hover:underline cursor-pointer"
                      >
                        ← Naa na koy account? Pagsulod Dinhi (Log In)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMemberGuide(true)}
                        className="font-bold text-[#D76B3F] hover:underline cursor-pointer"
                      >
                        Unsaon pagpasakop sa mga miyembro?
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            )}
          </div>

          <div className="text-center text-[10px] text-[#85947E] mt-6 border-t border-[#F0EBE1] pt-3">
            Sistemang AFA v1.1 • Gidisenyo alang sa kasayon sa matag mag-uuma ug opisyal.
          </div>
        </div>

      </div>
    </div>
  );
}
