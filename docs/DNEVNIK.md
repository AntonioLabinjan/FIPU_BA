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