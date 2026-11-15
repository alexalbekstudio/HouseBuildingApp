const API_URL = '/api';
let mapInstance = null;
let parcelMarker = null;
let currentPhases = [];
let currentCompanies = [];
let currentLang = localStorage.getItem('hb_lang') || 'sr';
let authToken = localStorage.getItem('hb_token');
let currentUser = null;
let isRegisterMode = false;
let currentProjectId = localStorage.getItem('hb_active_project_id') || '1';

window.switchProject = (projectId) => {
  currentProjectId = projectId;
  localStorage.setItem('hb_active_project_id', projectId);
  // Ponovo učitaj podatke specifične za izabranu kuću
  window.location.reload();
};

// Pomoćna funkcija za slanje autorizovanih API zahteva
window.fetchAuth = async (url, options = {}) => {
  options.headers = options.headers || {};
  if (authToken) {
    if (options.headers instanceof Headers) {
      options.headers.set('Authorization', `Bearer ${authToken}`);
    } else {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
  }
  const res = await fetch(url, options);
  if (res.status === 401) {
    logout();
  }
  return res;
};

// ==========================================
// DVOJEZIČNOST (SR / EN) — KOMPLETAN SISTEM
// ==========================================
const i18n = {
  sr: {
    subtitle: 'Upravljanje izgradnjom kuće — pravni tok, budžet, firme i mapa',
    exportCsv: '📊 Izvezi CSV',
    plannedBudget: 'Planiran Budžet',
    totalSpent: 'Potrošeno',
    remaining: 'Preostalo',
    ocrProcessing: 'OCR analizira sliku i automatski popunjava podatke...',
    phasesTitle: 'Pravni tok — 8 faza od parcele do upotrebne dozvole',
    phasesHint: 'Izaberite status faze za automatsko ažuriranje',
    addExpense: '+ Dodaj Trošak',
    snapReceipt: 'Slikaj račun',
    labelPhase: 'Faza',
    labelCompany: 'Firma / Dobavljač',
    labelTitle: 'Opis stavke',
    labelAmount: 'Iznos (RSD)',
    labelPayment: 'Način plaćanja',
    labelReceiptFile: 'Prilog / Račun',
    btnSaveExpense: 'Sačuvaj Trošak',
    expensesTitle: 'Evidencija računa i isplata',
    addCompany: '+ Dodaj Firmu / Majstora',
    snapCard: 'Slikaj vizitkartu',
    addressHint: 'Adresa se automatski geolocira na mapi',
    btnSaveCompany: 'Sačuvaj Firmu',
    companiesTitle: 'Katalog Partnera i Izvođača',
    mapTitle: 'Mapa gradilišta i dobavljača',
    mapHint: 'Kliknite ili prevucite kućicu na tačnu parcelu u Melencima za trajno čuvanje u bazi',
    myLocation: 'Moja lokacija na terenu',
    addDoc: '📄 Priloži Dokument / Sliku',
    snapWork: 'Slikaj',
    docTitleLabel: 'Naziv dokumenta / radova',
    docPhaseLabel: 'Pravna faza',
    docFileLabel: 'Fajl (PDF, JPG, PNG)',
    btnSaveDoc: 'Sačuvaj u Arhiv',
    docsTitle: '📁 Arhiva dokumenata i slika',
    addMat: '+ Dodaj Materijal',
    snapMat: 'Slikaj deklaraciju',
    matNameLabel: 'Naziv materijala *',
    matUnitLabel: 'Jedinica mere',
    matPriceLabel: 'Proc. cena (RSD)',
    matCatLabel: 'Kategorija',
    matDescLabel: 'Opis / Napomena',
    btnSaveMat: 'Sačuvaj Materijal',
    matTitle: 'Katalog Građevinskog Materijala',
    totalCapLabel: 'Ukupan Kapital',
    totalCapSpent: 'Ukupno Isplaćeno',
    totalCapRem: 'Preostala Sredstva',
    addCapitalTitle: '+ Dodaj Izvor Kapitala',
    snapSlip: 'Slikaj uplatnicu',
    capSourceLabel: 'Naziv izvora *',
    capAmountLabel: 'Iznos (RSD) *',
    capCatLabel: 'Kategorija',
    capDateLabel: 'Datum uplate',
    btnSaveCap: 'Sačuvaj Izvor Kapitala',
    capitalsListTitle: 'Struktura Finansiranja',
    ganttTitle: 'Vremenska linija gradnje (Gantt)',
    ganttDesc: 'Planirani i stvarni periodi po fazama. Crvena linija označava današnji datum.',
    legendPlan: 'Planirano',
    legendDone: 'Završeno',
    addReminderTitle: '+ Dodaj Podsetnik',
    snapRem: 'Slikaj rok',
    remTitleLabel: 'Naziv obaveze *',
    remDateLabel: 'Datum dospeća *',
    remPriorityLabel: 'Prioritet',
    remCatLabel: 'Kategorija',
    remNoteLabel: 'Napomena',
    btnSaveRem: 'Sačuvaj Podsetnik',
    remindersListTitle: 'Aktivni Rokovi i Alarmi',
    btnGenLegal: 'Generiši zakonske rokove',
    camTitle: 'Slikaj račun / dokument',
    btnSnap: 'Snimi fotografiju',
    btnRetake: 'Slikaj ponovo',
    btnUse: 'Koristi sliku',
    notStarted: 'Nije početo',
    inProgress: 'U toku',
    completed: 'Završeno'
  },
  en: {
    subtitle: 'House Construction Management — legal flow, budget, contractors & map',
    exportCsv: '📊 Export CSV',
    plannedBudget: 'Planned Budget',
    totalSpent: 'Total Spent',
    remaining: 'Remaining',
    ocrProcessing: 'OCR analyzing image and autofilling data...',
    phasesTitle: 'Legal Flow — 8 phases from plot to occupancy permit',
    phasesHint: 'Select phase status for automatic update',
    addExpense: '+ Add Expense',
    snapReceipt: 'Snap receipt',
    labelPhase: 'Phase',
    labelCompany: 'Company / Contractor',
    labelTitle: 'Item description',
    labelAmount: 'Amount (RSD)',
    labelPayment: 'Payment method',
    labelReceiptFile: 'Attachment / Receipt',
    btnSaveExpense: 'Save Expense',
    expensesTitle: 'Receipts and Payments Log',
    addCompany: '+ Add Company / Contractor',
    snapCard: 'Snap business card',
    addressHint: 'Address is automatically geolocated on the map',
    btnSaveCompany: 'Save Company',
    companiesTitle: 'Partners & Contractors Directory',
    mapTitle: 'Construction site & supplier map',
    mapHint: 'Click or drag the house icon to the exact plot to save permanently',
    myLocation: 'My location on site',
    addDoc: '📄 Attach Document / Photo',
    snapWork: 'Capture',
    docTitleLabel: 'Document / work title',
    docPhaseLabel: 'Legal phase',
    docFileLabel: 'File (PDF, JPG, PNG)',
    btnSaveDoc: 'Save to Archive',
    docsTitle: '📁 Construction Site Archive',
    addMat: '+ Add Material',
    snapMat: 'Snap product label',
    matNameLabel: 'Material name *',
    matUnitLabel: 'Unit of measure',
    matPriceLabel: 'Est. price (RSD)',
    matCatLabel: 'Category',
    matDescLabel: 'Description / Note',
    btnSaveMat: 'Save Material',
    matTitle: 'Building Materials Catalog',
    totalCapLabel: 'Total Capital',
    totalCapSpent: 'Total Paid Out',
    totalCapRem: 'Remaining Funds',
    addCapitalTitle: '+ Add Capital Source',
    snapSlip: 'Snap deposit slip',
    capSourceLabel: 'Source name *',
    capAmountLabel: 'Amount (RSD) *',
    capCatLabel: 'Category',
    capDateLabel: 'Payment date',
    btnSaveCap: 'Save Capital Source',
    capitalsListTitle: 'Funding Structure',
    ganttTitle: 'Construction Timeline (Gantt)',
    ganttDesc: 'Planned and actual phase durations. Red line marks today\'s date.',
    legendPlan: 'Planned',
    legendDone: 'Completed',
    addReminderTitle: '+ Add Reminder',
    snapRem: 'Snap deadline',
    remTitleLabel: 'Obligation title *',
    remDateLabel: 'Due date *',
    remPriorityLabel: 'Priority',
    remCatLabel: 'Category',
    remNoteLabel: 'Note',
    btnSaveRem: 'Save Reminder',
    remindersListTitle: 'Active Deadlines & Alerts',
    btnGenLegal: 'Generate legal deadlines',
    camTitle: 'Capture receipt / document',
    btnSnap: 'Capture photo',
    btnRetake: 'Retake photo',
    btnUse: 'Use photo',
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed'
  }
};

// Rečnik svih tekstualnih čvorova (SR <-> EN) za tabove, faze iz baze, Dnevnik, Admin Panel, modale i tabele
const DOM_TEXT_PAIRS = [
  ['Gradilište:', 'Site:'],
  ['+ Nova kuća', '+ New Project'],
  ['Odjavi se', 'Logout'],
  ['Izvezi:', 'Export:'],
  ['Faze (8)', 'Phases (8)'],
  ['Finansije & OCR', 'Finance & OCR'],
  ['Partneri', 'Partners'],
  ['Karta', 'Map'],
  ['Dokumenti & Dnevnik', 'Docs & Site Log'],
  ['Materijali', 'Materials'],
  ['Kapital', 'Capital'],
  ['Rokovi', 'Timeline'],
  ['Admin Panel', 'Admin Panel'],
  // 8 faza gradnje iz baze
  ['Provera parcele i identiteta', 'Plot & Ownership Verification'],
  ['Katastarska parcela, vlasništvo, tereti, pristupni put.', 'Cadastral plot, ownership, encumbrances, access road.'],
  ['Planska pravila', 'Urban Planning Rules'],
  ['Namena, indeks zauzetosti i izgrađenosti, gabariti, spratnost.', 'Zoning purpose, occupancy & construction index, dimensions, floors.'],
  ['Geodetski i geotehnički podaci', 'Geodetic & Geotechnical Survey'],
  ['Geodetski snimak i geotehnički elaborat tla.', 'Geodetic survey and geotechnical soil study.'],
  ['Idejno rešenje (IDR)', 'Conceptual Design (IDR)'],
  ['Idejno rešenje montažne kuće usklađeno sa parcelom.', 'Conceptual house design aligned with the plot.'],
  ['Lokacijski uslovi', 'Location Conditions'],
  ['Lokacijski uslovi i priključci (struja, voda, put).', 'Location conditions and utility connections (power, water, road).'],
  ['Projekat i građevinska dozvola (PGD)', 'Main Project & Building Permit (PGD)'],
  ['Glavni projekat, takse i rešenje o građevinskoj dozvoli.', 'Main project, fees and building permit issuance.'],
  ['Prijava radova i gradnja', 'Works Registration & Construction'],
  ['Prijava radova, temelj, montaža i instalacije.', 'Works registration, foundation, assembly and installations.'],
  ['Tehnički pregled i upotrebna dozvola', 'Technical Inspection & Occupancy Permit'],
  ['Tehnički pregled objekta, uknjižba i upotrebna dozvola.', 'Technical inspection, registration and occupancy permit.'],
  ['NIJE POCETO', 'NOT STARTED'],
  ['NIJE POČETO', 'NOT STARTED'],
  ['U TOKU', 'IN PROGRESS'],
  ['ZAVRSENO', 'COMPLETED'],
  ['ZAVRŠENO', 'COMPLETED'],
  // Padajuće liste i prazna stanja
  ['Izaberite fazu...', 'Select phase...'],
  ['-- Bez firme --', '-- No company --'],
  ['Gotovina (keš)', 'Cash'],
  ['Račun / Prenos', 'Bank Transfer'],
  ['Kartica', 'Card'],
  ['Nema zabeleženih troškova.', 'No expenses recorded yet.'],
  ['Datum', 'Date'],
  ['Faza', 'Phase'],
  ['Opis', 'Description'],
  ['Firma', 'Company'],
  ['Plaćanje', 'Payment'],
  ['Iznos', 'Amount'],
  ['Račun', 'Receipt'],
  ['Izvođač', 'Contractor'],
  ['Stovarište', 'Building Supply'],
  ['Geometar', 'Surveyor'],
  ['Projektant', 'Architect'],
  ['Nadzor', 'Supervisor'],
  ['Nema unetih firmi ni majstora.', 'No companies or contractors added yet.'],
  ['Nema upisane adrese', 'No address entered'],
  // Dokumenti & Dnevnik radova
  ['-- Opšti dokument (bez faze) --', '-- General document (no phase) --'],
  ['Opšti dokument', 'General document'],
  ['Otvori fajl ↗', 'Open file ↗'],
  ['Nema priloženih dokumenata.', 'No documents attached yet.'],
  ['Dnevnik radova', 'Daily Site Log'],
  ['Automatski ili ručni unos vremenskih uslova.', 'Automatic or manual weather condition entry.'],
  ['Vrsta radova', 'Work Type'],
  ['Temperatura (°C)', 'Temperature (°C)'],
  ['Vrijeme / Vjetar', 'Weather / Wind'],
  ['Beleška / Opis toka radova', 'Notes / Work Progress Description'],
  ['Zabeleži u Dnevnik', 'Save Log Entry'],
  ['Zapisnik gradilišta & Vremenski uslovi', 'Site Log & Weather Conditions'],
  ['Istorija izvođenja radova sa podacima o temperaturi i vetru.', 'History of construction works with temperature and wind data.'],
  ['🔄 Osveži', '🔄 Refresh'],
  ['Nema unosa u građevinskom dnevniku za ovo gradilište.', 'No site log entries for this construction site yet.'],
  ['Hronološka Galerija Napretka', 'Chronological Progress Gallery'],
  ['Vizuelno praćenje radova i poređenje stanja po fazama gradnje.', 'Visual progress tracking and phase-by-phase comparison.'],
  ['Sve faze radova', 'All construction phases'],
  ['Nema evidentiranih fotografija za izabranu fazu (PDF dokumenti su u gornjoj arhivi).', 'No photos recorded for the selected phase (PDF documents are in the archive above).'],
  // Materijali, Kapital, Rokovi
  ['kom', 'pcs'],
  ['tona', 'ton'],
  ['metar', 'meter'],
  ['Nema unetog materijala u katalogu.', 'No materials in the catalog yet.'],
  ['Bez napomene', 'No notes'],
  ['Ušteđevina', 'Savings'],
  ['Bankarski Kredit', 'Bank Loan'],
  ['Pozajmica', 'Loan'],
  ['Pomoć / Donacija', 'Grant / Donation'],
  ['Nema unetih izvora finansiranja.', 'No funding sources added yet.'],
  ['Visoko', 'High'],
  ['Srednje', 'Medium'],
  ['Nisko', 'Low'],
  ['Dozvole i opština', 'Permits & Municipality'],
  ['Zakonski rok', 'Legal Deadline'],
  ['Gradilište i majstori', 'Site & Contractors'],
  ['Plaćanje i banka', 'Payment & Bank'],
  ['Opšte', 'General'],
  ['Nema aktivnih podsetnika. Kliknite na "Generiši zakonske rokove" da automatski popunite obaveze.', 'No active reminders. Click "Generate legal deadlines" to autofill obligations.'],
  // Admin Panel
  ['👑 SuperAdmin Kontrolna Tabla', '👑 SuperAdmin Control Panel'],
  ['Upravljanje pretplatnicima, licencama i statusima aktivacije', 'Manage subscribers, licenses and activation statuses'],
  ['Osveži podatke', 'Refresh Data'],
  ['Testiraj E-mail', 'Test Email'],
  ['Ukupno Korisnika', 'Total Users'],
  ['Aktivne Pretplate', 'Active Subscriptions'],
  ['U Probnom Periodu', 'In Trial Period'],
  ['Istekle', 'Expired'],
  ['Pregled Registrovanih Pretplatnika', 'Registered Subscribers Overview'],
  ['Korisnik', 'User'],
  ['Uloga', 'Role'],
  ['Plan', 'Plan'],
  ['Status Pretplata', 'Subscription Status'],
  ['Ističe', 'Expires'],
  ['Projekat & Statistika', 'Project & Stats'],
  ['Akcija', 'Action'],
  ['Neograničeno', 'Unlimited'],
  ['Bez projekta', 'No project'],
  ['+30 dana / Aktiviraj', '+30 Days / Activate'],
  ['Podešavanja & Licenca', 'Settings & License'],
  ['⚙️ Podešavanja Sistema & Brendiranje', '⚙️ System Settings & Branding'],
  ['Podešavanja Sistema & Brendiranje', 'System Settings & Branding'],
  ['Podaci o firmi/investitoru, prilagođeni logo, valuta, SMTP alarmi i licenca', 'Company/investor details, custom logo, currency, SMTP alerts and license'],
  ['Naziv firme / Investitora', 'Company / Investor Name'],
  ['PIB / Matični broj', 'Tax ID / Registration No.'],
  ['Adresa sedišta', 'Company Address'],
  ['Tekući račun / IBAN', 'Bank Account / IBAN'],
  ['Logo firme i Favicon (PNG/JPG)', 'Company Logo & Favicon (PNG/JPG)'],
  ['Ukloni logo', 'Remove logo'],
  ['Valuta prikaza', 'Display Currency'],
  ['Paket licence (Tier)', 'License Edition (Tier)'],
  ['📧 SMTP Podešavanja za Email Alarme o Rokovima', '📧 SMTP Settings for Deadline Email Alerts'],
  ['SMTP Podešavanja za Email Alarme o Rokovima', 'SMTP Settings for Deadline Email Alerts'],
  ['SMTP Host & Port', 'SMTP Host & Port'],
  ['SMTP Email (Korisnik)', 'SMTP Email (Username)'],
  ['Google App Password (16 znakova)', 'Google App Password (16 chars)'],
  ['💾 Sačuvaj sva podešavanja', '💾 Save All Settings'],
  ['Sačuvaj sva podešavanja', 'Save All Settings'],
  // Modal za novo gradilište i prijava
  ['Dodaj novo gradilište / kuću', 'Add New Construction Site / House'],
  ['Naziv objekta *', 'Project Name *'],
  ['Lokacija / Mesto', 'Location / City'],
  ['Okvirni planirani budžet (RSD)', 'Estimated Planned Budget (RSD)'],
  ['ℹ️ Sistem automatski kreira svih 8 zakonskih faza i prazan dnevnik za ovo novo gradilište.', 'ℹ️ The system automatically creates all 8 legal phases and an empty site log for this project.'],
  ['Otkaži', 'Cancel'],
  ['Kreiraj gradilište', 'Create Project'],
  ['Prijava na HouseBuilding SaaS', 'Sign in to HouseBuilding SaaS'],
  ['Sistem za praćenje izgradnje, troškova i dokumentacije', 'Construction, expense and document tracking system'],
  ['Vaše Ime i Prezime', 'Your Full Name'],
  ['Email adresa', 'Email Address'],
  ['Lozinka', 'Password'],
  ['Naziv vašeg projekta', 'Your Project Name'],
  ['Prijavi se', 'Sign In'],
  ['Nemate nalog? Registrujte se', "Don't have an account? Register"],
  ['Registracija novog naloga', 'Register New Account'],
  ['Kreiraj nalog & Započni projekat', 'Create Account & Start Project'],
  ['Već imate nalog? Prijavite se', 'Already have an account? Sign In'],
  // Footer
  ['Verzija 2.4 PWA', 'Version 2.4 PWA'],
  ['● Sistem aktivan', '● System active']
];

const PLACEHOLDER_PAIRS = [
  ['npr. Armaturna mreža Q335', 'e.g. Reinforcing mesh Q335'],
  ['Naziv firme / Ime *', 'Company / Contractor Name *'],
  ['PIB', 'Tax ID / VAT'],
  ['Adresa sedišta (npr. Melenci, Glavna 1)', 'Company address (e.g. Main St 1)'],
  ['Telefon', 'Phone number'],
  ['npr. Lokacijski uslovi ili Temeljna armatura', 'e.g. Location permit or Foundation rebar'],
  ['npr. Zidanje pregradnih zidova', 'e.g. Partition wall masonry'],
  ['Auto / npr. 22', 'Auto / e.g. 22'],
  ['Auto / npr. Sunčano', 'Auto / e.g. Sunny'],
  ['Opiši tok radova, zastoje ili napredak...', 'Describe work progress, delays or notes...'],
  ['Pretraži arhiv...', 'Search archive...'],
  ['npr. Beton MB30', 'e.g. Concrete MB30'],
  ['npr. Zidarski, Armatura, Izolacija', 'e.g. Masonry, Rebar, Insulation'],
  ['Specifikacija ili zahtevi za kvalitet...', 'Specification or quality requirements...'],
  ['npr. Ušteđevina, Kredit OTP banke', 'e.g. Savings, Bank loan'],
  ['npr. Prijava početka radova', 'e.g. Construction start notice'],
  ['Detalji, kontakti ili dokumenti...', 'Details, contacts or documents...'],
  ['npr. Vikendica Fruška Gora ili Kuća Melenci 2', 'e.g. Weekend House or Family Home 2'],
  ['npr. Melenci, Zrenjanin ili Vrdnik', 'e.g. Belgrade, Novi Sad'],
  ['Ulica i broj, Grad', 'Street and number, City'],
  ['vas-email@gmail.com', 'your-email@gmail.com']
];

const srToEnMap = new Map(DOM_TEXT_PAIRS.map(([sr, en]) => [sr.trim(), en]));
const enToSrMap = new Map(DOM_TEXT_PAIRS.map(([sr, en]) => [en.trim(), sr]));
const phSrToEnMap = new Map(PLACEHOLDER_PAIRS.map(([sr, en]) => [sr.trim(), en]));
const phEnToSrMap = new Map(PLACEHOLDER_PAIRS.map(([sr, en]) => [en.trim(), sr]));

let _isTranslatingDom = false;
window.translateFullDom = (lang) => {
  if (_isTranslatingDom) return;
  _isTranslatingDom = true;
  try {
    const dict = lang === 'en' ? srToEnMap : enToSrMap;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const tag = node.parentElement?.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE') continue;
      const raw = node.nodeValue;
      const trimmed = raw ? raw.trim() : '';
      if (!trimmed) continue;

      if (dict.has(trimmed)) {
        node.nodeValue = raw.replace(trimmed, dict.get(trimmed));
      } else if (lang === 'en') {
        if (trimmed.startsWith('Plan:')) node.nodeValue = raw.replace('Plan:', 'Planned:');
        else if (trimmed.startsWith('Procena:')) node.nodeValue = raw.replace('Procena:', 'Est. price:');
        else if (trimmed.includes('troškova,') && trimmed.includes('dok.)')) {
          node.nodeValue = raw.replace('troškova,', 'expenses,').replace('dok.)', 'docs)');
        } else if (trimmed.includes('Sva prava zadržana.')) {
          node.nodeValue = raw.replace('Sva prava zadržana.', 'All rights reserved.');
        }
      } else {
        if (trimmed.startsWith('Planned:')) node.nodeValue = raw.replace('Planned:', 'Plan:');
        else if (trimmed.startsWith('Est. price:')) node.nodeValue = raw.replace('Est. price:', 'Procena:');
        else if (trimmed.includes('expenses,') && trimmed.includes('docs)')) {
          node.nodeValue = raw.replace('expenses,', 'troškova,').replace('docs)', 'dok.)');
        } else if (trimmed.includes('All rights reserved.')) {
          node.nodeValue = raw.replace('All rights reserved.', 'Sva prava zadržana.');
        }
      }
    }

    const phDict = lang === 'en' ? phSrToEnMap : phEnToSrMap;
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      const ph = (el.getAttribute('placeholder') || '').trim();
      if (phDict.has(ph)) el.setAttribute('placeholder', phDict.get(ph));
    });
  } finally {
    _isTranslatingDom = false;
  }
};

const setSafeText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

window.setLanguage = (lang) => {
  currentLang = lang;
  localStorage.setItem('hb_lang', lang);

  const btnSr = document.getElementById('lang-sr');
  const btnEn = document.getElementById('lang-en');
  const helpBtnText = document.getElementById('t-btn-help');
  if (helpBtnText) {
    helpBtnText.innerText = lang === 'en' ? 'Help' : 'Pomoć';
  }
  if (btnSr && btnEn) {
    if (lang === 'sr') {
      btnSr.className = 'px-2.5 py-1 rounded bg-blue-600 text-white transition';
      btnEn.className = 'px-2.5 py-1 rounded text-slate-600 hover:text-slate-900 transition';
    } else {
      btnEn.className = 'px-2.5 py-1 rounded bg-blue-600 text-white transition';
      btnSr.className = 'px-2.5 py-1 rounded text-slate-600 hover:text-slate-900 transition';
    }
  }

  const t = i18n[lang] || i18n.sr;
  setSafeText('t-subtitle', t.subtitle);
  setSafeText('t-export-csv', t.exportCsv);
  setSafeText('t-planned-budget', t.plannedBudget);
  setSafeText('t-total-spent', t.totalSpent);
  setSafeText('t-remaining', t.remaining);
  setSafeText('t-ocr-processing', t.ocrProcessing);
  setSafeText('t-phases-title', t.phasesTitle);
  setSafeText('t-phases-hint', t.phasesHint);
  setSafeText('t-add-expense', t.addExpense);
  setSafeText('t-snap-receipt', t.snapReceipt);
  setSafeText('t-label-phase', t.labelPhase);
  setSafeText('t-label-company', t.labelCompany);
  setSafeText('t-label-title', t.labelTitle);
  setSafeText('t-label-amount', t.labelAmount);
  setSafeText('t-label-payment', t.labelPayment);
  setSafeText('t-label-receipt-file', t.labelReceiptFile);
  setSafeText('t-btn-save-expense', t.btnSaveExpense);
  setSafeText('t-expenses-title', t.expensesTitle);
  setSafeText('t-add-company', t.addCompany);
  setSafeText('t-snap-card', t.snapCard);
  setSafeText('t-address-hint', t.addressHint);
  setSafeText('t-btn-save-company', t.btnSaveCompany);
  setSafeText('t-companies-title', t.companiesTitle);
  setSafeText('t-map-title', t.mapTitle);
  setSafeText('t-map-hint', t.mapHint);
  setSafeText('t-my-location', t.myLocation);
  setSafeText('t-add-doc', t.addDoc);
  setSafeText('t-snap-work', t.snapWork);
  setSafeText('t-doc-title-label', t.docTitleLabel);
  setSafeText('t-doc-phase-label', t.docPhaseLabel);
  setSafeText('t-doc-file-label', t.docFileLabel);
  setSafeText('t-btn-save-doc', t.btnSaveDoc);
  setSafeText('t-docs-title', t.docsTitle);
  setSafeText('t-add-mat', t.addMat);
  setSafeText('t-snap-mat', t.snapMat);
  setSafeText('t-mat-name-label', t.matNameLabel);
  setSafeText('t-mat-unit-label', t.matUnitLabel);
  setSafeText('t-mat-price-label', t.matPriceLabel);
  setSafeText('t-mat-cat-label', t.matCatLabel);
  setSafeText('t-mat-desc-label', t.matDescLabel);
  setSafeText('t-btn-save-mat', t.btnSaveMat);
  setSafeText('t-mat-title', t.matTitle);
  setSafeText('t-total-cap-label', t.totalCapLabel);
  setSafeText('t-total-cap-spent', t.totalCapSpent);
  setSafeText('t-total-cap-rem', t.totalCapRem);
  setSafeText('t-add-capital-title', t.addCapitalTitle);
  setSafeText('t-snap-slip', t.snapSlip);
  setSafeText('t-cap-source-label', t.capSourceLabel);
  setSafeText('t-cap-amount-label', t.capAmountLabel);
  setSafeText('t-cap-cat-label', t.capCatLabel);
  setSafeText('t-cap-date-label', t.capDateLabel);
  setSafeText('t-btn-save-cap', t.btnSaveCap);
  setSafeText('t-capitals-list-title', t.capitalsListTitle);
  setSafeText('t-gantt-title', t.ganttTitle);
  setSafeText('t-gantt-desc', t.ganttDesc);
  setSafeText('t-legend-plan', t.legendPlan);
  setSafeText('t-legend-done', t.legendDone);
  setSafeText('t-add-reminder-title', t.addReminderTitle);
  setSafeText('t-snap-rem', t.snapRem);
  setSafeText('t-rem-title-label', t.remTitleLabel);
  setSafeText('t-rem-date-label', t.remDateLabel);
  setSafeText('t-rem-priority-label', t.remPriorityLabel);
  setSafeText('t-rem-cat-label', t.remCatLabel);
  setSafeText('t-rem-note-label', t.remNoteLabel);
  setSafeText('t-btn-save-rem', t.btnSaveRem);
  setSafeText('t-reminders-list-title', t.remindersListTitle);
  setSafeText('t-btn-gen-legal', t.btnGenLegal);
  setSafeText('t-cam-title', t.camTitle);
  setSafeText('t-btn-snap', t.btnSnap);
  setSafeText('t-btn-retake', t.btnRetake);
  setSafeText('t-btn-use', t.btnUse);

  if (currentPhases && currentPhases.length > 0) {
    renderPhases(currentPhases);
    if (typeof renderGanttChart === 'function') renderGanttChart(currentPhases);
  }
  window.translateFullDom(lang);
};

// Automatsko prevođenje svakog dinamički ubačenog HTML-a (faze, tabele, admin panel, dnevnik)
document.addEventListener('DOMContentLoaded', () => {
  const obs = new MutationObserver(() => {
    window.translateFullDom(currentLang);
  });
  obs.observe(document.body, { childList: true, subtree: true });
});

// ==========================================
// INICIJALIZACIJA
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  setLanguage(currentLang);
  await loadProjectsDropdown();
  const isAuth = await checkAuth();
  if (isAuth) {
    await Promise.all([
      loadPhases(),
      loadExpenses(),
      loadCompanies(),
      loadDocuments(),
      loadMaterials(),
      loadCapitals(),
      loadReminders()
    ]);
  }
});

// ==========================================
// TAB KONTROLA
// ==========================================
window.switchTab = (tabName) => {
  if (tabName === 'admin') {
    if (typeof loadAdminData === 'function') loadAdminData();
  }

  // Sakrij sve tabove i resetuj layout klase
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('block', 'grid');
  });

  // Ukloni aktivni stil sa svih dugmadi u navigaciji
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600', 'font-bold');
    btn.classList.add('text-slate-500', 'border-transparent', 'font-semibold');
  });

  // Prikaži izabrani tab sa odgovarajućim layout-om
  const activeContent = document.getElementById(`tab-${tabName}`);
  if (activeContent) {
    activeContent.classList.remove('hidden');
    if (tabName === 'faze' || tabName === 'mapa' || tabName === 'kapital' || tabName === 'rokovi') {
      activeContent.classList.add('block');
    } else {
      activeContent.classList.add('grid');
    }
  }

  // Postavi plavu liniju i aktivni stil na kliknuto dugme
  const activeBtn = document.getElementById(`tab-btn-${tabName}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-500', 'border-transparent', 'font-semibold');
    activeBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', 'font-bold');
  }

  // Specifične inicijalizacije po tabu
  if (tabName === 'mapa' && typeof initMap === 'function') {
    setTimeout(initMap, 200);
  }
  if (tabName === 'rokovi' && typeof renderGanttChart === 'function') {
    renderGanttChart(typeof currentPhases !== 'undefined' ? currentPhases : []);
  }
  if (tabName === 'dokumenti') {
    if (typeof loadDocuments === 'function') loadDocuments();
    if (typeof loadSiteLogs === 'function') loadSiteLogs();
    if (typeof loadPhotoTimeline === 'function') loadPhotoTimeline();
    if (typeof currentPhases !== 'undefined') populateGalleryPhases(currentPhases);
  }
};

// ==========================================
// IZVOZ PODATAKA (CSV, EXCEL, PDF)
// ==========================================
window.exportData = (format) => {
  const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');
  let url = '';
  
  if (format === 'excel') {
    url = `/api/expenses/export/excel?projectId=${pId}`;
  } else if (format === 'pdf') {
    url = `/api/expenses/export/pdf?projectId=${pId}`;
  } else {
    url = `/api/expenses/export/csv?projectId=${pId}`;
  }
  
  window.location.href = url;
};

// ==========================================
// GRAĐEVINSKI I METEO DNEVNIK
// ==========================================
window.loadSiteLogs = async () => {
  try {
    const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');
    const res = await fetch(`/api/sitelogs?projectId=${pId}`);
    if (!res.ok) return;
    const logs = await res.json();
    const container = document.getElementById('sitelogs-list');
    if (!container) return;

    if (!Array.isArray(logs) || logs.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Nema unosa u građevinskom dnevniku za ovo gradilište.</p>`;
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-800">${new Date(log.date).toLocaleDateString('sr-RS')}</span>
            <span class="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">${log.workType || 'Radovi'}</span>
          </div>
          <p class="text-xs text-slate-600">${log.notes}</p>
        </div>
        <div class="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 text-xs">
          <span>🌡️</span>
          <span class="font-bold text-slate-700">${log.temperature != null ? `${log.temperature}°C` : '-'}</span>
          <span class="text-slate-400">•</span>
          <span class="text-slate-600">${log.weatherDesc || 'Bez meteo zapisa'}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Greška pri učitavanju dnevnika:', err);
  }
};

// Povezivanje forme za dnevnik (sprečava reload stranice)
document.addEventListener('DOMContentLoaded', () => {
  const siteLogForm = document.getElementById('sitelog-form');
  if (siteLogForm) {
    siteLogForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const workType = document.getElementById('sitelog-worktype')?.value.trim();
      const notes = document.getElementById('sitelog-notes')?.value.trim();
      const tempVal = document.getElementById('sitelog-temp')?.value;
      const descVal = document.getElementById('sitelog-desc')?.value;
      const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');

      const submitBtn = siteLogForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Čuvanje...';
      }

      try {
        const res = await fetch('/api/sitelogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: pId,
            workType,
            notes,
            temperature: tempVal !== '' ? tempVal : undefined,
            weatherDesc: descVal !== '' ? descVal : undefined
          })
        });

        if (res.ok) {
          siteLogForm.reset();
          await loadSiteLogs();
        } else {
          const errData = await res.json();
          alert('Greška pri čuvanju dnevnika: ' + (errData.error || 'Server error'));
        }
      } catch (err) {
        alert('Došlo je do greške u mreži.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Zabeleži u Dnevnik';
        }
      }
    });
  }
});

// ==========================================
// 1. FAZE & FINANSIJSKI PRESEK
// ==========================================
async function loadPhases() {
  try {
    const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');
    
    // Paralelno dohvatanje faza i unetog kapitala
    const [phasesRes, capitalsRes] = await Promise.all([
      fetch(`${API_URL}/phases?projectId=${pId}`),
      fetch(`${API_URL}/capitals?projectId=${pId}`)
    ]);

    const phases = await phasesRes.json();
    let totalCapital = 0;

    if (capitalsRes.ok) {
      const capitals = await capitalsRes.json();
      if (Array.isArray(capitals)) {
        totalCapital = capitals.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
      }
    }

    currentPhases = phases;
    renderSummary(phases, totalCapital);
    renderPhases(phases);
    populateSelects(phases, currentCompanies);
    populateDocPhases(phases);

    if (document.getElementById('tab-rokovi') && !document.getElementById('tab-rokovi').classList.contains('hidden')) {
      renderGanttChart(phases);
    }
  } catch (err) {
    console.error('Greška pri dohvatanju faza:', err);
  }
}

function renderSummary(phases, totalCapital = 0) {
  const totalBudget = phases.reduce((acc, p) => acc + (Number(p.budgetPlan) || 0), 0);
  const totalSpent = phases.reduce((acc, p) => acc + (Number(p.totalSpent) || 0), 0);

  // Ako imamo unet kapital (npr. 10.000.000 RSD), preostalo prikazuje realan novac
  // U suprotnom, računa preostali prostor iz građevinskog plana
  const remaining = totalCapital > 0 ? (totalCapital - totalSpent) : (totalBudget - totalSpent);

  setSafeText('stat-total-budget', `${totalBudget.toLocaleString('sr-RS')} RSD`);
  setSafeText('stat-total-spent', `${totalSpent.toLocaleString('sr-RS')} RSD`);
  setSafeText('stat-remaining', `${remaining.toLocaleString('sr-RS')} RSD`);

  // Opcionalno: vizuelno naglasi ako je račun u minusu
  const remEl = document.getElementById('stat-remaining');
  if (remEl) {
    if (remaining < 0) {
      remEl.classList.remove('text-slate-800');
      remEl.classList.add('text-rose-600');
    } else {
      remEl.classList.remove('text-rose-600');
      remEl.classList.add('text-slate-800');
    }
  }
}

function renderPhases(phases) {
  const container = document.getElementById('phases-container');
  if (!container) return;
  container.innerHTML = '';
  const t = i18n[currentLang] || i18n.sr;

  phases.forEach(p => {
    const planned = Number(p.budgetPlan) || 0;
    const spent = Number(p.totalSpent) || 0;
    const isOverBudget = spent > planned;
    const overAmount = spent - planned;

    // Proračun procenta i određivanje boje trake
    const percent = planned > 0 ? Math.min(Math.round((spent / planned) * 100), 100) : (spent > 0 ? 100 : 0);
    const rawPercent = planned > 0 ? Math.round((spent / planned) * 100) : 0;

    let barColor = 'bg-emerald-500';
    let statusBadge = '';

    if (isOverBudget) {
      barColor = 'bg-rose-500';
      statusBadge = `<span class="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded ml-1">+${overAmount.toLocaleString('sr-RS')} RSD</span>`;
    } else if (rawPercent >= 85) {
      barColor = 'bg-amber-500';
    }

    const card = document.createElement('div');
    card.className = 'bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 transition hover:border-slate-300';
    card.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <!-- Levo: Broj faze i nazivi -->
        <div class="flex items-start gap-3">
          <span class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
            ${p.orderIndex}
          </span>
          <div>
            <h3 class="text-sm font-bold text-slate-900">${p.title}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${p.subtitle || ''}</p>
          </div>
        </div>

        <!-- Desno: Finansijski presek i status -->
        <div class="flex items-center gap-5 justify-between md:justify-end shrink-0">
          <div class="text-right">
            <span class="text-[11px] text-slate-400 block">${currentLang === 'sr' ? 'Plan' : 'Planned'}: ${planned.toLocaleString('sr-RS')} RSD</span>
            <div class="flex items-center justify-end gap-1">
              <span class="text-sm font-extrabold ${isOverBudget ? 'text-rose-600' : 'text-slate-800'}">
                ${spent.toLocaleString('sr-RS')} RSD
              </span>
              ${statusBadge}
            </div>
          </div>
          
          <select onchange="updatePhaseStatus(${p.id}, this.value)" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 outline-none cursor-pointer bg-white text-slate-700 shadow-sm">
            <option value="NIJE_POCETO" ${p.status === 'NIJE_POCETO' ? 'selected' : ''}>${t.notStarted}</option>
            <option value="U_TOKU" ${p.status === 'U_TOKU' ? 'selected' : ''}>${t.inProgress}</option>
            <option value="ZAVRSENO" ${p.status === 'ZAVRSENO' ? 'selected' : ''}>${t.completed}</option>
          </select>
        </div>
      </div>

      <!-- Donja linija: Vizuelna traka iskorišćenosti budžeta -->
      <div class="pt-2 border-t border-slate-100 flex items-center gap-3">
        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div class="${barColor} h-2 rounded-full transition-all duration-500" style="width: ${percent}%;"></div>
        </div>
        <span class="text-[11px] font-bold text-slate-500 shrink-0 w-12 text-right">
          ${rawPercent}%
        </span>
      </div>
    `;
    container.appendChild(card);
  });
}

window.updatePhaseStatus = async (id, status) => {
  try {
    await fetch(`${API_URL}/phases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadPhases();
  } catch (err) {
    console.error('Greška pri ažuriranju statusa faze:', err);
  }
};

// ==========================================
// 2. TROŠKOVI
// ==========================================
async function loadExpenses() {
  try {
    const res = await fetch(`${API_URL}/expenses`);
    const expenses = await res.json();
    renderExpensesTable(expenses);
  } catch (err) {
    console.error('Greška pri dohvatanju troškova:', err);
  }
}

function renderExpensesTable(expenses) {
  const container = document.getElementById('expenses-table-container');
  if (!container) return;

  if (expenses.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic py-4">Nema zabeleženih troškova.</p>';
    return;
  }

  container.innerHTML = `
    <table class="w-full text-left text-xs">
      <thead>
        <tr class="border-b border-slate-200 text-slate-400">
          <th class="py-2">Datum</th>
          <th class="py-2">Faza</th>
          <th class="py-2">Opis</th>
          <th class="py-2">Firma</th>
          <th class="py-2">Plaćanje</th>
          <th class="py-2 text-right">Iznos</th>
          <th class="py-2 text-center">Račun</th>
          <th class="py-2"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${expenses.map(e => `
          <tr>
            <td class="py-2.5 text-slate-500">${e.date.split('T')[0]}</td>
            <td class="py-2.5 font-medium text-slate-800">${e.phase ? e.phase.title : '-'}</td>
            <td class="py-2.5 font-semibold text-slate-900">${e.title}</td>
            <td class="py-2.5 text-slate-600">${e.company ? e.company.name : '-'}</td>
            <td class="py-2.5"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">${e.paymentMethod}</span></td>
            <td class="py-2.5 text-right font-bold text-slate-900">${e.amount.toLocaleString()} RSD</td>
            <td class="py-2.5 text-center">
              ${e.invoiceUrl ? `<a href="${e.invoiceUrl}" target="_blank" class="text-blue-600 font-bold hover:underline">📎</a>` : '-'}
            </td>
            <td class="py-2.5 text-right">
              <button onclick="deleteExpense(${e.id})" class="text-slate-400 hover:text-rose-600">✕</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

document.getElementById('expense-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('projectId', currentProjectId);
  formData.append('phaseId', document.getElementById('expense-phase').value);
  formData.append('companyId', document.getElementById('expense-company').value);
  formData.append('title', document.getElementById('expense-title').value);
  formData.append('amount', document.getElementById('expense-amount').value);
  formData.append('paymentMethod', document.getElementById('expense-payment-method').value);

  const fileInput = document.getElementById('expense-file');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('invoice', fileInput.files[0]);
  }

  const res = await fetch(`${API_URL}/expenses`, { method: 'POST', body: formData });
  if (res.ok) {
    document.getElementById('expense-title').value = '';
    document.getElementById('expense-amount').value = '';
    if (fileInput) fileInput.value = '';
    await Promise.all([loadPhases(), loadExpenses(), loadCapitals()]);
  }
});

async function loadExpenses() {
  try {
    const res = await fetch(`${API_URL}/expenses?projectId=${currentProjectId}`);
    const expenses = await res.json();
    renderExpensesTable(expenses);
  } catch (err) {
    console.error('Greška pri dohvatanju troškova:', err);
  }
}

window.deleteExpense = async (id) => {
  if (!confirm('Obrisati ovaj trošak?')) return;
  await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
  await Promise.all([loadPhases(), loadExpenses(), loadCapitals()]);
};

// ==========================================
// 3. FIRME
// ==========================================
async function loadCompanies() {
  try {
    const res = await fetch(`${API_URL}/companies`);
    const companies = await res.json();
    currentCompanies = companies;
    renderCompanies(companies);
    populateSelects(currentPhases, companies);
  } catch (err) {
    console.error('Greška pri dohvatanju firmi:', err);
  }
}

function renderCompanies(companies) {
  const container = document.getElementById('companies-list');
  if (!container) return;
  container.innerHTML = '';

  if (companies.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic col-span-2">Nema unetih firmi ni majstora.</p>';
    return;
  }

  companies.forEach(c => {
    const card = document.createElement('div');
    card.className = 'border border-slate-200 p-4 rounded-xl flex justify-between items-start bg-slate-50';
    card.innerHTML = `
      <div>
        <span class="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded">${c.category}</span>
        <h4 class="font-bold text-sm text-slate-900 mt-1.5">${c.name}</h4>
        <p class="text-xs text-slate-500">${c.address || 'Nema upisane adrese'}</p>
        <p class="text-xs text-slate-600 mt-1">📞 ${c.phone || '-'}</p>
      </div>
      <button onclick="deleteCompanyItem(${c.id})" class="text-slate-400 hover:text-rose-600 text-xs">✕</button>
    `;
    container.appendChild(card);
  });
}

document.getElementById('company-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('company-name').value,
    pib: document.getElementById('company-pib').value,
    address: document.getElementById('company-address').value,
    phone: document.getElementById('company-phone').value,
    category: document.getElementById('company-category').value
  };

  const res = await fetch(`${API_URL}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    document.getElementById('company-name').value = '';
    document.getElementById('company-pib').value = '';
    document.getElementById('company-address').value = '';
    document.getElementById('company-phone').value = '';
    await loadCompanies();
    if (mapInstance) {
      mapInstance.remove();
      mapInstance = null;
      initMap();
    }
  }
});

window.deleteCompanyItem = async (id) => {
  if (!confirm('Obrisati ovu firmu?')) return;
  await fetch(`${API_URL}/companies/${id}`, { method: 'DELETE' });
  await loadCompanies();
};

// ==========================================
// 4. MAPA
// ==========================================
async function initMap() {
  if (mapInstance) {
    mapInstance.invalidateSize();
    return;
  }

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  let lat = 45.5167;
  let lng = 20.3167;

  try {
      const res = await fetch(`${API_URL}/projects/${currentProjectId}`);
      const project = await res.json();
      if (project && project.latitude && project.longitude) {
        lat = project.latitude;
        lng = project.longitude;
      }
    } catch (err) {
      console.error('Greška pri učitavanju koordinata:', err);
    }

  mapInstance = L.map('map').setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(mapInstance);

  const homeIcon = L.divIcon({
    html: '<div style="background:#2563eb;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid white;">🏠</div>',
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  parcelMarker = L.marker([lat, lng], { icon: homeIcon, draggable: true }).addTo(mapInstance);
  parcelMarker.bindPopup('<b>Gradilište Melenci</b><br>Prevuci pin na parcelu.').openPopup();

  parcelMarker.on('dragend', async (event) => {
    const pos = event.target.getLatLng();
    await saveProjectLocation(pos.lat, pos.lng);
  });

  mapInstance.on('click', async (e) => {
    parcelMarker.setLatLng(e.latlng);
    await saveProjectLocation(e.latlng.lat, e.latlng.lng);
  });

  currentCompanies.forEach(c => {
    if (c.latitude && c.longitude) {
      L.marker([c.latitude, c.longitude])
        .addTo(mapInstance)
        .bindPopup(`<b>${c.name}</b><br>${c.category}<br>${c.address || ''}`);
    }
  });
}

async function saveProjectLocation(latitude, longitude) {
  await fetch(`${API_URL}/projects/${currentProjectId}/location`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude })
  });
  parcelMarker.bindPopup(`<b>Gradilište</b><br>✅ Sačuvano u bazi!<br><small>${latitude.toFixed(5)}, ${longitude.toFixed(5)}</small>`).openPopup();
}

window.locateUserOnMap = () => {
  if (navigator.geolocation && mapInstance) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      mapInstance.setView([lat, lng], 15);
      L.marker([lat, lng]).addTo(mapInstance).bindPopup('Vaša trenutna lokacija').openPopup();
    });
  }
};

// ==========================================
// 5. DOKUMENTI
// ==========================================
async function loadDocuments() {
  try {
    const search = document.getElementById('doc-search')?.value || '';
    const res = await fetch(`${API_URL}/documents?projectId=${currentProjectId}&search=${encodeURIComponent(search)}`);
    const docs = await res.json();
    renderDocuments(docs);
  } catch (err) {
    console.error('Greška pri dohvatanju dokumenata:', err);
  }
}

document.getElementById('document-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('projectId', currentProjectId);
  formData.append('title', document.getElementById('doc-title').value);
  formData.append('phaseId', document.getElementById('doc-phase').value);

  const fileInput = document.getElementById('doc-file');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }

  const res = await fetch(`${API_URL}/documents`, { method: 'POST', body: formData });
  if (res.ok) {
    document.getElementById('doc-title').value = '';
    if (fileInput) fileInput.value = '';
    await Promise.all([loadDocuments(), loadPhases()]);
  }
});

function renderDocuments(docs) {
  const grid = document.getElementById('documents-grid');
  if (!grid) return;

  if (docs.length === 0) {
    grid.innerHTML = '<p class="text-xs text-slate-400 italic col-span-2 py-4">Nema priloženih dokumenata.</p>';
    return;
  }

  grid.innerHTML = docs.map(d => `
    <div class="border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:border-slate-300 transition bg-white">
      <div>
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${d.fileType === 'PDF' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
            ${d.fileType}
          </span>
          <button onclick="deleteDocItem(${d.id})" class="text-slate-400 hover:text-rose-600 text-xs">✕</button>
        </div>
        <h4 class="font-bold text-sm text-slate-900 leading-tight">${d.title}</h4>
        <p class="text-[11px] text-slate-500 mt-1">${d.phase ? d.phase.title : 'Opšti dokument'}</p>
      </div>

      <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
        <span class="text-[10px] text-slate-400">${d.createdAt.split('T')[0]}</span>
        <a href="${d.fileUrl}" target="_blank" class="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
          Otvori fajl ↗
        </a>
      </div>
    </div>
  `).join('');
}

document.getElementById('document-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('title', document.getElementById('doc-title').value);
  formData.append('phaseId', document.getElementById('doc-phase').value);

  const fileInput = document.getElementById('doc-file');
  if (fileInput && fileInput.files.length > 0) {
    formData.append('file', fileInput.files[0]);
  }

  const res = await fetch(`${API_URL}/documents`, { method: 'POST', body: formData });
  if (res.ok) {
    document.getElementById('doc-title').value = '';
    if (fileInput) fileInput.value = '';
    await Promise.all([loadDocuments(), loadPhases()]);
  }
});

window.deleteDocItem = async (id) => {
  if (!confirm('Obrisati ovaj dokument?')) return;
  await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' });
  await Promise.all([loadDocuments(), loadPhases()]);
};

// ==========================================
// 6. MATERIJALI
// ==========================================
async function loadMaterials() {
  try {
    const res = await fetch(`${API_URL}/materials?projectId=${currentProjectId}`);
    const materials = await res.json();
    renderMaterials(materials);
  } catch (err) {
    console.error('Greška pri dohvatanju materijala:', err);
  }
}

function renderMaterials(materials) {
  const container = document.getElementById('materials-list');
  if (!container) return;

  if (materials.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic col-span-2 py-4">Nema unetog materijala u katalogu.</p>';
    return;
  }

  container.innerHTML = materials.map(m => `
    <div class="border border-slate-200 p-4 rounded-xl flex justify-between items-start bg-slate-50">
      <div>
        <span class="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">${m.category}</span>
        <h4 class="font-bold text-sm text-slate-900 mt-1.5">${m.name}</h4>
        <p class="text-xs text-slate-500 mt-0.5">${m.description || 'Bez napomene'}</p>
        <p class="text-xs font-bold text-slate-700 mt-2">Procena: ${m.priceEst.toLocaleString()} RSD / ${m.unit}</p>
      </div>
      <button onclick="deleteMaterialItem(${m.id})" class="text-slate-400 hover:text-rose-600 text-xs">✕</button>
    </div>
  `).join('');
}

document.getElementById('material-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById('mat-name').value,
    unit: document.getElementById('mat-unit').value,
    priceEst: document.getElementById('mat-price').value,
    category: document.getElementById('mat-category').value,
    description: document.getElementById('mat-desc').value,
    projectId: currentProjectId
  };

  const res = await fetch(`${API_URL}/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    document.getElementById('mat-name').value = '';
    document.getElementById('mat-price').value = '';
    document.getElementById('mat-category').value = '';
    document.getElementById('mat-desc').value = '';
    loadMaterials();
  }
});

window.deleteMaterialItem = async (id) => {
  if (!confirm('Obrisati ovaj materijal?')) return;
  await fetch(`${API_URL}/materials/${id}`, { method: 'DELETE' });
  loadMaterials();
};

// ==========================================
// 7. KAPITAL I FINANSIJE
// ==========================================
async function loadCapitals() {
  try {
    const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');
    const res = await fetch(`${API_URL}/capitals?projectId=${pId}`);
    if (!res.ok) return;
    const data = await res.json();

    // 1. Ažuriranje kartica unutar samog taba Kapital
    setSafeText('stat-total-capital', `${(data.totalCapital || 0).toLocaleString()} RSD`);
    setSafeText('stat-capital-spent', `${(data.totalSpent || 0).toLocaleString()} RSD`);
    setSafeText('stat-capital-remaining', `${(data.remainingCapital || 0).toLocaleString()} RSD`);

    // 2. SINHRONIZACIJA GORNJE TRAKE:
    // Ako imamo evidentiran stvarni kapital (npr. 10.000.000 RSD),
    // gornje polje "Preostalo" prikazuje raspoloživi novac!
    if (data.totalCapital && data.totalCapital > 0) {
      setSafeText('stat-remaining', `${Number(data.remainingCapital).toLocaleString()} RSD`);
    }

    renderCapitals(data.capitals || []);
  } catch (err) {
    console.error('Greška pri dohvatanju kapitala:', err);
  }
}

function renderCapitals(capitals) {
  const container = document.getElementById('capitals-list');
  if (!container) return;

  if (!capitals || capitals.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic py-4">Nema unetih izvora finansiranja.</p>';
    return;
  }

  container.innerHTML = capitals.map(c => `
    <div class="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between bg-white mb-2 shadow-sm">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-900">${c.sourceName || c.title || 'Izvor'}</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">${c.category || 'Ušteđevina'}</span>
        </div>
        <p class="text-[11px] text-slate-400 mt-0.5">${c.date ? c.date.split('T')[0] : ''}</p>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm font-extrabold text-emerald-600">${Number(c.amount).toLocaleString()} RSD</span>
        <button onclick="deleteCapitalItem(${c.id})" class="text-slate-400 hover:text-rose-600 text-xs font-bold px-1" title="Obriši">✕</button>
      </div>
    </div>
  `).join('');
}

document.getElementById('capital-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');
  const body = {
    sourceName: document.getElementById('cap-name')?.value,
    amount: document.getElementById('cap-amount')?.value,
    category: document.getElementById('cap-category')?.value,
    date: document.getElementById('cap-date')?.value,
    projectId: pId
  };

  const res = await fetch(`${API_URL}/capitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    if (document.getElementById('cap-name')) document.getElementById('cap-name').value = '';
    if (document.getElementById('cap-amount')) document.getElementById('cap-amount').value = '';
    await loadCapitals();
    if (typeof loadPhases === 'function') loadPhases();
  }
});

window.deleteCapitalItem = async (id) => {
  if (!confirm('Obrisati ovaj izvor kapitala?')) return;
  await fetch(`${API_URL}/capitals/${id}`, { method: 'DELETE' });
  await loadCapitals();
  if (typeof loadPhases === 'function') loadPhases();
};

// ==========================================
// 8. VREMENSKA LINIJA (GANTT) & PODSETNICI
// ==========================================
function renderGanttChart(phases) {
  const container = document.getElementById('gantt-chart-container');
  if (!container) return;
  container.innerHTML = '';

  phases.forEach((p) => {
    const progressWidth = p.status === 'ZAVRSENO' ? 100 : (p.status === 'U_TOKU' ? 50 : 15);
    const colorClass = p.status === 'ZAVRSENO' ? 'bg-emerald-500' : (p.status === 'U_TOKU' ? 'bg-amber-500' : 'bg-blue-400 opacity-60');

    const row = document.createElement('div');
    row.className = 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition';
    row.innerHTML = `
      <div class="sm:w-1/3 flex items-center gap-2">
        <span class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
          ${p.orderIndex}
        </span>
        <span class="text-xs font-bold text-slate-800 truncate">${p.title}</span>
      </div>
      <div class="sm:w-2/3 bg-slate-100 h-5 rounded-full overflow-hidden relative flex items-center px-2">
        <div class="h-full rounded-full ${colorClass} transition-all duration-500" style="width: ${progressWidth}%;"></div>
        <span class="absolute right-3 text-[10px] font-bold text-slate-600">${p.status.replace('_', ' ')}</span>
      </div>
    `;
    container.appendChild(row);
  });
}

async function loadReminders() {
  try {
    const res = await fetch(`${API_URL}/reminders?projectId=${currentProjectId}`);
    const reminders = await res.json();
    renderReminders(reminders);
  } catch (err) {
    console.error('Greška pri dohvatanju podsetnika:', err);
  }
}

function renderReminders(reminders) {
  const container = document.getElementById('reminders-list');
  if (!container) return;

  if (reminders.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 italic py-4">Nema aktivnih podsetnika. Kliknite na "Generiši zakonske rokove" da automatski popunite obaveze.</p>';
    return;
  }

  container.innerHTML = reminders.map(r => {
    const isDone = r.isDone;
    const isOverdue = new Date(r.dueDate) < new Date() && !isDone;
    const priorityColor = r.priority === 'Visoko' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';

    return `
      <div class="border ${isOverdue ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'} p-3.5 rounded-xl flex items-start justify-between gap-4 transition">
        <div class="flex items-start gap-3">
          <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleReminder(${r.id})" class="mt-1 w-4 h-4 rounded text-blue-600 cursor-pointer" />
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}">${r.title}</h4>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded ${priorityColor}">${r.priority}</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">${r.category}</span>
            </div>
            ${r.note ? `<p class="text-[11px] text-slate-500 mt-1">${r.note}</p>` : ''}
            <span class="text-[10px] font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-400'} block mt-1">
              📅 Rok: ${r.dueDate.split('T')[0]} ${isOverdue ? '(Istekao!)' : ''}
            </span>
          </div>
        </div>
        <button onclick="deleteReminderItem(${r.id})" class="text-slate-400 hover:text-rose-600 text-xs">✕</button>
      </div>
    `;
  }).join('');
}

document.getElementById('reminder-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    title: document.getElementById('rem-title').value,
    dueDate: document.getElementById('rem-date').value,
    priority: document.getElementById('rem-priority').value,
    category: document.getElementById('rem-category').value,
    note: document.getElementById('rem-note').value,
    projectId: currentProjectId
  };

  const res = await fetch(`${API_URL}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (res.ok) {
    document.getElementById('rem-title').value = '';
    document.getElementById('rem-date').value = '';
    document.getElementById('rem-note').value = '';
    loadReminders();
  }
});

window.toggleReminder = async (id) => {
  await fetch(`${API_URL}/reminders/${id}/toggle`, { method: 'PATCH' });
  loadReminders();
};

window.deleteReminderItem = async (id) => {
  if (!confirm('Obrisati ovaj podsetnik?')) return;
  await fetch(`${API_URL}/reminders/${id}`, { method: 'DELETE' });
  loadReminders();
};

// Otvaranje PDF uputstva u novoj kartici ovisno o jeziku
window.openHelpGuide = () => {
  const lang = (typeof currentLang !== 'undefined' ? currentLang : 'sr').toLowerCase();
  
  let fileName = 'HouseBuilding - Korisničko Uputstvo (SR).pdf';
  if (lang === 'en') {
    fileName = 'HouseBuilding - User Guide (EN).pdf';
  }
  
  // Kodiranje razmaka i znakova u putanji
  const fileUrl = `/docs/${encodeURIComponent(fileName)}`;
  window.open(fileUrl, '_blank');
};

window.generateLegalReminders = async () => {
  try {
    const res = await (window.fetchAuth ? fetchAuth : fetch)(`${API_URL}/reminders/generate-legal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: currentProjectId })
    });

    if (res.ok) {
      await loadReminders();
    } else {
      const err = await res.json();
      alert(err.error || 'Greška pri generisanju zakonskih rokova.');
    }
  } catch (error) {
    console.error('Greška pri generisanju podsetnika:', error);
  }
};

// ==========================================
// 9. OCR I KAMERA ZA SVE TABOVE
// ==========================================
let currentStream = null;
let activeTargetModule = 'expense';
let capturedBlob = null;

window.openCameraModal = async (targetModule = 'expense') => {
  activeTargetModule = targetModule;
  const modal = document.getElementById('camera-modal');
  const video = document.getElementById('camera-stream');
  const canvas = document.getElementById('camera-canvas');
  const btnSnap = document.getElementById('btn-snap');
  const btnRetake = document.getElementById('btn-retake');
  const btnUse = document.getElementById('btn-use-photo');

  canvas.classList.add('hidden');
  video.classList.remove('hidden');
  btnSnap.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnUse.classList.add('hidden');
  modal.classList.remove('hidden');

  try {
    const constraints = {
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    };
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
  } catch (err) {
    console.error('Kamera greška:', err);
    alert('Nije moguće pristupiti kameri.');
    closeCameraModal();
  }
};

window.capturePhoto = () => {
  const video = document.getElementById('camera-stream');
  const canvas = document.getElementById('camera-canvas');
  const btnSnap = document.getElementById('btn-snap');
  const btnRetake = document.getElementById('btn-retake');
  const btnUse = document.getElementById('btn-use-photo');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  video.classList.add('hidden');
  canvas.classList.remove('hidden');
  btnSnap.classList.add('hidden');
  btnRetake.classList.remove('hidden');
  btnUse.classList.remove('hidden');

  canvas.toBlob((blob) => {
    capturedBlob = blob;
  }, 'image/jpeg', 0.95);
};

window.retakePhoto = () => {
  const video = document.getElementById('camera-stream');
  const canvas = document.getElementById('camera-canvas');
  const btnSnap = document.getElementById('btn-snap');
  const btnRetake = document.getElementById('btn-retake');
  const btnUse = document.getElementById('btn-use-photo');

  canvas.classList.add('hidden');
  video.classList.remove('hidden');
  btnSnap.classList.remove('hidden');
  btnRetake.classList.add('hidden');
  btnUse.classList.add('hidden');
};

window.closeCameraModal = () => {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }
  document.getElementById('camera-modal').classList.add('hidden');
};

window.useCapturedPhoto = async () => {
  if (!capturedBlob) return;
  const file = new File([capturedBlob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
  closeCameraModal();

  const loader = document.getElementById('ocr-loader');
  if (loader) loader.classList.remove('hidden');

  try {
    const formData = new FormData();
    formData.append('receipt', file);
    const res = await fetch(`${API_URL}/ocr/scan`, { method: 'POST', body: formData });
    const result = await res.json();
    const ext = result.extracted || {};
    const text = result.rawText || '';

    if (activeTargetModule === 'expense') {
      const fileInput = document.getElementById('expense-file');
      if (fileInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
      }
      if (ext.amount) document.getElementById('expense-amount').value = ext.amount;
    } else if (activeTargetModule === 'company') {
      if (ext.pib) document.getElementById('company-pib').value = ext.pib;
      const phoneMatch = text.match(/(?:(?:\+381|0)[16][0-9\s/-]{6,10})/);
      if (phoneMatch) document.getElementById('company-phone').value = phoneMatch[0].trim();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      if (lines.length > 0 && !document.getElementById('company-name').value) {
        document.getElementById('company-name').value = lines[0];
      }
    } else if (activeTargetModule === 'material') {
      if (ext.amount) document.getElementById('mat-price').value = ext.amount;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      if (lines.length > 0) {
        document.getElementById('mat-name').value = lines[0];
        document.getElementById('mat-desc').value = text.substring(0, 150);
      }
    } else if (activeTargetModule === 'capital') {
      if (ext.amount) document.getElementById('cap-amount').value = ext.amount;
      if (ext.date) document.getElementById('cap-date').value = ext.date;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      if (lines.length > 0 && !document.getElementById('cap-name').value) {
        document.getElementById('cap-name').value = lines[0];
      }
    } else if (activeTargetModule === 'document') {
      const fileInput = document.getElementById('doc-file');
      if (fileInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
      }
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      if (lines.length > 0 && !document.getElementById('doc-title').value) {
        document.getElementById('doc-title').value = lines[0];
      }
    } else if (activeTargetModule === 'reminder') {
      if (ext.date) document.getElementById('rem-date').value = ext.date;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      if (lines.length > 0) {
        document.getElementById('rem-title').value = lines[0];
        document.getElementById('rem-note').value = text.substring(0, 150);
      }
    }
  } catch (err) {
    console.error('Greška pri OCR obradi:', err);
  } finally {
    if (loader) loader.classList.add('hidden');
  }
};

window.testEmailNotification = async () => {
  const btn = document.getElementById('btn-test-email');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Slanje...';
  }

  try {
    const res = await fetch(`${API_URL}/admin/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Email je uspješno poslan! Provjerite sandučić (i Spam folder).');
    } else {
      alert('Greška pri slanju: ' + (data.error || 'Provjerite SMTP postavke u .env fajlu.'));
    }
  } catch (err) {
    alert('Došlo je do mrežne greške pri pozivu email servisa.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
};

// ==========================================
// FOTO-DNEVNIK & TIMELINE NAPRETKA (SAMO SLIKE)
// ==========================================
window.loadPhotoTimeline = async () => {
  try {
    const pId = typeof currentProjectId !== 'undefined' ? currentProjectId : (localStorage.getItem('hb_active_project_id') || '1');
    const phaseFilter = document.getElementById('gallery-phase-filter')?.value || 'all';
    
    const url = `/api/documents?projectId=${pId}&onlyImages=true${phaseFilter !== 'all' ? `&phaseId=${phaseFilter}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return;
    
    const rawData = await res.json();
    const container = document.getElementById('photo-timeline-grid');
    if (!container) return;

    // Dozvoljene ekstenzije slika — sprečava učitavanje PDF fajlova kroz <img> tag
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const photos = (Array.isArray(rawData) ? rawData : []).filter(item => {
      if (!item.fileUrl) return false;
      const lowerUrl = item.fileUrl.toLowerCase();
      return imageExtensions.some(ext => lowerUrl.endsWith(ext));
    });

    if (photos.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-8 text-center">
          <span class="text-3xl block mb-1">📷</span>
          <p class="text-xs text-slate-400">Nema evidentiranih fotografija za izabranu fazu (PDF dokumenti su u gornjoj arhivi).</p>
        </div>
      `;
      return;
    }

    container.innerHTML = photos.map(p => `
      <div class="group relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-square flex flex-col justify-end">
        <img src="${p.fileUrl}" alt="${p.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
        
        <div class="relative p-2 text-white z-10">
          <span class="text-[10px] bg-blue-600/90 font-bold px-1.5 py-0.5 rounded text-white inline-block mb-0.5 truncate max-w-full">
            ${p.phase?.title ? p.phase.title.split(' ')[0] : 'Opšte'}
          </span>
          <p class="text-[11px] font-semibold truncate leading-tight">${p.title}</p>
          <span class="text-[9px] text-slate-300 block">${new Date(p.createdAt).toLocaleDateString('sr-RS')}</span>
        </div>
        
        <a href="${p.fileUrl}" target="_blank" class="absolute top-2 right-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-lg p-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Otvori sliku">
          🔍
        </a>
      </div>
    `).join('');

  } catch (err) {
    console.error('Greška pri učitavanju foto tajmlajna:', err);
  }
};

// Pomoćna funkcija za punjenje padajućeg menija faza u galeriji
function populateGalleryPhases(phases) {
  const sel = document.getElementById('gallery-phase-filter');
  if (!sel || !Array.isArray(phases)) return;
  
  const currentVal = sel.value;
  sel.innerHTML = '<option value="all">Sve faze radova</option>';
  phases.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.orderIndex}. ${p.title}`;
    sel.appendChild(opt);
  });
  sel.value = currentVal;
}

// ==========================================
// 10. POMOĆNE DROPDOWN FUNKCIJE
// ==========================================
function populateSelects(phases, companies) {
  const phaseSelect = document.getElementById('expense-phase');
  if (phaseSelect) {
    const currentVal = phaseSelect.value;
    phaseSelect.innerHTML = '<option value="" disabled selected>Izaberite fazu...</option>';
    phases.forEach(p => {
      phaseSelect.innerHTML += `<option value="${p.id}">${p.orderIndex}. ${p.title}</option>`;
    });
    if (currentVal) phaseSelect.value = currentVal;
  }

  const compSelect = document.getElementById('expense-company');
  if (compSelect) {
    const currentVal = compSelect.value;
    compSelect.innerHTML = '<option value="">-- Bez firme --</option>';
    companies.forEach(c => {
      compSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
    if (currentVal) compSelect.value = currentVal;
  }
}

function populateDocPhases(phases) {
  const select = document.getElementById('doc-phase');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Opšti dokument (bez faze) --</option>';
  phases.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.orderIndex}. ${p.title}</option>`;
  });
  if (currentVal) select.value = currentVal;
}

// ==========================================
// 15. AUTENTIFIKACIJA & SESIJA
// ==========================================
async function checkAuth() {
  if (!authToken) {
    document.getElementById('auth-modal')?.classList.remove('hidden');
    return false;
  }

  try {
    const res = await fetchAuth(`${API_URL}/auth/me`);
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      document.getElementById('auth-modal')?.classList.add('hidden');
      
      const userSpan = document.getElementById('user-display-name');
      const btnLogout = document.getElementById('btn-logout');
      const btnAdmin = document.getElementById('btn-admin-panel');
      const tabBtnAdmin = document.getElementById('tab-btn-admin');

      if (userSpan) {
        userSpan.textContent = `👤 ${currentUser.fullName || currentUser.email}`;
        userSpan.classList.remove('hidden');
      }
      if (btnLogout) btnLogout.classList.remove('hidden');

      // Ako je korisnik ADMIN, prikaži admin dugmad
      if (currentUser.role === 'ADMIN') {
        if (btnAdmin) btnAdmin.classList.remove('hidden');
        if (tabBtnAdmin) tabBtnAdmin.classList.remove('hidden');
      }

      return true;
    } else {
      logout();
      return false;
    }
  } catch (err) {
    logout();
    return false;
  }
}

window.toggleAuthMode = () => {
  isRegisterMode = !isRegisterMode;
  const title = document.getElementById('auth-modal-title');
  const nameBox = document.getElementById('auth-name-container');
  const projBox = document.getElementById('auth-project-container');
  const btnSubmit = document.getElementById('auth-submit-btn');
  const btnToggle = document.getElementById('auth-toggle-btn');
  const errBox = document.getElementById('auth-error');
  if (errBox) errBox.classList.add('hidden');

  if (isRegisterMode) {
    title.textContent = 'Registracija novog naloga';
    nameBox.classList.remove('hidden');
    projBox.classList.remove('hidden');
    btnSubmit.textContent = 'Kreiraj nalog & Započni projekat';
    btnToggle.textContent = 'Već imate nalog? Prijavite se';
  } else {
    title.textContent = 'Prijava na HouseBuilding';
    nameBox.classList.add('hidden');
    projBox.classList.add('hidden');
    btnSubmit.textContent = 'Prijavi se';
    btnToggle.textContent = 'Nemate nalog? Registrujte se';
  }
};

document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const fullName = document.getElementById('auth-name').value;
  const projectName = document.getElementById('auth-project-name').value;
  const errBox = document.getElementById('auth-error');

  const endpoint = isRegisterMode ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;
  const body = isRegisterMode ? { email, password, fullName, projectName } : { email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (res.ok) {
      authToken = data.token;
      localStorage.setItem('hb_token', authToken);
      currentUser = data.user;
      document.getElementById('auth-modal').classList.add('hidden');
      window.location.reload();
    } else {
      if (errBox) {
        errBox.textContent = data.error || 'Greška pri prijavi';
        errBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('Auth greška:', err);
  }
});

window.logout = () => {
  localStorage.removeItem('hb_token');
  authToken = null;
  currentUser = null;
  window.location.reload();
};

async function loadSiteLogs() {
  try {
    const res = await fetch(`${API_URL}/sitelogs?projectId=${currentProjectId}`);
    const logs = await res.json();
    const container = document.getElementById('sitelogs-list');
    if (!container) return;

    if (logs.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Nema unosa u građevinskom dnevniku za ovo gradilište.</p>`;
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-800">${new Date(log.date).toLocaleDateString('sr-RS')}</span>
            <span class="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">${log.workType || 'Radovi na terenu'}</span>
          </div>
          <p class="text-xs text-slate-600">${log.notes}</p>
        </div>
        <div class="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
          <span class="text-sm">🌡️</span>
          <span class="text-xs font-bold text-slate-700">${log.temperature != null ? `${log.temperature}°C` : 'N/A'}</span>
          <span class="text-xs text-slate-400">•</span>
          <span class="text-xs text-slate-600">${log.weatherDesc || 'Bez podataka'}</span>
          <span class="text-xs text-slate-400">(${log.windSpeed || 0} km/h)</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Greška pri dohvatu dnevnika:', err);
  }
}

// ==========================================
// 16. SUPERADMIN DASHBOARD (PRETPLE)
// ==========================================
window.loadAdminData = async () => {
  try {
    const res = await fetchAuth(`${API_URL}/admin/subscribers`);
    if (!res.ok) return;
    const { metrics, users } = await res.json();

    document.getElementById('adm-total-users').textContent = metrics.totalUsers;
    document.getElementById('adm-active-paid').textContent = metrics.activePaid;
    document.getElementById('adm-trials').textContent = metrics.trials;
    document.getElementById('adm-expired').textContent = metrics.expired;

    const container = document.getElementById('admin-users-table-container');
    if (!container) return;

    container.innerHTML = `
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-slate-200 text-slate-400">
            <th class="py-2.5">Korisnik</th>
            <th class="py-2.5">Uloga</th>
            <th class="py-2.5">Plan</th>
            <th class="py-2.5">Status Pretplata</th>
            <th class="py-2.5">Ističe</th>
            <th class="py-2.5">Projekat & Statistika</th>
            <th class="py-2.5 text-right">Akcija</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${users.map(u => {
            const exp = u.subscriptionExpiresAt ? u.subscriptionExpiresAt.split('T')[0] : 'Neograničeno';
            const proj = u.projects[0];
            const stats = proj ? `${proj.name} (${proj._count.expenses} troškova, ${proj._count.documents} dok.)` : 'Bez projekta';
            return `
              <tr>
                <td class="py-3 font-bold text-slate-900">${u.fullName || '-'}<br><span class="font-normal text-slate-400">${u.email}</span></td>
                <td class="py-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}">${u.role}</span></td>
                <td class="py-3 font-semibold">${u.subscriptionPlan}</td>
                <td class="py-3">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : (u.subscriptionStatus === 'TRIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">
                    ${u.subscriptionStatus}
                  </span>
                </td>
                <td class="py-3 text-slate-500">${exp}</td>
                <td class="py-3 text-slate-600">${stats}</td>
                <td class="py-3 text-right">
                  <button onclick="adminExtendSubscription(${u.id})" class="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-blue-200 transition">
                    +30 dana / Aktiviraj
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error('Greška pri učitavanju admin podataka:', err);
  }
};

// ==========================================
// UPRAVLJANJE VIŠE GRADILIŠTA (MULTI-PROJECT)
// ==========================================
currentProjectId = localStorage.getItem('hb_active_project_id') || '1';

window.openNewProjectModal = () => {
  document.getElementById('new-project-modal')?.classList.remove('hidden');
};

window.closeNewProjectModal = () => {
  document.getElementById('new-project-modal')?.classList.add('hidden');
};

window.switchProject = (projectId) => {
  currentProjectId = projectId;
  localStorage.setItem('hb_active_project_id', projectId);
  window.location.reload();
};

async function loadProjectsDropdown() {
  try {
    const res = await fetch(`${API_URL}/projects`);
    if (!res.ok) return;
    const projects = await res.json();
    const select = document.getElementById('active-project-select');
    if (!select) return;

    if (projects.length === 0) {
      select.innerHTML = '<option value="1">Moja Kuća</option>';
      return;
    }

    select.innerHTML = projects.map(p => `
      <option value="${p.id}" ${String(p.id) === String(currentProjectId) ? 'selected' : ''}>
        ${p.name} (${p.location || 'Srbija'})
      </option>
    `).join('');

    // Ako u localStorage nije validan ID, postavi prvi dostupni
    if (!projects.some(p => String(p.id) === String(currentProjectId))) {
      currentProjectId = String(projects[0].id);
      localStorage.setItem('hb_active_project_id', currentProjectId);
    }
  } catch (err) {
    console.error('Greška pri učitavanju projekata:', err);
  }
}

document.getElementById('new-project-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('np-name').value;
  const location = document.getElementById('np-location').value;
  const budget = document.getElementById('np-budget').value;

  try {
    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        location,
        totalBudget: budget || 4120000
      })
    });

    if (res.ok) {
      const created = await res.json();
      closeNewProjectModal();
      switchProject(created.id);
    }
  } catch (err) {
    console.error('Greška pri kreiranju projekta:', err);
  }
});

window.adminExtendSubscription = async (userId) => {
  const status = confirm('Želite li da postavite status na ACTIVE i produžite pretplatu za 30 dana?') ? 'ACTIVE' : null;
  if (!status) return;

  await fetchAuth(`${API_URL}/admin/subscribers/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscriptionStatus: 'ACTIVE', daysToAdd: 30 })
  });

  loadAdminData();
};

// Registracija PWA Service Worker-a
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('PWA Service Worker aktivan:', reg.scope))
      .catch((err) => console.error('PWA SW greška:', err));
  });
}

// ==========================================
// 17. WHITE-LABEL PODEŠAVANJA, LOGO I 3 PAKETA (TIERS)
// ==========================================
window.HB_SETTINGS = {};

window.loadSystemSettings = async () => {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const { settings, hasCustomLogo } = await res.json();
    window.HB_SETTINGS = settings || {};

    // Popuni formu u tabu Podešavanja
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    setVal('set-company-name', settings.company_name);
    setVal('set-company-pib', settings.company_pib);
    setVal('set-company-address', settings.company_address);
    setVal('set-company-bank', settings.company_bank_acc);
    setVal('set-currency', settings.currency_base || 'RSD');
    setVal('set-license-tier', settings.license_tier || 'ultimate');
    setVal('set-smtp-host', settings.smtp_host || 'smtp.gmail.com');
    setVal('set-smtp-port', settings.smtp_port || '587');
    setVal('set-smtp-user', settings.smtp_user || '');
    setVal('set-smtp-pass', settings.smtp_pass || '');

    // Primeni naziv firme svuda
    const compName = (settings.company_name && settings.company_name.trim()) ? settings.company_name.trim() : 'HouseBuilding';
    document.querySelectorAll('.hb-company-name').forEach(el => { el.textContent = compName; });
    document.title = `${compName} - Upravljanje Gradnjom`;

    // Primeni logo firme svuda (Header, Login modal, Settings preview, Footer)
    document.querySelectorAll('.hb-company-logo').forEach(img => {
      if (hasCustomLogo) {
        img.src = '/company-logo.png?t=' + Date.now();
        img.classList.remove('hidden');
      } else {
        img.classList.add('hidden');
      }
    });

    // Primeni pravila za 3 komercijalna paketa (Core / Pro / Ultimate)
    applyTierRestrictions(settings.license_tier || 'ultimate');
  } catch (err) {
    console.error('Greška pri učitavanju sistemskih podešavanja:', err);
  }
};

function applyTierRestrictions(tier) {
  const badge = document.getElementById('settings-tier-badge');
  if (badge) badge.textContent = `${tier.toUpperCase()} EDITION`;

  // Core (49€): 1 objekat, bez OCR kamere i bez multi-project dugmeta
  // Pro (99€): Više objekata + OCR kamera + Mapa + Izvoz
  // Ultimate (179€): Sve otključano + Admin Panel + White-label
  const newProjBtn = document.querySelector('button[onclick="openNewProjectModal()"]');
  const camButtons = document.querySelectorAll('button[onclick^="openCameraModal"]');

  if (tier === 'core') {
    if (newProjBtn) newProjBtn.classList.add('hidden');
    camButtons.forEach(b => b.classList.add('hidden'));
  } else {
    if (newProjBtn) newProjBtn.classList.remove('hidden');
    camButtons.forEach(b => b.classList.remove('hidden'));
  }
}

window.removeCustomLogo = async () => {
  const fd = new FormData();
  fd.append('remove_logo', 'true');
  const res = await fetch('/api/settings', { method: 'POST', body: fd });
  if (res.ok) await window.loadSystemSettings();
};

document.addEventListener('DOMContentLoaded', () => {
  window.loadSystemSettings();

  const settingsForm = document.getElementById('system-settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(settingsForm);
      const res = await fetch('/api/settings', { method: 'POST', body: fd });
      if (res.ok) {
        await window.loadSystemSettings();
        alert(currentLang === 'en' ? 'Settings saved successfully!' : 'Podešavanja su uspešno sačuvana!');
      }
    });
  }
});