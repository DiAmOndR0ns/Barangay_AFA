import React, { useState } from 'react';
import { Sprout, Trophy, BookOpen, LogIn, ArrowRight, Sparkles, Coffee, Heart, Milestone, TrendingUp, Calendar, Users, Award, ShieldCheck, Check, ChevronLeft, ChevronRight, Lock, ShieldAlert } from 'lucide-react';
import { HogRaisingState, Member, Product } from '../types';

interface GuestPortalProps {
  onEnterLogin: () => void;
  members: Member[];
  hogRaising: HogRaisingState;
  products?: Product[];
}

export default function GuestPortal({ onEnterLogin, members, hogRaising, products = [] }: GuestPortalProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'achievements' | 'products'>('home');

  // Dynamically calculate stats to accurately reflect the registered roster
  const registeredMembersCount = members.length;
  const activeMembersCount = members.filter(m => m.status === 'Active').length;
  const currentPigsCount = 18; // BAFA Standard Piglet Batch size

  // Theme styling tailored for senior citizens (high contrast, warm, large readable text)
  const theme = {
    bg: 'bg-[#FAF7F2] text-[#1B4332]',
    cardBg: 'bg-white border-[#D5CFC1] shadow-md',
    headerText: 'text-[#1B4332] font-black',
    accentText: 'text-[#BF360C] font-black',
    accentBg: 'bg-[#FFCC80] text-[#8D2300]',
    primaryBtn: 'bg-[#1B4332] hover:bg-[#143326] text-white shadow-lg text-sm sm:text-base font-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]'
  };

  // Default Showcase Product Data
  const defaultProductsList = [
    {
      id: 'prod-coffee',
      name: 'Kape sa Tuburan (Tuburan Coffee)',
      cebName: 'Espesyal nga Roasted Coffee Beans',
      desc: 'Lunsay nga kape gikan sa mga bungtod sa Tuburan. Organiko, humot, ug lami kaayo ang pagka-galing.',
      specs: '100% Organic Robusta & Liberica beans',
      price: 'PHP 250 matag 250g',
      quantityAvailable: '45 ka pack (250g bags)',
      farmerName: 'Zenaida A. Elbiña',
      farmerSitio: 'Sitio Fatima',
      farmerPhone: '0945-876-1234',
      icon: Coffee,
      color: 'bg-amber-100 border-amber-300 text-amber-900'
    },
    {
      id: 'prod-corn',
      name: 'Dalag ug Puti nga Mais (Cebu Yellow & White Corn)',
      cebName: 'Lab-as nga Mais alang sa Pagkaon',
      desc: 'Gitanom sa tabunok nga yuta sa Alegria nga walay kemikal nga makadaot. Tam-is ug lab-as kaayo.',
      specs: 'Bag-ong ani matag semana',
      price: 'PHP 45 matag kilo',
      quantityAvailable: '250 ka kilo',
      farmerName: 'Gracelyn P. Asendiente',
      farmerSitio: 'Sitio Lower Alegria',
      farmerPhone: '0917-345-6789',
      icon: Sprout,
      color: 'bg-yellow-100 border-yellow-300 text-yellow-900'
    },
    {
      id: 'prod-pork',
      name: 'Lab-as nga Baboy (High-Grade Live & Fresh Pork)',
      cebName: 'Produkto sa Atong Hog Raising Project',
      desc: 'Gi-atiman pag-ayo sa atong miyembro sa baboyan. Kasaligan, limpyo, ug pakan-on sa husto nga nutrisyon.',
      specs: 'LGU Supported Healthy Feeding Standard',
      price: 'PHP 230 - 250 matag kilo',
      quantityAvailable: '8 ka ulo (approx 85-90kg/head)',
      farmerName: 'BAFA Hog Raising Committee (Led by Anselna Arnado)',
      farmerSitio: 'Sitio Upper Alegria',
      farmerPhone: '0922-987-6543',
      icon: TrendingUp,
      color: 'bg-rose-100 border-rose-300 text-rose-900'
    },
    {
      id: 'prod-coconut',
      name: 'Lubi ug Kopras (Organic Coconut & Copra)',
      cebName: 'Pang-unang Tinubdan sa Atong Mag-uuma',
      desc: 'Katas sa lubi ug taas nga kalidad nga kopras para sa mantika. Direkta gikan sa mga mag-uuma sa unom ka Sitio.',
      specs: 'Premium Copra & Fresh Buko',
      price: 'PHP 20 matag buok',
      quantityAvailable: '500 ka buok',
      farmerName: 'Lorena B. Pinote',
      farmerSitio: 'Sitio Anislagan',
      farmerPhone: '0998-123-4567',
      icon: Sparkles,
      color: 'bg-emerald-100 border-emerald-300 text-emerald-900'
    }
  ];


  // Milestones Data
  const milestones = [
    {
      year: '2026',
      title: 'Hog Raising IGP Upgrade & LGU Grant',
      cebTitle: 'PHP 1 Milyon nga Kapital gikan sa LGU',
      desc: 'Nadawat sa BAFA ang pundo alang sa modernong baboyan aron matabangan ang mga miyembro nga adunay sumpay nga kita.',
      icon: Trophy
    },
    {
      year: '2025',
      title: 'Pioneer Coffee Partner Award',
      cebTitle: 'Pasidungog sa Labing Maayo nga Kape sa Probinsya',
      desc: 'Giila ang Alegria nga usa sa nag-unang tig-suplay sa lunsay nga Tuburan Coffee nga de-kalidad.',
      icon: Award
    },
    {
      year: '2024',
      title: 'Bilingual Digital Integration',
      cebTitle: 'Paglusad sa Offline-First Mobile Portal',
      desc: 'Gisugdan ang paggamit sa daling masabtan nga sistema aron ang mga lolo ug lola nga mag-uuma dali rang makasusi sa presyo ug tigom.',
      icon: ShieldCheck
    },
    {
      year: '2022',
      title: 'BAFA Official Incorporation',
      cebTitle: 'Opisyal nga Pagkatukod sa Atong Asosasyon',
      desc: 'Naghiusa ang mga mag-uuma gikan sa unom ka Sitio sa Alegria aron magtinabangay ug mapanalipdan ang presyo sa uma.',
      icon: BookOpen
    }
  ];

  return (
    <div id="guest-portal-root" className={`min-h-screen ${theme.bg} flex flex-col font-sans antialiased text-slate-800 selection:bg-[#EAF4EC]`}>
      
      {/* PUBLIC HEADER */}
      <header className="bg-white border-b-2 border-[#D5CFC1] py-3.5 sm:py-4 px-3.5 sm:px-6 shadow-sm sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 w-full sm:w-auto min-w-0">
            <div className="bg-[#1B4332] p-2 sm:p-3 rounded-2xl text-white shadow-md shrink-0">
              <Sprout className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="text-left min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-tight text-[#1B4332] uppercase font-display leading-tight break-words">
                  Alegria Farmers Association
                </h1>
                <span className="text-[10px] sm:text-xs bg-[#EAF4EC] text-[#1B4332] px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-800/20 font-black tracking-wide flex items-center gap-1.5 shrink-0 shadow-sm whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Opisyal nga Portal
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-600 font-bold mt-0.5 leading-snug break-words">
                Barangay Alegria, Tuburan, Cebu Province • Opisyal nga Public Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={onEnterLogin}
              className="w-full sm:w-auto bg-[#BF360C] hover:bg-[#8D2300] text-white font-black text-xs sm:text-sm md:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>SULOD SA PORTAL (Log In)</span>
            </button>
          </div>
        </div>
      </header>

      {/* GUEST BANNER */}
      <section className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white py-8 sm:py-12 md:py-14 px-4 sm:px-6 text-center relative overflow-hidden shadow-inner">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-500 rounded-full opacity-10 pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500 rounded-full opacity-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 relative z-10 min-w-0">
          <span className="bg-[#FFCC80] text-[#8D2300] text-[10px] sm:text-xs font-black px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full uppercase tracking-wider inline-block shadow-sm break-words max-w-full">
            Maayong Pag-abot sa Atong Asosasyon!
          </span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight font-display break-words max-w-3xl mx-auto px-2">
            Magkauban sa Pag-uma ug Pagpalambo sa Atong Yutang Natawhan
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#D8F3DC] max-w-2xl mx-auto font-medium leading-relaxed break-words px-2">
            Kini ang public portal sa Barangay Alegria Farmers Association (BAFA). 
            Gidisenyo kini aron sayon ug daling matan-aw ang atong kasaysayan, mga kalamposan, ug ang lab-as nga mga produkto.
          </p>
        </div>
      </section>

      {/* TABS NAVIGATION WITH SCROLL INDICATOR ARROWS */}
      <div className="bg-[#FAF8F5] border-b-2 border-[#D5CFC1] static md:sticky md:top-[73px] z-20 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex flex-col items-center">
          
          {/* Mobile Phone Scroll Hint Indicator */}
          <div className="flex sm:hidden items-center justify-between w-full px-2.5 py-1 text-[11px] font-black text-[#1B4332] bg-[#EAF4EC] rounded-lg mb-1.5 border border-emerald-800/20 shadow-xs">
            <span className="flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5 text-[#BF360C] animate-pulse" />
              I-scroll o i-swipe ang menu sa ubos →
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#BF360C] animate-pulse" />
          </div>

          <div className="relative w-full flex items-center">
            {/* Left Scroll Indicator Arrow */}
            <div className="hidden sm:flex absolute left-0 z-10 p-1 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5] to-transparent items-center text-[#1B4332]">
              <ChevronLeft className="w-5 h-5 text-[#BF360C] animate-bounce-x" />
            </div>

            <div className="w-full flex justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto py-1 select-none scrollbar-thin scrollbar-thumb-[#1B4332]/20 px-3 sm:px-6">
              {[
                { id: 'home', label: 'Overview / Dashboard', icon: Sparkles },
                { id: 'history', label: 'Kasaysayan (History)', icon: BookOpen },
                { id: 'achievements', label: 'Kalamposan (Achievements)', icon: Trophy },
                { id: 'products', label: 'Mga Produkto (Our Products)', icon: Coffee }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`shrink-0 min-w-max px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-xs sm:text-sm md:text-base font-black transition-all duration-200 flex items-center gap-1.5 sm:gap-2 border-b-4 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-[#1B4332] text-[#1B4332] bg-[#D8F3DC] rounded-t-xl scale-[1.01] shadow-xs'
                        : 'border-transparent text-slate-700 hover:text-[#1B4332] hover:bg-white hover:shadow-xs hover:border-[#1B4332]/40 rounded-t-xl'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#1B4332]" />
                    <span className="font-display">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Indicator Arrow */}
            <div className="hidden sm:flex absolute right-0 z-10 p-1 bg-gradient-to-l from-[#FAF8F5] via-[#FAF8F5] to-transparent items-center text-[#1B4332]">
              <ChevronRight className="w-5 h-5 text-[#BF360C] animate-bounce-x" />
            </div>
          </div>
        </div>
      </div>

      {/* CORE CONTENT SWITCHER */}
      <main className="flex-1 p-3.5 sm:p-6 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 min-w-0">
        
        {/* TAB 1: OVERVIEW & DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-left min-w-0">
            
            {/* Dynamic Statistics Grid with Hover Functions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              <div className="bg-white border-2 border-[#D5CFC1] hover:border-[#1B4332] hover:shadow-xl hover:-translate-y-1 hover:bg-[#F2F8F4] transition-all duration-300 rounded-3xl p-4 sm:p-6 flex items-center gap-4 sm:gap-5 shadow-sm min-w-0 cursor-pointer group">
                <div className="p-3 sm:p-4 rounded-2xl bg-[#EAF4EC] text-[#1B4332] shrink-0 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-wider leading-tight">Mga Rehistradong Mag-uuma</span>
                  <span className="text-2xl sm:text-3xl font-black text-[#1B4332] font-mono leading-tight block break-words">{registeredMembersCount} Miyembro</span>
                  <span className="block text-[11px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 font-bold break-words">{activeMembersCount} Aktibo sa Unom ka Sitio</span>
                </div>
              </div>

              <div className="bg-white border-2 border-[#D5CFC1] hover:border-[#1B4332] hover:shadow-xl hover:-translate-y-1 hover:bg-[#F0F7FB] transition-all duration-300 rounded-3xl p-4 sm:p-6 flex items-center gap-4 sm:gap-5 shadow-sm min-w-0 cursor-pointer group">
                <div className="p-3 sm:p-4 rounded-2xl bg-sky-100 text-sky-800 shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] sm:text-xs font-black text-slate-500 uppercase tracking-wider leading-tight">Baboyan IGP Status</span>
                  <span className="text-2xl sm:text-3xl font-black text-sky-950 font-mono leading-tight block break-words">{currentPigsCount} ka Baboy</span>
                  <span className="block text-[11px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 font-bold break-words">Live Batch karon nga tuig</span>
                </div>
              </div>

            </div>

            {/* Quick Introduction Banner */}
            <div className="bg-white border-2 border-[#D5CFC1] rounded-3xl p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-md min-w-0">
              <div className="md:col-span-8 space-y-3 sm:space-y-4 min-w-0">
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#1B4332] font-display break-words">
                  Mahitungod sa Barangay Alegria Farmers Association
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-semibold break-words">
                  Ang BAFA gilusad aron tagaan og gahum, modernong tabang, ug dugang kita ang atong mga lokal nga mag-uuma. 
                  Gikan sa atong iladong <strong className="text-[#BF360C]">Kape sa Tuburan</strong>, saging, mais, hangtod sa gisuportahan nga <strong className="text-[#1B4332]">Hog Raising Project</strong>, 
                  atong paningkamotan nga mapalambo ang agrikultura pinaagi sa kooperasyon.
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-4 pt-2">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="w-full sm:w-auto bg-[#1B4332] hover:bg-[#143326] text-white font-black text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow shrink-0"
                  >
                    <span>Basaha Atong Kasaysayan</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="w-full sm:w-auto bg-white border-2 border-[#9E9785] text-[#1B4332] hover:bg-slate-50 font-black text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0"
                  >
                    <span>Tan-awa Atong mga Produkto</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-4 bg-[#FAF8F5] border-2 border-[#D5CFC1] p-4 sm:p-6 rounded-2xl space-y-3.5 min-w-0">
                <h4 className="font-black text-[#1B4332] text-xs sm:text-sm md:text-base uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D5CFC1] pb-2 break-words">
                  <ShieldCheck className="w-5 h-5 text-[#BF360C] shrink-0" />
                  <span>Kasaligan nga Serbisyo</span>
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm font-bold text-slate-700">
                  <li className="flex items-start gap-2 break-words">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>LGU & DA Certified Registered Association</span>
                  </li>
                  <li className="flex items-start gap-2 break-words">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>100% Transparency sa Pinansyal ug Pundo</span>
                  </li>
                  <li className="flex items-start gap-2 break-words">
                    <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>Aktibong Suporta sa matag Miyembro sa Asosasyon</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Portal Switch Card */}
            <div className="bg-[#FFF8E1] border-2 border-[#FFE082] rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm min-w-0">
              <div className="space-y-1 min-w-0">
                <h4 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2 flex-wrap break-words">
                  <Milestone className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFB300] shrink-0" />
                  <span>Miyembro ka ba o Opisyal sa BAFA?</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#7D5C4F] font-semibold break-words">
                  Pindota ang butones sa tuo aron makasulod sa imong personal nga dashboard, makatala sa imong trabaho (chore log), o makasusi sa balita.
                </p>
              </div>
              <button
                onClick={onEnterLogin}
                className="w-full md:w-auto bg-[#BF360C] hover:bg-[#8D2300] text-white font-black text-xs sm:text-sm px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl cursor-pointer shadow-md shrink-0 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] whitespace-nowrap"
              >
                <span>Sulod sa Imong Account (Access Portal)</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: KASAYSAYAN (HISTORY) */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in text-left bg-white border-2 border-[#D5CFC1] p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm min-w-0">
            <div className="border-b-2 border-[#F0EBE1] pb-3.5 sm:pb-4 flex items-center gap-2.5 flex-wrap">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-[#BF360C] shrink-0" />
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#1B4332] font-display break-words">
                Kasaysayan sa Asosasyon (Our History)
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-2 min-w-0">
              <div className="lg:col-span-8 space-y-4 sm:space-y-6 text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-semibold min-w-0 break-words">
                <p>
                  Ang <strong className="text-[#1B4332]">Barangay Alegria Farmers Association (BAFA)</strong> nagsugod isip usa ka gamay nga grupo sa mga mag-uuma sa Tuburan, Cebu. 
                  Sa wala pa matukod ang opisayl nga asosasyon, ang mga mag-uuma nag-atubang ug dakong kalisod sa pagbaligya sa ilang abot tungod sa kalayo sa merkado ug sa ubos kaayo nga presyo nga gitanyag sa mga middlemen.
                </p>
                <p>
                  Tungod niini, niadtong tuig 2022, sa tabang sa atong lider nga si <strong className="text-[#1B4332]">Presidente Zenaida A. Elbiña</strong> kauban ang suporta sa Lokal nga Kagamhanan (LGU) ug Department of Agriculture (DA), 
                  ang asosasyon opisyal nga na-rehistro ug natukod. Ang panguna nga katuyoan mao ang paghiusa sa unom ka nagkalain-laing Sitio sa Alegria aron adunay usa ka tingog ug hiniusang kusog.
                </p>
                
                <div className="bg-[#FAF8F5] border-l-4 border-[#1B4332] p-4 sm:p-5 rounded-r-2xl space-y-2 min-w-0 break-words">
                  <h4 className="font-black text-[#1B4332] text-sm sm:text-base uppercase tracking-wider">Atong Misyon (Our Mission)</h4>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic">
                    "Paghatag og kasaligan, malungtaron, ug de-kalidad nga suporta sa matag mag-uuma pinaagi sa paghatag og pundo, makinarya, libreng liso, ug modernong kahibalo aron masiguro ang kauswagan sa matag pamilya sa Alegria."
                  </p>
                </div>

                <p>
                  Karon, ang BAFA nagserbisyo na sa daghang aktibong pamilya sa mag-uuma. Mapasigarbohon kami nga nakatukod og mga programa sama sa collective selling sa <strong className="text-[#BF360C]">Kape sa Tuburan</strong>, 
                  fertilizer distribution sessions, ug ang modernong <strong className="text-[#1B4332]">Hog Raising Income Generating Project (IGP)</strong> nga nakadawat og dako nga pagtagad ug grant gikan sa LGU sa Tuburan.
                </p>
              </div>

              <div className="lg:col-span-4 space-y-6 min-w-0">
                <div className="bg-[#FAF8F5] border-2 border-[#D5CFC1] p-4 sm:p-6 rounded-2xl space-y-3.5 min-w-0">
                  <h4 className="font-black text-[#1B4332] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-[#D5CFC1] pb-2 font-display break-words">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#BF360C] shrink-0" />
                    <span>Atong mga Core Values</span>
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm text-slate-700 min-w-0">
                    <div className="space-y-1 text-left min-w-0 break-words">
                      <strong className="text-[#1B4332] block font-bold">1. Pagkahiusa (Unity)</strong>
                      <p className="text-slate-600 font-medium text-xs sm:text-sm">Usa ka pamilya, usa ka tinguha para sa tanan.</p>
                    </div>
                    <div className="space-y-1 text-left min-w-0 break-words">
                      <strong className="text-[#1B4332] block font-bold">2. Kamatinud-anon (Transparency)</strong>
                      <p className="text-slate-600 font-medium font-mono text-xs sm:text-sm">Limpyo ug bukas nga pagdumala sa kwarta ug pundo.</p>
                    </div>
                    <div className="space-y-1 text-left min-w-0 break-words">
                      <strong className="text-[#1B4332] block font-bold">3. Kakugi (Diligence)</strong>
                      <p className="text-slate-600 font-medium text-xs sm:text-sm">Walay hunong nga pagpaningkamot sa yuta ug uma.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#EAF4EC] border-2 border-[#1B4332]/30 p-4 sm:p-6 rounded-2xl space-y-3.5 text-left min-w-0">
                  <h4 className="font-black text-[#1B4332] text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 border-b border-emerald-950/15 pb-2 font-display break-words">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#1B4332] shrink-0" />
                    <span>Mga Opisyales sa BAFA (2026)</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700 font-medium min-w-0">
                    {[
                      { title: 'President', name: 'Zenaida A. Elbiña' },
                      { title: 'Vice President', name: 'Anselna B. Arnado' },
                      { title: 'Secretary', name: 'Jennylyn S. Lumactao' },
                      { title: 'Asst. Secretary', name: 'Joan A. Cebas' },
                      { title: 'Treasurer', name: 'Gracelyn P. Asendiente' },
                      { title: 'Asst. Treasurer', name: 'Ana Lourdes D. Pasaylo' },
                      { title: 'Auditor', name: 'Lorena B. Pinote' },
                      { title: 'PIO 1', name: 'Ida S. Manera' },
                      { title: 'PIO 2', name: 'Rosalinda G. Bangga' }
                    ].map((officer, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-emerald-950/10 pb-1.5 gap-2 min-w-0">
                        <span className="font-extrabold text-[#1B4332] text-[11px] sm:text-xs shrink-0">{officer.title}:</span>
                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs text-right break-words min-w-0">{officer.name}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-black text-[#1B4332] text-[11px] sm:text-xs uppercase tracking-wider pt-2 border-t border-emerald-950/15 font-display break-words">
                    Board of Directors (BOD)
                  </h4>
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-1 font-semibold break-words">
                    <li>Silvestra S. Simbajon</li>
                    <li>Diosdada M. Asendiente</li>
                    <li>Mirasol E. Tan</li>
                    <li>Romalina S. Evero</li>
                    <li>Judeline G. Romero</li>
                    <li>Marvie P. Conahap</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MGA KALAMPOSAN (ACHIEVEMENTS) */}
        {activeTab === 'achievements' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-left min-w-0">
            <div className="bg-white border-2 border-[#D5CFC1] p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm space-y-3 min-w-0">
              <div className="border-b-2 border-[#F0EBE1] pb-3.5 sm:pb-4 flex items-center gap-2.5 flex-wrap">
                <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 shrink-0" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#1B4332] font-display break-words">
                  Atong mga Kalamposan (Key Milestones)
                </h3>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-slate-700 font-semibold leading-relaxed break-words">
                Kini ang listahan sa mga dagkong dungog ug kalamposan nga nakab-ot sa atong asosasyon pinaagi sa pagtinabangay sa matag miyembro, opisyales, ug lokal nga kagamhanan sa Tuburan.
              </p>
            </div>

            {/* Timeline View */}
            <div className="relative border-l-3 sm:border-l-4 border-[#1B4332] ml-3 sm:ml-8 pl-4 sm:pl-10 space-y-6 sm:space-y-8 min-w-0">
              {milestones.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="relative space-y-2 animate-slide-up bg-white p-4 sm:p-6 rounded-2xl border-2 border-[#D5CFC1] hover:border-[#1B4332] hover:shadow-lg hover:-translate-y-0.5 hover:bg-[#FAFDFB] transition-all duration-200 shadow-sm min-w-0 cursor-pointer">
                    {/* Circle badge on timeline line */}
                    <div className="absolute -left-[17px] sm:-left-[22px] top-5 sm:top-6 bg-[#1B4332] text-white p-1.5 sm:p-2 rounded-full border-2 sm:border-4 border-[#FAF7F2] shadow-md z-10 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 flex-wrap min-w-0">
                      <span className="text-base sm:text-lg font-mono font-black text-[#BF360C]">{item.year}</span>
                      <span className="bg-[#EAF4EC] text-[#1B4332] px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-black border border-[#2D6A4F]/20 font-display break-words max-w-full inline-block">
                        {item.title}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base md:text-lg font-black text-[#1B4332] font-display break-words leading-tight">
                      {item.cebTitle}
                    </h4>
                    
                    <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed break-words">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Achievements Summary Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 min-w-0">
              <div className="bg-[#EAF4EC] border-2 border-[#1B4332]/30 hover:border-[#1B4332] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl p-4 sm:p-6 space-y-2.5 min-w-0 cursor-pointer">
                <span className="bg-[#1B4332] text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider inline-block">
                  Lokal nga Pagsuporta
                </span>
                <h4 className="text-base sm:text-lg font-black text-[#1B4332] break-words">100% Secured LGU Coordination</h4>
                <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed break-words">
                  Ang tanang pundo nga nadawat sa asosasyon direkta nga narekord ug gisubay sa atong Tesorero ug Auditor para masiguro nga walay mausik. 
                  Ang LGU sa Tuburan naghatag kanato og commendation isip usa sa labing transparent ug aktibo nga farmers association sa probinsya.
                </p>
              </div>

              <div className="bg-[#FFF3E0] border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-3xl p-4 sm:p-6 space-y-2.5 min-w-0 cursor-pointer">
                <span className="bg-[#BF360C] text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-wider inline-block">
                  Komunidad ug Miyembro
                </span>
                <h4 className="text-base sm:text-lg font-black text-orange-950 break-words">Miyembro nga Adunay Sumpay nga Kita</h4>
                <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed break-words">
                  Pinaagi sa Hog Raising IGP, ang matag miyembro makadawat og bahin o dividends gikan sa halin sa baboy matag batch. 
                  Kini naghatag og sigurado ug kasaligan nga dugang kwarta nga magamit sa pamilya para sa pagpa-skwela sa mga anak o medisina sa mga senior citizen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MGA PRODUKTO (PRODUCTS) */}
        {activeTab === 'products' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in text-left min-w-0">
            <div className="bg-white border-2 border-[#D5CFC1] p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm space-y-3 min-w-0">
              <div className="border-b-2 border-[#F0EBE1] pb-3.5 sm:pb-4 flex items-center gap-2.5 flex-wrap">
                <Coffee className="w-6 h-6 sm:w-7 sm:h-7 text-amber-700 shrink-0" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#1B4332] font-display break-words">
                  Mga Produkto sa Alegria (Our Agriculture Produce)
                </h3>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-slate-700 font-semibold leading-relaxed break-words">
                Garbo sa Barangay Alegria! Ang mosunod mao ang mga pang-unang produkto nga gitanom, gibuhi, ug ginama sa mga kamot sa atong kugihan nga mga mag-uuma.
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 min-w-0">
              {(products.length > 0 ? products : defaultProductsList).map((prod: any) => {
                const Icon = prod.icon || Coffee;
                const cardColor = prod.color || 'bg-emerald-100 border-emerald-300 text-emerald-900';
                return (
                  <div key={prod.id} className="bg-white border-2 border-[#D5CFC1] hover:border-[#1B4332] hover:shadow-xl hover:-translate-y-1 hover:bg-[#F8FCF9] transition-all duration-300 rounded-3xl p-4 sm:p-6 flex flex-col justify-between min-w-0 cursor-pointer group">
                    <div className="space-y-3.5 min-w-0">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <div className={`p-2.5 sm:p-3 rounded-2xl ${cardColor} border shadow-inner shrink-0`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm sm:text-base md:text-lg font-black text-[#1B4332] font-display leading-snug break-words">{prod.name}</h4>
                          <span className="text-xs text-slate-600 font-extrabold leading-snug break-words block mt-0.5">{prod.cebName}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed break-words">
                        {prod.desc || prod.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F0EBE1] space-y-3 min-w-0">
                      {/* Quantity & Price */}
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between text-xs font-black gap-2 min-w-0">
                        <div className="space-y-0.5 min-w-0">
                          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Magamit nga Kadaghanon (Quantity):</span>
                          <span className="text-[#1B4332] font-bold text-xs break-words">{prod.quantityAvailable || prod.specs || prod.unit || 'Magamit sa tig-ani'}</span>
                        </div>
                        <div className="sm:text-right space-y-0.5 min-w-0 shrink-0">
                          <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Standard Presyo (Price):</span>
                          <span className="text-[#BF360C] font-mono font-black text-xs sm:text-sm break-words">{typeof prod.price === 'number' ? `PHP ${prod.price.toLocaleString()} / ${prod.unit}` : prod.price}</span>
                        </div>
                      </div>

                      {/* Selling Farmer Contact Details */}
                      <div className="bg-[#FAF8F5] border border-[#E2DCCE] p-3 rounded-2xl space-y-1.5 min-w-0">
                        <span className="block text-[10px] text-amber-900 uppercase font-extrabold tracking-wider break-words">
                          Nalambigit nga Mag-uuma / Nagbaligya (Selling Farmer):
                        </span>
                        <div className="text-xs font-black text-[#1B4332] flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0">
                          <span className="break-words min-w-0">{prod.farmerName || prod.contactPerson || 'Miyembro nga Mag-uuma sa BAFA'}</span>
                          {prod.farmerSitio && <span className="text-[11px] text-slate-600 font-bold shrink-0">📍 {prod.farmerSitio}</span>}
                        </div>
                        {(prod.farmerPhone || prod.contactPerson) && (
                          <div className="text-xs font-mono font-bold text-[#BF360C] pt-0.5 flex items-center gap-1 flex-wrap break-all sm:break-words">
                            <span>📞 Kontak: {prod.farmerPhone || prod.contactPerson}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Buying Note Card */}
            <div className="bg-[#EAF4EC] border-2 border-[#1B4332]/30 rounded-3xl p-5 sm:p-8 text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto min-w-0">
              <h4 className="text-base sm:text-lg md:text-xl font-black text-[#1B4332] font-display break-words">Gusto ba ka mopalit o mo-order?</h4>
              <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed break-words">
                Ang tanang halin niini direkta nga moadto sa atong mga kaubang mag-uuma sa unom ka Sitio sa Alegria, Tuburan, Cebu. 
                Aron pagpalit, palihug kontaka o bisitaha si Presidente Zenaida A. Elbiña o bisan kinsa nga Opisyales sa BAFA sa personal.
              </p>
              <div className="font-bold text-[#BF360C] text-xs sm:text-sm break-words">
                Salamat sa inyong padayong pagsuporta sa lokal nga mga mag-uuma sa Alegria!
              </div>
            </div>
          </div>
        )}

      </main>

      {/* PUBLIC FOOTER */}
      <footer className="bg-[#1B4332] border-t-2 border-[#143326] py-6 sm:py-8 px-4 sm:px-6 text-center text-xs text-[#B7E4C7] shrink-0 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-4 text-center md:text-left min-w-0">
          <div className="space-y-1 min-w-0">
            <span className="font-black block text-sm text-white break-words">Barangay Alegria Farmers Association (BAFA)</span>
            <span className="break-words">Tuburan, Cebu Province, Central Visayas, Philippines</span>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
            <span className="flex items-center gap-1.5 bg-[#143326] px-3.5 py-1.5 rounded-xl border border-emerald-600/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-black text-[10px] tracking-wider uppercase">LGU & DA REGISTERED PORTAL</span>
            </span>
            <span className="text-[10px] text-[#85947E] break-words">© 2026 BAFA • Design Optimized for Senior Citizen Accessibility</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
