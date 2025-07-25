# 🏛️ Yogapit - Kompletný objednávkový systém

## 🎯 Prehľad projektu

**Cieľ:** E-shop pre objednávky kníh, védske textov a učebných materiálov bez online platby.

## ✅ Implementované funkcie

### **Frontend (React + TypeScript + Vite)**
- ✅ **Katalóg produktov** - filtrovanie podľa kategórií
- ✅ **Košík** - pridávanie, úprava množstva, odoberanie položiek
- ✅ **Objednávkový proces** - 2-krokový checkout s kontaktnými údajmi
- ✅ **Admin rozhranie** - správa objednávok a stavov
- ✅ **Responsive dizajn** - mobilné a desktop rozhranie
- ✅ **Fialová téma** - konzistentný dizajn

### **Backend (Supabase)**
- ✅ **Databázová štruktúra** - produkty, objednávky, zákazníci
- ✅ **OrderService** - kompletná logika pre objednávky
- ✅ **Generovanie čísel objednávok** - formát YYYYNNN
- ✅ **Stavy objednávok** - 6 rôznych stavov

## 🚀 Spustenie projektu

```bash
# Inštalácia závislostí
npm install

# Spustenie development servera
npm run dev

# Build pre produkciu
npm run build
```

## 📋 Ďalšie kroky pre implementáciu

### **Fáza 1: Supabase Setup (1-2 hodiny)**
1. **Vytvorenie Supabase projektu**
   ```bash
   # 1. Choď na https://supabase.com
   # 2. Vytvor nový projekt
   # 3. Skopíruj URL a ANON_KEY do .env súboru
   ```

2. **Databázové tabuľky**
   ```sql
   -- Vytvoriť tabuľky v Supabase SQL editori
   -- Pozri: database-schema.sql
   ```

3. **Environment premenné**
   ```bash
   # Vytvor .env súbor
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### **Fáza 2: Discord OAuth2 (2-3 dni)**
1. **Discord Developer Portal**
   - Vytvoriť aplikáciu na https://discord.com/developers/applications
   - Nastaviť OAuth2 redirect URI
   - Získať Client ID a Client Secret

2. **Implementácia autentifikácie**
   - Discord OAuth2 flow
   - Správa užívateľských rolí
   - Exkluzívne produkty pre členov

### **Fáza 3: Admin funkcionalita (2-3 dni)**
1. **Správa produktov**
   - CRUD operácie pre produkty
   - Upload obrázkov
   - Kategórie a tagy

2. **Správa zákazníkov**
   - Prehľad zákazníkov
   - História objednávok
   - Správa typov zákazníkov

3. **Analýzy a reporty**
   - Predajné reporty
   - Najpopulárnejšie produkty
   - Finančné analýzy

### **Fáza 4: Email notifikácie (1 deň)**
1. **Potvrdenie objednávky**
2. **Zmena stavu objednávky**
3. **Sledovanie balíčkov**

## 🗄️ Databázová štruktúra

### **Tabuľky:**
- `products` - produkty s cenami a skladom
- `categories` - kategórie produktov
- `customers` - zákazníci a ich údaje
- `orders` - objednávky s číslami a stavmi
- `order_items` - položky v objednávkach
- `users` - Discord užívatelia s rolami

### **Stavy objednávok:**
- `new` - Nová objednávka
- `waiting_payment` - Čaká na platbu
- `paid_waiting_shipment` - Zaplatená, čaká na odoslanie
- `shipped` - Odoslaná
- `delivered` - Doručená
- `cancelled` - Zrušená

## 🎨 Dizajn

- **Farebná schéma:** Fialová téma (`#8976C7`)
- **Font:** Inter
- **Komponenty:** shadcn/ui + Tailwind CSS
- **Layout:** Grid systém, responsive design

## 📱 Užívateľské úrovne

1. **Bežní zákazníci** - základný katalóg, objednávky
2. **Yogapit členovia** - exkluzívne produkty, Discord prihlásenie
3. **Skladoví manažeri** - správa objednávok, sklad
4. **Administrátori** - plný prístup, reporty

## 🔧 Technológie

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **State Management:** Zustand
- **Routing:** React Router DOM
- **Icons:** Lucide React

## 📞 Kontakt

Pre otázky a podporu kontaktujte vývojový tím.

---

**Status:** ✅ Základná funkcionalita implementovaná  
**Ďalší krok:** Supabase setup a Discord OAuth2 integrácia
