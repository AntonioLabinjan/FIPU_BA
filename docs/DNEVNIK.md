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
