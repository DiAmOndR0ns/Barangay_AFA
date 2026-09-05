// src/api/db.ts
import pg from "pg";

// src/utils/audit.ts
function sha256(ascii) {
  function rightRotate(value, amount) {
    return value >>> amount | value << 32 - amount;
  }
  const lengthProperty = "length";
  let i, j;
  const words = [];
  const asciiLength = ascii[lengthProperty];
  const hash = [
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ];
  const k = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ];
  const wordsLength = (asciiLength + 8 >> 6) + 1 << 4;
  for (i = 0; i < wordsLength; i++) {
    words[i] = 0;
  }
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << 24 - i % 4 * 8;
  }
  words[asciiLength >> 2] |= 128 << 24 - asciiLength % 4 * 8;
  words[wordsLength - 1] = asciiLength * 8;
  for (j = 0; j < wordsLength; j += 16) {
    const w = [];
    for (i = 0; i < 16; i++) {
      w[i] = words[j + i];
    }
    for (i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ w[i - 15] >>> 3;
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ w[i - 2] >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 | 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = e & f ^ ~e & g;
      const temp1 = h + S1 + ch + k[i] + w[i] | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = S0 + maj | 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 | 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 | 0;
    }
    hash[0] = hash[0] + a | 0;
    hash[1] = hash[1] + b | 0;
    hash[2] = hash[2] + c | 0;
    hash[3] = hash[3] + d | 0;
    hash[4] = hash[4] + e | 0;
    hash[5] = hash[5] + f | 0;
    hash[6] = hash[6] + g | 0;
    hash[7] = hash[7] + h | 0;
  }
  let hex = "";
  for (i = 0; i < 8; i++) {
    const word = hash[i];
    for (j = 0; j < 4; j++) {
      const byte = word >>> 24 - j * 8 & 255;
      hex += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return hex;
}
function calculateLogHash(log, previousHash) {
  const contentString = [
    log.id,
    log.timestamp,
    log.user,
    log.role,
    log.action,
    log.details,
    log.syncStatus,
    previousHash
  ].join("|");
  return sha256(contentString);
}
function buildAuditChain(logs) {
  if (logs.length === 0) return [];
  const chronological = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const chainedLogs = [];
  let currentPreviousHash = "0";
  for (const log of chronological) {
    const hash = calculateLogHash(log, currentPreviousHash);
    const chainedLog = {
      ...log,
      previousHash: currentPreviousHash,
      hash
    };
    chainedLogs.push(chainedLog);
    currentPreviousHash = hash;
  }
  return chainedLogs.reverse();
}

// src/initialData.ts
var SEED_USERS = [
  {
    id: "user-pres",
    username: "president",
    password: "password123",
    name: "Zenaida A. Elbi\xF1a",
    role: "President",
    isApproved: true,
    joinedDate: "2024-01-01"
  },
  {
    id: "user-vp",
    username: "vp",
    password: "password123",
    name: "Anselna B Arnado",
    role: "Vice_President",
    isApproved: true,
    joinedDate: "2024-01-01"
  },
  {
    id: "user-sec",
    username: "secretary",
    password: "password123",
    name: "Jennylyn S Lumactao",
    role: "Secretary",
    isApproved: true,
    joinedDate: "2024-01-01"
  },
  {
    id: "user-tres",
    username: "treasurer",
    password: "password123",
    name: "Gracelyn P Asendiente",
    role: "Treasurer",
    isApproved: true,
    joinedDate: "2024-01-01"
  },
  {
    id: "user-aud",
    username: "auditor",
    password: "password123",
    name: "Lorena B Pinote",
    role: "Auditor",
    isApproved: true,
    joinedDate: "2024-01-01"
  },
  {
    id: "user-pio",
    username: "pio",
    password: "password123",
    name: "Ida S Manera",
    role: "PIO",
    isApproved: true,
    joinedDate: "2024-01-01"
  },
  {
    id: "user-m1",
    username: "roberto",
    password: "password123",
    name: 'Roberto "Nong Berting" Caballes',
    role: "Member",
    isApproved: true,
    farmLocation: "Sitio Ylaya",
    farmSize: 2.5,
    primaryCrops: ["Corn (Mais)", "Coconut (Lubi)", "Tuburan Coffee"],
    contactNumber: "0917-456-7890",
    joinedDate: "2022-03-15",
    status: "Active"
  },
  {
    id: "user-m2",
    username: "maria",
    password: "password123",
    name: 'Maria "Nang Mary" Alcoser',
    role: "Member",
    isApproved: true,
    farmLocation: "Sitio Fatima",
    farmSize: 1.8,
    primaryCrops: ["Vegetables (Utanon)", "Banana (Saging)", "Hog Raising (Baboyan)"],
    contactNumber: "0928-123-4567",
    joinedDate: "2023-01-10",
    status: "Active"
  }
];
var INITIAL_MEMBERS = [
  {
    id: "m-1",
    name: 'Roberto "Nong Berting" Caballes',
    memberIdNumber: "BAFA-2022-001",
    rsbsaNumber: "07-22-51-001-000104",
    isRsbsaRegistered: true,
    farmLocation: "Sitio Ylaya",
    farmSize: 2.5,
    primaryCrops: ["Corn (Mais)", "Coconut (Lubi)", "Tuburan Coffee"],
    contactNumber: "0917-456-7890",
    status: "Active",
    joinedDate: "2022-03-15",
    gender: "Male",
    birthDate: "1968-04-12"
  },
  {
    id: "m-2",
    name: 'Maria "Nang Mary" Alcoser',
    memberIdNumber: "BAFA-2023-014",
    rsbsaNumber: "07-22-51-001-000218",
    isRsbsaRegistered: true,
    farmLocation: "Sitio Fatima",
    farmSize: 1.8,
    primaryCrops: ["Vegetables (Utanon)", "Banana (Saging)", "Hog Raising (Baboyan)"],
    contactNumber: "0928-123-4567",
    status: "Active",
    joinedDate: "2023-01-10",
    gender: "Female",
    birthDate: "1974-09-25"
  },
  {
    id: "m-3",
    name: 'Anselna "Nang Seling" Arnado',
    memberIdNumber: "BAFA-2021-003",
    rsbsaNumber: "07-22-51-001-000045",
    isRsbsaRegistered: true,
    farmLocation: "Sitio Proper (Centro)",
    farmSize: 3.2,
    primaryCrops: ["Cacao", "Coconut (Lubi)", "Hog Raising (Baboyan)"],
    contactNumber: "0909-876-5432",
    status: "Active",
    joinedDate: "2021-06-20",
    gender: "Female",
    birthDate: "1970-11-18"
  },
  {
    id: "m-4",
    name: 'Gaudioso "Nong Gaudy" Mendoza',
    memberIdNumber: "BAFA-2022-009",
    rsbsaNumber: "07-22-51-001-000301",
    isRsbsaRegistered: true,
    farmLocation: "Sitio Mahayahay",
    farmSize: 4,
    primaryCrops: ["Corn (Mais)", "Cassava (Kamoteng Kahoy)"],
    contactNumber: "0935-234-5678",
    status: "Active",
    joinedDate: "2022-11-05",
    gender: "Male",
    birthDate: "1965-02-08"
  },
  {
    id: "m-5",
    name: 'Florencia "Nang Flor" Ruelan',
    memberIdNumber: "BAFA-2024-032",
    rsbsaNumber: "07-22-51-001-000412",
    isRsbsaRegistered: false,
    farmLocation: "Sitio Huyong-Huyong",
    farmSize: 1.2,
    primaryCrops: ["Vegetables (Utanon)", "Tuburan Coffee", "Poultry Raising (Manokan)"],
    contactNumber: "0915-345-6789",
    status: "Inactive",
    joinedDate: "2024-02-18",
    gender: "Female",
    birthDate: "1982-08-30"
  },
  {
    id: "m-6",
    name: 'Zenaida "Nang Nene" Elbi\xF1a',
    memberIdNumber: "BAFA-2020-001",
    rsbsaNumber: "07-22-51-001-000008",
    isRsbsaRegistered: true,
    farmLocation: "Sitio Guimbal",
    farmSize: 5.5,
    primaryCrops: ["Coconut (Lubi)", "Cacao"],
    contactNumber: "0945-876-1234",
    status: "Active",
    joinedDate: "2020-08-12",
    gender: "Female",
    birthDate: "1963-05-14"
  }
];
var INITIAL_MEETINGS = [
  {
    id: "meet-1",
    title: "June General Assembly & Fertilizer Distribution",
    date: "2026-06-14",
    location: "Alegria Multi-Purpose Center",
    attendanceCount: 42,
    agenda: "1. Distribution of Municipal Seedlings\n2. Financial Report of Q1 2026\n3. Setup of Communal Fertilizer Depot",
    minutes: "The meeting commenced at 9:00 AM with an opening prayer led by Nang Mary. President Zenaida welcomed the members and announced that 150 bags of organic fertilizers from the Tuburan LGU had arrived. Treasurer reported a stable general fund. Nang Seling moved a motion to establish a roster for fertilizer allocation, which was seconded by Roberto. The meeting was adjourned at 11:30 AM.",
    officerInCharge: "Secretary (Jennylyn S Lumactao)"
  },
  {
    id: "meet-2",
    title: "Emergency Meeting on Typhoon Precaution",
    date: "2026-05-25",
    location: "Alegria Barangay Hall",
    attendanceCount: 28,
    agenda: "1. Harvest timing for early maize\n2. Drainage clearing schedule\n3. Securing storage warehouse assets",
    minutes: "Called to order at 2:00 PM due to the PAGASA gale advisory for Cebu. Members agreed on a bayanihan (bulig) schedule starting tomorrow at 6:00 AM to clear the community drainage ditches near the low-lying farmlands. Recommended that corn growers harvest matured ears immediately to prevent water logging damage.",
    officerInCharge: "Secretary (Jennylyn S Lumactao)"
  }
];
var INITIAL_RESOLUTIONS = [
  {
    id: "res-1",
    resolutionNumber: "BAFA-2026-001",
    title: "Establishment of Barangay Alegria Communal Fertilizer Depot",
    description: "A resolution to designate a portion of the cooperative lot in Sitio Proper for storing and distributing subsidized fertilizer, and charging a maintenance fee of 10 Pesos per bag to cover the warehouse keeper's honorarium.",
    dateAgreed: "2026-06-14",
    movedBy: "Anselna B Arnado",
    secondedBy: "Roberto Caballes",
    voteInFavor: 38,
    voteAgainst: 2,
    voteAbstain: 2,
    status: "Approved"
  },
  {
    id: "res-2",
    resolutionNumber: "BAFA-2026-002",
    title: "Allocation of 15,000 PHP from General Funds for Solar Dryer Repair",
    description: "A resolution authorizing the Treasurer to disburse the amount of Fifteen Thousand Pesos (PHP 15,000) for the replacement of damaged concrete slabs and buying UV canvas sheets for the communal solar dryer in Sitio Fatima.",
    dateAgreed: "2026-07-05",
    movedBy: "Maria Alcoser",
    secondedBy: "Zenaida A. Elbi\xF1a",
    voteInFavor: 31,
    voteAgainst: 4,
    voteAbstain: 0,
    status: "Pending Approval"
  }
];
var INITIAL_TRANSACTIONS = [
  {
    id: "t-1",
    type: "income",
    category: "Membership Dues",
    amount: 3200,
    date: "2026-06-14",
    description: "Annual membership dues collected from 32 active members during the General Assembly.",
    recordedBy: "Treasurer (Gracelyn P Asendiente)",
    fundSource: "General Fund / CBU (Member Equity)",
    auditedStatus: "Audited",
    auditedBy: "Auditor (Lorena B Pinote)",
    auditedDate: "2026-06-18",
    auditNotes: "Matched receipts and cash-on-hand ledger perfectly. Certified correct."
  },
  {
    id: "t-2",
    type: "expense",
    category: "Snacks & Materials",
    amount: 1250,
    date: "2026-06-14",
    description: "Snacks (pan de sal and juice) and attendance log notebooks bought for the June General Assembly.",
    recordedBy: "Treasurer (Gracelyn P Asendiente)",
    fundSource: "GF-SLP (General Fund / DSWD-SLP Operational Buffer)",
    auditedStatus: "Audited",
    auditedBy: "Auditor (Lorena B Pinote)",
    auditedDate: "2026-06-18",
    auditNotes: "Supported by official receipt from Alegria Bakeshop. Certified."
  },
  {
    id: "t-3",
    type: "income",
    category: "Donation",
    amount: 1e4,
    date: "2026-07-02",
    description: "Cash donation from Tuburan Agriculture Office for local farmer cooperative empowerment.",
    recordedBy: "Treasurer (Gracelyn P Asendiente)",
    fundSource: "LGU Tuburan Agriculture Assistance Fund",
    auditedStatus: "Unaudited"
  },
  {
    id: "t-4",
    type: "expense",
    category: "Equipment Maintenance",
    amount: 4500,
    date: "2026-07-08",
    description: "Spare parts purchase and mechanic labor for repairing the association's shared grass cutter.",
    recordedBy: "Treasurer (Gracelyn P Asendiente)",
    fundSource: "GF-SLP (General Operational Fund)",
    auditedStatus: "Flagged",
    auditedBy: "Auditor (Lorena B Pinote)",
    auditedDate: "2026-07-09",
    auditNotes: "Missing secondary receipt for the labor service (PHP 1,500). Please provide acknowledgment receipt signed by the mechanic."
  }
];
var INITIAL_FUNDS = [
  {
    id: "fund-gen",
    name: "General Fund / SLP (Sustainable Livelihood Program)",
    code: "GF-SLP",
    allocatedAmount: 15e4,
    currentBalance: 157450,
    description: "Main operational treasury and DSWD-SLP micro-enterprise revolving fund for seed capital and community projects.",
    custodian: "Treasurer (Gracelyn P Asendiente)",
    lastUpdated: "2026-07-10"
  },
  {
    id: "fund-dole",
    name: "DOLE Integrated Livelihood Program (DILP) Fund",
    code: "DOLE-IGP",
    allocatedAmount: 1e6,
    currentBalance: 1e6,
    description: "DOLE capital grant dedicated strictly to communal Hog Raising, piglet purchases, feeds, and livestock assets.",
    custodian: "Assist. Treasurer & Treasurer (Gracelyn P Asendiente)",
    lastUpdated: "2026-07-01"
  },
  {
    id: "fund-ati",
    name: "ATI Training & Capacity Building Record",
    code: "ATI-TRG",
    allocatedAmount: 85e3,
    currentBalance: 85e3,
    description: "Agricultural Training Institute (ATI) grant for farmer skills training, organic farming seminars, and benchmarking.",
    custodian: "President (Zenaida A. Elbi\xF1a) & Treasurer",
    lastUpdated: "2026-07-04"
  },
  {
    id: "fund-dispersal",
    name: "Dispersal & 5% Livestock Insurance Risk Pool",
    code: "DISP-5%",
    allocatedAmount: 45e3,
    currentBalance: 48500,
    description: "5% statutory contingency reserve set aside from gross revenues for livestock mortality insurance and emergency replacements.",
    custodian: "Auditor & Treasurer (Gracelyn P Asendiente)",
    lastUpdated: "2026-07-08"
  },
  {
    id: "fund-fcct",
    name: "FCCT Cooperative Deposit (December Member Cut)",
    code: "FCCT-SAVINGS",
    allocatedAmount: 12e4,
    currentBalance: 126400,
    description: "First Consolidated Cooperative (FCCT) bank deposits holding the 30% patronage interest cut to be released in December.",
    custodian: "Treasurer (Gracelyn P Asendiente)",
    lastUpdated: "2026-07-12"
  },
  {
    id: "fund-cbu",
    name: "Member Capital Build-Up (CBU) Fund",
    code: "CBU",
    allocatedAmount: 75e3,
    currentBalance: 78200,
    description: "Accumulated savings and equity pooled from active members for future cooperative land and solar dryer expansion.",
    custodian: "Treasurer (Gracelyn P Asendiente)",
    lastUpdated: "2026-07-05"
  }
];
var INITIAL_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Free Cacao & Coffee Seedlings Distribution",
    category: "Assistance",
    content: "The Municipal Agriculture Office of Tuburan will distribute free cacao grafts and Tuburan Robusta coffee seedlings on July 18, 2026, 8:00 AM at the Barangay Alegria Hall. Active members can claim up to 30 seedlings each. Please bring your BAFA Membership ID card.",
    datePosted: "2026-07-10",
    priority: "High",
    postedBy: "PIO (Ida S Manera)"
  },
  {
    id: "ann-2",
    title: "Schedules of Communal Solar Dryer Use",
    category: "General",
    content: "To prevent conflict, corn and coffee growers must reserve schedules for drying. Please write your name on the booking sheet posted at the Sitio Fatima Dryer bulletin or contact the Secretary. Maximum of 3 consecutive drying days per farmer during peak harvest.",
    datePosted: "2026-07-05",
    priority: "Medium",
    postedBy: "PIO (Ida S Manera)"
  },
  {
    id: "ann-3",
    title: "Rain Shower Alert & Early Harvest Advisory",
    category: "Weather",
    content: "Moderate to heavy rain showers are expected this week over northwestern Cebu due to low pressure easterlies. Farmers with mature corn are advised to harvest early to maintain optimal crop moisture and prevent mold.",
    datePosted: "2026-07-11",
    priority: "High",
    postedBy: "PIO (Ida S Manera)"
  }
];
var INITIAL_LOGS = buildAuditChain([
  {
    id: "log-1",
    timestamp: "2026-07-10T09:30:00Z",
    user: "Ida S Manera",
    role: "PIO",
    action: "Posted Announcement",
    details: 'Created announcement: "Free Cacao & Coffee Seedlings Distribution"',
    syncStatus: "synced",
    hash: "",
    previousHash: ""
  },
  {
    id: "log-2",
    timestamp: "2026-07-09T14:15:00Z",
    user: "Lorena B Pinote",
    role: "Auditor",
    action: "Flagged Transaction",
    details: "Flagged transaction t-4 (shared grass cutter repair) due to missing receipt.",
    syncStatus: "synced",
    hash: "",
    previousHash: ""
  },
  {
    id: "log-3",
    timestamp: "2026-07-08T11:00:00Z",
    user: "Gracelyn P Asendiente",
    role: "Treasurer",
    action: "Recorded Expense",
    details: "Logged PHP 4,500 expense for equipment maintenance (grass cutter).",
    syncStatus: "synced",
    hash: "",
    previousHash: ""
  }
]);
var INITIAL_HOG_RAISING = {
  capitalGrant: 1e6,
  produces: ["Hog Raising", "Poultry Raising", "Tilapia Breeding"],
  expenses: [
    {
      id: "pig-exp-prev-1",
      category: "Piglets",
      description: "Purchased 20 piglets for 2025 batch",
      amount: 6e4,
      date: "2025-10-10",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-prev-2",
      category: "Feeds",
      description: "Feeds for 2025 batch",
      amount: 15e3,
      date: "2025-11-15",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE-DILP Revolving Feed Allocation"
    },
    {
      id: "pig-exp-q1-1",
      category: "Feeds",
      description: "Purchased starter feeds for early 2026 cycle",
      amount: 12e3,
      date: "2026-02-10",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-1",
      category: "Piglets",
      description: "Purchased 25 hybrid piglets (F1 high-quality breed) for fattening project",
      amount: 75e3,
      date: "2026-06-15",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-2",
      category: "Feeds",
      description: "Bought 15 bags of Hog Starter Crumbles & booster feeds",
      amount: 24e3,
      date: "2026-06-20",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    },
    {
      id: "pig-exp-3",
      category: "Vitamins/Medicines",
      description: "Acquired anti-cholera vaccine vials, dewormer powders, and swine growth booster vitamins",
      amount: 8500,
      date: "2026-06-22",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "Dispersal & 5% Livestock Insurance Risk Pool"
    },
    {
      id: "pig-exp-4",
      category: "Feeds",
      description: "Bought 10 bags of Hog Grower Pellets for the second month feeding cycle",
      amount: 18500,
      date: "2026-07-05",
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      fundSource: "DOLE Integrated Livelihood Program (DILP) Capital Grant"
    }
  ],
  sales: [
    {
      id: "pig-sale-prev-1",
      date: "2025-12-20",
      hogsCount: 15,
      revenue: 21e4,
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      notes: "Final sales for 2025 cycle. Books closed."
    },
    {
      id: "pig-sale-q1-1",
      date: "2026-03-18",
      hogsCount: 4,
      revenue: 65e3,
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      notes: "Sold 4 hogs to local dealers."
    },
    {
      id: "pig-sale-1",
      date: "2026-07-08",
      hogsCount: 8,
      revenue: 135e3,
      recordedBy: "Treasurer (Gracelyn P Asendiente)",
      notes: "Sold first batch of 8 mature fattened hogs to Cebu Meat Dealers. Average live weight 88kg at PHP 191/kg."
    }
  ],
  groups: [
    {
      id: "grp-1",
      name: "Batch 1 (Lunes - Monday Group)",
      members: ['Roberto "Nong Berting" Caballes', 'Zenaida "Nang Nene" Elbi\xF1a'],
      scheduleDays: ["Monday"]
    },
    {
      id: "grp-2",
      name: "Batch 2 (Miyerkules - Wednesday Group)",
      members: ['Maria "Nang Mary" Alcoser', 'Florencia "Nang Flor" Ruelan'],
      scheduleDays: ["Wednesday"]
    },
    {
      id: "grp-3",
      name: "Batch 3 (Biyernes - Friday Group)",
      members: ['Anselna "Nang Seling" Arnado', 'Gaudioso "Nong Gaudy" Mendoza'],
      scheduleDays: ["Friday"]
    }
  ],
  choreLogs: [
    {
      id: "chore-1",
      date: "2026-07-10",
      time: "07:30 AM",
      batchName: "Batch 1 (Lunes - Monday Group)",
      checkedBy: 'Roberto "Nong Berting" Caballes',
      activities: ["Feeding", "Cleaning", "Water Refill"],
      notes: "Cleaned and disinfected the pig pens. Refilled clean water troughs and fed morning rations. All piglets are healthy and active."
    },
    {
      id: "chore-2",
      date: "2026-07-11",
      time: "08:00 AM",
      batchName: "Batch 2 (Miyerkules - Wednesday Group)",
      checkedBy: 'Maria "Nang Mary" Alcoser',
      activities: ["Feeding", "Vitamins"],
      notes: "Administered vitamin booster powder mixed in the morning grower feeds. Pigs are growing rapidly."
    }
  ],
  closedYears: [2025]
};
var INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Kape sa Tuburan (Tuburan Coffee)",
    cebName: "Espesyal nga Roasted Coffee Beans",
    category: "Processed Goods",
    description: "Lunsay nga kape gikan sa mga bungtod sa Tuburan. Organiko, humot, ug lami kaayo ang pagka-galing.",
    unit: "250g bag",
    price: 250,
    quantityAvailable: "45 ka pack (250g bags)",
    stockStatus: "In Stock",
    farmerName: "Zenaida A. Elbi\xF1a",
    farmerSitio: "Sitio Fatima",
    farmerPhone: "0945-876-1234",
    contactPerson: "Zenaida A. Elbi\xF1a \u2022 Sitio Fatima (0945-876-1234)",
    isPublished: true,
    updatedBy: "Treasurer (Gracelyn P Asendiente)",
    managedBy: "Treasurer (Gracelyn P Asendiente)",
    dateUpdated: "2026-07-10"
  },
  {
    id: "prod-2",
    name: "Dalag ug Puti nga Mais (Cebu Corn)",
    cebName: "Lab-as nga Mais alang sa Pagkaon ug Tuka",
    category: "Produce",
    description: "Gitanom sa tabunok nga yuta sa Alegria nga walay kemikal nga makadaot. Tam-is ug lab-as kaayo.",
    unit: "matag kilo",
    price: 45,
    quantityAvailable: "250 ka kilo",
    stockStatus: "In Stock",
    farmerName: "Gracelyn P. Asendiente",
    farmerSitio: "Sitio Lower Alegria",
    farmerPhone: "0917-345-6789",
    contactPerson: "Gracelyn P. Asendiente \u2022 Sitio Lower Alegria (0917-345-6789)",
    isPublished: true,
    updatedBy: "Treasurer (Gracelyn P Asendiente)",
    managedBy: "Treasurer (Gracelyn P Asendiente)",
    dateUpdated: "2026-07-12"
  },
  {
    id: "prod-3",
    name: "Lab-as nga Baboy (High-Grade Live & Fresh Pork)",
    cebName: "Produkto sa Atong Hog Raising IGP",
    category: "Livestock",
    description: "Gi-atiman pag-ayo sa atong miyembro sa baboyan. Kasaligan, limpyo, ug pakan-on sa husto nga nutrisyon.",
    unit: "matag kilo",
    price: 240,
    quantityAvailable: "8 ka ulo (approx 85-90kg/head)",
    stockStatus: "In Stock",
    farmerName: "BAFA Hog Raising Committee (Led by Anselna Arnado)",
    farmerSitio: "Sitio Upper Alegria",
    farmerPhone: "0922-987-6543",
    contactPerson: "Anselna B. Arnado \u2022 Sitio Upper Alegria (0922-987-6543)",
    isPublished: true,
    updatedBy: "Treasurer (Gracelyn P Asendiente)",
    managedBy: "Treasurer (Gracelyn P Asendiente)",
    dateUpdated: "2026-07-11"
  },
  {
    id: "prod-4",
    name: "Lubi ug Kopras (Organic Coconut)",
    cebName: "Pang-unang Tinubdan sa Atong Mag-uuma",
    category: "Produce",
    description: "Katas sa lubi ug taas nga kalidad nga kopras para sa mantika. Direkta gikan sa mga mag-uuma sa unom ka Sitio.",
    unit: "matag buok",
    price: 20,
    quantityAvailable: "500 ka buok",
    stockStatus: "In Stock",
    farmerName: "Lorena B. Pinote",
    farmerSitio: "Sitio Anislagan",
    farmerPhone: "0998-123-4567",
    contactPerson: "Lorena B. Pinote \u2022 Sitio Anislagan (0998-123-4567)",
    isPublished: true,
    updatedBy: "Treasurer (Gracelyn P Asendiente)",
    managedBy: "Treasurer (Gracelyn P Asendiente)",
    dateUpdated: "2026-07-08"
  }
];
var INITIAL_ACTIVITIES = [
  {
    id: "act-1",
    title: "Monthly Bayanihan & Community Solar Dryer Clearing",
    category: "Community Work",
    scheduledDate: "2026-07-25",
    dateScheduled: "2026-07-25",
    scheduledTime: "07:00 AM - 11:00 AM",
    timeScheduled: "07:00 AM - 11:00 AM",
    location: "Sitio Fatima Solar Dryer Depot",
    description: "Hiniusa nga paglimpyo sa kanal ug pag-ayo sa atop sa solar dryer basin aron andam sa ting-ani sa mais ug kape.",
    organizer: "PIO (Ida S Manera)",
    status: "Scheduled",
    attendeesCount: 35
  },
  {
    id: "act-2",
    title: "Organiko nga Pag-atiman sa Baboy & Organic Feeding Seminar",
    category: "Training",
    scheduledDate: "2026-08-05",
    dateScheduled: "2026-08-05",
    scheduledTime: "09:00 AM - 02:00 PM",
    timeScheduled: "09:00 AM - 02:00 PM",
    location: "Alegria Barangay Covered Court",
    description: "Libre nga pagbansay alang sa tanang miyembro kung unsaon paghimo og alternatibong pagkaon sa baboy gikan sa gabi ug banana stalk.",
    organizer: "PIO (Ida S Manera)",
    status: "Scheduled",
    attendeesCount: 50
  },
  {
    id: "act-3",
    title: "Quarterly General Assembly & Dividend Distribution",
    category: "Assembly",
    scheduledDate: "2026-06-14",
    dateScheduled: "2026-06-14",
    scheduledTime: "08:30 AM - 12:00 PM",
    timeScheduled: "08:30 AM - 12:00 PM",
    location: "Alegria Multi-Purpose Hall",
    description: "Tinuig nga tigum para sa pinansyal nga report, pag-audit sa pundo, ug paghatag sa halin sa Hog Raising batch 1.",
    organizer: "Secretary (Jennylyn S Lumactao)",
    status: "Completed",
    documentedNotes: "Matagumpay nga gitigom ang 42 ka miyembro. Gi-aprubahan ang resolution 001 ug gihatag ang report sa auditor.",
    attendeesCount: 42
  }
];

// src/api/db.ts
var PgPool = pg?.Pool || pg?.default?.Pool || pg?.default || pg;
var poolInstance = null;
var lastUsedConnectionString = null;
function isDatabaseConfigured() {
  const dbUrl = process.env.DATABASE_URL?.trim().replace(/^["']|["']$/g, "");
  return Boolean(
    dbUrl && dbUrl !== "" && !dbUrl.includes("[YOUR-PASSWORD]") && !dbUrl.includes("<password>") && !dbUrl.includes("YOUR_PASSWORD") && !dbUrl.includes("your_aiven_connection_string") && !dbUrl.includes("your_supabase_connection_string") && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))
  );
}
function cleanDatabaseUrl(rawUrl) {
  let urlStr = rawUrl.trim().replace(/^["']|["']$/g, "");
  let hostInfo = "PostgreSQL";
  try {
    const parsed = new URL(urlStr);
    hostInfo = `${parsed.hostname}${parsed.port ? ":" + parsed.port : ""}${parsed.pathname}`;
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("ssl");
    return {
      connectionString: parsed.toString(),
      isSsl: true,
      hostInfo
    };
  } catch {
    const cleaned = urlStr.replace(/[\?&]sslmode=[^&]*/g, "").replace(/[\?&]ssl=[^&]*/g, "").replace(/\?$/, "");
    return { connectionString: cleaned, isSsl: true, hostInfo };
  }
}
function getPool() {
  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl || !isDatabaseConfigured()) {
    throw new Error("DATABASE_URL environment variable is not configured");
  }
  const { connectionString } = cleanDatabaseUrl(rawDbUrl);
  if (!poolInstance || lastUsedConnectionString !== connectionString) {
    if (poolInstance) {
      poolInstance.end().catch(() => {
      });
    }
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    poolInstance = new PgPool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 6e3,
      idleTimeoutMillis: 1e4,
      max: 6
    });
    poolInstance.on("error", (err) => {
      console.warn("[PostgreSQL Pool Client Error]:", err?.message || err);
    });
    lastUsedConnectionString = connectionString;
  }
  return poolInstance;
}
async function runSchemaMigrations(client) {
  const statements = [
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS member_id_number VARCHAR(100);`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS rsbsa_number VARCHAR(100);`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS is_rsbsa_registered BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_date VARCHAR(50);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id_number VARCHAR(100);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS rsbsa_number VARCHAR(100);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_rsbsa_registered BOOLEAN DEFAULT FALSE;`,
    `ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS fund_source TEXT;`,
    `ALTER TABLE meetings ADD COLUMN IF NOT EXISTS attendance_record JSONB;`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`,
    `ALTER TABLE activities ADD COLUMN IF NOT EXISTS ceb_title TEXT;`,
    `ALTER TABLE activities ADD COLUMN IF NOT EXISTS target_audience TEXT;`,
    `ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT;`
  ];
  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch {
    }
  }
}
async function initDatabaseSchema(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_approved BOOLEAN DEFAULT TRUE,
        joined_date VARCHAR(50),
        farm_location TEXT,
        farm_size NUMERIC,
        primary_crops TEXT[],
        contact_number VARCHAR(50),
        status VARCHAR(50),
        avatar_url TEXT,
        member_id_number VARCHAR(100),
        rsbsa_number VARCHAR(100),
        is_rsbsa_registered BOOLEAN DEFAULT FALSE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        farm_location TEXT,
        farm_size NUMERIC,
        primary_crops TEXT[],
        contact_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Active',
        joined_date VARCHAR(50),
        member_id_number VARCHAR(100),
        rsbsa_number VARCHAR(100),
        is_rsbsa_registered BOOLEAN DEFAULT FALSE,
        avatar_url TEXT,
        gender VARCHAR(20),
        birth_date VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        date VARCHAR(50),
        location TEXT,
        attendance_count INTEGER DEFAULT 0,
        agenda TEXT,
        minutes TEXT,
        officer_in_charge TEXT,
        attendance_record JSONB
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS resolutions (
        id VARCHAR(100) PRIMARY KEY,
        resolution_number VARCHAR(100) NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date_agreed VARCHAR(50),
        moved_by TEXT,
        seconded_by TEXT,
        vote_in_favor INTEGER DEFAULT 0,
        vote_against INTEGER DEFAULT 0,
        vote_abstain INTEGER DEFAULT 0,
        status VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC NOT NULL,
        date VARCHAR(50),
        description TEXT,
        recorded_by TEXT,
        fund_source TEXT,
        audited_status VARCHAR(50) DEFAULT 'Unaudited',
        audited_by TEXT,
        audited_date VARCHAR(50),
        audit_notes TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        category VARCHAR(100),
        content TEXT,
        date_posted VARCHAR(50),
        priority VARCHAR(50),
        posted_by TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp VARCHAR(100),
        user_name TEXT,
        role VARCHAR(50),
        action TEXT,
        details TEXT,
        sync_status VARCHAR(50),
        hash TEXT,
        previous_hash TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS hog_raising (
        id VARCHAR(100) PRIMARY KEY,
        capital_grant NUMERIC,
        produces TEXT[],
        expenses JSONB,
        sales JSONB,
        groups JSONB,
        chore_logs JSONB,
        closed_years INT[]
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        ceb_name TEXT,
        category VARCHAR(100),
        description TEXT,
        unit VARCHAR(50),
        price NUMERIC,
        quantity_available VARCHAR(100),
        stock_status VARCHAR(50),
        farmer_name TEXT,
        farmer_sitio TEXT,
        farmer_phone VARCHAR(50),
        contact_person TEXT,
        image_url TEXT,
        is_published BOOLEAN DEFAULT TRUE,
        updated_by TEXT,
        managed_by TEXT,
        date_updated VARCHAR(50)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(100) PRIMARY KEY,
        title TEXT NOT NULL,
        ceb_title TEXT,
        category VARCHAR(100),
        scheduled_date VARCHAR(50),
        date_scheduled VARCHAR(50),
        scheduled_time VARCHAR(100),
        time_scheduled VARCHAR(100),
        location TEXT,
        description TEXT,
        organizer TEXT,
        status VARCHAR(50),
        documented_notes TEXT,
        attendees_count INTEGER DEFAULT 0,
        target_audience TEXT,
        image_url TEXT
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_funds (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        allocated_amount NUMERIC DEFAULT 0,
        current_balance NUMERIC DEFAULT 0,
        description TEXT,
        custodian TEXT,
        last_updated VARCHAR(50)
      );
    `);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
async function getTableStats(pool) {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT
        (SELECT count(*) FROM users) as users,
        (SELECT count(*) FROM members) as members,
        (SELECT count(*) FROM meetings) as meetings,
        (SELECT count(*) FROM resolutions) as resolutions,
        (SELECT count(*) FROM financial_transactions) as financial_transactions,
        (SELECT count(*) FROM announcements) as announcements,
        (SELECT count(*) FROM system_logs) as system_logs,
        (SELECT count(*) FROM hog_raising) as hog_raising,
        (SELECT count(*) FROM products) as products,
        (SELECT count(*) FROM activities) as activities,
        (SELECT count(*) FROM organization_funds) as organization_funds
    `);
    const row = res.rows[0] || {};
    const tableCounts = {
      users: Number(row.users || 0),
      members: Number(row.members || 0),
      meetings: Number(row.meetings || 0),
      resolutions: Number(row.resolutions || 0),
      financial_transactions: Number(row.financial_transactions || 0),
      announcements: Number(row.announcements || 0),
      system_logs: Number(row.system_logs || 0),
      hog_raising: Number(row.hog_raising || 0),
      products: Number(row.products || 0),
      activities: Number(row.activities || 0),
      organization_funds: Number(row.organization_funds || 0)
    };
    const totalRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);
    return { tableCounts, totalRecords };
  } catch {
    return {
      tableCounts: {},
      totalRecords: 0
    };
  } finally {
    client.release();
  }
}
async function ensureDatabaseSchema(pool) {
  const client = await pool.connect();
  try {
    const check = await client.query(`SELECT to_regclass('public.members') as members_table`);
    if (!check.rows[0]?.members_table) {
      await initDatabaseSchema(pool);
    } else {
      await runSchemaMigrations(client);
    }
    const counts = await client.query(`
      SELECT 
        (SELECT count(*) FROM users) as users_count,
        (SELECT count(*) FROM members) as members_count,
        (SELECT count(*) FROM financial_transactions) as tx_count,
        (SELECT count(*) FROM organization_funds) as funds_count
    `);
    const usersCount = Number(counts.rows[0]?.users_count || 0);
    const membersCount = Number(counts.rows[0]?.members_count || 0);
    if (usersCount === 0 || membersCount === 0) {
      console.log(`[Supabase / PostgreSQL]: Empty tables detected (users: ${usersCount}, members: ${membersCount}). Auto-seeding initial association dataset...`);
      await migrateSeedData(pool);
      console.log("[Supabase / PostgreSQL]: Initial dataset auto-seeded into Supabase successfully!");
    }
  } catch (err) {
    console.warn("[ensureDatabaseSchema warning]:", err?.message || err);
  } finally {
    client.release();
  }
}
async function migrateSeedData(pool) {
  await initDatabaseSchema(pool);
  const client = await pool.connect();
  const summary = {};
  try {
    await client.query("BEGIN");
    await runSchemaMigrations(client);
    let usersCount = 0;
    for (const u of SEED_USERS) {
      await client.query(`
        INSERT INTO users (id, username, password, name, role, is_approved, joined_date, farm_location, farm_size, primary_crops, contact_number, status, avatar_url, member_id_number, rsbsa_number, is_rsbsa_registered)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password = EXCLUDED.password,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          is_approved = EXCLUDED.is_approved,
          joined_date = EXCLUDED.joined_date,
          farm_location = EXCLUDED.farm_location,
          farm_size = EXCLUDED.farm_size,
          primary_crops = EXCLUDED.primary_crops,
          contact_number = EXCLUDED.contact_number,
          status = EXCLUDED.status,
          avatar_url = EXCLUDED.avatar_url,
          member_id_number = EXCLUDED.member_id_number,
          rsbsa_number = EXCLUDED.rsbsa_number,
          is_rsbsa_registered = EXCLUDED.is_rsbsa_registered;
      `, [
        u.id,
        u.username,
        u.password || "password123",
        u.name,
        u.role,
        u.isApproved,
        u.joinedDate || null,
        u.farmLocation || null,
        u.farmSize || null,
        u.primaryCrops || [],
        u.contactNumber || null,
        u.status || "Active",
        u.avatarUrl || null,
        u.memberIdNumber || null,
        u.rsbsaNumber || null,
        Boolean(u.isRsbsaRegistered)
      ]);
      usersCount++;
    }
    summary.users = usersCount;
    let membersCount = 0;
    for (const m of INITIAL_MEMBERS) {
      await client.query(`
        INSERT INTO members (id, name, farm_location, farm_size, primary_crops, contact_number, status, joined_date, member_id_number, rsbsa_number, is_rsbsa_registered, avatar_url, gender, birth_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          farm_location = EXCLUDED.farm_location,
          farm_size = EXCLUDED.farm_size,
          primary_crops = EXCLUDED.primary_crops,
          contact_number = EXCLUDED.contact_number,
          status = EXCLUDED.status,
          joined_date = EXCLUDED.joined_date,
          member_id_number = EXCLUDED.member_id_number,
          rsbsa_number = EXCLUDED.rsbsa_number,
          is_rsbsa_registered = EXCLUDED.is_rsbsa_registered,
          avatar_url = EXCLUDED.avatar_url,
          gender = EXCLUDED.gender,
          birth_date = EXCLUDED.birth_date;
      `, [
        m.id,
        m.name,
        m.farmLocation || null,
        m.farmSize || null,
        m.primaryCrops || [],
        m.contactNumber || null,
        m.status || "Active",
        m.joinedDate || null,
        m.memberIdNumber || null,
        m.rsbsaNumber || null,
        Boolean(m.isRsbsaRegistered),
        m.avatarUrl || null,
        m.gender || null,
        m.birthDate || null
      ]);
      membersCount++;
    }
    summary.members = membersCount;
    let meetingsCount = 0;
    for (const mt of INITIAL_MEETINGS) {
      await client.query(`
        INSERT INTO meetings (id, title, date, location, attendance_count, agenda, minutes, officer_in_charge, attendance_record)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          date = EXCLUDED.date,
          location = EXCLUDED.location,
          attendance_count = EXCLUDED.attendance_count,
          agenda = EXCLUDED.agenda,
          minutes = EXCLUDED.minutes,
          officer_in_charge = EXCLUDED.officer_in_charge,
          attendance_record = EXCLUDED.attendance_record;
      `, [
        mt.id,
        mt.title,
        mt.date,
        mt.location,
        mt.attendanceCount || 0,
        mt.agenda || "",
        mt.minutes || "",
        mt.officerInCharge || "",
        JSON.stringify(mt.attendanceRecord || {})
      ]);
      meetingsCount++;
    }
    summary.meetings = meetingsCount;
    let resolutionsCount = 0;
    for (const r of INITIAL_RESOLUTIONS) {
      await client.query(`
        INSERT INTO resolutions (id, resolution_number, title, description, date_agreed, moved_by, seconded_by, vote_in_favor, vote_against, vote_abstain, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          resolution_number = EXCLUDED.resolution_number,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          date_agreed = EXCLUDED.date_agreed,
          moved_by = EXCLUDED.moved_by,
          seconded_by = EXCLUDED.seconded_by,
          vote_in_favor = EXCLUDED.vote_in_favor,
          vote_against = EXCLUDED.vote_against,
          vote_abstain = EXCLUDED.vote_abstain,
          status = EXCLUDED.status;
      `, [
        r.id,
        r.resolutionNumber,
        r.title,
        r.description,
        r.dateAgreed,
        r.movedBy,
        r.secondedBy,
        r.voteInFavor,
        r.voteAgainst,
        r.voteAbstain,
        r.status
      ]);
      resolutionsCount++;
    }
    summary.resolutions = resolutionsCount;
    let txCount = 0;
    for (const tx of INITIAL_TRANSACTIONS) {
      await client.query(`
        INSERT INTO financial_transactions (id, type, category, amount, date, description, recorded_by, fund_source, audited_status, audited_by, audited_date, audit_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          category = EXCLUDED.category,
          amount = EXCLUDED.amount,
          date = EXCLUDED.date,
          description = EXCLUDED.description,
          recorded_by = EXCLUDED.recorded_by,
          fund_source = EXCLUDED.fund_source,
          audited_status = EXCLUDED.audited_status,
          audited_by = EXCLUDED.audited_by,
          audited_date = EXCLUDED.audited_date,
          audit_notes = EXCLUDED.audit_notes;
      `, [
        tx.id,
        tx.type,
        tx.category,
        tx.amount,
        tx.date,
        tx.description,
        tx.recordedBy,
        tx.fundSource || null,
        tx.auditedStatus || "Unaudited",
        tx.auditedBy || null,
        tx.auditedDate || null,
        tx.auditNotes || null
      ]);
      txCount++;
    }
    summary.financial_transactions = txCount;
    let annCount = 0;
    for (const an of INITIAL_ANNOUNCEMENTS) {
      await client.query(`
        INSERT INTO announcements (id, title, category, content, date_posted, priority, posted_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          content = EXCLUDED.content,
          date_posted = EXCLUDED.date_posted,
          priority = EXCLUDED.priority,
          posted_by = EXCLUDED.posted_by;
      `, [
        an.id,
        an.title,
        an.category,
        an.content,
        an.datePosted,
        an.priority,
        an.postedBy
      ]);
      annCount++;
    }
    summary.announcements = annCount;
    let logsCount = 0;
    for (const lg of INITIAL_LOGS) {
      await client.query(`
        INSERT INTO system_logs (id, timestamp, user_name, role, action, details, sync_status, hash, previous_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          timestamp = EXCLUDED.timestamp,
          user_name = EXCLUDED.user_name,
          role = EXCLUDED.role,
          action = EXCLUDED.action,
          details = EXCLUDED.details,
          sync_status = EXCLUDED.sync_status,
          hash = EXCLUDED.hash,
          previous_hash = EXCLUDED.previous_hash;
      `, [
        lg.id,
        lg.timestamp,
        lg.user || lg.userName || "System",
        lg.role,
        lg.action,
        lg.details,
        lg.syncStatus || "synced",
        lg.hash || null,
        lg.previousHash || null
      ]);
      logsCount++;
    }
    summary.system_logs = logsCount;
    await client.query(`
      INSERT INTO hog_raising (id, capital_grant, produces, expenses, sales, groups, chore_logs, closed_years)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        capital_grant = EXCLUDED.capital_grant,
        produces = EXCLUDED.produces,
        expenses = EXCLUDED.expenses,
        sales = EXCLUDED.sales,
        groups = EXCLUDED.groups,
        chore_logs = EXCLUDED.chore_logs,
        closed_years = EXCLUDED.closed_years;
    `, [
      "hog_raising_main",
      INITIAL_HOG_RAISING.capitalGrant,
      INITIAL_HOG_RAISING.produces,
      JSON.stringify(INITIAL_HOG_RAISING.expenses),
      JSON.stringify(INITIAL_HOG_RAISING.sales),
      JSON.stringify(INITIAL_HOG_RAISING.groups),
      JSON.stringify(INITIAL_HOG_RAISING.choreLogs),
      INITIAL_HOG_RAISING.closedYears || []
    ]);
    summary.hog_raising = 1;
    let productsCount = 0;
    for (const p of INITIAL_PRODUCTS) {
      await client.query(`
        INSERT INTO products (id, name, ceb_name, category, description, unit, price, quantity_available, stock_status, farmer_name, farmer_sitio, farmer_phone, contact_person, image_url, is_published, updated_by, managed_by, date_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          ceb_name = EXCLUDED.ceb_name,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          unit = EXCLUDED.unit,
          price = EXCLUDED.price,
          quantity_available = EXCLUDED.quantity_available,
          stock_status = EXCLUDED.stock_status,
          farmer_name = EXCLUDED.farmer_name,
          farmer_sitio = EXCLUDED.farmer_sitio,
          farmer_phone = EXCLUDED.farmer_phone,
          contact_person = EXCLUDED.contact_person,
          image_url = EXCLUDED.image_url,
          is_published = EXCLUDED.is_published,
          updated_by = EXCLUDED.updated_by,
          managed_by = EXCLUDED.managed_by,
          date_updated = EXCLUDED.date_updated;
      `, [
        p.id,
        p.name,
        p.cebName,
        p.category,
        p.description,
        p.unit,
        p.price,
        p.quantityAvailable,
        p.stockStatus,
        p.farmerName || null,
        p.farmerSitio || null,
        p.farmerPhone || null,
        p.contactPerson || null,
        p.imageUrl || null,
        p.isPublished ?? true,
        p.updatedBy || null,
        p.managedBy || null,
        p.dateUpdated || null
      ]);
      productsCount++;
    }
    summary.products = productsCount;
    let activitiesCount = 0;
    for (const act of INITIAL_ACTIVITIES) {
      await client.query(`
        INSERT INTO activities (id, title, ceb_title, category, scheduled_date, date_scheduled, scheduled_time, time_scheduled, location, description, organizer, status, documented_notes, attendees_count, target_audience, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          ceb_title = EXCLUDED.ceb_title,
          category = EXCLUDED.category,
          scheduled_date = EXCLUDED.scheduled_date,
          date_scheduled = EXCLUDED.date_scheduled,
          scheduled_time = EXCLUDED.scheduled_time,
          time_scheduled = EXCLUDED.time_scheduled,
          location = EXCLUDED.location,
          description = EXCLUDED.description,
          organizer = EXCLUDED.organizer,
          status = EXCLUDED.status,
          documented_notes = EXCLUDED.documented_notes,
          attendees_count = EXCLUDED.attendees_count,
          target_audience = EXCLUDED.target_audience,
          image_url = EXCLUDED.image_url;
      `, [
        act.id,
        act.title,
        act.cebTitle || null,
        act.category,
        act.scheduledDate || act.dateScheduled || null,
        act.dateScheduled || act.scheduledDate || null,
        act.scheduledTime || act.timeScheduled || null,
        act.timeScheduled || act.scheduledTime || null,
        act.location,
        act.description,
        act.organizer,
        act.status,
        act.documentedNotes || null,
        act.attendeesCount || 0,
        act.targetAudience || null,
        act.imageUrl || null
      ]);
      activitiesCount++;
    }
    summary.activities = activitiesCount;
    let fundsCount = 0;
    for (const f of INITIAL_FUNDS) {
      await client.query(`
        INSERT INTO organization_funds (id, name, code, allocated_amount, current_balance, description, custodian, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          code = EXCLUDED.code,
          allocated_amount = EXCLUDED.allocated_amount,
          current_balance = EXCLUDED.current_balance,
          description = EXCLUDED.description,
          custodian = EXCLUDED.custodian,
          last_updated = EXCLUDED.last_updated;
      `, [
        f.id,
        f.name,
        f.code,
        f.allocatedAmount || 0,
        f.currentBalance || 0,
        f.description || "",
        f.custodian || "",
        f.lastUpdated || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      ]);
      fundsCount++;
    }
    summary.organization_funds = fundsCount;
    await client.query("COMMIT");
    return summary;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
async function saveFullStateToPostgres(pool, state) {
  await ensureDatabaseSchema(pool);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await runSchemaMigrations(client);
    if (state.users && Array.isArray(state.users) && state.users.length > 0) {
      for (const u of state.users) {
        await client.query(`
          INSERT INTO users (id, username, password, name, role, is_approved, joined_date, farm_location, farm_size, primary_crops, contact_number, status, avatar_url, member_id_number, rsbsa_number, is_rsbsa_registered)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            is_approved = EXCLUDED.is_approved,
            joined_date = EXCLUDED.joined_date,
            farm_location = EXCLUDED.farm_location,
            farm_size = EXCLUDED.farm_size,
            primary_crops = EXCLUDED.primary_crops,
            contact_number = EXCLUDED.contact_number,
            status = EXCLUDED.status,
            avatar_url = EXCLUDED.avatar_url,
            member_id_number = EXCLUDED.member_id_number,
            rsbsa_number = EXCLUDED.rsbsa_number,
            is_rsbsa_registered = EXCLUDED.is_rsbsa_registered;
        `, [
          u.id,
          u.username,
          u.password || "password123",
          u.name,
          u.role,
          u.isApproved,
          u.joinedDate || null,
          u.farmLocation || null,
          u.farmSize || null,
          u.primaryCrops || [],
          u.contactNumber || null,
          u.status || "Active",
          u.avatarUrl || null,
          u.memberIdNumber || null,
          u.rsbsaNumber || null,
          Boolean(u.isRsbsaRegistered)
        ]);
      }
    }
    if (state.members && Array.isArray(state.members) && state.members.length > 0) {
      for (const m of state.members) {
        await client.query(`
          INSERT INTO members (id, name, farm_location, farm_size, primary_crops, contact_number, status, joined_date, member_id_number, rsbsa_number, is_rsbsa_registered, avatar_url, gender, birth_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            farm_location = EXCLUDED.farm_location,
            farm_size = EXCLUDED.farm_size,
            primary_crops = EXCLUDED.primary_crops,
            contact_number = EXCLUDED.contact_number,
            status = EXCLUDED.status,
            joined_date = EXCLUDED.joined_date,
            member_id_number = EXCLUDED.member_id_number,
            rsbsa_number = EXCLUDED.rsbsa_number,
            is_rsbsa_registered = EXCLUDED.is_rsbsa_registered,
            avatar_url = EXCLUDED.avatar_url,
            gender = EXCLUDED.gender,
            birth_date = EXCLUDED.birth_date;
        `, [
          m.id,
          m.name,
          m.farmLocation || null,
          m.farmSize || null,
          m.primaryCrops || [],
          m.contactNumber || null,
          m.status || "Active",
          m.joinedDate || null,
          m.memberIdNumber || null,
          m.rsbsaNumber || null,
          Boolean(m.isRsbsaRegistered),
          m.avatarUrl || null,
          m.gender || null,
          m.birthDate || null
        ]);
      }
    }
    const txList = state.financialTransactions || state.transactions;
    if (txList && Array.isArray(txList) && txList.length > 0) {
      for (const tx of txList) {
        await client.query(`
          INSERT INTO financial_transactions (id, type, category, amount, date, description, recorded_by, fund_source, audited_status, audited_by, audited_date, audit_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            type = EXCLUDED.type,
            category = EXCLUDED.category,
            amount = EXCLUDED.amount,
            date = EXCLUDED.date,
            description = EXCLUDED.description,
            recorded_by = EXCLUDED.recorded_by,
            fund_source = EXCLUDED.fund_source,
            audited_status = EXCLUDED.audited_status,
            audited_by = EXCLUDED.audited_by,
            audited_date = EXCLUDED.audited_date,
            audit_notes = EXCLUDED.audit_notes;
        `, [
          tx.id,
          tx.type,
          tx.category,
          tx.amount,
          tx.date,
          tx.description,
          tx.recordedBy,
          tx.fundSource || null,
          tx.auditedStatus || "Unaudited",
          tx.auditedBy || null,
          tx.auditedDate || null,
          tx.auditNotes || null
        ]);
      }
    }
    if (state.meetings && Array.isArray(state.meetings) && state.meetings.length > 0) {
      for (const mt of state.meetings) {
        await client.query(`
          INSERT INTO meetings (id, title, date, location, attendance_count, agenda, minutes, officer_in_charge, attendance_record)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            date = EXCLUDED.date,
            location = EXCLUDED.location,
            attendance_count = EXCLUDED.attendance_count,
            agenda = EXCLUDED.agenda,
            minutes = EXCLUDED.minutes,
            officer_in_charge = EXCLUDED.officer_in_charge,
            attendance_record = EXCLUDED.attendance_record;
        `, [
          mt.id,
          mt.title,
          mt.date,
          mt.location,
          mt.attendanceCount || 0,
          mt.agenda || "",
          mt.minutes || "",
          mt.officerInCharge || "",
          JSON.stringify(mt.attendanceRecord || {})
        ]);
      }
    }
    if (state.hogRaising) {
      await client.query(`
        INSERT INTO hog_raising (id, capital_grant, produces, expenses, sales, groups, chore_logs, closed_years)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          capital_grant = EXCLUDED.capital_grant,
          produces = EXCLUDED.produces,
          expenses = EXCLUDED.expenses,
          sales = EXCLUDED.sales,
          groups = EXCLUDED.groups,
          chore_logs = EXCLUDED.chore_logs,
          closed_years = EXCLUDED.closed_years;
      `, [
        "hog_raising_main",
        state.hogRaising.capitalGrant || 0,
        state.hogRaising.produces || [],
        JSON.stringify(state.hogRaising.expenses || []),
        JSON.stringify(state.hogRaising.sales || []),
        JSON.stringify(state.hogRaising.groups || []),
        JSON.stringify(state.hogRaising.choreLogs || []),
        state.hogRaising.closedYears || []
      ]);
    }
    const logList = state.systemLogs || state.logs;
    if (logList && Array.isArray(logList) && logList.length > 0) {
      for (const lg of logList) {
        await client.query(`
          INSERT INTO system_logs (id, timestamp, user_name, role, action, details, sync_status, hash, previous_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            timestamp = EXCLUDED.timestamp,
            user_name = EXCLUDED.user_name,
            role = EXCLUDED.role,
            action = EXCLUDED.action,
            details = EXCLUDED.details,
            sync_status = EXCLUDED.sync_status,
            hash = EXCLUDED.hash,
            previous_hash = EXCLUDED.previous_hash;
        `, [
          lg.id,
          lg.timestamp,
          lg.user || lg.userName || "Officer",
          lg.role,
          lg.action,
          lg.details,
          lg.syncStatus || "Synced",
          lg.hash || null,
          lg.previousHash || null
        ]);
      }
    }
    if (state.products && Array.isArray(state.products) && state.products.length > 0) {
      for (const p of state.products) {
        await client.query(`
          INSERT INTO products (id, name, ceb_name, category, description, unit, price, quantity_available, stock_status, farmer_name, farmer_sitio, farmer_phone, contact_person, image_url, is_published, updated_by, managed_by, date_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            ceb_name = EXCLUDED.ceb_name,
            category = EXCLUDED.category,
            description = EXCLUDED.description,
            unit = EXCLUDED.unit,
            price = EXCLUDED.price,
            quantity_available = EXCLUDED.quantity_available,
            stock_status = EXCLUDED.stock_status,
            farmer_name = EXCLUDED.farmer_name,
            farmer_sitio = EXCLUDED.farmer_sitio,
            farmer_phone = EXCLUDED.farmer_phone,
            contact_person = EXCLUDED.contact_person,
            image_url = EXCLUDED.image_url,
            is_published = EXCLUDED.is_published,
            updated_by = EXCLUDED.updated_by,
            managed_by = EXCLUDED.managed_by,
            date_updated = EXCLUDED.date_updated;
        `, [
          p.id,
          p.name,
          p.cebName,
          p.category,
          p.description,
          p.unit,
          p.price,
          p.quantityAvailable,
          p.stockStatus,
          p.farmerName || null,
          p.farmerSitio || null,
          p.farmerPhone || null,
          p.contactPerson || null,
          p.imageUrl || null,
          p.isPublished ?? true,
          p.updatedBy || null,
          p.managedBy || null,
          p.dateUpdated || null
        ]);
      }
    }
    if (state.resolutions && Array.isArray(state.resolutions) && state.resolutions.length > 0) {
      for (const r of state.resolutions) {
        await client.query(`
          INSERT INTO resolutions (id, resolution_number, title, description, date_agreed, moved_by, seconded_by, vote_in_favor, vote_against, vote_abstain, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            resolution_number = EXCLUDED.resolution_number,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            date_agreed = EXCLUDED.date_agreed,
            moved_by = EXCLUDED.moved_by,
            seconded_by = EXCLUDED.seconded_by,
            vote_in_favor = EXCLUDED.vote_in_favor,
            vote_against = EXCLUDED.vote_against,
            vote_abstain = EXCLUDED.vote_abstain,
            status = EXCLUDED.status;
        `, [
          r.id,
          r.resolutionNumber,
          r.title,
          r.description,
          r.dateAgreed,
          r.movedBy,
          r.secondedBy,
          r.voteInFavor,
          r.voteAgainst,
          r.voteAbstain,
          r.status
        ]);
      }
    }
    if (state.announcements && Array.isArray(state.announcements) && state.announcements.length > 0) {
      for (const a of state.announcements) {
        await client.query(`
          INSERT INTO announcements (id, title, category, content, date_posted, priority, posted_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            category = EXCLUDED.category,
            content = EXCLUDED.content,
            date_posted = EXCLUDED.date_posted,
            priority = EXCLUDED.priority,
            posted_by = EXCLUDED.posted_by;
        `, [a.id, a.title, a.category, a.content, a.datePosted, a.priority, a.postedBy]);
      }
    }
    if (state.activities && Array.isArray(state.activities) && state.activities.length > 0) {
      for (const act of state.activities) {
        await client.query(`
          INSERT INTO activities (id, title, ceb_title, category, scheduled_date, date_scheduled, scheduled_time, time_scheduled, location, description, organizer, status, documented_notes, attendees_count, target_audience, image_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            ceb_title = EXCLUDED.ceb_title,
            category = EXCLUDED.category,
            scheduled_date = EXCLUDED.scheduled_date,
            date_scheduled = EXCLUDED.date_scheduled,
            scheduled_time = EXCLUDED.scheduled_time,
            time_scheduled = EXCLUDED.time_scheduled,
            location = EXCLUDED.location,
            description = EXCLUDED.description,
            organizer = EXCLUDED.organizer,
            status = EXCLUDED.status,
            documented_notes = EXCLUDED.documented_notes,
            attendees_count = EXCLUDED.attendees_count,
            target_audience = EXCLUDED.target_audience,
            image_url = EXCLUDED.image_url;
        `, [
          act.id,
          act.title,
          act.cebTitle || null,
          act.category,
          act.scheduledDate || act.dateScheduled || null,
          act.dateScheduled || act.scheduledDate || null,
          act.scheduledTime || act.timeScheduled || null,
          act.timeScheduled || act.scheduledTime || null,
          act.location,
          act.description,
          act.organizer,
          act.status,
          act.documentedNotes || null,
          act.attendeesCount || 0,
          act.targetAudience || null,
          act.imageUrl || null
        ]);
      }
    }
    const fundList = state.organizationFunds || state.funds;
    if (fundList && Array.isArray(fundList) && fundList.length > 0) {
      for (const f of fundList) {
        await client.query(`
          INSERT INTO organization_funds (id, name, code, allocated_amount, current_balance, description, custodian, last_updated)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            allocated_amount = EXCLUDED.allocated_amount,
            current_balance = EXCLUDED.current_balance,
            description = EXCLUDED.description,
            custodian = EXCLUDED.custodian,
            last_updated = EXCLUDED.last_updated;
        `, [
          f.id,
          f.name,
          f.code,
          f.allocatedAmount || 0,
          f.currentBalance || 0,
          f.description || "",
          f.custodian || "",
          f.lastUpdated || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        ]);
      }
    }
    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// src/api/helper.ts
function sendResponse(res, statusCode, data) {
  try {
    if (res.headersSent) return;
    if (typeof res.status === "function" && typeof res.json === "function") {
      return res.status(statusCode).json(data);
    }
    res.statusCode = statusCode;
    if (typeof res.setHeader === "function") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    return res.end(JSON.stringify(data));
  } catch (err) {
    console.error("[sendResponse Error]:", err);
  }
}
async function parseRequestBody(req) {
  if (req.body) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

// src/api/seed.ts
async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      if (typeof res.status === "function") return res.status(200).end();
      res.statusCode = 200;
      return res.end();
    }
    if (!isDatabaseConfigured()) {
      return sendResponse(res, 400, {
        success: false,
        message: "DATABASE_URL is not configured."
      });
    }
    const pool = getPool();
    await ensureDatabaseSchema(pool);
    const body = await parseRequestBody(req);
    if (body && Object.keys(body).length > 0) {
      await saveFullStateToPostgres(pool, body);
    } else {
      await migrateSeedData(pool);
    }
    const stats = await getTableStats(pool);
    return sendResponse(res, 200, {
      success: true,
      message: `Successfully populated Supabase tables! (${stats.totalRecords} records across 11 tables)`,
      tableCounts: stats.tableCounts,
      totalRecords: stats.totalRecords
    });
  } catch (error) {
    console.error("[Cloud DB Seed Handler Error]:", error);
    return sendResponse(res, 500, {
      success: false,
      message: `Failed to seed database: ${error?.message || error}`
    });
  }
}
export {
  handler as default
};
