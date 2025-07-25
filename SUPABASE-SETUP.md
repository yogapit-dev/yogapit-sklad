# 🔧 Supabase Setup - Yogapit E-shop

## 📋 Krok za krokom inštrukcie

### 1. Vytvorenie Supabase projektu

1. **Choďte na [supabase.com](https://supabase.com)**
2. **Prihláste sa** alebo vytvorte účet
3. **Kliknite "New Project"**
4. **Vyplňte údaje:**
   - Organization: vyberte vašu organizáciu
   - Name: `yogapit-sklad`
   - Database Password: vytvorte silné heslo (uložte si ho!)
   - Region: vyberte najbližší (napr. West Europe)
5. **Kliknite "Create new project"**

### 2. Získanie API kľúčov

1. **Po vytvorení projektu** choďte do **Settings** → **API**
2. **Skopírujte:**
   - **Project URL** (napr. `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (začína s `eyJ...`)

### 3. Vytvorenie .env súboru

1. **V koreňovom priečinku projektu** vytvorte súbor `.env`
2. **Skopírujte obsah z `env-config.txt`**
3. **Nahraďte placeholder hodnoty:**

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Nastavenie databázy

1. **V Supabase dashboardi** choďte do **SQL Editor**
2. **Kliknite "New query"**
3. **Skopírujte a spustite** obsah súboru `database-schema.sql`
4. **Počkajte** kým sa všetky tabuľky vytvoria

### 5. Testovanie pripojenia

1. **Spustite aplikáciu:**
   ```bash
   npm run dev
   ```

2. **Otvorte konzolu prehliadača** (F12)
3. **Skontrolujte** či sa zobrazujú produkty z databázy

## 🔍 Riešenie problémov

### Chyba: "Missing Supabase environment variables"
- Skontrolujte či máte správne `.env` súbor
- Reštartujte development server

### Chyba: "Invalid API key"
- Skontrolujte či je anon key správne skopírovaný
- Overte či projekt URL je správny

### Chyba: "Table does not exist"
- Spustite `database-schema.sql` v Supabase SQL Editori
- Skontrolujte či sa všetky tabuľky vytvorili

## 📊 Overenie nastavenia

Po úspešnom setup by ste mali vidieť:

1. **Produkty na hlavnej stránke** (4 sample produkty)
2. **Kategórie** (Védske texty, Učebné materiály, atď.)
3. **Funkčný košík** a checkout proces
4. **Admin rozhranie** na `/admin`

## 🔐 Bezpečnosť

- **Nikdy** necommitnite `.env` súbor do Git
- `.env` je už v `.gitignore`
- Používajte len **anon key** pre frontend
- **Service role key** používajte len pre backend

## 📞 Podpora

Ak máte problémy:
1. Skontrolujte Supabase logs v dashboardi
2. Pozrite konzolu prehliadača pre chyby
3. Overte či sú všetky environment premenné nastavené

---

**Status:** ✅ Inštrukcie pripravené  
**Ďalší krok:** Vytvorte Supabase projekt a nastavte .env súbor 

# Skladové rezervácie a prehľad

## 1. Pridať stĺpec reserved_from do order_items

```sql
ALTER TABLE order_items ADD COLUMN reserved_from VARCHAR(32);
```

## 2. Pohľad na rezervované produkty (všetky "aktívne" objednávky)

```sql
CREATE OR REPLACE VIEW reserved_products AS
SELECT 
  oi.product_id,
  SUM(oi.quantity) AS reserved_quantity
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status NOT IN ('delivered', 'cancelled')
GROUP BY oi.product_id;
```

## 3. Pohľad na dostupné produkty

```sql
CREATE OR REPLACE VIEW available_products AS
SELECT 
  p.id AS product_id,
  (p.stock_bratislava + p.stock_ruzomberok + p.stock_bezo) - COALESCE(rp.reserved_quantity, 0) AS available_quantity
FROM products p
LEFT JOIN reserved_products rp ON rp.product_id = p.id;
```

---

**Poznámka:**
- Stĺpec `reserved_from` bude NULL až do expedície, potom sa nastaví podľa výberu admina.
- Pohľad `reserved_products` ukazuje, koľko kusov je "v riešení" (rezervované, nevybavené objednávky).
- Pohľad `available_products` ukazuje, koľko je reálne dostupné na objednanie. 