# 🔧 Oprava chyby pri vytváraní produktov

## 🚨 Problém
V konzole sa zobrazuje chyba:
- `Error creating product: Object`
- `Bad Request` chyba pri volaní Supabase API

## 🛠️ Riešenie

### 1. Spustite SQL v Supabase
- Otvorte **Supabase dashboard**
- Choďte do **SQL Editor**
- Spustite obsah súboru `fix-products-rls.sql`

### 2. Čo SQL robí
- **Kontroluje RLS nastavenia** pre products tabuľku
- **Dočasne vypne RLS** pre testovanie
- **Zobrazí aktuálne policies**

### 3. Alternatívne riešenie
Ak chcete RLS zapnuté, odkomentujte riadky v SQL súbore:
```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all reads on products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow all inserts on products" ON products
  FOR INSERT WITH CHECK (true);
```

## ✅ Overenie
Po spustení SQL:
1. **Skúste vytvoriť nový produkt** v admin sekcii
2. **Skontrolujte konzolu** - chyba by mala zmiznúť
3. **Produkt by sa mal uložiť** do databázy

## 🔍 Príčina
Problém je pravdepodobne v **Row Level Security (RLS)** policies, ktoré blokujú INSERT operácie na products tabuľku.

---

**Status:** ✅ SQL pripravený  
**Ďalší krok:** Spustite SQL v Supabase a otestujte vytváranie produktov 