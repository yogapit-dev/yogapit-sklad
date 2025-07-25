# 📦 Vloženie testovacích dát do databázy

## 🚀 Rýchle nastavenie

### 1. Otvorte Supabase Dashboard
- Choďte na váš Supabase projekt
- Kliknite na **SQL Editor** v ľavom menu

### 2. Spustite testovacie dáta
- Kliknite **"New query"**
- Skopírujte celý obsah súboru `insert-sample-products.sql`
- Kliknite **"Run"**

### 3. Overte dáta
Po spustení by ste mali vidieť:
- **4 kategórie** (Knihy, Japa bagy, Japa maly, Kanti maly)
- **6 produktov** s rôznymi cenami a stavmi skladu
- **2 exkluzívne produkty** (Bhagavad-gita, Šrí Išopanišad)

## 📊 Čo sa vloží

### Kategórie:
- **Knihy** - Védske texty a duchovná literatúra
- **Japa bagy** - Vrecká na japa mantry  
- **Japa maly** - Korálky na japa mantry
- **Kanti maly** - Korálky na kanti mantry

### Produkty:
1. **Bhagavad-gita s komentármi** (89.99€) - Exkluzívne
2. **Japa baga čierna** (8.99€) - Všetci
3. **Japa maly sandálové drevo** (18.99€) - Všetci
4. **Kanti maly 108 korálkov** (12.99€) - Všetci
5. **Šrí Išopanišad** (45.99€) - Exkluzívne
6. **Japa baga červená** (9.99€) - Všetci

## ✅ Overenie

Po vložení dát:
1. **Otvorte aplikáciu** (`npm run dev`)
2. **Skontrolujte homepage** - mali by sa zobraziť produkty
3. **Testujte vyhľadávanie** - napíšte "bha" → nájde sa Bhagavad-gita
4. **Skontrolujte admin** - produkty by sa mali zobrazovať v admin sekcii

## 🔧 Riešenie problémov

### Ak sa produkty nezobrazujú:
- Skontrolujte či sú všetky produkty s `status = 'active'`
- Overte či sú kategórie správne prepojené
- Skontrolujte konzolu prehliadača pre chyby

### Ak sa zobrazujú len exkluzívne produkty:
- Nastavte `isYogapitMember = true` v HomePage.tsx pre testovanie
- Alebo zmeňte `is_exclusive = false` v databáze

---

**Status:** ✅ Testovacie dáta pripravené  
**Ďalší krok:** Spustite SQL v Supabase a overte funkcionalitu 