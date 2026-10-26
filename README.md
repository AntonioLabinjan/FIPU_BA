# BoxChain Wallet

Kratka tehnička dokumentacija za frontend koji omogućuje povezivanje MetaMask walleta i slanje Sepolia ETH-a.

## Tehnologije

- Vue 3 s `<script setup>` i Composition API-jem
- Vite za razvoj i izgradnju aplikacije
- MetaMask Ethereum Provider API za pristup walletu i slanje transakcija
- Sepolia testna mreža (chain ID `11155111`)

## Što je napravljeno

- **Povezivanje walleta:** gumb traži pristup MetaMask računu. Sučelje prikazuje skraćenu adresu i trenutačnu mrežu; promjene računa i mreže u MetaMasku ažuriraju sučelje.
- **Sepolia mreža:** slanje je omogućeno samo na Sepoliji. Ako wallet koristi drugu mrežu, sučelje nudi prebacivanje, a po potrebi i dodavanje Sepolije u MetaMask.
- **Slanje ETH-a:** obrazac prima adresu primatelja i iznos. Aplikacija provjerava format adrese i iznos (više od nule, do 18 decimalnih mjesta), pretvara ETH u wei i šalje zahtjev MetaMasku.
- **Potpisivanje transakcije:** transakciju potvrđuje korisnik u MetaMasku. Privatni ključevi ne ulaze u aplikaciju.
- **Povratna informacija:** sučelje prikazuje odbijene/neuspjele zahtjeve i poveznicu na transakciju u Sepolia Etherscanu nakon što wallet vrati njezin hash.

## Pokretanje lokalno

Walletta nije potrebno spajati da bi se aplikacija pokrenula. Za slanje transakcija potreban je MetaMask:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Otvori lokalni URL koji Vite ispiše u terminalu (uobičajeno `http://localhost:5173`). Za korištenje pošalji testni ETH na Sepoliji; stvarni ETH se ne šalje.

Produkcijska izgradnja:

```bash
npm --prefix frontend run build
```

## Glavne datoteke

- `frontend/src/App.vue` — MetaMask povezivanje, provjera mreže i slanje transakcije.
- `frontend/src/style.css` — izgled i responzivni raspored sučelja.
- `frontend/index.html` — naslov i početna HTML stranica.

Ova verzija šalje obične ETH transakcije izravno putem MetaMaska; ne koristi pametni ugovor niti sama provjerava konačnu potvrdu transakcije na blockchainu.
