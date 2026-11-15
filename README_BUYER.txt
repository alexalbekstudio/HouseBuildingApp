===================================================================
HOUSEBUILDING APP — UPUTSTVO ZA INSTALACIJU I POKRETANJE (SR / EN)
===================================================================

[SRPSKI]
Hvala vam na kupovini HouseBuilding softvera za upravljanje gradnjom,
troškovima, izvođačima, građevinskim dnevnikom i zakonskim fazama!

1. BRZO POKRETANJE PREKO DOCKER-A (PREPORUČENO)
   - Instalirajte Docker Desktop (ili Docker Engine na serveru).
   - U folderu aplikacije pokrenite:
     docker compose up -d --build
   - Otvorite u pretraživaču: http://localhost:3000

2. POKRETANJE BEZ DOCKER-A (NODE.JS + POSTGRESQL)
   - Instalirajte Node.js (v18+) i PostgreSQL (v15+).
   - Kopirajte fajl ".env.example" u ".env" i unesite vaš DATABASE_URL.
   - U terminalu pokrenite:
     npm install
     npx prisma generate
     npx prisma migrate deploy
     npm start
   - Aplikacija je dostupna na: http://localhost:3000

3. BRENDIRANJE (WHITE-LABEL), VALUTA I EMAIL ALARMI
   - Nakon prijave, otvorite tab "⚙️ Podešavanja & Licenca".
   - Unesite naziv vaše građevinske firme/investitora, PIB, adresu i račun.
   - Otpremite vaš logo (PNG/JPG) — sistem ga automatski postavlja u
     zaglavlje, futer, ekran za prijavu i kao ikonicu pretraživača (favicon).
   - Izaberite valutu (EUR, RSD, USD, BAM) i jezik (SR / EN) u gornjem uglu.

-------------------------------------------------------------------

[ENGLISH]
Thank you for purchasing HouseBuilding — Construction, Budget,
Contractor, Site Log & Legal Flow Management Software!

1. QUICK START WITH DOCKER (RECOMMENDED)
   - Install Docker Desktop (or Docker Engine on your VPS).
   - In the application folder run:
     docker compose up -d --build
   - Open in browser: http://localhost:3000

2. MANUAL SETUP (NODE.JS + POSTGRESQL)
   - Install Node.js (v18+) and PostgreSQL (v15+).
   - Copy ".env.example" to ".env" and configure your DATABASE_URL.
   - Run in terminal:
     npm install
     npx prisma generate
     npx prisma migrate deploy
     npm start
   - Open: http://localhost:3000

3. WHITE-LABEL BRANDING, CURRENCY & SMTP ALERTS
   - Log in and open the "⚙️ Settings & License" tab.
   - Enter your company/investor name, Tax ID, address, and bank account.
   - Upload your logo (PNG/JPG) — it will automatically replace the app
     header logo, footer logo, login logo, and browser favicon.
   - Switch between SR and EN anytime in the top navigation bar.
===================================================================