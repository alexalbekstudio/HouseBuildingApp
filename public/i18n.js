// public/i18n.js — Kompletan prevodilac za HouseBuildingApp (SR <-> EN)
(function () {
  // Parovi [Srpski tekst, Engleski tekst] za sve elemente sa slika
  const TEXT_PAIRS = [
    // Gornja traka i opcije izvoza
    ["GRADILIŠTE:", "SITE:"],
    ["+ Nova kuća", "+ New Project"],
    ["Pomoć", "Help"],
    ["Help", "Help"],
    ["Odjavi se", "Logout"],
    ["IZVEZI:", "EXPORT:"],
    ["PLANIRAN BUDŽET", "PLANNED BUDGET"],
    ["POTROŠENO", "TOTAL SPENT"],
    ["PREOSTALO", "REMAINING"],

    // Glavni tabovi navigacije
    ["🏛️ Faze (8)", "🏛️ Phases (8)"],
    ["Faze (8)", "Phases (8)"],
    ["💰 Finansije & OCR", "💰 Finance & OCR"],
    ["Finansije & OCR", "Finance & OCR"],
    ["🏢 Partneri", "🏢 Partners"],
    ["Partneri", "Partners"],
    ["🗺️ Karta", "🗺️ Map"],
    ["Karta", "Map"],
    ["📑 Dokumenti & Dnevnik", "📑 Docs & Site Log"],
    ["Dokumenti & Dnevnik", "Docs & Site Log"],
    ["🧱 Materijali", "🧱 Materials"],
    ["Materijali", "Materials"],
    ["💵 Kapital", "💵 Capital"],
    ["Kapital", "Capital"],
    ["⏱️ Rokovi", "⏱️ Timeline"],
    ["Rokovi", "Timeline"],
    ["👑 Admin Panel", "👑 Admin Panel"],
    ["Admin Panel", "Admin Panel"],

    // Tab 1: 8 Faza gradnje (iz baze) + statusi
    ["Pravni tok — 8 faza od parcele do upotrebne dozvole", "Legal Flow — 8 phases from plot to occupancy permit"],
    ["Izaberite status faze za automatsko ažuriranje", "Select phase status for automatic update"],
    ["Provera parcele i identiteta", "Plot & Ownership Verification"],
    ["Katastarska parcela, vlasništvo, tereti, pristupni put.", "Cadastral plot, ownership, encumbrances, access road."],
    ["Planska pravila", "Urban Planning Rules"],
    ["Namena, indeks zauzetosti i izgrađenosti, gabariti, spratnost.", "Zoning purpose, occupancy & construction index, dimensions, floors."],
    ["Geodetski i geotehnički podaci", "Geodetic & Geotechnical Survey"],
    ["Geodetski snimak i geotehnički elaborat tla.", "Geodetic survey and geotechnical soil study."],
    ["Idejno rešenje (IDR)", "Conceptual Design (IDR)"],
    ["Idejno rešenje montažne kuće usklađeno sa parcelom.", "Conceptual house design aligned with the plot."],
    ["Lokacijski uslovi", "Location Conditions"],
    ["Projekat i građevinska dozvola (PGD)", "Main Project & Building Permit (PGD)"],
    ["Prijava radova i gradnja", "Works Registration & Construction"],
    ["Tehnički pregled i upotrebna dozvola", "Technical Inspection & Occupancy Permit"],
    ["Nije početo", "Not started"],
    ["NIJE POCETO", "NOT STARTED"],
    ["NIJE POČETO", "NOT STARTED"],
    ["U toku", "In progress"],
    ["U TOKU", "IN PROGRESS"],
    ["Završeno", "Completed"],
    ["ZAVRŠENO", "COMPLETED"],
    ["ZAVRSENO", "COMPLETED"],

    // Tab 2: Finansije & OCR
    ["Izaberite fazu...", "Select phase..."],
    ["-- Bez firme --", "-- No company --"],
    ["Gotovina (keš)", "Cash"],
    ["Prenos na račun (faktura)", "Bank transfer (invoice)"],
    ["Kartica", "Card"],
    ["Nema zabeleženih troškova.", "No expenses recorded yet."],

    // Tab 3: Partneri
    ["Address is automatically geolocated on the map", "Address is automatically geolocated on the map"],
    ["Adresa se automatski geolocira na karti", "Address is automatically geolocated on the map"],
    ["Izvođač", "Contractor"],
    ["Dobavljač", "Supplier"],
    ["Projektant / Nadzor", "Architect / Supervision"],
    ["Nema unetih firmi ni majstora.", "No companies or contractors added yet."],

    // Tab 4: Karta
    ["Gradilište Melenci", "Construction Site Melenci"],
    ["Prevuci pin na parcelu", "Drag pin to the exact plot"],

    // Tab 5: Dokumenti & Dnevnik
    ["-- Opšti dokument (bez faze) --", "-- General document (no phase) --"],
    ["Nema priloženih dokumenata.", "No documents attached yet."],
    ["📋 Zapisnik gradilišta & Vremenski uslovi", "📋 Site Log & Weather Conditions"],
    ["Zapisnik gradilišta & Vremenski uslovi", "Site Log & Weather Conditions"],
    ["Istorija izvođenja radova sa podacima o temperaturi i vetru.", "History of construction works with temperature and wind data."],
    ["🔄 Osveži", "🔄 Refresh"],
    ["Osveži", "Refresh"],
    ["Nema unosa u građevinskom dnevniku za ovo gradilište.", "No site log entries for this construction site yet."],
    ["🌤️ Dnevnik radova", "🌤️ Daily Site Log"],
    ["Dnevnik radova", "Daily Site Log"],
    ["Automatski ili ručni unos vremenskih uslova.", "Automatic or manual weather condition entry."],
    ["VRSTA RADOVA", "WORK TYPE"],
    ["TEMPERATURA (°C)", "TEMPERATURE (°C)"],
    ["VRIJEME / VJETAR", "WEATHER / WIND"],
    ["BELEŠKA / OPIS TOKA RADOVA", "NOTES / WORK PROGRESS DESCRIPTION"],
    ["Sačuvaj u dnevnik", "Save Log Entry"],
    ["📸 Hronološka Galerija Napretka", "📸 Chronological Progress Gallery"],
    ["Hronološka Galerija Napretka", "Chronological Progress Gallery"],
    ["Vizuelno praćenje radova i poređenje stanja po fazama gradnje.", "Visual progress tracking and phase-by-phase comparison."],
    ["Sve faze radova", "All construction phases"],
    ["Nema evidentiranih fotografija za izabranu fazu (PDF dokumenti su u gornjoj arhivi).", "No photos recorded for the selected phase (PDF documents are in the archive above)."],

    // Tab 6: Materijali
    ["Nema unetog materijala u katalogu.", "No materials in the catalog yet."],

    // Tab 7: Kapital
    ["Ušteđevina", "Savings"],
    ["Kredit banke", "Bank Loan"],
    ["Pozajmica / Investitor", "Loan / Investor"],
    ["Subvencija", "Subsidy / Grant"],
    ["Nema unetih izvora finansiranja.", "No funding sources added yet."],

    // Tab 8: Rokovi
    ["Planirano", "Planned"],

    // Tab 9: Admin Panel
    ["👑 SuperAdmin Kontrolna Tabla", "👑 SuperAdmin Control Panel"],
    ["SuperAdmin Kontrolna Tabla", "SuperAdmin Control Panel"],
    ["Upravljanje pretplatnicima, licencama i statusima aktivacije", "Manage users, licenses, and activation statuses"],
    ["🔄 Osveži podatke", "🔄 Refresh Data"],
    ["Osveži podatke", "Refresh Data"],
    ["📧 Testiraj E-mail", "📧 Test Email"],
    ["Testiraj E-mail", "Test Email"],
    ["UKUPNO KORISNIKA", "TOTAL USERS"],
    ["AKTIVNE PRETPLATE", "ACTIVE LICENSES"],
    ["U PROBNOM PERIODU", "IN TRIAL PERIOD"],
    ["ISTEKLE", "EXPIRED"],
    ["Pregled Registrovanih Pretplatnika", "Registered Users Overview"],
    ["Korisnik", "User"],
    ["Uloga", "Role"],
    ["Plan", "Plan"],
    ["Status Pretplata", "License Status"],
    ["Ističe", "Expires"],
    ["Projekat & Statistika", "Project & Stats"],
    ["Akcija", "Action"],
    ["+30 dana / Aktiviraj", "+30 Days / Activate"],

    // Podnožje (Footer)
    ["Sva prava zadržana.", "All rights reserved."],
    ["Verzija 2.4 PWA", "Version 2.4 PWA"],
    ["• Sistem aktivan", "• System active"],
    ["Sistem aktivan", "System active"]
  ];

  // Parovi za placeholder atribute u input/textarea poljima
  const PLACEHOLDER_PAIRS = [
    ["npr. Armaturna mreža Q335", "e.g. Reinforcing mesh Q335"],
    ["Naziv firme / Ime *", "Company / Contractor Name *"],
    ["PIB", "Tax ID / VAT"],
    ["Adresa sedišta (npr. Melenci, Glavna 1)", "Company address (e.g. Main St 1)"],
    ["Telefon", "Phone number"],
    ["npr. Lokacijski uslovi ili Temeljna armatura", "e.g. Location permit or Foundation rebar"],
    ["Pretraži arhiv...", "Search archive..."],
    ["npr. Zidanje pregradnih zidova", "e.g. Partition wall masonry"],
    ["Auto / npr. 22", "Auto / e.g. 22"],
    ["Auto / npr. Sunčano", "Auto / e.g. Sunny"],
    ["Detaljan opis radova na gradilištu...", "Detailed description of site works..."],
    ["npr. Beton MB30", "e.g. Concrete MB30"],
    ["npr. Zidarski, Armatura, Izolacija", "e.g. Masonry, Rebar, Insulation"],
    ["Specifikacija ili zahtevi za kvalitet...", "Specification or quality requirements..."],
    ["npr. Ušteđevina, Kredit OTP banke", "e.g. Personal savings, Bank loan"]
  ];

  const srToEn = new Map();
  const enToSr = new Map();
  TEXT_PAIRS.forEach(([sr, en]) => {
    srToEn.set(sr.trim(), en);
    enToSr.set(en.trim(), sr);
  });

  const phSrToEn = new Map();
  const phEnToSr = new Map();
  PLACEHOLDER_PAIRS.forEach(([sr, en]) => {
    phSrToEn.set(sr.trim(), en);
    phEnToSr.set(en.trim(), sr);
  });

  function translateNodeText(rawText, lang) {
    if (!rawText) return null;
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    const dict = lang === "en" ? srToEn : enToSr;
    if (dict.has(trimmed)) {
      return rawText.replace(trimmed, dict.get(trimmed));
    }

    // Dinamički prevod za "Plan: 30.000 RSD" <-> "Planned: 30.000 RSD" i statistiku u Admin tabeli
    if (lang === "en") {
      if (trimmed.startsWith("Plan:")) return rawText.replace("Plan:", "Planned:");
      if (trimmed.includes("troškova,") && trimmed.includes("dok.)")) {
        return rawText.replace("troškova,", "expenses,").replace("dok.)", "docs)");
      }
      if (trimmed.includes("Sva prava zadržana.")) {
        return rawText.replace("Sva prava zadržana.", "All rights reserved.");
      }
    } else {
      if (trimmed.startsWith("Planned:")) return rawText.replace("Planned:", "Plan:");
      if (trimmed.includes("expenses,") && trimmed.includes("docs)")) {
        return rawText.replace("expenses,", "troškova,").replace("docs)", "dok.)");
      }
      if (trimmed.includes("All rights reserved.")) {
        return rawText.replace("All rights reserved.", "Sva prava zadržana.");
      }
    }
    return null;
  }

  let isApplying = false;

  window.applyFullDomTranslation = function (lang) {
    if (isApplying) return;
    isApplying = true;
    try {
      const targetLang = lang || localStorage.getItem("hb_lang") || "sr";

      // 1. Prevedi sve tekstualne čvorove u DOM-u (uključujući <option>, dugmad, tabove i naslove faza)
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while ((node = walker.nextNode())) {
        const parentTag = node.parentElement && node.parentElement.tagName;
        if (parentTag === "SCRIPT" || parentTag === "STYLE") continue;
        const replaced = translateNodeText(node.nodeValue, targetLang);
        if (replaced !== null && replaced !== node.nodeValue) {
          node.nodeValue = replaced;
        }
      }

      // 2. Prevedi sve placeholder atribute
      const phDict = targetLang === "en" ? phSrToEn : phEnToSr;
      document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((el) => {
        const ph = (el.getAttribute("placeholder") || "").trim();
        if (phDict.has(ph)) {
          el.setAttribute("placeholder", phDict.get(ph));
        }
      });
    } finally {
      isApplying = false;
    }
  };

  // Poveži sa postojećim SR / EN dugmadima na vrhu ekrana
  function detectCurrentLang() {
    const activeBtn = document.querySelector("button.active, .lang-btn.active");
    if (activeBtn && (activeBtn.textContent.trim() === "EN" || activeBtn.textContent.trim() === "SR")) {
      return activeBtn.textContent.trim().toLowerCase();
    }
    return localStorage.getItem("hb_lang") || "sr";
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, a, span");
    if (!btn) return;
    const txt = (btn.textContent || "").trim();
    if (txt === "EN" || txt === "SR") {
      const lang = txt.toLowerCase();
      localStorage.setItem("hb_lang", lang);
      setTimeout(() => window.applyFullDomTranslation(lang), 20);
      setTimeout(() => window.applyFullDomTranslation(lang), 250);
    } else {
      // Kad korisnik klikne na drugi tab, prevede dinamički učitani sadržaj
      setTimeout(() => window.applyFullDomTranslation(detectCurrentLang()), 60);
    }
  });

  // Automatski prevedi čim API učita faze, troškove ili admin tabelu u DOM
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => window.applyFullDomTranslation(detectCurrentLang()), 100);
    const observer = new MutationObserver(() => {
      window.applyFullDomTranslation(detectCurrentLang());
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();