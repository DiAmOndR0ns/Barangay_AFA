import { Member, Meeting, Resolution, FinancialTransaction, Announcement, SystemLog, HogRaisingState, Product, AssociationActivity } from './types';
import { buildAuditChain } from './utils/audit';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm-1',
    name: 'Roberto "Nong Berting" Caballes',
    farmLocation: 'Sitio Ylaya',
    farmSize: 2.5,
    primaryCrops: ['Corn (Mais)', 'Coconut (Lubi)', 'Tuburan Coffee'],
    contactNumber: '0917-456-7890',
    status: 'Active',
    joinedDate: '2022-03-15',
  },
  {
    id: 'm-2',
    name: 'Maria "Nang Mary" Alcoser',
    farmLocation: 'Sitio Fatima',
    farmSize: 1.8,
    primaryCrops: ['Vegetables (Utanon)', 'Banana (Saging)', 'Hog Raising (Baboyan)'],
    contactNumber: '0928-123-4567',
    status: 'Active',
    joinedDate: '2023-01-10',
  },
  {
    id: 'm-3',
    name: 'Anselna "Nang Seling" Arnado',
    farmLocation: 'Sitio Proper (Centro)',
    farmSize: 3.2,
    primaryCrops: ['Cacao', 'Coconut (Lubi)', 'Hog Raising (Baboyan)'],
    contactNumber: '0909-876-5432',
    status: 'Active',
    joinedDate: '2021-06-20',
  },
  {
    id: 'm-4',
    name: 'Gaudioso "Nong Gaudy" Mendoza',
    farmLocation: 'Sitio Mahayahay',
    farmSize: 4.0,
    primaryCrops: ['Corn (Mais)', 'Cassava (Kamoteng Kahoy)'],
    contactNumber: '0935-234-5678',
    status: 'Active',
    joinedDate: '2022-11-05',
  },
  {
    id: 'm-5',
    name: 'Florencia "Nang Flor" Ruelan',
    farmLocation: 'Sitio Huyong-Huyong',
    farmSize: 1.2,
    primaryCrops: ['Vegetables (Utanon)', 'Tuburan Coffee', 'Poultry Raising (Manokan)'],
    contactNumber: '0915-345-6789',
    status: 'Inactive',
    joinedDate: '2024-02-18',
  },
  {
    id: 'm-6',
    name: 'Zenaida "Nang Nene" Elbiña',
    farmLocation: 'Sitio Guimbal',
    farmSize: 5.5,
    primaryCrops: ['Coconut (Lubi)', 'Cacao'],
    contactNumber: '0945-876-1234',
    status: 'Active',
    joinedDate: '2020-08-12',
  }
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    title: 'June General Assembly & Fertilizer Distribution',
    date: '2026-06-14',
    location: 'Alegria Multi-Purpose Center',
    attendanceCount: 42,
    agenda: '1. Distribution of Municipal Seedlings\n2. Financial Report of Q1 2026\n3. Setup of Communal Fertilizer Depot',
    minutes: 'The meeting commenced at 9:00 AM with an opening prayer led by Nang Mary. President Zenaida welcomed the members and announced that 150 bags of organic fertilizers from the Tuburan LGU had arrived. Treasurer reported a stable general fund. Nang Seling moved a motion to establish a roster for fertilizer allocation, which was seconded by Roberto. The meeting was adjourned at 11:30 AM.',
    officerInCharge: 'Secretary (Jennylyn S Lumactao)',
  },
  {
    id: 'meet-2',
    title: 'Emergency Meeting on Typhoon Precaution',
    date: '2026-05-25',
    location: 'Alegria Barangay Hall',
    attendanceCount: 28,
    agenda: '1. Harvest timing for early maize\n2. Drainage clearing schedule\n3. Securing storage warehouse assets',
    minutes: 'Called to order at 2:00 PM due to the PAGASA gale advisory for Cebu. Members agreed on a bayanihan (bulig) schedule starting tomorrow at 6:00 AM to clear the community drainage ditches near the low-lying farmlands. Recommended that corn growers harvest matured ears immediately to prevent water logging damage.',
    officerInCharge: 'Secretary (Jennylyn S Lumactao)',
  }
];

export const INITIAL_RESOLUTIONS: Resolution[] = [
  {
    id: 'res-1',
    resolutionNumber: 'BAFA-2026-001',
    title: 'Establishment of Barangay Alegria Communal Fertilizer Depot',
    description: 'A resolution to designate a portion of the cooperative lot in Sitio Proper for storing and distributing subsidized fertilizer, and charging a maintenance fee of 10 Pesos per bag to cover the warehouse keeper\'s honorarium.',
    dateAgreed: '2026-06-14',
    movedBy: 'Anselna B Arnado',
    secondedBy: 'Roberto Caballes',
    voteInFavor: 38,
    voteAgainst: 2,
    voteAbstain: 2,
    status: 'Approved',
  },
  {
    id: 'res-2',
    resolutionNumber: 'BAFA-2026-002',
    title: 'Allocation of 15,000 PHP from General Funds for Solar Dryer Repair',
    description: 'A resolution authorizing the Treasurer to disburse the amount of Fifteen Thousand Pesos (PHP 15,000) for the replacement of damaged concrete slabs and buying UV canvas sheets for the communal solar dryer in Sitio Fatima.',
    dateAgreed: '2026-07-05',
    movedBy: 'Maria Alcoser',
    secondedBy: 'Zenaida A. Elbiña',
    voteInFavor: 31,
    voteAgainst: 4,
    voteAbstain: 0,
    status: 'Pending Approval',
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 't-1',
    type: 'income',
    category: 'Membership Dues',
    amount: 3200,
    date: '2026-06-14',
    description: 'Annual membership dues collected from 32 active members during the General Assembly.',
    recordedBy: 'Treasurer (Gracelyn P Asendiente)',
    auditedStatus: 'Audited',
    auditedBy: 'Auditor (Lorena B Pinote)',
    auditedDate: '2026-06-18',
    auditNotes: 'Matched receipts and cash-on-hand ledger perfectly. Certified correct.',
  },
  {
    id: 't-2',
    type: 'expense',
    category: 'Snacks & Materials',
    amount: 1250,
    date: '2026-06-14',
    description: 'Snacks (pan de sal and juice) and attendance log notebooks bought for the June General Assembly.',
    recordedBy: 'Treasurer (Gracelyn P Asendiente)',
    auditedStatus: 'Audited',
    auditedBy: 'Auditor (Lorena B Pinote)',
    auditedDate: '2026-06-18',
    auditNotes: 'Supported by official receipt from Alegria Bakeshop. Certified.',
  },
  {
    id: 't-3',
    type: 'income',
    category: 'Donation',
    amount: 10000,
    date: '2026-07-02',
    description: 'Cash donation from Tuburan Agriculture Office for local farmer cooperative empowerment.',
    recordedBy: 'Treasurer (Gracelyn P Asendiente)',
    auditedStatus: 'Unaudited',
  },
  {
    id: 't-4',
    type: 'expense',
    category: 'Equipment Maintenance',
    amount: 4500,
    date: '2026-07-08',
    description: 'Spare parts purchase and mechanic labor for repairing the association\'s shared grass cutter.',
    recordedBy: 'Treasurer (Gracelyn P Asendiente)',
    auditedStatus: 'Flagged',
    auditedBy: 'Auditor (Lorena B Pinote)',
    auditedDate: '2026-07-09',
    auditNotes: 'Missing secondary receipt for the labor service (PHP 1,500). Please provide acknowledgment receipt signed by the mechanic.',
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Free Cacao & Coffee Seedlings Distribution',
    category: 'Assistance',
    content: 'The Municipal Agriculture Office of Tuburan will distribute free cacao grafts and Tuburan Robusta coffee seedlings on July 18, 2026, 8:00 AM at the Barangay Alegria Hall. Active members can claim up to 30 seedlings each. Please bring your BAFA Membership ID card.',
    datePosted: '2026-07-10',
    priority: 'High',
    postedBy: 'PIO (Ida S Manera)',
  },
  {
    id: 'ann-2',
    title: 'Schedules of Communal Solar Dryer Use',
    category: 'General',
    content: 'To prevent conflict, corn and coffee growers must reserve schedules for drying. Please write your name on the booking sheet posted at the Sitio Fatima Dryer bulletin or contact the Secretary. Maximum of 3 consecutive drying days per farmer during peak harvest.',
    datePosted: '2026-07-05',
    priority: 'Medium',
    postedBy: 'PIO (Ida S Manera)',
  },
  {
    id: 'ann-3',
    title: 'Rain Shower Alert & Early Harvest Advisory',
    category: 'Weather',
    content: 'Moderate to heavy rain showers are expected this week over northwestern Cebu due to low pressure easterlies. Farmers with mature corn are advised to harvest early to maintain optimal crop moisture and prevent mold.',
    datePosted: '2026-07-11',
    priority: 'High',
    postedBy: 'PIO (Ida S Manera)',
  }
];

export const INITIAL_LOGS: SystemLog[] = buildAuditChain([
  {
    id: 'log-1',
    timestamp: '2026-07-10T09:30:00Z',
    user: 'Ida S Manera',
    role: 'PIO',
    action: 'Posted Announcement',
    details: 'Created announcement: "Free Cacao & Coffee Seedlings Distribution"',
    syncStatus: 'synced',
    hash: '',
    previousHash: ''
  },
  {
    id: 'log-2',
    timestamp: '2026-07-09T14:15:00Z',
    user: 'Lorena B Pinote',
    role: 'Auditor',
    action: 'Flagged Transaction',
    details: 'Flagged transaction t-4 (shared grass cutter repair) due to missing receipt.',
    syncStatus: 'synced',
    hash: '',
    previousHash: ''
  },
  {
    id: 'log-3',
    timestamp: '2026-07-08T11:00:00Z',
    user: 'Gracelyn P Asendiente',
    role: 'Treasurer',
    action: 'Recorded Expense',
    details: 'Logged PHP 4,500 expense for equipment maintenance (grass cutter).',
    syncStatus: 'synced',
    hash: '',
    previousHash: ''
  }
]);

export const INITIAL_HOG_RAISING: HogRaisingState = {
  capitalGrant: 1000000,
  produces: ['Hog Raising', 'Poultry Raising', 'Tilapia Breeding'],
  expenses: [
    {
      id: 'pig-exp-prev-1',
      category: 'Piglets',
      description: 'Purchased 20 piglets for 2025 batch',
      amount: 60000,
      date: '2025-10-10',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    },
    {
      id: 'pig-exp-prev-2',
      category: 'Feeds',
      description: 'Feeds for 2025 batch',
      amount: 15000,
      date: '2025-11-15',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    },
    {
      id: 'pig-exp-q1-1',
      category: 'Feeds',
      description: 'Purchased starter feeds for early 2026 cycle',
      amount: 12000,
      date: '2026-02-10',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    },
    {
      id: 'pig-exp-1',
      category: 'Piglets',
      description: 'Purchased 25 hybrid piglets (F1 high-quality breed) for fattening project',
      amount: 75000,
      date: '2026-06-15',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    },
    {
      id: 'pig-exp-2',
      category: 'Feeds',
      description: 'Bought 15 bags of Hog Starter Crumbles & booster feeds',
      amount: 24000,
      date: '2026-06-20',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    },
    {
      id: 'pig-exp-3',
      category: 'Vitamins/Medicines',
      description: 'Acquired anti-cholera vaccine vials, dewormer powders, and swine growth booster vitamins',
      amount: 8500,
      date: '2026-06-22',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    },
    {
      id: 'pig-exp-4',
      category: 'Feeds',
      description: 'Bought 10 bags of Hog Grower Pellets for the second month feeding cycle',
      amount: 18500,
      date: '2026-07-05',
      recordedBy: 'Treasurer (Gracelyn P Asendiente)'
    }
  ],
  sales: [
    {
      id: 'pig-sale-prev-1',
      date: '2025-12-20',
      hogsCount: 15,
      revenue: 210000,
      recordedBy: 'Treasurer (Gracelyn P Asendiente)',
      notes: 'Final sales for 2025 cycle. Books closed.'
    },
    {
      id: 'pig-sale-q1-1',
      date: '2026-03-18',
      hogsCount: 4,
      revenue: 65000,
      recordedBy: 'Treasurer (Gracelyn P Asendiente)',
      notes: 'Sold 4 hogs to local dealers.'
    },
    {
      id: 'pig-sale-1',
      date: '2026-07-08',
      hogsCount: 8,
      revenue: 135000,
      recordedBy: 'Treasurer (Gracelyn P Asendiente)',
      notes: 'Sold first batch of 8 mature fattened hogs to Cebu Meat Dealers. Average live weight 88kg at PHP 191/kg.'
    }
  ],
  groups: [
    {
      id: 'grp-1',
      name: 'Batch 1 (Lunes - Monday Group)',
      members: ['Roberto "Nong Berting" Caballes', 'Zenaida "Nang Nene" Elbiña'],
      scheduleDays: ['Monday']
    },
    {
      id: 'grp-2',
      name: 'Batch 2 (Miyerkules - Wednesday Group)',
      members: ['Maria "Nang Mary" Alcoser', 'Florencia "Nang Flor" Ruelan'],
      scheduleDays: ['Wednesday']
    },
    {
      id: 'grp-3',
      name: 'Batch 3 (Biyernes - Friday Group)',
      members: ['Anselna "Nang Seling" Arnado', 'Gaudioso "Nong Gaudy" Mendoza'],
      scheduleDays: ['Friday']
    }
  ],
  choreLogs: [
    {
      id: 'chore-1',
      date: '2026-07-10',
      time: '07:30 AM',
      batchName: 'Batch 1 (Lunes - Monday Group)',
      checkedBy: 'Roberto "Nong Berting" Caballes',
      activities: ['Feeding', 'Cleaning', 'Water Refill'],
      notes: 'Cleaned and disinfected the pig pens. Refilled clean water troughs and fed morning rations. All piglets are healthy and active.'
    },
    {
      id: 'chore-2',
      date: '2026-07-11',
      time: '08:00 AM',
      batchName: 'Batch 2 (Miyerkules - Wednesday Group)',
      checkedBy: 'Maria "Nang Mary" Alcoser',
      activities: ['Feeding', 'Vitamins'],
      notes: 'Administered vitamin booster powder mixed in the morning grower feeds. Pigs are growing rapidly.'
    }
  ],
  closedYears: [2025]
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Kape sa Tuburan (Tuburan Coffee)',
    cebName: 'Espesyal nga Roasted Coffee Beans',
    category: 'Processed Goods',
    description: 'Lunsay nga kape gikan sa mga bungtod sa Tuburan. Organiko, humot, ug lami kaayo ang pagka-galing.',
    unit: '250g bag',
    price: 250,
    quantityAvailable: '45 ka pack (250g bags)',
    stockStatus: 'In Stock',
    farmerName: 'Zenaida A. Elbiña',
    farmerSitio: 'Sitio Fatima',
    farmerPhone: '0945-876-1234',
    contactPerson: 'Zenaida A. Elbiña • Sitio Fatima (0945-876-1234)',
    isPublished: true,
    updatedBy: 'Treasurer (Gracelyn P Asendiente)',
    managedBy: 'Treasurer (Gracelyn P Asendiente)',
    dateUpdated: '2026-07-10'
  },
  {
    id: 'prod-2',
    name: 'Dalag ug Puti nga Mais (Cebu Corn)',
    cebName: 'Lab-as nga Mais alang sa Pagkaon ug Tuka',
    category: 'Produce',
    description: 'Gitanom sa tabunok nga yuta sa Alegria nga walay kemikal nga makadaot. Tam-is ug lab-as kaayo.',
    unit: 'matag kilo',
    price: 45,
    quantityAvailable: '250 ka kilo',
    stockStatus: 'In Stock',
    farmerName: 'Gracelyn P. Asendiente',
    farmerSitio: 'Sitio Lower Alegria',
    farmerPhone: '0917-345-6789',
    contactPerson: 'Gracelyn P. Asendiente • Sitio Lower Alegria (0917-345-6789)',
    isPublished: true,
    updatedBy: 'Treasurer (Gracelyn P Asendiente)',
    managedBy: 'Treasurer (Gracelyn P Asendiente)',
    dateUpdated: '2026-07-12'
  },
  {
    id: 'prod-3',
    name: 'Lab-as nga Baboy (High-Grade Live & Fresh Pork)',
    cebName: 'Produkto sa Atong Hog Raising IGP',
    category: 'Livestock',
    description: 'Gi-atiman pag-ayo sa atong miyembro sa baboyan. Kasaligan, limpyo, ug pakan-on sa husto nga nutrisyon.',
    unit: 'matag kilo',
    price: 240,
    quantityAvailable: '8 ka ulo (approx 85-90kg/head)',
    stockStatus: 'In Stock',
    farmerName: 'BAFA Hog Raising Committee (Led by Anselna Arnado)',
    farmerSitio: 'Sitio Upper Alegria',
    farmerPhone: '0922-987-6543',
    contactPerson: 'Anselna B. Arnado • Sitio Upper Alegria (0922-987-6543)',
    isPublished: true,
    updatedBy: 'Treasurer (Gracelyn P Asendiente)',
    managedBy: 'Treasurer (Gracelyn P Asendiente)',
    dateUpdated: '2026-07-11'
  },
  {
    id: 'prod-4',
    name: 'Lubi ug Kopras (Organic Coconut)',
    cebName: 'Pang-unang Tinubdan sa Atong Mag-uuma',
    category: 'Produce',
    description: 'Katas sa lubi ug taas nga kalidad nga kopras para sa mantika. Direkta gikan sa mga mag-uuma sa unom ka Sitio.',
    unit: 'matag buok',
    price: 20,
    quantityAvailable: '500 ka buok',
    stockStatus: 'In Stock',
    farmerName: 'Lorena B. Pinote',
    farmerSitio: 'Sitio Anislagan',
    farmerPhone: '0998-123-4567',
    contactPerson: 'Lorena B. Pinote • Sitio Anislagan (0998-123-4567)',
    isPublished: true,
    updatedBy: 'Treasurer (Gracelyn P Asendiente)',
    managedBy: 'Treasurer (Gracelyn P Asendiente)',
    dateUpdated: '2026-07-08'
  }
];

export const INITIAL_ACTIVITIES: AssociationActivity[] = [
  {
    id: 'act-1',
    title: 'Monthly Bayanihan & Community Solar Dryer Clearing',
    category: 'Community Work',
    scheduledDate: '2026-07-25',
    dateScheduled: '2026-07-25',
    scheduledTime: '07:00 AM - 11:00 AM',
    timeScheduled: '07:00 AM - 11:00 AM',
    location: 'Sitio Fatima Solar Dryer Depot',
    description: 'Hiniusa nga paglimpyo sa kanal ug pag-ayo sa atop sa solar dryer basin aron andam sa ting-ani sa mais ug kape.',
    organizer: 'PIO (Ida S Manera)',
    status: 'Scheduled',
    attendeesCount: 35
  },
  {
    id: 'act-2',
    title: 'Organiko nga Pag-atiman sa Baboy & Organic Feeding Seminar',
    category: 'Training',
    scheduledDate: '2026-08-05',
    dateScheduled: '2026-08-05',
    scheduledTime: '09:00 AM - 02:00 PM',
    timeScheduled: '09:00 AM - 02:00 PM',
    location: 'Alegria Barangay Covered Court',
    description: 'Libre nga pagbansay alang sa tanang miyembro kung unsaon paghimo og alternatibong pagkaon sa baboy gikan sa gabi ug banana stalk.',
    organizer: 'PIO (Ida S Manera)',
    status: 'Scheduled',
    attendeesCount: 50
  },
  {
    id: 'act-3',
    title: 'Quarterly General Assembly & Dividend Distribution',
    category: 'Assembly',
    scheduledDate: '2026-06-14',
    dateScheduled: '2026-06-14',
    scheduledTime: '08:30 AM - 12:00 PM',
    timeScheduled: '08:30 AM - 12:00 PM',
    location: 'Alegria Multi-Purpose Hall',
    description: 'Tinuig nga tigum para sa pinansyal nga report, pag-audit sa pundo, ug paghatag sa halin sa Hog Raising batch 1.',
    organizer: 'Secretary (Jennylyn S Lumactao)',
    status: 'Completed',
    documentedNotes: 'Matagumpay nga gitigom ang 42 ka miyembro. Gi-aprubahan ang resolution 001 ug gihatag ang report sa auditor.',
    attendeesCount: 42
  }
];


