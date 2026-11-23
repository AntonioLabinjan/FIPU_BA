# AI dnevnik

## T1 — Postavljanje projekta (datum)
- Cilj termina: Setupirati agenta i napraviti bazični vue frontend projekt
- Najkorisniji prompt (kopiran u cijelosti): Kreiraj direktorij frontend. Direktorij frontend sadržavat će Vue3 projekt sa script setup načinom pisanja. Od dodatnih paketa, dodaj piniu i vite.
- Što je AI napravio dobro: Složio je traženi basic frontend, bez dodavanja eksternih paketa, nepotrebnih stilizacija, animacija i sl.
- Što je AI napravio drugačije nego što sam očekivao: Ništa. Prompt je bio dovoljno jednostavan da nije imao priliku ništa ishalucinirati. Jedino je napisao kod na hrvatskom.
- Što sam dodao u AGENTS.md: Kodiraj sadržaj frontenda da bude na engleskom
- Provjera: Otvorio frontend i vizualno ga pregledao.
- Commit: c679d9e

## T2 - Kreiranje POC Metamask konfiguracije
- Cilj termina: Setupirati metamask i omogućiti osnovno slanje transakcija kroz postojeći Vue Frontend
- Najkorisniji prompt (kopiran u cijelosti): Na postojećem frontendu nadodaj spajanje sa mojim metamask walletom i opciju slanja na drugi wallet
- Što je AI napravio dobro: kreirao je funkcionalno e2e slanje ethereuma s konekcijom na wallet
- Što je AI napravio drukčije nego što sam očekivao: Kreirao je ethereum "backend" dio unutar frontend fajlova. It works, ali očekivao sam da će to biti odvojeni file, no uopće mi ne smeta takav pristup, dapače.
- Što sam dodao u AGENTS.md: Drži backend skripte za rad s eth u frontend kodu kako ne bismo nepotrebno nagomilavali fajlove
- Provjera: Manualni code review i testno slanje kolegi
- Commit: 69dd05e

## T3 - Tablica
- Datum: 2026-11-02
- Cilj termina: Recenzirati specifikaciju BoxChain, zabilježiti odluke o nalazima te povezati funkcije s kriterijima prihvaćanja.
- Najkorisniji prompt (kopiran u cijelosti): U SPEC-u popuni Sljedivost: tablicu Funkcija | Kriteriji. Svaki kriterij mora se pojaviti barem jednom. Funkcija bez kriterija dobiva kriterij; kriterij bez funkcije znači da funkcija nedostaje.
- Što je AI napravio dobro: Dodao je kriterije K11–K13 za pregled salda i statusa karijere, zabranu samostalnih prijenosa tokena te metapodatke BoxTokena. Popunio je Sljedivost tablicom koja povezuje funkcije s kriterijima K1–K13.
- Provjera: Ručno pregledana izmjena u SPEC.md; provjereno je da je svaki kriterij od K1 do K13 naveden barem jednom u tablici Sljedivost.
- Commit: d5ca0256c86e8b732d59383ee2761c87149821d5

| Nalaz | Prijedlog rješenja | Odluka (prihvaćeno / odbijeno) | Obrazloženje |
|---|---|---|---|
| Nije definiran jedinstveni identifikator meča ni zaštita od ponovnog poravnanja. | Svaki meč ima jedinstveni ID; poravnati meč ne može se ponovno obraditi. | Prihvaćam |Unique ID mi je najjednostavnije rješenje ovog problema |
| Dva boksača mogu potvrditi izmišljeni meč ili koristiti više novčanika. | Definirati izvor istine i provjerljiv način dokazivanja meča odnosno identiteta boksača. |Prihvaćam |Moraju potencijalno priložiti neki legit ID (tipa licencu)|
| Jednostrana prijava može ostati neriješena bez roka, povlačenja ili izmjene. | Definirati može li se prijava na čekanju povući ili izmijeniti te pravila za druge mečeve. |Prihvaćam |Definiramo rok za potvrdu od drugog boksača, pa ako istekne, prijava se poništava |
| Nije zabranjen meč boksača protiv samoga sebe. | Prijava s istom adresom sudionika pada bez promjene stanja. |Prihvaćam|Jako jednostavno rješenje koje će onemogućiti takve situacije |
| Nije izričito testiran poraz s točno 5 BOX. | Nakon takvog poraza saldo gubitnika je 0, karijera završena, a pobjednik dobiva ukupno 6 BOX. |Prihvaćam|Prijedlog je logičan i ima smisla |
| Nije testirano odbijanje meča kada je završena karijera protivnika. | Ako je karijera bilo kojeg sudionika završena, prijava pada s definiranom greškom. |Odbijeno|Kada protivnikova karijera završi, više neće biti opcija za dogovaranje mečeva |
| Pravila oporavka ne određuju valjanost novog novčanika ni status starog. | Odbiti oporavak na nultu, istu ili registriranu adresu; stari novčanik nakon oporavka ne može se ponovno registrirati. |Prihvaćeno |Novčanik mora biti unique za svakog boksača |
| Nije definirano što oporavak radi s neriješenim prijavama meča. | Oporavak s neriješenom prijavom pada bez promjene stanja. |Prihvaćeno |Nakon isteka roka, prijava će se smatrat poništenom i oporavak će biti dopušten |
| Nisu definirane provjere koje zabranjuju samostalni prijenos tokena. | Izravni `transfer` i `transferFrom` izvan poravnanja meča padaju; testirati i točne količine tokena s 18 decimala. |Prihvaćeno |Prijenos se veže uz potvrđeni meč i tokeni se ne mogu prenijeti van tog slučaja |
| Kriteriji ne provjeravaju ukupnu količinu tokena ni ponovljeno poravnanje. | Registracija stvara 50 BOX, pobjeda točno 1 BOX, prijenos ne mijenja ukupnu količinu, a remi je ne mijenja. |Prihvaćeno |Tehnički gledano, ima smisla te je u skladu s logičkim pravilima|

## T4 - Provjera kriterija BoxChainTokena
- Datum: 2026-11-02
- Cilj termina: Usporediti tri očekivana ponašanja tokena sa stvarnim rezultatima.
- Najkorisniji prompt (kopiran u cijelosti): Odaberi tri kriterija o tokenu iz svog SPEC-a: jedan uspješan, jedan neuspješan koji se tiče ovlasti i jedan po izboru (npr. prenosivost ili granica iznosa). Svaki klikni u Remixu; račune mijenjaj u izborniku Account, a tekst upiši u navodnicima.
- Provjera: Pokrenuti lokalne Hardhat testove jer Remix se nije učitao. Rezultat: 8 testova prošlo.
- Nalaz i odluka: Nema odstupanja u tri provjerena ponašanja; za ove provjere nisu potrebne izmjene koda ni SPEC-a. Ovo je lokalna automatizirana provjera, ne ručno klikanje u Remixu.

| Provjera | Očekivano prema SPEC-u | Dobiveno | Nalaz (kriv kod ili SPEC?) | Korekcija |
|---|---|---|---|---|
| K13 — čitanje metapodataka | `name()` vraća `"BoxToken"`, `symbol()` vraća `"BOX"`, a `decimals()` vraća `18`. | Dobivene su vrijednosti `"BoxToken"`, `"BOX"` i `18`. | Nema odstupanja. | Nije potrebna. |
| Ovlasti — poziv `mint` s računa koji nije modul | Samo modul smije izdavati tokene; poziv drugog računa mora pasti. | Poziv je pao s `UnauthorizedModule`; saldo i ukupna količina nisu promijenjeni. | Nema odstupanja. | Nije potrebna. |
| K12 — samostalni `transfer` | Prijenos izvan potvrđenog meča mora pasti, a salda ostati nepromijenjena. | Poziv je pao s `StandaloneTransfersDisabled`; salda su ostala nepromijenjena. | Nema odstupanja. | Nije potrebna. |

## T5 - Povezivanje BoxChain frontenda i priprema deploya
- Datum: 2026-11-04
- Cilj termina: Povezati frontend s BoxChain ugovorima, omogućiti korištenje aplikacije na Sepoliji i pripremiti deploy modula iz MetaMaska.
- Najkorisniji promptovi:
  - „Now, your task is to modify the frontend so it is connected to existing contracts in contracts subfolder and make e2e functional app“
  - „We need to deploy our module“
- Što je AI napravio dobro: Dodao je nedostajuću implementaciju `BoxChainModul`, koja pri deployu kreira `BoxChainToken`, te testove za registraciju, prijavu/poravnanje mečeva, remi, završetak karijere i oporavak novčanika. Frontend je povezan s ugovorima preko ethers v6 i omogućuje pregled BOX salda/statusa karijere, registraciju, prijavu i provjeru mečeva te oporavak novčanika. Dodan je i deploy tok koji koristi potpis u MetaMasku, sprema adresu modula u browser te je prikazuje nakon potvrde transakcije.
- Što je AI napravio drugačije nego što sam očekivao: U repozitoriju nije postojala implementacija `BoxChainModul`, samo sučelje, pa ju je dodao zajedno s testovima. Nije izvršio stvarni Sepolia deploy jer integrirani browser nije imao MetaMask; transakcija nije poslana i adresa ugovora još nije dobivena.
- Provjera: `npm test` — 18 testova prošlo; `npm --prefix frontend run build` — uspješan; lokalna browser provjera prikaza aplikacije — uspješna. Stvarni deploy i e2e provjera na Sepoliji još nisu provedeni.
- Napomena: Trenutačna implementacija odbija oporavak novčanika dok postoje neriješene prijave meča. Automatsko poništavanje prijave nakon roka još nije implementirano.
- Predložena commit poruka: `feat: add BoxChain Sepolia deployment and frontend integration`
- Commit: 6bfcb67a2f11326ffb564fac9dd538ac046035b7.

## Vježba 4: testovi
- Prompt: „Prema kriterijima prihvaćanja K1–K13 u `docs/SPEC.md` napiši Hardhat 3 testove u JavaScript ESM-u, po jedan neovisan `it()` test po kriteriju, koristeći Mocha, Chai i ethers v6. Provjeri točne poruke grešaka i događaje; nemoj mijenjati ugovor.”
- Testova: 13, prolazi: 13 (`npx hardhat test test/BoxChainToken.test.js`).
- Greška AI-ja koju sam uočio: U testu K4 prvo je izostavljena prva prijava meča, pa test nije mogao očekivati potvrđeni meč. Ispravljeno je dodavanjem prijave prije potvrde.
- Mutacijska provjera: privremeno sam zakomentirao `require(!isRegistered[msg.sender], "Boxer already registered.")` u `BoxChainModul.sol`; pao je test „K2: rejects registering the same boxer twice”. Vratio sam `require` i svih 13 testova ponovno je prošlo.

## Vježba 4: objava na lokalnoj mreži
- Adresa ugovora / hash transakcije / blok / gas: `0x5fbdb2315678afecb367f032d93f642f64180aa3` / `0x6334eb448c9a7d054fd21b62d6f70fd5848866b220b2096edd5c47dceb1b4a0b` / `1` (`0x20ce45e7caa4fd9aca810cd3c90b8f6798cd7c9c9d0a30e11817c8ac9acfc15a`) / `3,071,535`.
- Zašto objava troši gas, a čitanje salda ne? Objavljivanje izvršava konstruktor i sprema bytecode ugovora u stanje blockchaina, što zahtijeva izračun i zapis te troši gas. Čitanje salda (`balanceOf`) je `view` poziv: ne mijenja stanje i lokalnim `eth_call` pozivom ne šalje transakciju ni ne troši gas.
- Zašto je poziv `registerBoxer()` potrošio puno manje gasa od objave? To je obična transakcija nad već objavljenim `BoxChainModul` ugovorom: registrira boksača i dodjeljuje 50 BOX. Za razliku od deploya, ona ne sprema bytecode ugovora u blockchain, već plaća za izvršene operacije i promjene stanja. Zapis deploya iznad ne sadrži registracijsku transakciju, pa njezin gas treba zabilježiti iz zasebnog poziva.
- Poziv registracije na pokrenutom lokalnom nodeu (zamijeni adresu modula onom iz deploy izlaza): `MODULE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3 npx hardhat run scripts/register.js --network localhost`. Skripta koristi prvi otključani račun nodea i ispisuje hash transakcije i stvarno potrošeni gas. Pokreni je samo jednom za taj račun jer ponovna registracija pada.
- Što bi se dogodilo s ugovorom da sad ugasim `npx hardhat node`? Zadani lokalni node drži blockchain stanje u memoriji, pa se gašenjem nodea gubi i deployani ugovor. Ponovnim pokretanjem dobiva se nova lokalna mreža; ugovor treba ponovno objaviti.

Contract deployment iz terminala:

 Contract deployment: BoxChainModul
  Contract address:    0x5fbdb2315678afecb367f032d93f642f64180aa3
  Transaction:         0x6334eb448c9a7d054fd21b62d6f70fd5848866b220b2096edd5c47dceb1b4a0b
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  Value:               0 ETH
  Gas used:            3071535 of 3071535
  Block #1:            0x20ce45e7caa4fd9aca810cd3c90b8f6798cd7c9c9d0a30e11817c8ac9acfc15a

eth_getTransactionByHash
eth_getTransactionReceipt
eth_call
  Contract call:       BoxChainModul#boxToken
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x5fbdb2315678afecb367f032d93f642f64180aa3

## Lokalno E2E testiranje frontend-a i Hardhata
- Datum: 2026-11-16
- Cilj: Povezati postojeći Vue frontend s lokalnim Hardhat nodeom kako bi se deploy, registracija i mečevi mogli testirati bez Sepolia ETH-a.
- Što je napravljeno: Frontend podržava Sepoliju i Local Hardhat (chain ID `31337`), može dodati/prebaciti MetaMask mrežu, deployati modul iz UI-ja i spremiti adresu odvojeno za svaku mrežu. Dodana je `scripts/fund-local-account.js` skripta za slanje 10 lokalnih testnih ETH-a javnoj adresi te su u README-u opisani koraci za lokalni e2e test.
- Provjera: `npm --prefix frontend run build` uspješan; `npm test` — 31 test prošao; funding skripta uspješno izvršena na privremenoj lokalnoj Hardhat mreži; frontend se učitao u browseru. Lokalni Hardhat RPC odgovarao je na chain ID `31337`.
- Ograničenje: Stvarni deploy iz Brave Walleta na Local Hardhat nije potvrđen. Wallet je odbio transakciju s `Nonce too high` (očekivan nonce 0, poslan 13); deploy transakcija je također prijavila `StackUnderflow`. Potrebno je riješiti nesklad noncea pa ponoviti ručni e2e deploy prije nego što se može potvrditi da cijeli UI→wallet→Hardhat tok radi.

- Usporedba s Dijelom 1: ni ja ni AI pregledavač nismo pronašli ranjivosti ili odstupanja od specifikacije, pa nema razlika u nalazima.

## Dio 3 — Napadački testovi
- Nalaz: nema prihvaćenih ranjivosti za popravak; postojeći ugovor već ograničava izdavanje tokena na modul i odbija samostalne prijenose.
- Testovi: `test/Sigurnost.test.js` dodaje S1 (ne-modul ne može izdavati tokene) i S2 (samostalni `transfer` i neovlašteni `transferFrom` padaju, a salda ostaju ista).
- Redoslijed crveno-zeleno: testovi su prošli na neizmijenjenom ugovoru (`2 passing`), zato nije bilo pošteno prikazati nepostojeći pad ili napraviti lažni popravak/commit.
- Provjera: `npx hardhat test test/Sigurnost.test.js` — 2 testa prošla; `npm test` — 33 testa prošla.