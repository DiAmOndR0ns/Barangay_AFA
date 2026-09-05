import { Member, Meeting, Resolution, FinancialTransaction, Announcement, SystemLog, HogRaisingState, Product, AssociationActivity, User, OrganizationFund, AuditorReport, DelegationRequest } from './types';

// The 6 official officer accounts of Alegria Farmers Association (Tuburan, Cebu)
// Allows designated officers to log in securely.
export const OFFICIAL_OFFICERS: User[] = [
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
  }
];

// Clean empty collections — ready for real user input
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_MEETINGS: Meeting[] = [];
export const INITIAL_RESOLUTIONS: Resolution[] = [];
export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];
export const INITIAL_FUNDS: OrganizationFund[] = [];
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];
export const INITIAL_LOGS: SystemLog[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_ACTIVITIES: AssociationActivity[] = [];
export const INITIAL_AUDITOR_REPORTS: AuditorReport[] = [];
export const INITIAL_DELEGATIONS: DelegationRequest[] = [];

export const INITIAL_HOG_RAISING: HogRaisingState = {
  capitalGrant: 0,
  produces: ['Hog Raising'],
  expenses: [],
  sales: [],
  groups: [],
  choreLogs: [],
  closedYears: []
};
