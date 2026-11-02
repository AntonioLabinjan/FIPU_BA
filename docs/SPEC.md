# BoxChain - specifikacija projekta

## Opis

Blockchain aplikacija za praćenje boksačkih karijera i scorea. Svaki registrirani boksač započinje s 50 BOX; saldo se mijenja prema potvrđenim rezultatima međusobnih mečeva.

## Korisnici i uloge

- **Boksač:** samostalno se registrira, pregledava karijeru i saldo te prijavljuje vlastiti ishod meča.
- **Nema administratora ni centralnog izdavatelja tokena.** Rezultat meča potvrđuju oba boksača.

## Odluke o tokenu

- Naziv: **BoxToken**.
- Simbol: **BOX**.
- Decimale: **18**.
- Svaki boksač pri vlastitoj registraciji dobiva **50 BOX**.
- Ne postoji gornja granica ukupne količine. Količina se povećava automatskom početnom dodjelom pri registraciji i nagradom za pobjedu; nema ručnog izdavanja.
- Ne postoje samostalni prijenosi članova. Tokeni se prenose samo kao dio potvrđenog meča.
- `transferFrom` smije se koristiti samo za poravnanje potvrđenog meča.
- Tokeni se ne troše niti spaljuju. Kod meča gubitnik prenosi 5 BOX pobjedniku ili, ako ima manje od 5 BOX, cijeli preostali saldo.

## Odluke o modulu

- Boksač je povezan s vlastitim novčanikom.
- Saldo BOX predstavlja score boksača.
- Boksač započinje s 50 BOX.
- Za potvrdu meča oba boksača moraju prijaviti međusobno sukladne ishode: pobjednik prijavi pobjedu, a protivnik poraz; za remi oba prijave remi.
- Nakon potvrđenog meča pobjednik dobiva 5 BOX od gubitnika te 1 novostvoreni BOX. Kod remija saldo se ne mijenja.
- Ako gubitnik ima manje od 5 BOX, prenosi sav preostali saldo. Kada saldo dosegne 0, karijera boksača je završena, neovisno o broju poraza.
- Vlasnik novčanika ne može biti uklonjen od strane administratora jer administratorska uloga ne postoji. Prijenos scorea i salda na novi novčanik zahtijeva odobrenje starog novčanika; bez pristupa starom novčaniku oporavak nije podržan.

## Funkcije

### Samostalna registracija boksača

- **Tko:** novčanik koji još nije registriran.
- **Ulazni podaci:** nema dodatnih podataka.
- **Što radi:** registrira novčanik kao boksača i dodjeljuje mu 50 BOX.
- **Kada pada:** ako je novčanik već registriran.
- **Poruka greške:** `Boxer already registered.`

### Prijava i potvrda ishoda meča

- **Tko:** jedan od dva registrirana boksača koji sudjeluju u meču.
- **Ulazni podaci:** drugi boksač i ishod iz perspektive pozivatelja: pobjeda, poraz ili remi.
- **Što radi:** bilježi prvu prijavu; kada drugi boksač prijavi sukladan ishod, potvrđuje meč, ažurira salda i završava karijeru svakog boksača čiji saldo dosegne 0.
- **Pravila poravnanja:** kod pobjede pobjednik dobiva 5 BOX od gubitnika te 1 novostvoreni BOX; ako gubitnik ima manje od 5 BOX, prenosi cijeli preostali saldo. Kod remija nema prijenosa ni nagrade.
- **Kada pada:** ako pozivatelj ili protivnik nije registriran, boksači prijave ishode koji nisu sukladni ili je karijera jednog od boksača već završena.
- **Poruke greške:** `Boxer is not registered.`, `Match result does not match the other participant's report.`, `Career is over.`

### Prijenos salda na novi novčanik

- **Tko:** stari novčanik boksača.
- **Ulazni podaci:** novi novčanik.
- **Što radi:** prenosi score i saldo boksača sa starog na novi novčanik uz odobrenje starog novčanika.
- **Kada pada:** ako poziv ne potpisuje stari novčanik.
- **Poruka greške:** `Only the current boxer wallet can authorize recovery.`
- **Ograničenje:** ako je pristup starom novčaniku izgubljen, prijenos nije moguće autorizirati i oporavak nije podržan.

## Matrica ovlasti

| Radnja | Boksač | Administrator |
|---|---|---|
| Registrirati vlastiti novčanik | Da, ako nije registriran | Nema |
| Prijaviti vlastiti ishod meča | Da, ako je registriran i karijera mu nije završena | Nema |
| Potvrditi meč | Da, drugi boksač mora prijaviti sukladan ishod | Nema |
| Samostalno prenijeti BOX | Ne | Nema |
| Prenijeti BOX u sklopu potvrđenog meča | Da, prema pravilima meča | Nema |
| Oporaviti boksača na novom novčaniku | Samo uz potpis starog novčanika | Nema |
| Ručno izdavati tokene ili mijenjati salda | Ne | Nema |

## Model podataka na lancu

- Adresa novčanika boksača i status registracije.
- Saldo BOX koji predstavlja score.
- Status karijere: aktivna ili završena.
- Prijavljeni ishodi mečeva i stanje njihove potvrde od oba boksača.
- Stanje BOX tokena, uključujući početnu dodjelu i nagrade za pobjedu.

## Što se NE sprema na blockchain

- Privatni ključevi i tajne za pristup novčanicima.
- Podaci za kontakt i osobni podaci boksača koji nisu nužni za povezivanje karijere s javnom adresom novčanika.
- Fotografije, biografije, zdravstveni podaci i detalji treninga.

## Kriteriji prihvaćanja

### K1 — Registracija

- **Zadano:** novčanik još nije registriran.
- **Kada:** boksač se registrira.
- **Tada:** novčanik postaje registrirani boksač i dobiva 50 BOX.

### K2 — Ponovljena registracija

- **Zadano:** novčanik je već registriran.
- **Kada:** isti novčanik pokuša ponovno registrirati boksača.
- **Tada:** zahtjev ne uspije s točnom porukom `Boxer already registered.`

### K3 — Potvrda pobjede i poraz

- **Zadano:** oba boksača su registrirana i njihove prijave su sukladne; gubitnik ima najmanje 5 BOX.
- **Kada:** jedan prijavi pobjedu, a drugi poraz za isti meč.
- **Tada:** meč se potvrdi, pobjednik dobije 5 BOX od gubitnika i 1 novostvoreni BOX, a salda se ažuriraju.

### K4 — Poraz s manje od 5 BOX

- **Zadano:** oba boksača su registrirana i njihove prijave su sukladne; gubitnik ima od 1 do 4 BOX.
- **Kada:** jedan prijavi pobjedu, a drugi poraz za isti meč.
- **Tada:** gubitnik prenese sav preostali saldo pobjedniku, njegov saldo postane 0 i karijera mu završi.

### K5 — Remi

- **Zadano:** oba boksača su registrirana i oba prijave remi za isti meč.
- **Kada:** druga prijava potvrdi remi.
- **Tada:** meč se potvrdi, a salda boksača ostanu nepromijenjena.

### K6 — Nesukladne prijave

- **Zadano:** jedan boksač već je prijavio ishod meča.
- **Kada:** drugi boksač prijavi ishod koji nije sukladan prvoj prijavi.
- **Tada:** zahtjev ne uspije s točnom porukom `Match result does not match the other participant's report.`

### K7 — Neaktivna karijera

- **Zadano:** karijera boksača je završena jer mu je saldo BOX dosegnuo 0.
- **Kada:** taj boksač pokuša prijaviti novi meč.
- **Tada:** zahtjev ne uspije s točnom porukom `Career is over.`

### K8 — Neregistrirani boksač

- **Zadano:** pozivatelj ili protivnik nije registriran.
- **Kada:** pokuša se prijaviti ishod meča.
- **Tada:** zahtjev ne uspije s točnom porukom `Boxer is not registered.`

### K9 — Oporavak novčanika

- **Zadano:** stari novčanik boksača dostupan je i odobrava prijenos.
- **Kada:** autorizira prijenos scorea i salda na novi novčanik.
- **Tada:** score i saldo prenesu se na novi novčanik.

### K10 — Oporavak bez starog novčanika

- **Zadano:** poziv nije autoriziran starim novčanikom boksača.
- **Kada:** pokuša se prenijeti score i saldo na novi novčanik.
- **Tada:** zahtjev ne uspije s točnom porukom `Only the current boxer wallet can authorize recovery.`

## Izvan opsega

- Administratorske uloge i centralno upravljanje.
- Ručno izdavanje tokena ili proizvoljna izmjena salda.
- Samostalni P2P prijenosi tokena izvan poravnanja meča.
- Oporavak novčanika bez potpisa starog novčanika.
- Spaljivanje tokena.

## Otvorena pitanja

- Potvrditi službeni naziv aplikacije i naziv zajednice; **BoxChain** je preuzet iz ranije verzije ove specifikacije.
- Odrediti kako se jednoznačno označava meč, osobito kada se isti boksači susretnu više puta.
- Odrediti koje dodatne podatke o meču treba pratiti uz ishod, ako ih ima.
- Potvrditi jesu li dodatne statistike karijere, osim salda/scorea i ishoda mečeva, potrebne.

## Sljedivost

Odluke iz razgovora: BoxToken (BOX), 18 decimala, početni saldo 50 BOX po boksaču, nagrada od 1 BOX za pobjedu, prijenos od 5 BOX gubitnika pobjedniku, remi bez promjene salda, kraj karijere pri saldu 0, P2P potvrda ishoda od oba boksača, bez administratora, te oporavak samo uz autorizaciju starog novčanika.
