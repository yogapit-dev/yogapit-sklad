# 📁 Nastavenie Supabase Storage pre obrázky produktov

## 🚀 Rýchle nastavenie

### 1. Spustite SQL v Supabase
- Otvorte **Supabase dashboard**
- Choďte do **SQL Editor**
- Spustite obsah súboru `setup-storage.sql`

### 2. Čo SQL robí
- **Vytvorí Storage bucket** `product-images`
- **Nastaví verejný prístup** pre čítanie obrázkov
- **Nastaví RLS policies** pre upload/update/delete

### 3. Alternatívne nastavenie (bez autentifikácie)
Ak chcete povoliť upload bez prihlásenia, odkomentujte posledný riadok v SQL:
```sql
CREATE POLICY "Allow all operations" ON storage.objects
  FOR ALL USING (bucket_id = 'product-images');
```

## ✅ Overenie nastavenia

Po spustení SQL:
1. **Choďte do Storage** v Supabase dashboardi
2. **Mali by ste vidieť bucket** `product-images`
3. **Skúste vytvoriť produkt** s obrázkom v admin rozhraní
4. **Obrázok by sa mal nahrať** a zobraziť

## 🔧 Riešenie problémov

### Chyba: "Bucket does not exist"
- Spustite `setup-storage.sql` v Supabase SQL Editori
- Skontrolujte či sa bucket vytvoril v Storage sekcii

### Chyba: "Access denied"
- Skontrolujte RLS policies v Storage sekcii
- Pre testovanie použite "Allow all operations" policy

### Chyba: "File too large"
- Zväčšite `file_size_limit` v SQL (aktuálne 5MB)
- Alebo zmenšite obrázok pred uploadom

## 📊 Nastavenia bucket

- **Názov:** `product-images`
- **Verejný:** Áno (obrázky sú dostupné pre všetkých)
- **Limit veľkosti:** 5MB
- **Povolené formáty:** JPEG, PNG, WebP, GIF

## 🔒 Bezpečnosť

- **Čítanie:** Povolené pre všetkých
- **Upload/Update/Delete:** Len pre autentifikovaných užívateľov
- **Alternatívne:** Povolené pre všetkých (pre testovanie)

---

**Status:** ✅ SQL pripravený  
**Ďalší krok:** Spustite SQL v Supabase a otestujte upload obrázkov 