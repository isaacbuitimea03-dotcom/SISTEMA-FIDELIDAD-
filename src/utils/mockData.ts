import { RegisteredCustomer, VisitRecord, ActivityLog } from '../types';

export const PREMIUM_BASE_CUSTOMERS: RegisteredCustomer[] = [
  {
    folio: '002',
    name: 'Dulce Escalante',
    email: 'sgs@gmail.com',
    phone: '6421138384',
    birthday: '1998-08-07',
    currentStamps: 1,
    totalStampsEarned: 9,
    points: 150,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '003',
    name: 'Arlett Zazueta',
    email: 'sarahizazueta@outlook.es',
    phone: '6421950032',
    birthday: '1995-07-20',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '004',
    name: 'Juan Carlos Castro B.',
    email: 'juancarloscastro2001@gmail.com',
    phone: '6471052292',
    birthday: '2001-04-17',
    currentStamps: 1,
    totalStampsEarned: 9,
    points: 250,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '005',
    name: 'Martha Alicia Angel Felix',
    email: 'martha.felix@gmail.com',
    phone: '6428536607',
    birthday: '1990-05-27',
    currentStamps: 2,
    totalStampsEarned: 2,
    points: 200,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '006',
    name: 'Ezequiel Alvarez',
    email: 'ezequiel.alvarez@outlook.com',
    phone: '9625179225',
    birthday: '1994-01-26',
    currentStamps: 3,
    totalStampsEarned: 11,
    points: 300,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '007',
    name: 'Clara Montaño',
    email: 'clara.montano@yahoo.com',
    phone: '6421476614',
    birthday: '1993-12-21',
    currentStamps: 4,
    totalStampsEarned: 4,
    points: 400,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '086',
    name: 'luz del carmen',
    email: 'luz_carmen@gmail.com',
    phone: '6421077010',
    birthday: '1992-06-10', // June 10
    currentStamps: 5,
    totalStampsEarned: 13,
    points: 500,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '025',
    name: 'Tania Gpe. Zazueta V.',
    email: 'tgzv_0101@hotmail.com',
    phone: '6421151475',
    birthday: '1996-06-12', // June 12
    currentStamps: 6,
    totalStampsEarned: 6,
    points: 600,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '014',
    name: 'Marielos Mcpherson',
    email: 'angiemc_lastra@hotmail.com',
    phone: '6421169793',
    birthday: '1997-06-20', // June 20
    currentStamps: 7,
    totalStampsEarned: 15,
    points: 700,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '009',
    name: 'CINTHYA BORBON G',
    email: 'susyrbd46@hotmail.com',
    phone: '6421341664',
    birthday: '1994-06-25', // June 25
    currentStamps: 2,
    totalStampsEarned: 10,
    points: 200,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '013',
    name: 'Abdiel Rodolfo Romero',
    email: 'abdiel_rod@gmail.com',
    phone: '6421998822',
    birthday: '1989-01-05',
    currentStamps: 3,
    totalStampsEarned: 3,
    points: 300,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '029',
    name: 'Francisca Delia Castro V.',
    email: 'fran.delia@outlook.com',
    phone: '6441553322',
    birthday: '1991-01-08',
    currentStamps: 4,
    totalStampsEarned: 4,
    points: 400,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '057',
    name: 'Janett Sanchez',
    email: 'sanchez.janett@gmail.com',
    phone: '6421234567',
    birthday: '1994-01-10',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '010',
    name: 'LILIANA BELTRAN CARAVEO',
    email: 'lilibeltran@gmail.com',
    phone: '6429876543',
    birthday: '1995-01-10',
    currentStamps: 5,
    totalStampsEarned: 13,
    points: 500,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '008',
    name: 'Perla Lopez Acuña',
    email: 'perla.lacuna@gmail.com',
    phone: '6421122334',
    birthday: '1988-01-12',
    currentStamps: 2,
    totalStampsEarned: 2,
    points: 200,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '090',
    name: 'Chayito Zazueta',
    email: 'chayito_sweet@gmail.com',
    phone: '6421049609',
    birthday: '1990-01-15',
    currentStamps: 1,
    totalStampsEarned: 9,
    points: 150,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '030',
    name: 'Jessica Medina',
    email: 'jess.medina@gmail.com',
    phone: '6421155998',
    birthday: '1992-01-15',
    currentStamps: 2,
    totalStampsEarned: 10,
    points: 200,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '020',
    name: 'Daniela Valenzuela',
    email: 'dani.valenzuela@gmail.com',
    phone: '6421144332',
    birthday: '1996-01-27',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '053',
    name: 'Karla Camacho',
    email: 'karlacamacho@hotmail.com',
    phone: '6421987556',
    birthday: '1993-04-05',
    currentStamps: 2,
    totalStampsEarned: 2,
    points: 200,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '092',
    name: 'Ignacio Tozal',
    email: 'ignacio_toz@gmail.com',
    phone: '6424820518',
    birthday: '1990-11-20',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '091',
    name: 'Alma Leticia Velarde',
    email: 'almalet_vel@gmail.com',
    phone: '6622274212',
    birthday: '1992-07-15',
    currentStamps: 2,
    totalStampsEarned: 2,
    points: 200,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '016',
    name: 'Claudia Villaseñor',
    email: 'claudiav@gmail.com',
    phone: '6421112223',
    birthday: '1994-03-30',
    currentStamps: 3,
    totalStampsEarned: 3,
    points: 300,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '089',
    name: 'Brian Flores Mendivil',
    email: 'brian_floresm@gmail.com',
    phone: '6474828315',
    birthday: '1997-10-14',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '088',
    name: 'Maria Zuleika Lagarda Vlza.',
    email: 'zulelagarda@gmail.com',
    phone: '6421040595',
    birthday: '1995-12-08',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '087',
    name: 'Iliana Maria B. Lujan',
    email: 'iliana_lujan@gmail.com',
    phone: '6421123485',
    birthday: '1994-05-18',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  },
  {
    folio: '085',
    name: 'Lourdes B. Sonia Rivera',
    email: 'lulu_sonia@gmail.com',
    phone: '6421144556',
    birthday: '1991-03-24',
    currentStamps: 1,
    totalStampsEarned: 1,
    points: 100,
    unlockedVouchers: [],
    visitsHistory: []
  }
];

export const DUMMY_SPANISH_NAMES = [
  'Arturo Perez', 'Valeria Quiroga', 'Sebastian Ruiz', 'Monica Gastelum', 'Alejandro Leyva',
  'Guadalupe Orozco', 'Francisco Moreno', 'Gabriela Leyva', 'Roberto Mendez', 'Daniela Felix',
  'Fernando Tapia', 'Patricia Lopez', 'Jose Luis Chavez', 'Maria Jesus Coronado', 'Manuel Lopez',
  'Yolanda Gutierrez', 'Cecilia Gaxiola', 'David Valenzuela', 'Sofia Miranda', 'Andres Lopez',
  'Rocio Beltran', 'Guillermo Duarte', 'Liliana Icedo', 'Angelica Duarte', 'Gabriel Gastelum',
  'Rosa Maria Ley', 'Claudio Valenzuela', 'Oscar Bojorquez', 'Aracely Perez', 'Enrique Meza',
  'Norma Alicia Vega', 'Jorge Luis Felix', 'Silvia Sanchez', 'Ramon Morales', 'Isabel Coronado',
  'Humberto Encinas', 'Juana Rodriguez', 'Carlos Almada', 'Carmen Coronado', 'Luis Alberto Leon',
  'Teresa Mendez', 'Jesus Manuel Vega', 'Socorro Beltran', 'Mario Rodriguez', 'Fabiola Valenzuela',
  'Griselda Fernandez', 'Rogelio Miranda', 'Virginia Leyva', 'Guadalupe Romero', 'Héctor Ramirez'
];

export const INITIAL_VISITS: VisitRecord[] = [
  {
    id: 'v_init_10',
    timestamp: '2026-06-07T20:31:00.000Z',
    stampsAdded: 2,
    clerkName: 'Diana',
    clerkCode: 'CR02',
    customerFolio: '053',
    customerName: 'Karla Camacho'
  },
  {
    id: 'v_init_11',
    timestamp: '2026-06-07T15:28:00.000Z',
    stampsAdded: 1,
    clerkName: 'Arlett',
    clerkCode: 'C03',
    customerFolio: '092',
    customerName: 'Ignacio Tozal'
  },
  {
    id: 'v_init_12',
    timestamp: '2026-06-07T12:49:00.000Z',
    stampsAdded: 1,
    clerkName: 'Arlett',
    clerkCode: 'C03',
    customerFolio: '091',
    customerName: 'Alma Leticia Velarde'
  },
  {
    id: 'v_init_13',
    timestamp: '2026-06-07T12:47:00.000Z',
    stampsAdded: 2,
    clerkName: 'Arlett',
    clerkCode: 'C03',
    customerFolio: '016',
    customerName: 'Claudia Villaseñor'
  },
  {
    id: 'v_init_14',
    timestamp: '2026-06-07T09:36:00.000Z',
    stampsAdded: 1,
    clerkName: 'Arlett',
    clerkCode: 'C03',
    customerFolio: '090',
    customerName: 'Chayito Zazueta'
  },
  {
    id: 'v_init_15',
    timestamp: '2026-06-06T23:29:00.000Z',
    stampsAdded: 1,
    clerkName: 'Diana',
    clerkCode: 'CR02',
    customerFolio: '089',
    customerName: 'Brian Flores Mendivil'
  },
  {
    id: 'v_init_16',
    timestamp: '2026-06-06T23:15:00.000Z',
    stampsAdded: 1,
    clerkName: 'Diana',
    clerkCode: 'CR02',
    customerFolio: '088',
    customerName: 'Maria Zuleika Lagarda Vlza.'
  },
  {
    id: 'v_init_17',
    timestamp: '2026-06-06T23:15:00.000Z',
    stampsAdded: 1,
    clerkName: 'Diana',
    clerkCode: 'CR02',
    customerFolio: '087',
    customerName: 'Iliana Maria B. Lujan'
  },
  {
    id: 'v_init_18',
    timestamp: '2026-06-06T23:15:00.000Z',
    stampsAdded: 1,
    clerkName: 'Diana',
    clerkCode: 'CR02',
    customerFolio: '085',
    customerName: 'Lourdes B. Sonia Rivera'
  },
  {
    id: 'v_init_19',
    timestamp: '2026-06-06T18:26:00.000Z',
    stampsAdded: 1,
    clerkName: 'Ezequiel',
    clerkCode: 'C01',
    customerFolio: '002',
    customerName: 'Dulce Escalante'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  ...INITIAL_VISITS.map(v => ({
    id: 'log_' + v.id,
    type: 'stamp_added' as const,
    amount: v.stampsAdded,
    title: `Registro de Visita #${v.customerFolio}`,
    description: `Se registró visita por el encargado ${v.clerkName} (${v.clerkCode}) para ${v.customerName}.`,
    timestamp: v.timestamp,
    clerkName: v.clerkName,
    clerkCode: v.clerkCode,
    customerFolio: v.customerFolio
  }))
];

export function generateInitialCustomers(): RegisteredCustomer[] {
  const generatedList = [...PREMIUM_BASE_CUSTOMERS];
  const occupiedFolios = new Set(PREMIUM_BASE_CUSTOMERS.map(c => c.folio));
  
  let nameIndex = 0;
  for (let cardNum = 1; cardNum <= 100; cardNum++) {
    if (generatedList.length >= 91) break;
    const padFolio = String(cardNum).padStart(3, '0');
    if (!occupiedFolios.has(padFolio)) {
      const gName = DUMMY_SPANISH_NAMES[nameIndex % DUMMY_SPANISH_NAMES.length] + ' ' + (['Mendoza', 'Soto', 'Gomez', 'Cruz', 'Diaz', 'Acuña', 'Vargas', 'Ramos'][cardNum % 8]);
      const gPhone = '6421' + String(100000 + cardNum * 2315).substring(0, 6);
      const gEmail = gName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, '') + '@gmail.com';
      
      const randomMonth = String((cardNum % 12) + 1).padStart(2, '0');
      const randomDay = String((cardNum % 28) + 1).padStart(2, '0');
      
      const customVisits: VisitRecord[] = [];
      const numVisits = (cardNum % 12) + 1;
      
      generatedList.push({
        folio: padFolio,
        name: gName,
        email: gEmail,
        phone: gPhone,
        birthday: `1994-${randomMonth}-${randomDay}`,
        currentStamps: cardNum % 8, 
        totalStampsEarned: cardNum % 8,
        points: (cardNum % 8) * 100,
        unlockedVouchers: [],
        visitsHistory: customVisits
      });
      nameIndex++;
    }
  }
  return generatedList;
}
