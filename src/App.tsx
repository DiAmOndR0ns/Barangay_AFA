import React, { useState, useEffect } from 'react';
import { 
  OfficerRole, Member, Meeting, Resolution, 
  FinancialTransaction, Announcement, SyncQueueItem, SystemLog, User, HogRaisingState,
  IgpExpense, IgpSale, IgpChoreLog, Product, AssociationActivity
} from './types';
import { 
  INITIAL_MEMBERS, INITIAL_MEETINGS, INITIAL_RESOLUTIONS, 
  INITIAL_TRANSACTIONS, INITIAL_ANNOUNCEMENTS, INITIAL_LOGS, INITIAL_HOG_RAISING,
  INITIAL_PRODUCTS, INITIAL_ACTIVITIES
} from './initialData';
import OfflineIndicator from './components/OfflineIndicator';
import SecretaryView from './components/SecretaryView';
import TreasurerView from './components/TreasurerView';
import PioView from './components/PioView';
import ExecutiveView from './components/ExecutiveView';
import AnnouncementDashboard from './components/AnnouncementDashboard';
import HogRaisingIgpTracker from './components/HogRaisingIgpTracker';
import SyncQueuePanel from './components/SyncQueuePanel';
import AuthScreen from './components/AuthScreen';
import MemberDashboard from './components/MemberDashboard';
import GuestPortal from './components/GuestPortal';
import OfficerReportModal from './components/OfficerReportModal';
import ProductManagementModal from './components/ProductManagementModal';
import { buildAuditChain } from './utils/audit';
import { 
  Building, ShieldCheck, Megaphone, Users, Coins, 
  Layers, CheckCircle, AlertTriangle, HelpCircle, ArrowRight, LogOut, PiggyBank, FileText, ShoppingBag,
  ChevronLeft, ChevronRight, Download
} from 'lucide-react';

const SEED_USERS: User[] = [
  {
    id: 'user-pres',
    username: 'president',
    password: 'password123',
    name: 'Zenaida A. Elbiña',
    role: 'President',
    isApproved: true,
    joinedDate: '2024-01-01'
  },
  {
    id: 'user-vp',
    username: 'vp',
    password: 'password123',
    name: 'Anselna B Arnado',
    role: 'Vice_President',
    isApproved: true,
    joinedDate: '2024-01-01'
  },
  {
    id: 'user-sec',
    username: 'secretary',
    password: 'password123',
    name: 'Jennylyn S Lumactao',
    role: 'Secretary',
    isApproved: true,
    joinedDate: '2024-01-01'
  },
  {
    id: 'user-tres',
    username: 'treasurer',
    password: 'password123',
    name: 'Gracelyn P Asendiente',
    role: 'Treasurer',
    isApproved: true,
    joinedDate: '2024-01-01'
  },
  {
    id: 'user-aud',
    username: 'auditor',
    password: 'password123',
    name: 'Lorena B Pinote',
    role: 'Auditor',
    isApproved: true,
    joinedDate: '2024-01-01'
  },
  {
    id: 'user-pio',
    username: 'pio',
    password: 'password123',
    name: 'Ida S Manera',
    role: 'PIO',
    isApproved: true,
    joinedDate: '2024-01-01'
  },
  {
    id: 'user-m1',
    username: 'roberto',
    password: 'password123',
    name: 'Roberto "Nong Berting" Caballes',
    role: 'Member',
    isApproved: true,
    farmLocation: 'Sitio Ylaya',
    farmSize: 2.5,
    primaryCrops: ['Corn (Mais)', 'Coconut (Lubi)', 'Tuburan Coffee'],
    contactNumber: '0917-456-7890',
    joinedDate: '2022-03-15',
    status: 'Active'
  },
  {
    id: 'user-m2',
    username: 'maria',
    password: 'password123',
    name: 'Maria "Nang Mary" Alcoser',
    role: 'Member',
    isApproved: true,
    farmLocation: 'Sitio Fatima',
    farmSize: 1.8,
    primaryCrops: ['Vegetables (Utanon)', 'Banana (Saging)', 'Hog Raising (Baboyan)'],
    contactNumber: '0928-123-4567',
    joinedDate: '2023-01-10',
    status: 'Active'
  }
];

export default function App() {
  // Auth & Accounts State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [guestMode, setGuestMode] = useState<boolean>(true);

  // Connection and Sync State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Officer Role State
  const [currentRole, setCurrentRole] = useState<OfficerRole>('President');
  const [officerTab, setOfficerTab] = useState<'tasks' | 'hog-raising' | 'announcements' | 'member-view'>('tasks');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);

  // Core App Data States (hydrated from localStorage or initials)
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hogRaising, setHogRaising] = useState<HogRaisingState>(INITIAL_HOG_RAISING);
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<AssociationActivity[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Feedback State (Toasts)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  // Load Data on Mount
  useEffect(() => {
    try {
      const storedMembers = localStorage.getItem('bafa_members');
      const storedMeetings = localStorage.getItem('bafa_meetings');
      const storedResolutions = localStorage.getItem('bafa_resolutions');
      const storedTransactions = localStorage.getItem('bafa_transactions');
      const storedAnnouncements = localStorage.getItem('bafa_announcements');
      const storedHogRaising = localStorage.getItem('bafa_hog_raising');
      const storedProducts = localStorage.getItem('bafa_products');
      const storedActivities = localStorage.getItem('bafa_activities');
      const storedQueue = localStorage.getItem('bafa_sync_queue');
      const storedLogs = localStorage.getItem('bafa_logs');
      const storedUsers = localStorage.getItem('bafa_users');
      const storedCurrentUser = localStorage.getItem('bafa_current_user');

      setMembers(storedMembers ? JSON.parse(storedMembers) : INITIAL_MEMBERS);
      setMeetings(storedMeetings ? JSON.parse(storedMeetings) : INITIAL_MEETINGS);
      setResolutions(storedResolutions ? JSON.parse(storedResolutions) : INITIAL_RESOLUTIONS);
      setTransactions(storedTransactions ? JSON.parse(storedTransactions) : INITIAL_TRANSACTIONS);
      setAnnouncements(storedAnnouncements ? JSON.parse(storedAnnouncements) : INITIAL_ANNOUNCEMENTS);
      setHogRaising(storedHogRaising ? JSON.parse(storedHogRaising) : INITIAL_HOG_RAISING);
      setProducts(storedProducts ? JSON.parse(storedProducts) : INITIAL_PRODUCTS);
      setActivities(storedActivities ? JSON.parse(storedActivities) : INITIAL_ACTIVITIES);
      setSyncQueue(storedQueue ? JSON.parse(storedQueue) : []);
      
      const parsedUsers = storedUsers ? JSON.parse(storedUsers) : SEED_USERS;
      setUsers(parsedUsers);
      if (!storedUsers) {
        localStorage.setItem('bafa_users', JSON.stringify(SEED_USERS));
      }

      if (storedCurrentUser) {
        const parsedCurrentUser = JSON.parse(storedCurrentUser);
        setCurrentUser(parsedCurrentUser);
        if (parsedCurrentUser.role !== 'Member') {
          setCurrentRole(parsedCurrentUser.role as OfficerRole);
        }
      }

      const rawLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_LOGS;
      const needsChaining = rawLogs.some((l: any) => !l.hash || !l.previousHash);
      const activeLogs = needsChaining ? buildAuditChain(rawLogs) : rawLogs;
      if (needsChaining) {
        updateStorage('bafa_logs', activeLogs);
      }
      setLogs(activeLogs);
    } catch (e) {
      console.error('Error reading localStorage: ', e);
      // Fallback
      setMembers(INITIAL_MEMBERS);
      setMeetings(INITIAL_MEETINGS);
      setResolutions(INITIAL_RESOLUTIONS);
      setTransactions(INITIAL_TRANSACTIONS);
      setAnnouncements(INITIAL_ANNOUNCEMENTS);
      setHogRaising(INITIAL_HOG_RAISING);
      setSyncQueue([]);
      setLogs(INITIAL_LOGS);
      setUsers(SEED_USERS);
    }
  }, []);

  // Save changes helper
  const updateStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const showToastMessage = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const getOfficerName = (role: OfficerRole) => {
    const matchedUser = users.find(u => u.role === role);
    if (matchedUser) return matchedUser.name;

    switch (role) {
      case 'President': return 'Zenaida A. Elbiña';
      case 'Vice_President': return 'Anselna B Arnado';
      case 'Secretary': return 'Jennylyn S Lumactao';
      case 'Treasurer': return 'Gracelyn P Asendiente';
      case 'Auditor': return 'Lorena B Pinote';
      case 'PIO': return 'Ida S Manera';
      default: return 'BAFA Officer';
    }
  };

  const logAction = (action: string, details: string, syncStatus: 'synced' | 'pending' = 'synced', overrideLogs?: SystemLog[]) => {
    const rawNewLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: getOfficerName(currentRole),
      role: currentRole,
      action,
      details,
      syncStatus,
      hash: '',
      previousHash: ''
    };
    const currentLogs = overrideLogs || logs;
    const updatedLogs = buildAuditChain([rawNewLog, ...currentLogs]);
    setLogs(updatedLogs);
    updateStorage('bafa_logs', updatedLogs);
    return updatedLogs[0];
  };

  // Sync Queue handler
  const addToSyncQueue = (
    action: 'create' | 'update' | 'delete',
    entityType: 'member' | 'meeting' | 'resolution' | 'transaction' | 'announcement' | 'hog_expense' | 'hog_sale' | 'hog_chore' | 'product' | 'activity' | string,
    payload: any
  ) => {
    const queueItem: SyncQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      payload
    };
    const updatedQueue = [...syncQueue, queueItem];
    setSyncQueue(updatedQueue);
    updateStorage('bafa_sync_queue', updatedQueue);
    
    // Also record a pending log
    logAction(
      `Queued Offline: ${action.toUpperCase()} ${entityType}`,
      `Added operation to offline queue: ${action} ${entityType}. Will sync when reconnected.`,
      'pending'
    );
    showToastMessage('Saved offline! Operation queued for synchronization.', 'warning');
  };

  // Flush Queue / Synchronize
  const handleSynchronize = () => {
    if (!isOnline || syncQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    showToastMessage('Establishing secure connection... Syncing data...', 'info');

    setTimeout(() => {
      // Apply queued items to state if they weren't already applied locally
      // Note: In our offline implementation, we already applied the results locally to state
      // so that users get immediate feedback.
      // We will now mark all logs that were 'pending' as 'synced'
      const updatedLogsRaw = logs.map(l => l.syncStatus === 'pending' ? { ...l, syncStatus: 'synced' as const } : l);
      
      // Log the successful sync batch
      const syncSummary = `Synchronized ${syncQueue.length} pending offline operation(s) safely.`;
      const finalLogRaw: SystemLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: getOfficerName(currentRole),
        role: currentRole,
        action: 'System Synchronization',
        details: syncSummary,
        syncStatus: 'synced',
        hash: '',
        previousHash: ''
      };

      const finalLogs = buildAuditChain([finalLogRaw, ...updatedLogsRaw]);
      setLogs(finalLogs);
      updateStorage('bafa_logs', finalLogs);

      // Clear queue
      setSyncQueue([]);
      updateStorage('bafa_sync_queue', []);
      setIsSyncing(false);
      showToastMessage(`Sync complete! ${syncQueue.length} records pushed online successfully.`, 'success');
    }, 1600);
  };

  const handleClearQueue = () => {
    setSyncQueue([]);
    updateStorage('bafa_sync_queue', []);
    showToastMessage('Sync queue cleared. Changes remain in local view only.', 'info');
  };

  const handleRemoveQueueItem = (id: string) => {
    const updated = syncQueue.filter(item => item.id !== id);
    setSyncQueue(updated);
    updateStorage('bafa_sync_queue', updated);
    showToastMessage('Removed pending change from queue.', 'warning');
  };

  // SECRETARY ACTION HANDLERS
  const handleAddMember = (memberData: Omit<Member, 'id' | 'joinedDate'>) => {
    const newMember: Member = {
      ...memberData,
      id: `member-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    const updated = [newMember, ...members];
    setMembers(updated);
    updateStorage('bafa_members', updated);

    if (isOnline) {
      logAction('Registered Farmer', `Registered new member: ${newMember.name} from ${newMember.farmLocation}`);
      showToastMessage(`Registered ${newMember.name} successfully!`);
    } else {
      addToSyncQueue('create', 'member', newMember);
    }
  };

  const handleUpdateMemberStatus = (id: string, status: 'Active' | 'Inactive') => {
    const updated = members.map(m => m.id === id ? { ...m, status } : m);
    setMembers(updated);
    updateStorage('bafa_members', updated);
    
    const targetMember = members.find(m => m.id === id);
    const mName = targetMember ? targetMember.name : 'Unknown';

    if (isOnline) {
      logAction('Updated Farmer Status', `Changed status of ${mName} to ${status}`);
      showToastMessage(`Updated status for ${mName} to ${status}.`);
    } else {
      addToSyncQueue('update', 'member', { id, status, name: mName });
    }
  };

  const handleDeleteMember = (id: string) => {
    const targetMember = members.find(m => m.id === id);
    const mName = targetMember ? targetMember.name : 'Unknown';
    
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    updateStorage('bafa_members', updated);

    if (isOnline) {
      logAction('Deleted Farmer Registration', `Removed member registration for: ${mName}`);
      showToastMessage(`Removed ${mName} from roster.`, 'warning');
    } else {
      addToSyncQueue('delete', 'member', { id, name: mName });
    }
  };

  const handleAddMeeting = (meetingData: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
      ...meetingData,
      id: `meet-${Date.now()}`
    };
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    updateStorage('bafa_meetings', updated);

    if (isOnline) {
      logAction('Logged Assembly Minutes', `Compiled minutes for assembly: "${newMeeting.title}" with ${newMeeting.attendanceCount} present.`);
      showToastMessage(`Minutes for "${newMeeting.title}" have been compiled successfully!`);
    } else {
      addToSyncQueue('create', 'meeting', newMeeting);
    }
  };

  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
    const updated = meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
    setMeetings(updated);
    updateStorage('bafa_meetings', updated);

    if (isOnline) {
      logAction('Updated Meeting Record', `Updated details/attendance for assembly: "${updatedMeeting.title}".`);
      showToastMessage(`Meeting "${updatedMeeting.title}" has been updated.`);
    } else {
      addToSyncQueue('update', 'meeting', updatedMeeting);
    }
  };

  const handleAddResolution = (resolutionData: Omit<Resolution, 'id' | 'status'>) => {
    const newResolution: Resolution = {
      ...resolutionData,
      id: `res-${Date.now()}`,
      status: 'Pending Approval'
    };
    const updated = [newResolution, ...resolutions];
    setResolutions(updated);
    updateStorage('bafa_resolutions', updated);

    if (isOnline) {
      logAction('Drafted Association Resolution', `Drafted Resolution ${newResolution.resolutionNumber}: "${newResolution.title}"`);
      showToastMessage(`Draft Resolution ${newResolution.resolutionNumber} registered. Awaiting signature.`);
    } else {
      addToSyncQueue('create', 'resolution', newResolution);
    }
  };

  // TREASURER & AUDITOR HANDLERS
  const handleAddTransaction = (txData: Omit<FinancialTransaction, 'id' | 'auditedStatus'>) => {
    const newTx: FinancialTransaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      auditedStatus: 'Unaudited'
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    updateStorage('bafa_transactions', updated);

    if (isOnline) {
      logAction('Recorded Transaction', `Logged PHP ${newTx.amount.toLocaleString()} ${newTx.type} under "${newTx.category}"`);
      showToastMessage(`Ledger entry recorded successfully.`);
    } else {
      addToSyncQueue('create', 'transaction', newTx);
    }
  };

  const handleAuditTransaction = (id: string, status: 'Audited' | 'Flagged', notes: string) => {
    const updated = transactions.map(t => {
      if (t.id === id) {
        return {
          ...t,
          auditedStatus: status,
          auditedBy: `Auditor (${getOfficerName('Auditor')})`,
          auditedDate: new Date().toISOString().split('T')[0],
          auditNotes: notes
        };
      }
      return t;
    });
    setTransactions(updated);
    updateStorage('bafa_transactions', updated);

    const targetTx = transactions.find(t => t.id === id);
    const txDescStr = targetTx ? `PHP ${targetTx.amount} (${targetTx.category})` : 'Transaction';

    if (isOnline) {
      logAction(
        status === 'Audited' ? 'Audited & Verified' : 'Flagged Audit Discrepancy',
        `${status === 'Audited' ? 'Verified' : 'Flagged'} ledger item: ${txDescStr}. Comments: "${notes}"`
      );
      showToastMessage(`Audit submitted: marked as ${status}.`);
    } else {
      addToSyncQueue('update', 'transaction', { id, status, notes, desc: txDescStr });
    }
  };

  // HOG RAISING IGP HANDLERS
  const handleAddPigExpense = (expData: Omit<IgpExpense, 'id' | 'recordedBy'>) => {
    const newExp: IgpExpense = {
      ...expData,
      id: `pig-exp-${Date.now()}`,
      recordedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Treasurer (Rodolfo Climaco)'
    };
    const updatedState: HogRaisingState = {
      ...hogRaising,
      expenses: [newExp, ...hogRaising.expenses]
    };
    setHogRaising(updatedState);
    updateStorage('bafa_hog_raising', updatedState);

    // Also register in general ledger for complete co-op records!
    handleAddTransaction({
      type: 'expense',
      category: 'Hog Raising Project',
      amount: expData.amount,
      date: expData.date,
      description: `[Hog Raising IGP] ${expData.category}: ${expData.description}`,
      recordedBy: currentUser ? `Treasurer (${currentUser.name})` : 'Treasurer (Rodolfo Climaco)'
    });

    if (isOnline) {
      logAction('Recorded Pig Expense', `Logged PHP ${newExp.amount.toLocaleString()} piggery expense for "${newExp.category}"`);
      showToastMessage('Hog raising expense recorded and linked to general ledger.');
    } else {
      addToSyncQueue('create', 'hog_expense', newExp);
    }
  };

  const handleAddHogSale = (saleData: Omit<IgpSale, 'id' | 'recordedBy'>) => {
    const newSale: IgpSale = {
      ...saleData,
      id: `pig-sale-${Date.now()}`,
      recordedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Treasurer (Rodolfo Climaco)'
    };
    const updatedState: HogRaisingState = {
      ...hogRaising,
      sales: [newSale, ...hogRaising.sales]
    };
    setHogRaising(updatedState);
    updateStorage('bafa_hog_raising', updatedState);

    // Also register in general ledger for complete co-op records!
    handleAddTransaction({
      type: 'income',
      category: 'Hog Raising Project',
      amount: saleData.revenue,
      date: saleData.date,
      description: `[Hog Raising IGP] Sold ${saleData.hogsCount} hogs: ${saleData.notes || 'Mature hogs sold.'}`,
      recordedBy: currentUser ? `Treasurer (${currentUser.name})` : 'Treasurer (Rodolfo Climaco)'
    });

    if (isOnline) {
      logAction('Recorded Hog Sale', `Sold ${newSale.hogsCount} mature hogs for PHP ${newSale.revenue.toLocaleString()}`);
      showToastMessage(`Hog sale of PHP ${newSale.revenue.toLocaleString()} recorded and linked to general ledger.`);
    } else {
      addToSyncQueue('create', 'hog_sale', newSale);
    }
  };

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProduct,
      id: `prod-${Date.now()}`
    };
    const updated = [product, ...products];
    setProducts(updated);
    updateStorage('bafa_products', updated);

    if (isOnline) {
      logAction('Added Product', `Registered new product: "${product.name}" (PHP ${product.price}/${product.unit})`);
      showToastMessage(`Gi-dugang ang bag-ong produkto "${product.name}"!`, 'success');
    } else {
      addToSyncQueue('create', 'product', product);
    }
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const updated = products.map(p => p.id === updatedProd.id ? updatedProd : p);
    setProducts(updated);
    updateStorage('bafa_products', updated);

    if (isOnline) {
      logAction('Updated Product', `Updated product details for "${updatedProd.name}"`);
      showToastMessage(`Gi-update ang produkto "${updatedProd.name}"!`, 'success');
    } else {
      addToSyncQueue('update', 'product', updatedProd);
    }
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    updateStorage('bafa_products', updated);

    if (isOnline) {
      logAction('Deleted Product', `Removed product: "${target?.name || id}"`);
      showToastMessage('Gipapas ang produkto!', 'info');
    } else {
      addToSyncQueue('delete', 'product', { id });
    }
  };

  const handleAddActivity = (newAct: Omit<AssociationActivity, 'id'>) => {
    const activity: AssociationActivity = {
      ...newAct,
      id: `act-${Date.now()}`
    };
    const updated = [activity, ...activities];
    setActivities(updated);
    updateStorage('bafa_activities', updated);

    if (isOnline) {
      logAction('Scheduled Activity', `Created association activity: "${activity.title}" scheduled for ${activity.dateScheduled}`);
      showToastMessage(`Gipasa ang bag-ong kalihokan "${activity.title}"!`, 'success');
    } else {
      addToSyncQueue('create', 'activity', activity);
    }
  };

  const handleUpdateActivity = (updatedAct: AssociationActivity) => {
    const updated = activities.map(a => a.id === updatedAct.id ? updatedAct : a);
    setActivities(updated);
    updateStorage('bafa_activities', updated);

    if (isOnline) {
      logAction('Updated Activity', `Updated activity status/details for "${updatedAct.title}"`);
      showToastMessage(`Gi-update ang kalihokan "${updatedAct.title}"!`, 'success');
    } else {
      addToSyncQueue('update', 'activity', updatedAct);
    }
  };

  const handleDeleteActivity = (id: string) => {
    const target = activities.find(a => a.id === id);
    const updated = activities.filter(a => a.id !== id);
    setActivities(updated);
    updateStorage('bafa_activities', updated);

    if (isOnline) {
      logAction('Deleted Activity', `Removed activity: "${target?.title || id}"`);
      showToastMessage('Gipapas ang kalihokan!', 'info');
    } else {
      addToSyncQueue('delete', 'activity', { id });
    }
  };

  const handleAddPigChore = (choreData: Omit<IgpChoreLog, 'id'>) => {
    const newChore: IgpChoreLog = {
      ...choreData,
      id: `chore-${Date.now()}`
    };
    const updatedState: HogRaisingState = {
      ...hogRaising,
      choreLogs: [newChore, ...hogRaising.choreLogs]
    };
    setHogRaising(updatedState);
    updateStorage('bafa_hog_raising', updatedState);

    if (isOnline) {
      logAction('Logged Pig Chore', `${newChore.checkedBy} checked-in: ${newChore.activities.join(', ')}`);
      showToastMessage('Daily pig care activity has been recorded successfully!');
    } else {
      addToSyncQueue('create', 'hog_chore', newChore);
    }
  };

  const handleUpdateCapitalGrant = (amount: number) => {
    const updatedState: HogRaisingState = {
      ...hogRaising,
      capitalGrant: amount
    };
    setHogRaising(updatedState);
    updateStorage('bafa_hog_raising', updatedState);

    if (isOnline) {
      logAction('Updated Capital Grant', `Modified Hog Raising IGP LGU capital grant to PHP ${amount.toLocaleString()}`);
      showToastMessage(`Successfully updated LGU Capital Grant to PHP ${amount.toLocaleString()}!`, 'success');
    } else {
      addToSyncQueue('update', 'hog_expense', { id: 'capital-grant', amount });
    }
  };

  const handleAddProduce = (produceName: string) => {
    const updatedState: HogRaisingState = {
      ...hogRaising,
      produces: Array.from(new Set([...(hogRaising.produces || ['Hog Raising', 'Poultry Raising', 'Tilapia Breeding']), produceName]))
    };
    setHogRaising(updatedState);
    updateStorage('bafa_hog_raising', updatedState);

    if (isOnline) {
      logAction('Added Dynamic IGP Produce', `Added new dynamic produce project: "${produceName}"`);
      showToastMessage(`Successfully added dynamic IGP project: "${produceName}"`, 'success');
    }
  };

  const handleCloseDecemberBook = (year: number) => {
    const closedList = hogRaising.closedYears || [2025];
    if (closedList.includes(year)) return;
    const updatedState: HogRaisingState = {
      ...hogRaising,
      closedYears: [...closedList, year]
    };
    setHogRaising(updatedState);
    updateStorage('bafa_hog_raising', updatedState);

    if (isOnline) {
      logAction('Closed Financial Book', `Officially closed and sealed the Hog Raising IGP financial book for December ${year}.`);
      showToastMessage(`Successfully closed and locked the financial books for ${year}!`, 'success');
    } else {
      addToSyncQueue('update', 'hog_expense', { id: `close-book-${year}`, year });
    }
  };

  // PIO ACTION HANDLERS
  const handleAddAnnouncement = (annData: Omit<Announcement, 'id' | 'datePosted'>) => {
    const newAnn: Announcement = {
      ...annData,
      id: `ann-${Date.now()}`,
      datePosted: new Date().toISOString().split('T')[0]
    };
    const updated = [newAnn, ...announcements];
    setAnnouncements(updated);
    updateStorage('bafa_announcements', updated);

    if (isOnline) {
      logAction('Posted Announcement', `Published notice: "${newAnn.title}" under ${newAnn.category}`);
      showToastMessage(`Notice published to public board.`);
    } else {
      addToSyncQueue('create', 'announcement', newAnn);
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    const targetAnn = announcements.find(a => a.id === id);
    const titleStr = targetAnn ? targetAnn.title : 'Notice';

    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    updateStorage('bafa_announcements', updated);

    if (isOnline) {
      logAction('Deleted Announcement', `Removed board publication: "${titleStr}"`);
      showToastMessage(`Announcement removed from board.`, 'warning');
    } else {
      addToSyncQueue('delete', 'announcement', { id, title: titleStr });
    }
  };

  // EXECUTIVE ACTION HANDLERS (PRESIDENT / VP)
  const handleApproveResolution = (id: string) => {
    const updated = resolutions.map(r => r.id === id ? { ...r, status: 'Approved' as const } : r);
    setResolutions(updated);
    updateStorage('bafa_resolutions', updated);

    const targetRes = resolutions.find(r => r.id === id);
    const resNo = targetRes ? targetRes.resolutionNumber : 'Resolution';

    if (isOnline) {
      logAction('Signed & Approved Resolution', `Officially approved Resolution ${resNo}: "${targetRes?.title}"`);
      showToastMessage(`Resolution ${resNo} has been signed and enacted!`, 'success');
    } else {
      addToSyncQueue('update', 'resolution', { id, status: 'Approved', resNo });
    }
  };

  // USER AUTHENTICATION & MANAGEMENT ACTIONS
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    updateStorage('bafa_current_user', user);
    if (user.role !== 'Member') {
      setCurrentRole(user.role as OfficerRole);
    }
    showToastMessage(`Maayong adlaw, ${user.name}! Successful login.`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      logAction('Logged Out', `${currentUser.name} signed out of the system.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('bafa_current_user');
    setGuestMode(true);
    showToastMessage('You have been signed out successfully.', 'info');
  };

  const handleRegister = (userData: Omit<User, 'id' | 'isApproved'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      isApproved: false,
      joinedDate: new Date().toISOString().split('T')[0]
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    updateStorage('bafa_users', updated);
    
    showToastMessage('Sign-up request received! Awaiting President/Admin approval.', 'warning');
  };

  const handleRequestPasswordReset = (username: string) => {
    const matchedUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!matchedUser) {
      showToastMessage('Wala makit-i ang username (Username not found).', 'error');
      return;
    }
    const updated = users.map(u => u.id === matchedUser.id ? { ...u, resetRequested: true } : u);
    setUsers(updated);
    updateStorage('bafa_users', updated);
    
    // Add simple system log
    logAction('Requested Reset', `Requested password reset for ${matchedUser.name} (${matchedUser.username})`);
    showToastMessage(`Ang hangyo sa pag-reset sa password para kang ${matchedUser.name} napadala na sa Presidente!`, 'success');
  };

  const handleResetPassword = (userId: string, newPass: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    const updated = users.map(u => u.id === userId ? { ...u, password: newPass, resetRequested: false } : u);
    setUsers(updated);
    updateStorage('bafa_users', updated);
    
    // Add simple system log
    logAction('Reset Password', `Updated password credentials for ${targetUser.name} (${targetUser.role})`);
    showToastMessage(`Malampusong na-reset ang password ni ${targetUser.name}!`, 'success');
  };

  const handleApproveUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    const updated = users.map(u => u.id === id ? { ...u, isApproved: true } : u);
    setUsers(updated);
    updateStorage('bafa_users', updated);

    // If they are a registered farmer member, enroll them into the primary members list too!
    if (targetUser.role === 'Member') {
      const alreadyInRoster = members.some(m => m.id === id || m.name.toLowerCase() === targetUser.name.toLowerCase());
      if (!alreadyInRoster) {
        const newMember: Member = {
          id: targetUser.id,
          name: targetUser.name,
          farmLocation: targetUser.farmLocation || 'Sitio Proper (Centro)',
          farmSize: targetUser.farmSize || 1.2,
          primaryCrops: targetUser.primaryCrops || ['Crops'],
          contactNumber: targetUser.contactNumber || '',
          status: 'Active',
          joinedDate: targetUser.joinedDate || new Date().toISOString().split('T')[0]
        };
        const updatedMembers = [newMember, ...members];
        setMembers(updatedMembers);
        updateStorage('bafa_members', updatedMembers);
      }
    }

    logAction('Approved Registration', `Approved portal registration for ${targetUser.name} (${targetUser.role})`);
    showToastMessage(`Approved registration for ${targetUser.name}!`, 'success');
  };

  const handleDeclineUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    updateStorage('bafa_users', updated);

    logAction('Declined Registration', `Declined portal registration for ${targetUser.name} (${targetUser.role})`);
    showToastMessage(`Declined registration for ${targetUser.name}.`, 'warning');
  };

  const handleDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    updateStorage('bafa_users', updatedUsers);

    // Also remove from members roster if they are a member
    const updatedMembers = members.filter(m => m.id !== id);
    setMembers(updatedMembers);
    updateStorage('bafa_members', updatedMembers);

    logAction('Revoked Access', `Revoked portal access for ${targetUser.name}`);
    showToastMessage(`Revoked access for ${targetUser.name}.`, 'warning');
  };

  const handleUpdateProfile = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    updateStorage('bafa_users', updatedUsers);

    setCurrentUser(updatedUser);
    updateStorage('bafa_current_user', updatedUser);

    // Sync member list details if they are a member
    if (updatedUser.role === 'Member') {
      const updatedMembers = members.map(m => m.id === updatedUser.id ? {
        ...m,
        name: updatedUser.name,
        farmLocation: updatedUser.farmLocation || m.farmLocation,
        farmSize: updatedUser.farmSize || m.farmSize,
        primaryCrops: updatedUser.primaryCrops || m.primaryCrops,
        contactNumber: updatedUser.contactNumber || m.contactNumber,
        avatarUrl: updatedUser.avatarUrl
      } : m);
      setMembers(updatedMembers);
      updateStorage('bafa_members', updatedMembers);
    }

    logAction('Updated Profile', `${updatedUser.name} modified their profile details`);
    showToastMessage('Profile details updated successfully!', 'success');
  };

  const handlePresidentTurnover = (
    newPresidentId: string,
    electionDate: string,
    turnoverNotes: string,
    outgoingNewRole: 'Member' | 'Vice_President' | 'Secretary' | 'Treasurer' | 'Auditor' | 'PIO' | 'None'
  ) => {
    const currentPresident = users.find(u => u.role === 'President');
    if (!currentPresident) {
      showToastMessage('Error: No active President found in the system.', 'error');
      return;
    }

    const newPresidentUser = users.find(u => u.id === newPresidentId);
    if (!newPresidentUser) {
      showToastMessage('Error: Selected new President user not found.', 'error');
      return;
    }

    const updatedUsers = users.map(user => {
      if (user.role === 'President') {
        return { 
          ...user, 
          role: (outgoingNewRole === 'None' ? 'Member' : outgoingNewRole) as any 
        };
      }
      if (user.id === newPresidentId) {
        return { ...user, role: 'President' as const };
      }
      return user;
    });

    setUsers(updatedUsers);
    updateStorage('bafa_users', updatedUsers);

    let updatedCurrentUser = currentUser;
    if (currentUser) {
      if (currentUser.role === 'President') {
        updatedCurrentUser = {
          ...currentUser,
          role: (outgoingNewRole === 'None' ? 'Member' : outgoingNewRole) as any
        };
        setCurrentRole(outgoingNewRole === 'None' ? 'Member' as any : outgoingNewRole as any);
      } else if (currentUser.id === newPresidentId) {
        updatedCurrentUser = {
          ...currentUser,
          role: 'President'
        };
        setCurrentRole('President');
      }
      setCurrentUser(updatedCurrentUser);
      updateStorage('bafa_current_user', updatedCurrentUser);
    }

    const turnoverDetails = `FORMAL OFFICERS TURNOVER: Following the election on ${electionDate}, ${currentPresident.name} has formally turned over the presidency and all BAFA files, keys, and assets to the newly-elected President, ${newPresidentUser.name}. Memo/Notes: ${turnoverNotes}`;
    
    logAction('Presidential Turnover', turnoverDetails);
    showToastMessage(`Turnover completed! The new President is ${newPresidentUser.name}!`, 'success');
  };

  const handleDownloadSystemBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      exportedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Guest / System',
      association: 'Alegria Farmers Association (Tuburan, Cebu)',
      version: '1.0.0',
      data: {
        users,
        members,
        meetings,
        resolutions,
        transactions,
        announcements,
        hogRaising,
        products,
        activities,
        logs,
        syncQueue
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `BAFA_System_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToastMessage('System Backup downloaded successfully as a formatted JSON file!', 'success');
  };

  if (!currentUser) {
    if (guestMode) {
      return (
        <GuestPortal 
          onEnterLogin={() => setGuestMode(false)}
          members={members}
          hogRaising={hogRaising}
          products={products}
        />
      );
    }

    return (
      <div id="auth-screen-wrapper" className="min-h-screen bg-[#FAF8F5]">
        <AuthScreen 
          users={users}
          onLogin={handleLogin}
          onRegister={handleRegister}
          toast={showToastMessage}
          onRequestPasswordReset={handleRequestPasswordReset}
          onBackToGuest={() => setGuestMode(true)}
        />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-2xl border-2 text-sm font-extrabold max-w-sm ${
              toast.type === 'success' 
                ? 'bg-[#1B4332] text-[#D8F3DC] border-[#2D6A4F]' 
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-600'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-600'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}>
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentUser.role === 'Member') {
    return (
      <div id="member-screen-wrapper" className="min-h-screen bg-[#FAF8F5]">
        <MemberDashboard 
          currentUser={currentUser}
          onUpdateProfile={handleUpdateProfile}
          onLogout={handleLogout}
          toast={showToastMessage}
          announcements={announcements}
          hogRaisingState={hogRaising}
          members={members}
          onAddChoreLog={handleAddPigChore}
          products={products}
          activities={activities}
        />
        {toast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className={`flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-2xl border-2 text-sm font-extrabold max-w-sm ${
              toast.type === 'success' 
                ? 'bg-[#1B4332] text-[#D8F3DC] border-[#2D6A4F]' 
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-amber-600'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-600'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}>
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="application-root" className="min-h-screen bg-[#F5F2EB] text-slate-900 flex flex-col font-sans">
      
      {/* GLOBAL TOAST NOTIFICATION BANNER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div className={`flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-2xl border-2 text-sm font-extrabold max-w-sm ${
            toast.type === 'success' 
              ? 'bg-[#1B4332] text-[#D8F3DC] border-[#2D6A4F]' 
              : toast.type === 'warning'
              ? 'bg-amber-900 text-amber-100 border-amber-600'
              : toast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-600'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* TOP HEADER NAVIGATION AND IDENTIFIER */}
      <header className="bg-[#1B4332] border-b-2 border-[#122E22] py-4 px-6 shrink-0 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#D8F3DC] p-2.5 rounded-2xl shadow-inner text-[#1B4332]">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white uppercase font-display">Alegria Farmers Association</h1>
                <span className="text-[10px] bg-[#2D6A4F] text-[#D8F3DC] px-2.5 py-0.5 rounded-full border border-[#40916C] font-black font-mono">
                  Barangay Portal
                </span>
              </div>
              <p className="text-xs text-[#D8F3DC]/80 mt-0.5 font-medium">Tuburan, Cebu Province • Official Officer Administration Suite</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 w-full lg:w-auto max-w-full">
            {/* Active session bar */}
            <div className="flex items-center gap-2.5 bg-[#081C15]/60 px-3 py-1.5 rounded-2xl border border-[#2D6A4F] shrink-0">
              <div className="w-7 h-7 rounded-xl bg-[#D8F3DC] text-[#1B4332] font-mono font-black flex items-center justify-center text-xs shrink-0 uppercase shadow-xs">
                {currentUser?.name.substring(0, 2)}
              </div>
              <div className="text-left min-w-0">
                <span className="block text-xs font-black text-white truncate max-w-[120px]">{currentUser?.name}</span>
                <span className="block text-[9px] text-[#D8F3DC] font-mono font-black uppercase tracking-wider truncate">
                  Role: {currentUser?.role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-rose-900/50 hover:text-rose-200 rounded-xl text-slate-300 cursor-pointer transition-colors border border-transparent hover:border-rose-400/30 shrink-0"
                title="Sign out of administration suite"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Download System Backup Button */}
            <button
              id="header-download-backup-btn"
              type="button"
              onClick={handleDownloadSystemBackup}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D8F3DC] hover:bg-[#b7e4c7] text-[#1B4332] border border-[#2D6A4F] rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title="Download formatted JSON backup of all local association data"
            >
              <Download className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>Download System Backup</span>
            </button>

            {/* Export Officer Reports Button */}
            <button
              id="header-export-reports-btn"
              type="button"
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D8F3DC] hover:bg-[#b7e4c7] text-[#1B4332] border border-[#2D6A4F] rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title="Open Official Officer Reports & Export Center"
            >
              <FileText className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>Officer Reports & Export</span>
            </button>

            {/* Manage Association Products Button */}
            <button
              id="header-manage-products-btn"
              type="button"
              onClick={() => setShowProductModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FFE0B2] hover:bg-[#FFD180] text-[#8C3B00] border border-[#FFB74D] rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm whitespace-nowrap"
              title="Manage Association Products & Catalog"
            >
              <ShoppingBag className="w-4 h-4 text-[#8C3B00] shrink-0" />
              <span>Products Catalog</span>
            </button>

            {/* Offline Switch & Sync Trigger */}
            <OfflineIndicator 
              isOnline={isOnline}
              queueCount={syncQueue.length}
              onSync={handleSynchronize}
              isSyncing={isSyncing}
            />
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT BODY */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* OFFICER MAIN VIEWS TAB BAR WITH SCROLL INDICATOR ARROWS */}
          <div className="bg-white border-2 border-[#D5CFC1] rounded-2xl p-2.5 no-print space-y-1.5 shadow-sm">
            {/* Mobile Phone Scroll Hint Indicator */}
            <div className="flex sm:hidden items-center justify-between w-full px-2.5 py-1 text-[11px] font-black text-[#1B4332] bg-[#EAF4EC] rounded-lg border border-[#2D6A4F]/30">
              <span className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                Scroll / swipe menu to view all options →
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
            </div>

            <div className="relative w-full flex items-center">
              {/* Left Arrow Indicator */}
              <div className="hidden sm:flex absolute left-0 z-10 p-1 bg-gradient-to-r from-white via-white to-transparent items-center text-amber-700">
                <ChevronLeft className="w-5 h-5 animate-bounce-x" />
              </div>

              <div className="w-full flex justify-start gap-1.5 overflow-x-auto py-1 select-none scrollbar-thin scrollbar-thumb-emerald-600/30 px-2 sm:px-5">
                <button
                  id="officer-tasks-tab-btn"
                  onClick={() => setOfficerTab('tasks')}
                  className={`shrink-0 min-w-max px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-b-4 cursor-pointer whitespace-nowrap rounded-t-xl ${
                    officerTab === 'tasks'
                      ? 'border-[#1B4332] text-[#1B4332] bg-[#EAF4EC]'
                      : 'border-transparent text-slate-700 hover:text-[#1B4332] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <Building className="w-4 h-4 text-[#1B4332]" />
                  <span>Officer Task Panel</span>
                </button>

                <button
                  id="officer-hog-raising-tab-btn"
                  onClick={() => setOfficerTab('hog-raising')}
                  className={`shrink-0 min-w-max px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-b-4 cursor-pointer whitespace-nowrap rounded-t-xl ${
                    officerTab === 'hog-raising'
                      ? 'border-[#1B4332] text-[#1B4332] bg-[#EAF4EC]'
                      : 'border-transparent text-slate-700 hover:text-[#1B4332] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <PiggyBank className="w-4 h-4 text-[#1B4332]" />
                  <span>Hog Raising IGP Portal</span>
                  <span className="bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20 text-[9px] px-2 py-0.5 rounded-full font-black ml-1">
                    Active
                  </span>
                </button>

                <button
                  id="officer-announcements-tab-btn"
                  onClick={() => setOfficerTab('announcements')}
                  className={`shrink-0 min-w-max px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-b-4 cursor-pointer whitespace-nowrap rounded-t-xl relative ${
                    officerTab === 'announcements'
                      ? 'border-[#1B4332] text-[#1B4332] bg-[#EAF4EC]'
                      : 'border-transparent text-slate-700 hover:text-[#1B4332] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-[#1B4332]" />
                  <span>All Bulletins & Announcements Board</span>
                  <span className="bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20 text-[9px] px-2 py-0.5 rounded-full font-black ml-1">
                    Dashboard
                  </span>
                </button>

                <button
                  id="officer-member-view-tab-btn"
                  onClick={() => setOfficerTab('member-view')}
                  className={`shrink-0 min-w-max px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border-b-4 cursor-pointer whitespace-nowrap rounded-t-xl relative ${
                    officerTab === 'member-view'
                      ? 'border-amber-600 text-amber-900 bg-amber-50'
                      : 'border-transparent text-slate-700 hover:text-amber-900 hover:bg-amber-50/50'
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-700" />
                  <span>Akong Member View (My Member Dashboard & ID)</span>
                  <span className="bg-amber-200 text-amber-900 border border-amber-300 text-[9px] px-2 py-0.5 rounded-full font-black ml-1">
                    Officer as Member
                  </span>
                </button>
              </div>

              {/* Right Arrow Indicator */}
              <div className="hidden sm:flex absolute right-0 z-10 p-1 bg-gradient-to-l from-white via-white to-transparent items-center text-amber-700">
                <ChevronRight className="w-5 h-5 animate-bounce-x" />
              </div>
            </div>
          </div>

          {officerTab === 'tasks' && (
            /* ACTIVE VIEW WRAPPER */
            <div id="officer-dashboard-window" className="bg-white border-2 border-[#D5CFC1] p-5 sm:p-6 rounded-3xl shadow-sm text-slate-900">
            
            {/* President & Vice President View */}
            {(currentRole === 'President' || currentRole === 'Vice_President') && (
              <ExecutiveView 
                members={members}
                meetings={meetings}
                resolutions={resolutions}
                onApproveResolution={handleApproveResolution}
                transactions={transactions}
                logs={logs}
                currentRole={currentRole}
                onUpdateLogs={(newLogs) => {
                  setLogs(newLogs);
                  updateStorage('bafa_logs', newLogs);
                }}
                users={users}
                onApproveUser={handleApproveUser}
                onDeclineUser={handleDeclineUser}
                onDeleteUser={handleDeleteUser}
                onResetPassword={handleResetPassword}
                onPresidentTurnover={handlePresidentTurnover}
                onOpenReportModal={() => setShowReportModal(true)}
                onDownloadBackup={handleDownloadSystemBackup}
              />
            )}

            {/* Secretary View */}
            {currentRole === 'Secretary' && (
              <SecretaryView 
                members={members}
                onAddMember={handleAddMember}
                onUpdateMemberStatus={handleUpdateMemberStatus}
                onDeleteMember={handleDeleteMember}
                meetings={meetings}
                onAddMeeting={handleAddMeeting}
                onUpdateMeeting={handleUpdateMeeting}
                resolutions={resolutions}
                onAddResolution={handleAddResolution}
                isOnline={isOnline}
                onOpenReportModal={() => setShowReportModal(true)}
              />
            )}

            {/* Treasurer & Auditor View */}
            {(currentRole === 'Treasurer' || currentRole === 'Auditor') && (
              <TreasurerView 
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onAuditTransaction={handleAuditTransaction}
                currentRole={currentRole}
                onOpenReportModal={() => setShowReportModal(true)}
              />
            )}

            {/* PIO View */}
            {currentRole === 'PIO' && (
              <PioView 
                announcements={announcements}
                activities={activities}
                onAddAnnouncement={handleAddAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                onAddActivity={handleAddActivity}
                onUpdateActivity={handleUpdateActivity}
                onDeleteActivity={handleDeleteActivity}
                onOpenReportModal={() => setShowReportModal(true)}
              />
            )}

          </div>
          )}

          {officerTab === 'hog-raising' && (
            <div id="officer-hog-raising-window" className="bg-white border-2 border-[#D5CFC1] p-5 sm:p-6 rounded-3xl shadow-sm text-slate-900 text-left">
              <HogRaisingIgpTracker 
                state={hogRaising}
                members={members}
                onAddExpense={handleAddPigExpense}
                onAddSale={handleAddHogSale}
                onAddChoreLog={handleAddPigChore}
                onUpdateCapitalGrant={handleUpdateCapitalGrant}
                onAddProduce={handleAddProduce}
                isTreasurerOrOfficer={currentRole === 'Treasurer' || currentRole === 'Auditor' || currentRole === 'President'}
                currentUser={currentUser!}
                isOfficerMode={true}
                closedYears={hogRaising.closedYears || [2025]}
                onCloseDecemberBook={handleCloseDecemberBook}
              />
            </div>
          )}

          {officerTab === 'announcements' && (
            <div id="officer-announcements-window" className="bg-white border-2 border-[#D5CFC1] p-5 sm:p-6 rounded-3xl shadow-sm text-slate-900">
              <AnnouncementDashboard 
                announcements={announcements}
                isOfficerMode={true}
              />
            </div>
          )}

          {officerTab === 'member-view' && (
            <div id="officer-member-view-window" className="bg-[#FAF8F5] text-slate-900 border border-[#D5CFC1] p-4 sm:p-6 rounded-3xl shadow-xl space-y-4">
              <div className="bg-[#EAF4EC] border-2 border-[#1B4332]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#1B4332] text-white rounded-xl shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#1B4332]">Akong Member Dashboard & ID (Officer as Member)</h2>
                    <p className="text-xs text-slate-600 font-bold">
                      Gipakita ang inyong opisyal nga profile, Digital Member ID, ug pribilehiyo isip miyembro sa BAFA ({currentUser?.role.replace('_', ' ')}).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOfficerTab('tasks')}
                  className="px-4 py-2 bg-[#1B4332] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Building className="w-4 h-4" />
                  <span>Bumalik sa Officer Suite</span>
                </button>
              </div>

              <MemberDashboard 
                currentUser={currentUser!}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
                toast={showToastMessage}
                announcements={announcements}
                hogRaisingState={hogRaising}
                members={members}
                onAddChoreLog={handleAddPigChore}
                products={products}
                activities={activities}
              />
            </div>
          )}

          {/* OFFLINE SYNC QUEUE MANAGEMENT SCREEN (Always available to monitor) */}
          <div id="sync-queue-panel-window">
            <SyncQueuePanel 
              queue={syncQueue}
              isOnline={isOnline}
              onSync={handleSynchronize}
              isSyncing={isSyncing}
              onClearQueue={handleClearQueue}
              onRemoveItem={handleRemoveQueueItem}
              onDownloadBackup={handleDownloadSystemBackup}
            />
          </div>

        </div>
      </main>

      {/* LOWER FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>© 2026 Barangay Alegria Farmers Association (BAFA) • Tuburan, Cebu</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Offline-First Progressive Web App (PWA) Standard Certified
          </span>
        </div>
      </footer>

      {/* OFFICER REPORT & EXPORT MODAL */}
      {showReportModal && (
        <OfficerReportModal 
          currentRole={currentRole}
          members={members}
          meetings={meetings}
          resolutions={resolutions}
          transactions={transactions}
          announcements={announcements}
          logs={logs}
          hogRaising={hogRaising}
          onClose={() => setShowReportModal(false)}
          onDownloadBackup={handleDownloadSystemBackup}
        />
      )}

      {/* PRODUCT MANAGEMENT MODAL */}
      {showProductModal && (
        <ProductManagementModal 
          products={products}
          currentRole={currentRole}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onClose={() => setShowProductModal(false)}
        />
      )}


    </div>
  );
}
