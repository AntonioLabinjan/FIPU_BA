# BoxChain - specifikacija projekta

## Opis

Blockchain aplikacija za praćenje boksačkih karijera i scorea. Svaki registrirani boksač započinje s 50 BOX; saldo se mijenja prema potvrđenim rezultatima međusobnih mečeva.

## Korisnici i uloge

- **Boksač:** novčanik se jednom registrira, pregledava karijeru i saldo te prijavljuje vlastiti ishod meča.
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
- Druga prijava mora stići u roku od 7 dana od prve. Nakon isteka bilo koji račun može poništiti nepotvrđenu prijavu; time se ne mijenjaju salda ni ukupna količina, a ID poništenog meča ponovno je slobodan.
- Nepozvana prva prijava ne blokira oporavak novčanika protivnika. Oporavak blokiraju samo nepotvrđeni mečevi koje je taj novčanik sam prvi prijavio.
- Potvrđeni ID meča ne može se ponovno koristiti. ID-jevi su globalni; izvor i kanonsko povezivanje ID-ja sa stvarnim mečem ostaju izvan provjere ugovora.
- Ugovor vjeruje sukladnim prijavama dvaju registriranih novčanika. Ne provjerava identitet osobe iza novčanika niti je li se meč stvarno dogodio.
- Svaka adresa može biti povezana s najviše jednom karijerom. Oporavak ne oslobađa staru ni novu adresu za buduću registraciju ili ponovnu uporabu.
- Nakon potvrđenog meča pobjednik dobiva 5 BOX od gubitnika te 1 novostvoreni BOX. Kod remija saldo se ne mijenja.
- Ako gubitnik ima manje od 5 BOX, prenosi sav preostali saldo. Kada saldo dosegne 0, karijera boksača je završena, neovisno o broju poraza.
- Vlasnik novčanika ne može biti uklonjen od strane administratora jer administratorska uloga ne postoji. Prijenos scorea i salda na novi novčanik zahtijeva odobrenje starog novčanika; bez pristupa starom novčaniku oporavak nije podržan.

## Funkcije

### Samostalna registracija boksača

- **Tko:** novčanik koji nikada prije nije bio registriran.
- **Ulazni podaci:** nema dodatnih podataka.
- **Što radi:** registrira novčanik kao boksača i dodjeljuje mu 50 BOX.
- **Kada pada:** ako je novčanik trenutačno registriran ili je ranije bio povezan s karijerom.
- **Poruka greške:** `Boxer already registered.`
- **Poruka greške za ranije korišten novčanik:** `Boxer wallet has already been used.`

### Prijava i potvrda ishoda meča

- **Tko:** jedan od dva registrirana boksača koji sudjeluju u meču.
- **Ulazni podaci:** drugi boksač i ishod iz perspektive pozivatelja: pobjeda, poraz ili remi.
- **Što radi:** bilježi prvu prijavu; kada drugi boksač prijavi sukladan ishod, potvrđuje meč, ažurira salda i završava karijeru svakog boksača čiji saldo dosegne 0.
- **Pravila poravnanja:** kod pobjede pobjednik dobiva 5 BOX od gubitnika te 1 novostvoreni BOX; ako gubitnik ima manje od 5 BOX, prenosi cijeli preostali saldo. Kod remija nema prijenosa ni nagrade.
- **Kada pada:** ako pozivatelj ili protivnik nije registriran, boksači prijave ishode koji nisu sukladni, karijera jednog od boksača već je završena ili druga prijava stigne nakon roka.
- **Poruke greške:** `Boxer is not registered.`, `Match result does not match the other participant's report.`, `Career is over.`, `Match report has expired.`

### Poništavanje istekle prijave meča

- **Tko:** bilo koji račun.
- **Ulazni podaci:** ID nepotvrđenog meča.
- **Što radi:** nakon isteka 7 dana od prve prijave poništava prijavu, oslobađa oba boksača iz stanja čekanja i oslobađa ID meča za ponovnu uporabu. Salda i ukupna količina tokena ostaju nepromijenjeni.
- **Kada pada:** ako ID ne postoji, meč je već potvrđen ili rok od 7 dana još nije istekao.
- **Poruke greške:** `Match does not exist.`, `Match has already been confirmed.`, `Match report has not expired.`
- **Ograničenje:** druga prijava nakon isteka roka pada s `Match report has expired.`; potvrđeni ID-jevi ostaju trajno zauzeti.

### Prijenos salda na novi novčanik

- **Tko:** stari novčanik boksača.
- **Ulazni podaci:** novi novčanik.
- **Što radi:** prenosi score i saldo boksača sa starog na novi novčanik uz odobrenje starog novčanika.
- **Kada pada:** ako poziv ne potpisuje stari novčanik, nova adresa je ranije korištena ili stari novčanik ima vlastite nepotvrđene prijave.
- **Poruka greške:** `Only the current boxer wallet can authorize recovery.`
- **Ostale poruke greške:** `New wallet has already been used.`, `Cannot recover a wallet with pending matches.`
- **Ograničenje:** ako je pristup starom novčaniku izgubljen, prijenos nije moguće autorizirati i oporavak nije podržan.
- **Ograničenje implementacije:** oporavak nije moguć dok boksač ima vlastite nepotvrđene prijave. Ako protivnik prvi prijavi meč, boksač se može oporaviti; prijava vezana uz staru adresu tada se ne može potvrditi i može se poništiti nakon 7 dana.

## Matrica ovlasti

| Radnja | Boksač | Administrator |
|---|---|---|
| Registrirati vlastiti novčanik | Da, ako nikada nije korišten | Nema |
| Prijaviti vlastiti ishod meča | Da, ako je registriran i karijera mu nije završena | Nema |
| Potvrditi meč | Da, drugi boksač mora prijaviti sukladan ishod | Nema |
| Poništiti istekli meč | Da, bilo koji račun nakon isteka 7 dana | Nema |
| Samostalno prenijeti BOX | Ne | Nema |
| Prenijeti BOX u sklopu potvrđenog meča | Da, prema pravilima meča | Nema |
| Oporaviti boksača na novom novčaniku | Samo uz potpis starog novčanika, nekorištenu novu adresu i bez vlastitih prijava na čekanju | Nema |
| Ručno izdavati tokene ili mijenjati salda | Ne | Nema |

## Model podataka na lancu

- Adresa novčanika boksača i status registracije.
- Oznaka je li adresa ikada bila povezana s karijerom.
- Saldo BOX koji predstavlja score.
- Status karijere: aktivna ili završena.
- Prijavljeni ishodi mečeva i stanje njihove potvrde od oba boksača.
- Broj vlastitih prvih prijava mečeva koje još čekaju potvrdu.
- Vrijeme prve prijave i rok za potvrdu od 7 dana.
- Stanje BOX tokena, uključujući početnu dodjelu i nagrade za pobjedu.
- Adresa tokena dostupna je preko modula; modul pri deployu stvara pripadajući BoxToken.

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

### K11 — Pregled salda i statusa karijere

- **Zadano:** boksač je registriran.
- **Kada:** zatraži pregled svoje karijere.
- **Tada:** prikazuju se njegov trenutačni saldo BOX i status karijere (aktivna ili završena).

### K12 — Zabrana samostalnog prijenosa tokena

- **Zadano:** boksač pokušava prenijeti BOX izvan poravnanja potvrđenog meča.
- **Kada:** pokuša samostalni prijenos ili pozove `transferFrom` izvan poravnanja meča.
- **Tada:** prijenos ne uspije i salda ostanu nepromijenjena. Prijenos kroz potvrđeni meč primjenjuje K3 ili K4.

### K13 — Metapodaci BoxTokena

- **Zadano:** BoxToken je dostupan.
- **Kada:** zatraže se naziv, simbol i broj decimala tokena.
- **Tada:** vraćaju se `BoxToken`, `BOX` i `18`.

### K14 — Poništavanje istekle prijave

- **Zadano:** meč ima samo jednu prijavu, a prošlo je najmanje 7 dana.
- **Kada:** bilo koji račun poništi prijavu.
- **Tada:** prijava nestaje, prvi prijavitelj više nema taj meč na čekanju, ID se može ponovno koristiti, a salda i ukupna količina ostaju nepromijenjeni.

### K15 — Rok za potvrdu i poništavanje

- **Zadano:** prijava je nova ili je meč već potvrđen.
- **Kada:** netko pokuša prerano poništiti prijavu, poništiti potvrđeni/nepostojeći meč ili potvrditi prijavu nakon isteka.
- **Tada:** zahtjev pada s odgovarajućom porukom greške i bez promjene stanja.

### K16 — Jedinstvenost novčanika kroz oporavak

- **Zadano:** boksač je oporavio karijeru s ranijeg novčanika na novi.
- **Kada:** pokuša ponovno registrirati stari novčanik ili oporaviti karijeru na bilo koju ranije korištenu adresu.
- **Tada:** zahtjev pada, a salda, registracije i ukupna količina ostaju nepromijenjeni.

### K17 — Oporavak od nepozvane prijave

- **Zadano:** protivnik je prvi prijavio nepotvrđeni meč protiv boksača.
- **Kada:** boksač, koji nije prvi prijavitelj i nema vlastite prijave na čekanju, oporavlja novčanik.
- **Tada:** oporavak uspije; nepotvrđena prijava vezana uz staru adresu ne može se potvrditi s novom adresom i može se poništiti nakon 7 dana.

## Izvan opsega

- Administratorske uloge i centralno upravljanje.
- Ručno izdavanje tokena ili proizvoljna izmjena salda.
- Samostalni P2P prijenosi tokena izvan poravnanja meča.
- Oporavak novčanika bez potpisa starog novčanika.
- Spaljivanje tokena.

## Otvorena pitanja

- Potvrditi službeni naziv aplikacije i naziv zajednice; **BoxChain** je preuzet iz ranije verzije ove specifikacije.
- Odrediti kako aplikacija povezuje globalni ID s konkretnim stvarnim mečem, osobito kada se isti boksači susretnu više puta; ugovor provjerava jedinstvenost dovršenih ID-jeva, ali ne i njihovu vanjsku autentičnost.
- Odrediti koje dodatne podatke o meču treba pratiti uz ishod, ako ih ima.
- Potvrditi jesu li dodatne statistike karijere, osim salda/scorea i ishoda mečeva, potrebne.

## Sljedivost

| Funkcija | Kriterij | Test |
|---|---|---|
| Samostalna registracija boksača i početna dodjela 50 BOX | K1 | `K1: registering a boxer allocates 50 BOX` |
| Samostalna registracija boksača i početna dodjela 50 BOX | K2 | `K2: rejects registering the same boxer twice` |
| Prijava i potvrda ishoda pobjeda/poraz te poravnanje salda i nagrade | K3 | `K3: confirms a win and loss, transfers 5 BOX, and rewards the winner 1 BOX` |
| Prijava i potvrda ishoda pobjeda/poraz te poravnanje salda i nagrade | K4 | `K4: transfers the loser's remaining balance when it is below 5 BOX` |
| Prijava i potvrda remija | K5 | `K5: confirms a draw without changing either balance` |
| Prijava i potvrda ishoda pobjeda/poraz te poravnanje salda i nagrade; prijava i potvrda remija | K6 | `K6: rejects results that do not match the first report` |
| Prijava i potvrda ishoda pobjeda/poraz te poravnanje salda i nagrade; prijava i potvrda remija | K7 | `K7: rejects a match report from a boxer whose career has ended` |
| Prijava i potvrda ishoda pobjeda/poraz te poravnanje salda i nagrade; prijava i potvrda remija | K8 | `K8: rejects match reports involving an unregistered boxer` |
| Prijenos scorea i salda na novi novčanik | K9 | `K9: recovers registration, career status, and balance to a new wallet` |
| Prijenos scorea i salda na novi novčanik | K10 | `K10: rejects wallet recovery not authorized by the current wallet` |
| Pregled salda i statusa karijere | K11 | `K11: exposes the boxer's current balance and career status` |
| Prijenos BOX u sklopu potvrđenog meča i zabrana samostalnog prijenosa | K12 | `K12: rejects standalone token transfers and leaves balances unchanged` |
| Čitanje metapodataka BoxTokena | K13 | `K13: returns the specified token metadata` |
| Poništavanje istekle prijave i oslobađanje boksača/ID-ja | K14 | `S3: an unsolicited report cannot block the opponent's recovery` |
| Provjera roka potvrde i uvjeta poništavanja | K15 | `S4: only an expired pending match can be cancelled` |
| Zabrana ponovne uporabe novčanika nakon oporavka | K16 | `S5: a recovered wallet cannot start or receive another career` |
| Oporavak unatoč nepozvanoj prijavi protivnika | K17 | `S3: an unsolicited report cannot block the opponent's recovery` |
