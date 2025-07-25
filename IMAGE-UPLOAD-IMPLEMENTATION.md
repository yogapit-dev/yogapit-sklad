# 📸 Implementácia upload obrázkov produktov

## ✅ Čo je implementované

### 1. **Upload funkcia**
- **Funkcia `uploadImage`** - nahráva súbory do Supabase Storage
- **Automatické generovanie názvov** - unikátne názvy súborov
- **Podporované formáty** - JPEG, PNG, WebP, GIF
- **Limit veľkosti** - 5MB

### 2. **Formulár pre vytváranie produktov**
- **Upload input** s preview obrázka
- **Loading stav** počas nahrávania
- **Automatický upload** pri vytváraní produktu
- **Base64 preview** pred uploadom

### 3. **Formulár pre editáciu produktov**
- **Rovnaká funkcionalita** ako pri vytváraní
- **Zobrazenie existujúceho obrázka**
- **Možnosť zmeny** obrázka

### 4. **Zobrazenie v zozname produktov**
- **Thumbnail obrázkov** v admin rozhraní
- **Fallback ikona** ak obrázok neexistuje
- **Responsive zobrazenie**

### 5. **Zobrazenie na stránke**
- **Obrázky produktov** na homepage
- **Košík s obrázkami**
- **Admin objednávky** s obrázkami

## 🔧 Technické detaily

### Upload proces:
1. **Užívateľ vyberie súbor** → Base64 preview
2. **Klikne "Vytvoriť/Uložiť"** → Upload do Storage
3. **Získa verejnú URL** → Uloží do databázy
4. **Zobrazí sa v aplikácii** → Všetky miesta

### Storage bucket:
- **Názov:** `product-images`
- **Verejný prístup:** Áno
- **Cesta:** `product-images/{random-name}.{ext}`

## 🚀 Nastavenie

### 1. Spustite SQL
```bash
# V Supabase SQL Editori spustite:
# setup-storage.sql
```

### 2. Overte bucket
- Choďte do **Storage** v Supabase
- Mali by ste vidieť bucket `product-images`

### 3. Testujte upload
- Vytvorte nový produkt s obrázkom
- Skontrolujte či sa nahral do Storage
- Overte zobrazenie v aplikácii

## 🔒 Bezpečnosť

### Aktuálne nastavenie:
- **Čítanie:** Povolené pre všetkých
- **Upload:** Len pre autentifikovaných

### Pre testovanie:
- Odkomentujte "Allow all operations" v SQL
- Povolí upload bez prihlásenia

## 📊 Výkon

### Optimalizácie:
- **Automatické generovanie názvov** - predídne konfliktom
- **Base64 preview** - rýchle zobrazenie
- **Lazy loading** - obrázky sa načítavajú podľa potreby

### Limity:
- **Veľkosť súboru:** 5MB
- **Formáty:** JPEG, PNG, WebP, GIF
- **Počet súborov:** Neobmedzené

## 🔍 Riešenie problémov

### Chyba: "Bucket does not exist"
- Spustite `setup-storage.sql`
- Skontrolujte Storage sekciu

### Chyba: "Access denied"
- Skontrolujte RLS policies
- Pre testovanie použite "Allow all operations"

### Chyba: "File too large"
- Zmenšite obrázok pred uploadom
- Alebo zväčšite limit v SQL

### Obrázky sa nezobrazujú
- Skontrolujte či sú URL správne
- Overte či sú obrázky verejne dostupné

---

**Status:** ✅ Implementované  
**Ďalší krok:** Spustite SQL a otestujte funkcionalitu 