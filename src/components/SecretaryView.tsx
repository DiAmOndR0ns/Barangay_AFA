import React, { useState } from 'react';
import { Member, Meeting, Resolution } from '../types';
import { 
  Users, BookOpen, FileText, Plus, Search, 
  MapPin, CheckCircle, FilePlus, Calendar, 
  Trash2, UserPlus, Info, Tag, Printer, UserCheck,
  CheckCircle2, AlertCircle, XCircle
} from 'lucide-react';
import PrintMinutesModal from './PrintMinutesModal';
import PrintAttendanceModal from './PrintAttendanceModal';
import RollCallModal from './RollCallModal';

interface SecretaryViewProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id' | 'joinedDate'>) => void;
  onUpdateMemberStatus: (id: string, status: 'Active' | 'Inactive') => void;
  onDeleteMember: (id: string) => void;
  
  meetings: Meeting[];
  onAddMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  
  resolutions: Resolution[];
  onAddResolution: (resolution: Omit<Resolution, 'id' | 'status'>) => void;
  
  isOnline: boolean;
  onOpenReportModal?: () => void;
}

export default function SecretaryView({
  members,
  onAddMember,
  onUpdateMemberStatus,
  onDeleteMember,
  meetings,
  onAddMeeting,
  onUpdateMeeting,
  resolutions,
  onAddResolution,
  isOnline,
  onOpenReportModal
}: SecretaryViewProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'meetings' | 'resolutions'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSitio, setSelectedSitio] = useState('All');
  const [selectedMeetingForPrint, setSelectedMeetingForPrint] = useState<Meeting | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  
  // Roll Call States
  const [meetingAttendanceRecord, setMeetingAttendanceRecord] = useState<Record<string, 'Present' | 'Absent' | 'Excused'>>({});
  const [rollCallMeeting, setRollCallMeeting] = useState<Meeting | null>(null);
  const [showCreateRollCall, setShowCreateRollCall] = useState(false);
  
  // Member Form State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberContact, setMemberContact] = useState('');
  const [memberSitio, setMemberSitio] = useState('Sitio Proper (Centro)');
  const [memberSize, setMemberSize] = useState('1.0');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  
  // Meeting Form State
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingLocation, setMeetingLocation] = useState('Alegria Multi-Purpose Center');
  const [meetingAttendance, setMeetingAttendance] = useState('15');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingMinutes, setMeetingMinutes] = useState('');

  // Resolution Form State
  const [showResModal, setShowResModal] = useState(false);
  const [resNumber, setResNumber] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resMovedBy, setResMovedBy] = useState('');
  const [resSecondedBy, setResSecondedBy] = useState('');
  const [resInFavor, setResInFavor] = useState('0');
  const [resAgainst, setResAgainst] = useState('0');
  const [resAbstain, setResAbstain] = useState('0');

  const SITIOS = [
    'Sitio Proper (Centro)',
    'Sitio Ylaya',
    'Sitio Fatima',
    'Sitio Mahayahay',
    'Sitio Huyong-Huyong',
    'Sitio Guimbal'
  ];

  const CROPS = [
    'Corn (Mais)',
    'Coconut (Lubi)',
    'Banana (Saging)',
    'Cacao',
    'Tuburan Coffee',
    'Vegetables (Utanon)',
    'Cassava (Kamoteng Kahoy)',
    'Hog Raising (Baboyan)',
    'Poultry Raising (Manokan)',
    'Goat Raising (Kanding)'
  ];

  const handleCropToggle = (crop: string) => {
    if (selectedCrops.includes(crop)) {
      setSelectedCrops(selectedCrops.filter(c => c !== crop));
    } else {
      setSelectedCrops([...selectedCrops, crop]);
    }
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    onAddMember({
      name: memberName,
      contactNumber: memberContact || 'None',
      farmLocation: memberSitio,
      farmSize: parseFloat(memberSize) || 1.0,
      primaryCrops: selectedCrops.length > 0 ? selectedCrops : ['Vegetables (Utanon)'],
      status: 'Active'
    });
    // Reset Form
    setMemberName('');
    setMemberContact('');
    setMemberSitio('Sitio Proper (Centro)');
    setMemberSize('1.0');
    setSelectedCrops([]);
    setShowMemberModal(false);
  };

  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim() || !meetingMinutes.trim()) return;
    
    // Use the compiled attendance count from the roll call if one was done, otherwise use input
    const finalCount = Object.keys(meetingAttendanceRecord).length > 0
      ? Object.values(meetingAttendanceRecord).filter(v => v === 'Present').length
      : parseInt(meetingAttendance) || 0;

    onAddMeeting({
      title: meetingTitle,
      date: meetingDate,
      location: meetingLocation,
      attendanceCount: finalCount,
      agenda: meetingAgenda,
      minutes: meetingMinutes,
      officerInCharge: 'Secretary (Jennylyn S Lumactao)',
      attendanceRecord: Object.keys(meetingAttendanceRecord).length > 0 ? meetingAttendanceRecord : undefined
    });
    // Reset Form
    setMeetingTitle('');
    setMeetingDate(new Date().toISOString().split('T')[0]);
    setMeetingLocation('Alegria Multi-Purpose Center');
    setMeetingAttendance('15');
    setMeetingAgenda('');
    setMeetingMinutes('');
    setMeetingAttendanceRecord({});
    setShowMeetingModal(false);
  };

  const handleResSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resNumber.trim() || !resTitle.trim() || !resDesc.trim()) return;
    onAddResolution({
      resolutionNumber: resNumber,
      title: resTitle,
      description: resDesc,
      dateAgreed: new Date().toISOString().split('T')[0],
      movedBy: resMovedBy || 'General Assembly',
      secondedBy: resSecondedBy || 'General Assembly',
      voteInFavor: parseInt(resInFavor) || 0,
      voteAgainst: parseInt(resAgainst) || 0,
      voteAbstain: parseInt(resAbstain) || 0
    });
    // Reset Form
    setResNumber('');
    setResTitle('');
    setResDesc('');
    setResMovedBy('');
    setResSecondedBy('');
    setResInFavor('0');
    setResAgainst('0');
    setResAbstain('0');
    setShowResModal(false);
  };

  // Filter Members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.primaryCrops.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSitio = selectedSitio === 'All' || member.farmLocation === selectedSitio;
    return matchesSearch && matchesSitio;
  });

  return (
    <div id="secretary-view-container" className="space-y-6">
      {/* Header and Switch Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700/65">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Secretary Administration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register members, draft resolutions, and compile meeting minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {onOpenReportModal && (
            <button
              id="secretary-report-btn"
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-850 text-emerald-400 border border-emerald-500/30 rounded-xl shadow-sm transition-all w-full sm:w-auto cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Export Secretary Report</span>
            </button>
          )}

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700/50 w-full sm:w-auto">
          <button
            id="tab-members"
            onClick={() => setActiveTab('members')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === 'members' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
          </button>
          <button
            id="tab-meetings"
            onClick={() => setActiveTab('meetings')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === 'meetings' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Meetings ({meetings.length})</span>
          </button>
          <button
            id="tab-resolutions"
            onClick={() => setActiveTab('resolutions')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === 'resolutions' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resolutions ({resolutions.length})</span>
          </button>
        </div>
      </div>
    </div>

      {/* OFFLINE STATUS TIPS */}
      {!isOnline && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Local Storage Enabled:</span> You are working in PWA Offline Mode. Newly added members, meetings, or resolutions will be stored securely on your device and queued to sync instantly once you go back online.
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div id="members-tab-content" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search members, crops, or livestock..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <select
                value={selectedSitio}
                onChange={(e) => setSelectedSitio(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Sitios</option>
                {SITIOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <button
              id="add-member-btn"
              onClick={() => setShowMemberModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Farmer</span>
            </button>
          </div>

          <div className="bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3">Farmer Name</th>
                    <th className="px-5 py-3">Sitio / Location</th>
                    <th className="px-5 py-3">Farm Area</th>
                    <th className="px-5 py-3">Crops & Livestock</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-750 text-slate-200 text-sm">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-750/30 transition-colors">
                        <td className="px-5 py-4 font-semibold text-white">
                          {member.name}
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Joined: {member.joinedDate || 'Recent'}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{member.farmLocation}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-emerald-400 font-mono font-medium">
                          {member.farmSize.toFixed(1)} ha
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {member.primaryCrops.map((crop, idx) => (
                              <span key={idx} className="bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700/60">
                                {crop}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-400 font-mono text-xs">
                          {member.contactNumber}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            id={`status-toggle-${member.id}`}
                            onClick={() => onUpdateMemberStatus(member.id, member.status === 'Active' ? 'Inactive' : 'Active')}
                            className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-all ${
                              member.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {member.status}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            id={`delete-member-${member.id}`}
                            onClick={() => onDeleteMember(member.id)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all inline-flex items-center justify-center"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        No farmers found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MEETINGS TAB */}
      {activeTab === 'meetings' && (
        <div id="meetings-tab-content" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Past Assemblies & Meetings</h3>
            <div className="flex flex-wrap gap-2.5">
              <button
                id="print-blank-attendance-btn"
                onClick={() => setShowAttendanceModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Download Attendance Sheet</span>
              </button>
              
              <button
                id="log-meeting-btn"
                onClick={() => setShowMeetingModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>Log Meeting Minutes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {meetings.map((meeting) => {
              const rec = meeting.attendanceRecord || {};
              const present = Object.values(rec).filter(v => v === 'Present').length;
              const absent = Object.values(rec).filter(v => v === 'Absent').length;
              const excused = Object.values(rec).filter(v => v === 'Excused').length;

              return (
                <div key={meeting.id} className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all shadow-md">
                  <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-slate-700/60 pb-3 mb-4">
                    <div>
                      <h4 className="text-base font-bold text-white">{meeting.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {meeting.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {meeting.location}
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {meeting.attendanceCount} Attendees present
                        </span>

                        {meeting.attendanceRecord && (
                          <div className="flex items-center gap-1.5 text-[10px] bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-750 font-sans">
                            <span className="text-slate-500 uppercase font-semibold text-[9px]">Roll Call:</span>
                            <span className="text-emerald-400 font-bold">Present: {present}</span>
                            <span className="text-slate-700">•</span>
                            <span className="text-rose-400 font-bold">Absent: {absent}</span>
                            <span className="text-slate-700">•</span>
                            <span className="text-amber-400 font-bold">Excused: {excused}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2.5 shrink-0">
                      <span className="text-xs font-mono text-slate-500 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-750">
                        Recorded: {meeting.officerInCharge}
                      </span>
                      <div className="flex gap-2 w-full">
                        <button
                          id={`roll-call-btn-${meeting.id}`}
                          onClick={() => setRollCallMeeting(meeting)}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer border border-slate-650 shadow-sm"
                          title="Record / Edit digital attendance roll call for this assembly"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{meeting.attendanceRecord ? 'Edit Roll Call' : 'Record Roll Call'}</span>
                        </button>
                        <button
                          id={`print-meeting-btn-${meeting.id}`}
                          onClick={() => setSelectedMeetingForPrint(meeting)}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm border border-emerald-500/10"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Minutes</span>
                        </button>
                      </div>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-750/70">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Meeting Agenda</h5>
                    <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{meeting.agenda}</p>
                  </div>
                  <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-750/70">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Minutes of Discussion</h5>
                    <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{meeting.minutes}</p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* RESOLUTIONS TAB */}
      {activeTab === 'resolutions' && (
        <div id="resolutions-tab-content" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Association Resolutions</h3>
            <button
              id="draft-res-btn"
              onClick={() => setShowResModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
            >
              <FilePlus className="w-4 h-4" />
              <span>Draft Resolution</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {resolutions.map((res) => (
              <div key={res.id} className="bg-slate-800 border border-slate-700/50 rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
                <div className={`absolute top-0 right-0 h-1.5 w-full ${res.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {res.resolutionNumber}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      res.status === 'Approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mt-2 leading-snug">{res.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Date Agreed: {res.dateAgreed}</p>
                  
                  <p className="text-sm text-slate-300 mt-3 bg-slate-900/40 p-3 rounded-xl leading-relaxed italic border border-slate-750">
                    "{res.description}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-750 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-slate-500">Mover / Seconder:</span>
                    <span className="text-slate-300 font-medium">Moved by {res.movedBy}</span>
                    <span className="block text-slate-400 font-normal">Seconded by {res.secondedBy}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-750 flex justify-around text-center shrink-0">
                    <div>
                      <span className="block text-[9px] text-emerald-400 font-bold uppercase">In Favor</span>
                      <span className="text-sm font-semibold text-white font-mono">{res.voteInFavor}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-700" />
                    <div>
                      <span className="block text-[9px] text-red-400 font-bold uppercase">Against</span>
                      <span className="text-sm font-semibold text-white font-mono">{res.voteAgainst}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-700" />
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Abstain</span>
                      <span className="text-sm font-semibold text-white font-mono">{res.voteAbstain}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MEMBER MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Register New Association Farmer</h3>
              <button 
                onClick={() => setShowMemberModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleMemberSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Farmer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan De la Cruz"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Farm Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 1.5"
                    value={memberSize}
                    onChange={(e) => setMemberSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0917-000-0000"
                    value={memberContact}
                    onChange={(e) => setMemberContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Sitio (Farm Location within Alegria)</label>
                <select
                  value={memberSitio}
                  onChange={(e) => setMemberSitio(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  {SITIOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  Primary Crops & Livestock Products
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-750 max-h-36 overflow-y-auto">
                  {CROPS.map((crop) => (
                    <label key={crop} className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedCrops.includes(crop)}
                        onChange={() => handleCropToggle(crop)}
                        className="rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>{crop}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEETING MINUTES MODAL */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Log Assembly / Meeting Minutes</h3>
              <button 
                onClick={() => setShowMeetingModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleMeetingSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Quick Link to Blank Attendance Printout */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-750 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <span className="font-bold text-emerald-400 block">Need a physical attendance form first?</span>
                  Generate, customize and print blank sign-in sheets or complete active member checklists.
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download / Print Form</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Meeting Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly General Assembly"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Date Held</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={meetingLocation}
                    onChange={(e) => setMeetingLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-300 uppercase">Attendance Count</label>
                    <button
                      type="button"
                      onClick={() => setShowCreateRollCall(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{Object.keys(meetingAttendanceRecord).length > 0 ? 'Update Roll Call' : 'Take Digital Roll Call'}</span>
                    </button>
                  </div>
                  
                  {Object.keys(meetingAttendanceRecord).length > 0 ? (
                    <div className="bg-slate-900 border border-emerald-500/15 p-2.5 rounded-xl flex items-center justify-between text-xs font-sans">
                      <div className="text-slate-300 flex items-center gap-1.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">
                          Roll call recorded:{' '}
                          <span className="font-bold text-emerald-400">
                            {Object.values(meetingAttendanceRecord).filter(v => v === 'Present').length} Present
                          </span>
                          {' '}({Object.values(meetingAttendanceRecord).filter(v => v === 'Absent').length} A,{' '}
                          {Object.values(meetingAttendanceRecord).filter(v => v === 'Excused').length} E)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMeetingAttendanceRecord({})}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-all cursor-pointer underline shrink-0"
                      >
                        Reset to Manual
                      </button>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      required
                      value={meetingAttendance}
                      onChange={(e) => setMeetingAttendance(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Meeting Agenda (Bulleted list)</label>
                <textarea
                  rows={3}
                  placeholder="1. Topic A&#10;2. Topic B&#10;3. Topic C"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Discussion Details & Minutes</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Record summary of what was discussed, agreed items, next action items..."
                  value={meetingMinutes}
                  onChange={(e) => setMeetingMinutes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
                >
                  Save Meeting Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {showResModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Draft New Association Resolution</h3>
              <button 
                onClick={() => setShowResModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleResSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Resolution Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAFA-2026-003"
                    value={resNumber}
                    onChange={(e) => setResNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Resolution Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Request for corn seed assistance"
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Resolution Content / Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Whereas, the members agree that..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Moved By (Proponent)</label>
                  <input
                    type="text"
                    placeholder="e.g. Nong Berting"
                    value={resMovedBy}
                    onChange={(e) => setResMovedBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Seconded By (Supporter)</label>
                  <input
                    type="text"
                    placeholder="e.g. Nang Mary"
                    value={resSecondedBy}
                    onChange={(e) => setResSecondedBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-750 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Vote Tally (General Assembly)</label>
                <div className="grid grid-cols-3 gap-3 bg-slate-900 p-3 rounded-xl border border-slate-750 text-center">
                  <div>
                    <label className="block text-[10px] text-emerald-400 font-bold uppercase mb-1">In Favor (Yes)</label>
                    <input
                      type="number"
                      min="0"
                      value={resInFavor}
                      onChange={(e) => setResInFavor(e.target.value)}
                      className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-red-400 font-bold uppercase mb-1">Against (No)</label>
                    <input
                      type="number"
                      min="0"
                      value={resAgainst}
                      onChange={(e) => setResAgainst(e.target.value)}
                      className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Abstain</label>
                    <input
                      type="number"
                      min="0"
                      value={resAbstain}
                      onChange={(e) => setResAbstain(e.target.value)}
                      className="w-full text-center px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all"
                >
                  Save Draft Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MINUTES MODAL */}
      <PrintMinutesModal 
        meeting={selectedMeetingForPrint} 
        onClose={() => setSelectedMeetingForPrint(null)} 
      />

      {/* PRINT BLANK ATTENDANCE SHEET MODAL */}
      <PrintAttendanceModal 
        isOpen={showAttendanceModal} 
        onClose={() => setShowAttendanceModal(false)} 
        members={members}
      />

      {/* DIGITAL ROLL CALL MODAL - NEW MEETING CREATION */}
      <RollCallModal
        isOpen={showCreateRollCall}
        onClose={() => setShowCreateRollCall(false)}
        meetingTitle={meetingTitle}
        members={members}
        initialRecord={meetingAttendanceRecord}
        onSave={setMeetingAttendanceRecord}
      />

      {/* DIGITAL ROLL CALL MODAL - EXISTING MEETING EDIT/UPDATE */}
      <RollCallModal
        isOpen={!!rollCallMeeting}
        onClose={() => setRollCallMeeting(null)}
        meetingTitle={rollCallMeeting?.title || ''}
        members={members}
        initialRecord={rollCallMeeting?.attendanceRecord}
        onSave={(newRecord) => {
          if (rollCallMeeting) {
            onUpdateMeeting({
              ...rollCallMeeting,
              attendanceRecord: newRecord,
              attendanceCount: Object.values(newRecord).filter(v => v === 'Present').length
            });
          }
        }}
      />
    </div>
  );
}
