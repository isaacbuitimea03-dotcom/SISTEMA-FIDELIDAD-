import { RegisteredCustomer, VisitRecord, ActivityLog } from '../types';

interface RawCustomerDef {
  birthday: string;
  stamps: number;
  folio: string;
  phone: string;
  name: string;
}

const RAW_CUSTOMERS: RawCustomerDef[] = [
  { birthday: "1973-12-04", stamps: 1, folio: "092", phone: "6424820518", name: "Ignacio Tozal" },
  { birthday: "1967-10-29", stamps: 1, folio: "091", phone: "6622274212", name: "Alma Leticia Velarde" },
  { birthday: "1960-01-15", stamps: 1, folio: "090", phone: "6421049609", name: "Chayito Zazueta" },
  { birthday: "2002-05-29", stamps: 1, folio: "089", phone: "6474828315", name: "Brian Flores Mendivil" },
  { birthday: "1975-02-06", stamps: 1, folio: "088", phone: "6421040595", name: "Maria Zuleika Lagarda Vlza." },
  { birthday: "1986-06-04", stamps: 1, folio: "087", phone: "6441970762", name: "Iliana Maria B. Lujan" },
  { birthday: "1971-02-28", stamps: 1, folio: "085", phone: "6621710725", name: "Lourdes B. Sonia Rivera" },
  { birthday: "1971-06-10", stamps: 1, folio: "086", phone: "6421077010", name: "luz del carmen" },
  { birthday: "1999-11-29", stamps: 1, folio: "084", phone: "5205434523", name: "Mariely Rodriguez Salcido" },
  { birthday: "1980-12-23", stamps: 1, folio: "083", phone: "6639331416", name: "Mariza Lizeth Valdez" },
  { birthday: "1996-02-28", stamps: 1, folio: "082", phone: "6421312916", name: "Ayari Gpe. Alvarez" },
  { birthday: "1992-04-14", stamps: 1, folio: "081", phone: "6441936946", name: "Estefania Serra Valdez" },
  { birthday: "1988-12-23", stamps: 1, folio: "080", phone: "5517745067", name: "Gustavo Ceron" },
  { birthday: "1987-08-13", stamps: 1, folio: "079", phone: "6421094420", name: "Gisel Bojorquez" },
  { birthday: "2000-11-26", stamps: 1, folio: "078", phone: "6421565255", name: "Legna Millanes Romero" },
  { birthday: "1981-09-22", stamps: 1, folio: "077", phone: "6424829001", name: "Andrea Gonzalez Almada" },
  { birthday: "1971-05-12", stamps: 1, folio: "076", phone: "6621038616", name: "Cecilia Palafox" },
  { birthday: "1985-09-09", stamps: 1, folio: "075", phone: "6424834935", name: "Paola Blanco" },
  { birthday: "1996-02-14", stamps: 1, folio: "074", phone: "641351776", name: "Ailec Quiroz" },
  { birthday: "1995-04-28", stamps: 1, folio: "073", phone: "6421049793", name: "Dayani Meraz" },
  { birthday: "1962-05-02", stamps: 1, folio: "072", phone: "6421340286", name: "Guadalupe Fuentes Leyva" },
  { birthday: "1998-05-21", stamps: 1, folio: "071", phone: "6421343631", name: "Alma Viridiana B." },
  { birthday: "1967-07-25", stamps: 1, folio: "070", phone: "6424286416", name: "Hilda Fuentes Leyva" },
  { birthday: "1956-10-23", stamps: 1, folio: "069", phone: "6474045595", name: "Servando Peñuñuri A." },
  { birthday: "1999-08-26", stamps: 1, folio: "068", phone: "6421505663", name: "Wendy Olivares" },
  { birthday: "1995-07-10", stamps: 1, folio: "067", phone: "6421031715", name: "Diana Maria Valenzuela" },
  { birthday: "1982-09-25", stamps: 1, folio: "066", phone: "6441380330", name: "Nubia Ramos Ortiz" },
  { birthday: "1992-10-19", stamps: 1, folio: "065", phone: "6181338890", name: "Grisma Paola Lopez" },
  { birthday: "1963-10-02", stamps: 1, folio: "063", phone: "6421161294", name: "Maria del Carmen Cordova G." },
  { birthday: "1980-08-31", stamps: 1, folio: "064", phone: "6421511305", name: "Araceli Barba Piña" },
  { birthday: "2000-03-01", stamps: 1, folio: "062", phone: "6421800027", name: "Denisse Guzman Vlza" },
  { birthday: "1999-02-16", stamps: 1, folio: "061", phone: "6621725263", name: "Vianilceith Gpe. Plata G." },
  { birthday: "1990-01-10", stamps: 1, folio: "057", phone: "6421046953", name: "Janett Sanchez" },
  { birthday: "1997-09-28", stamps: 1, folio: "060", phone: "6421358002", name: "Nayeli Monteon" },
  { birthday: "1995-01-28", stamps: 1, folio: "059", phone: "6421610227", name: "Madaì Perez" },
  { birthday: "1994-02-07", stamps: 1, folio: "058", phone: "6421166349", name: "Miriam Alexia Rodriguez Torres" },
  { birthday: "1990-08-24", stamps: 1, folio: "056", phone: "6421525433", name: "Daniel Ramos" },
  { birthday: "1959-05-09", stamps: 1, folio: "054", phone: "6421150147", name: "Maria Haydee Ross Vzla." },
  { birthday: "2008-04-01", stamps: 1, folio: "055", phone: "6421085577", name: "Carlos Isaac Barreras" },
  { birthday: "2001-04-17", stamps: 1, folio: "004", phone: "6471052292", name: "Juan Carlos Castro B." },
  { birthday: "1987-11-04", stamps: 2, folio: "053", phone: "6421490979", name: "Karla Camacho" },
  { birthday: "1984-08-15", stamps: 1, folio: "052", phone: "6471050286", name: "Alejandra Barraza Clarts" },
  { birthday: "2000-08-05", stamps: 1, folio: "051", phone: "6474235083", name: "Melisa Austin" },
  { birthday: "1989-05-22", stamps: 1, folio: "050", phone: "4421060607", name: "Jesus Jaime Hirado Mercado" },
  { birthday: "1997-02-04", stamps: 1, folio: "049", phone: "6421415287", name: "Luis David Gómez Loza" },
  { birthday: "1988-08-03", stamps: 1, folio: "048", phone: "6428530657", name: "Gregorio Navarro" },
  { birthday: "1970-07-08", stamps: 1, folio: "047", phone: "6471176721", name: "Alejandro Urbalejo" },
  { birthday: "1992-02-16", stamps: 1, folio: "046", phone: "6441219894", name: "Jose Lopez" },
  { birthday: "1977-07-28", stamps: 1, folio: "045", phone: "6421514782", name: "Sandra Higuera" },
  { birthday: "1993-05-21", stamps: 1, folio: "044", phone: "7222476602", name: "Alma Rosa Cancino" },
  { birthday: "1994-07-15", stamps: 1, folio: "043", phone: "6449977211", name: "Alix Nayeli López Topete" },
  { birthday: "2009-08-01", stamps: 1, folio: "042", phone: "6421501027", name: "Kelly Castañeda" },
  { birthday: "2007-10-26", stamps: 1, folio: "041", phone: "6442302811", name: "ANA LAURA" },
  { birthday: "1977-04-03", stamps: 1, folio: "040", phone: "6421512387", name: "Silvia Pacheco Corral" },
  { birthday: "1976-11-25", stamps: 1, folio: "039", phone: "6421582762", name: "Yadira Aguilera Alamea" },
  { birthday: "1998-10-15", stamps: 1, folio: "038", phone: "6441688825", name: "Yoseline Hernandez" },
  { birthday: "1972-09-10", stamps: 1, folio: "037", phone: "6421139602", name: "Aracely Martinez Villalobos" },
  { birthday: "1989-11-03", stamps: 1, folio: "036", phone: "6424829774", name: "Marín Montoya" },
  { birthday: "2000-05-02", stamps: 1, folio: "035", phone: "6421006008", name: "Jairo Sainz Rincon" },
  { birthday: "1959-11-14", stamps: 1, folio: "034", phone: "9991279182", name: "Leticia Almada" },
  { birthday: "1971-09-10", stamps: 1, folio: "033", phone: "6421121823", name: "Maribel García" },
  { birthday: "1993-09-27", stamps: 1, folio: "032", phone: "6421583145", name: "Raquel Aracely Moreno" },
  { birthday: "1996-05-23", stamps: 1, folio: "031", phone: "6471142470", name: "Raul Ramírez g" },
  { birthday: "1994-01-15", stamps: 1, folio: "030", phone: "6471261256", name: "Jessica Medina" },
  { birthday: "1971-01-08", stamps: 1, folio: "029", phone: "6421356361", name: "Francisca Delia Castro V." },
  { birthday: "1997-04-11", stamps: 1, folio: "028", phone: "6471084470", name: "Eloisa Yocupicio Avila" },
  { birthday: "1983-08-19", stamps: 1, folio: "027", phone: "6421419504", name: "Ana Espinoza" },
  { birthday: "1963-10-03", stamps: 1, folio: "026", phone: "9931435383", name: "Trinidad Limon" },
  { birthday: "1992-06-12", stamps: 1, folio: "025", phone: "6421151475", name: "Tania Gpe. Zazueta V." },
  { birthday: "1973-02-16", stamps: 1, folio: "024", phone: "6428533672", name: "Claudia Balderrama" },
  { birthday: "1963-12-14", stamps: 1, folio: "022", phone: "6471100436", name: "Luz Maria Castro" },
  { birthday: "1960-07-30", stamps: 1, folio: "023", phone: "6421088500", name: "Julia Noriega M." },
  { birthday: "2006-09-18", stamps: 1, folio: "021", phone: "6424266120", name: "Camila Odalys Morales" },
  { birthday: "1963-11-13", stamps: 2, folio: "019", phone: "6623369251", name: "Griselda Felix" },
  { birthday: "1994-01-27", stamps: 1, folio: "020", phone: "6421522206", name: "Daniela Valenzuela" },
  { birthday: "1987-02-23", stamps: 1, folio: "018", phone: "6471141106", name: "Sheila Adriana Zavala Navarro" },
  { birthday: "1989-10-18", stamps: 1, folio: "017", phone: "6421648692", name: "Daniel Peñuñuri Valle" },
  { birthday: "1987-12-08", stamps: 2, folio: "016", phone: "6421088549", name: "Claudia Villaseñor" },
  { birthday: "1965-05-15", stamps: 1, folio: "015", phone: "6863763090", name: "Lourdes Palomares V." },
  { birthday: "1981-06-20", stamps: 1, folio: "014", phone: "6421169793", name: "Marielos Mcpherson" },
  { birthday: "1995-01-05", stamps: 1, folio: "013", phone: "7228742059", name: "Abdiel Rodolfo Romero" },
  { birthday: "1988-10-07", stamps: 1, folio: "012", phone: "6421168754", name: "Roxana Barreras" },
  { birthday: "1988-07-27", stamps: 1, folio: "011", phone: "6424821807", name: "MANUEL QUINTERO" },
  { birthday: "1993-01-10", stamps: 1, folio: "010", phone: "6441007089", name: "LILIANA BELTRAN CARAVEO" },
  { birthday: "1990-06-25", stamps: 1, folio: "009", phone: "6421341664", name: "CINTHYA BORBON G" },
  { birthday: "1980-01-12", stamps: 1, folio: "008", phone: "6424836591", name: "Perla Lopez Acuña" },
  { birthday: "2001-12-21", stamps: 1, folio: "007", phone: "6421476614", name: "Clara Montaño" },
  { birthday: "1985-01-26", stamps: 1, folio: "006", phone: "9625179225", name: "Ezequiel Alvarez" },
  { birthday: "1962-05-27", stamps: 1, folio: "005", phone: "6428536607", name: "Martha Alicia Angel Felix" },
  { birthday: "2001-07-20", stamps: 1, folio: "003", phone: "6421950032", name: "Arlett Zazueta" },
  { birthday: "1995-08-07", stamps: 1, folio: "002", phone: "642138384", name: "Dulce Escalante" }
];

export const PREMIUM_BASE_CUSTOMERS: RegisteredCustomer[] = RAW_CUSTOMERS.map((rc, idx) => {
  const email = rc.name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, '') + '@gmail.com';

  const CLERKS_ROSTER = [
    { name: 'Jose Luis', code: 'CO1' },
    { name: 'Diana', code: 'CR02' },
    { name: 'Noelia', code: 'C03' },
    { name: 'Amairani', code: 'CR04' },
    { name: 'Gisela', code: 'C05' }
  ];

  const customerVisits: VisitRecord[] = [];
  for (let i = 1; i <= rc.stamps; i++) {
    const day = i === 1 ? '06' : '07';
    const hour = String(9 + (idx % 8)).padStart(2, '0');
    const minute = String((idx * 13) % 60).padStart(2, '0');
    const assignedClerk = CLERKS_ROSTER[(idx + i) % CLERKS_ROSTER.length];
    customerVisits.push({
      id: `v_init_${rc.folio}_${i}`,
      timestamp: `2026-06-${day}T${hour}:${minute}:00.000Z`,
      stampsAdded: 1,
      clerkName: assignedClerk.name,
      clerkCode: assignedClerk.code,
      customerFolio: rc.folio,
      customerName: rc.name
    });
  }

  return {
    folio: rc.folio,
    name: rc.name,
    email: email,
    phone: rc.phone,
    birthday: rc.birthday,
    currentStamps: rc.stamps,
    totalStampsEarned: rc.stamps,
    points: rc.stamps * 100,
    unlockedVouchers: [],
    visitsHistory: customerVisits
  };
});

export const INITIAL_VISITS: VisitRecord[] = PREMIUM_BASE_CUSTOMERS.flatMap(c => c.visitsHistory);

export const INITIAL_LOGS: ActivityLog[] = INITIAL_VISITS.map(v => ({
  id: 'log_' + v.id,
  type: 'stamp_added' as const,
  amount: v.stampsAdded,
  title: `Registro de Visita #${v.customerFolio}`,
  description: `Se registró visita por el encargado ${v.clerkName} (${v.clerkCode}) para ${v.customerName}.`,
  timestamp: v.timestamp,
  clerkName: v.clerkName,
  clerkCode: v.clerkCode,
  customerFolio: v.customerFolio
}));

export function generateInitialCustomers(): RegisteredCustomer[] {
  return PREMIUM_BASE_CUSTOMERS;
}
