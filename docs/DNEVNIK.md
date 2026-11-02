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

