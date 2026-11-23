# Sigurnosni pregled: BoxChain

| # | Provjera | Rezultat | Napomena |
|---|---|---|---|
| P1 | Za svaku funkciju koja mijenja stanje: tko je smije pozvati? Odgovara li to matrici ovlasti u SPEC-u? | U redu | `registerBoxer()` je javna uz provjeru registracije (`contracts/BoxChainModul.sol:51–57`); `reportMatch()` i `recoverWallet()` provjeravaju uvjete sudionika (`:60–135`). `mint()`, `settleMatch()` i `recoverBalance()` dostupni su samo modulu (`contracts/BoxChainToken.sol:78–90`). |

| P2 | Postoji li funkcija koja mijenja stanje, a nema nikakvu provjeru pozivatelja? Je li to namjerno? | U redu | `registerBoxer()` je namjerno javna za nove boksače, uz provjeru da novčanik nije registriran (`contracts/BoxChainModul.sol:51–57`). `approve()` mijenja samo allowance koji postavlja vlasnik tokena (`contracts/BoxChainToken.sol:64–66`); nema neograničene javne administratorske funkcije. |

| P3 | Koristi li ugovor igdje `tx.origin`? | U redu | Nema korištenja `tx.origin`; provjere pozivatelja koriste `msg.sender`, npr. `registerBoxer()` (`contracts/BoxChainModul.sol:51–57`) i `onlyModule` (`contracts/BoxChainToken.sol:14–19`). |

| P4 | Provjeravaju li se svi ulazi: nulta adresa, 0, najveći iznos, duljina teksta? | U redu | `recoverWallet()` odbija nultu, istu i već registriranu adresu (`contracts/BoxChainModul.sol:121–135`); `reportMatch()` provjerava sudionike i ishod (`:60–119`). Nema tekstualnih ulaza; SPEC ne definira zasebna ograničenja duljine teksta ili `matchId` vrijednosti. |

| P5 | Može li netko zaobići pravilo preko naslijeđene funkcije (npr. `transfer`, `transferFrom`, `approve`, `renounceOwnership`)? | U redu | `transfer()` uvijek odbija samostalni prijenos (`contracts/BoxChainToken.sol:59–61`). `transferFrom()` dopušten je samo modulu (`:69–75`), a modul nema javni put za proizvoljan prijenos. `approve()` može postaviti allowance, ali sam ne prenosi tokene (`:64–66`). |

| P6 | Ima li blok `unchecked` ili verziju Solidityja ispod 0.8? | U redu | Sve četiri Solidity datoteke koriste `^0.8.24` (`contracts/BoxChainModul.sol:2`, `contracts/BoxChainToken.sol:2`, `contracts/IBoxChainModul.sol:2`, `contracts/IBoxChainToken.sol:2`); nema `unchecked` bloka. |

| P7 | Ima li petlju preko niza koji raste? | U redu | Nema petlji ni rastućih nizova; obrada meča je u `reportMatch()` (`contracts/BoxChainModul.sol:60–119`). |

| P8 | Ima li ugovor tajnu ili osobni podatak u varijabli? | U redu | `BoxChainModul` sprema adrese, statuse, ishode i stanja boksača/mečeva (`contracts/BoxChainModul.sol:15–28`); token sprema adresu modula (`contracts/BoxChainToken.sol:14`). Nema privatnih ključeva ni osobnih podataka. |

| P9 | Emitira li svaka promjena ovlasti događaj? | U redu | Promjene registracije, prijava i oporavka emitiraju događaje, npr. `registerBoxer()` (`contracts/BoxChainModul.sol:57`), `reportMatch()` (`:77`, `:101–102`, `:115`, `:118`) i `recoverWallet()` (`:135`). ERC-20 `approve()`, mintanje i prijenos emitiraju standardne `Approval`/`Transfer` događaje (`contracts/BoxChainToken.sol:64–90`). |

| P10 | Što se dogodi ako vlasnik izgubi ključ ili pozove `renounceOwnership`? | Ne odnosi se | `BoxChainModul` i `BoxChainToken` ne nasljeđuju `Ownable`, pa `renounceOwnership()` i `transferOwnership()` ne postoje. Odluka: prihvatljivo je jer nema vlasničke administracije; adresa modula postavlja se nepromjenjivo u konstruktoru (`contracts/BoxChainModul.sol:47–49`, `contracts/BoxChainToken.sol:14–19`). Izgubljeni boksačev ključ sprječava oporavak novčanika. |

## Zaključak prvog pregleda

Prvi pregled nije utvrdio exploatabilne ili materijalne ranjivosti. Sekundarna neovisna provjera naknadno je identificirala rizike životnog ciklusa prijave i povjerenja u obostrane prijave; detalji i status sanacije nalaze se ispod.

## Nalazi AI pregledavača

| # | Nalaz | Ozbiljnost (AI) | Odluka | Razlog | Test |
|---|---|---|---|---|---|
| N1 | AI pregled nije utvrdio ranjivosti ni odstupanja od specifikacije. | Informativno | Odbijen | Nema konkretnog nalaza za prihvatiti; pregled je prijavio da nema iskoristivih problema. | - |

## Sekundarna neovisna provjera — 2026-11-23

Provjera je ponovljena neovisno o prvotnom AI pregledu, uspoređujući ugovore, SPEC i testove. Nije utvrđen put za neovlašteno mintanje ili samostalni prijenos BOX-a, ali utvrđeni su sljedeći rizici:

| # | Nalaz | Ozbiljnost | Konkretan scenarij | Status i test |
|---|---|---|---|---|
| N2 | Prva prijava mogla je blokirati oporavak protivnika i neograničeno zauzeti globalni ID meča. | Srednja — dostupnost oporavka | Registrirani napadač pozove `reportMatch(id, žrtva, Win)`. Prije popravka brojač prijava na čekanju rastao je i za žrtvu pa je `recoverWallet` padao. | Sanirano za oporavak: brojač se sada vodi samo za prvog prijavitelja, pa nepozvana prijava ne blokira protivnikov oporavak. Nakon 7 dana bilo tko može poništiti prijavu; kasna potvrda se odbija, a ID se oslobađa. Testovi S3 i S4 u `test/Sigurnost.test.js`. |
| N3 | Dva novčanika pod istom kontrolom mogu potvrditi izmišljeni meč. | Srednja — integritet rezultata, ako se on-chain zapis smatra dokazom stvarnog meča | Dva registrirana novčanika prijave sukladnu pobjedu/poraz za nove ID-jeve; pobjednik dobije prijenos do 5 BOX-a i 1 novostvoreni BOX po potvrdi. | Preostali rizik prihvaćen odlukom da ostanu obostrane prijave. Ugovor ne može dokazati identitet osobe ili postojanje stvarnog meča bez dodatnog izvora povjerenja; to nije implementacijski popravak unutar sadašnjeg modela. |
| N4 | Globalni ID može biti zauzet prvom prijavom prije nego što ga prijave namijenjeni sudionici. | Niska — ometanje identifikacije meča | Prva prijava veže ID uz dva novčanika; drugi par s istim ID-jem odbija se kao nepodudarni sudionici. | Djelomično ublaženo: nepotvrđeni ID oslobađa se nakon 7 dana. Potvrđeni ID ostaje zauzet, a kanonsko povezivanje ID-ja sa stvarnim mečem ostaje izvan lanca i otvoreno pitanje. |

Rok za drugu prijavu iznosi 7 dana od prve prijave. Poništavanje ne mijenja salda ni ukupnu količinu tokena. Ugovor potvrđuje samo da su dva novčanika prijavila sukladne ishode; taj zapis nije dokaz stvarnog sportskog događaja.

Sanacija vrijedi za nove deployeve. Postojeće instance modula nisu nadogradive i trebaju se ponovno deployati da bi dobile rok i `expireMatch`.

## Dodatni nalaz tijekom sanacije

Sljedeći nalaz nije bio u izvještaju sekundarnog pregledavača; otkriven je tijekom pripreme napadačkog testa i odgovara ranijoj prihvaćenoj odluci iz dnevnika o jedinstvenosti novčanika:

| # | Nalaz | Ozbiljnost | Konkretan scenarij | Status i test |
|---|---|---|---|---|
| N5 | Oporavljeni stari novčanik mogao se ponovno registrirati i dobiti novu karijeru/50 BOX; ranije korišten novčanik mogao se ponovno koristiti kao odredište oporavka. | Srednja — dupliciranje karijere i mintanje početnog salda | Boksač registrira stari novčanik, oporavi karijeru na novi pa ponovno pozove `registerBoxer()` sa starog. Prije popravka poziv je uspio i stvorio novu dodjelu 50 BOX. | Sanirano: ugovor bilježi je li adresa ikada korištena, odbija ponovnu registraciju i odbija ranije korišteno odredište. Test S5 u `test/Sigurnost.test.js`. |
