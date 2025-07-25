# 🚀 Nasadenie bezpečnostných opatrení - Yogapit

## 📋 Čo sme implementovali

Implementovali sme komplexný bezpečnostný systém na ochranu pred:
- ✅ Spam objednávkami
- ✅ SQL injection útokmi
- ✅ XSS útokmi
- ✅ DDoS útokmi
- ✅ Neplatnými vstupmi
- ✅ Zneužitím systému

## 🔧 Kroky na nasadenie

### 1. **Spustenie databázových bezpečnostných opatrení**

```bash
# 1. Otvorte Supabase dashboard
# 2. Choďte do SQL Editor
# 3. Skopírujte a spustite obsah súboru database-security-final.sql
```

**Čo SQL robí:**
- Nastaví Row Level Security (RLS) na všetkých tabuľkách
- Vytvorí constraints pre obmedzenie hodnôt (iba ak neexistujú)
- Pridá indexy pre výkon (iba ak neexistujú)
- Vytvorí triggers pre automatickú validáciu
- Nastaví audit logovanie
- Opravené chyby s existujúcimi objektmi
- Odstránený VACUUM príkaz z transakčného bloku

### 2. **Overenie frontend bezpečnosti**

```bash
# Spustite aplikáciu
npm run dev

# Otvorte konzolu prehliadača (F12)
# Spustite bezpečnostné testy
```

V konzole spustite:
```javascript
import securityTests from './src/lib/security.test.ts';
securityTests.runAllSecurityTests();
```

### 3. **Testovanie bezpečnostných opatrení**

#### Test 1: Rate Limiting
```javascript
// Skúste vytvoriť 6 objednávok za minútu
// 6. objednávka by mala zlyhať s chybou rate limitu
```

#### Test 2: Validácia vstupov
```javascript
// Skúste zadať neplatný email: "invalid-email"
// Skúste zadať neplatný telefón: "abc123"
// Skúste zadať XSS: "<script>alert('xss')</script>"
```

#### Test 3: Obmedzenia objednávok
```javascript
// Skúste vytvoriť objednávku s 1001 kusmi
// Skúste vytvoriť objednávku s hodnotou 15 000 €
// Skúste pridať 51 položiek do košíka
```

## ✅ Kontrolný zoznam

### Databázové bezpečnosť
- [ ] RLS povolené na všetkých tabuľkách
- [ ] Constraints pre obmedzenie hodnôt
- [ ] Indexy vytvorené
- [ ] Triggers pre validáciu
- [ ] Audit log tabuľky vytvorené

### Frontend bezpečnosť
- [ ] Rate limiting implementovaný
- [ ] Validácia vstupov funguje
- [ ] Sanitizácia vstupov funguje
- [ ] Obmedzenia objednávok fungujú
- [ ] Bezpečnostné testy prechádzajú

### Testovanie
- [ ] Rate limiting testy
- [ ] Validácia testy
- [ ] Sanitizácia testy
- [ ] Obmedzenia testy
- [ ] Admin validácia testy

## 🔍 Monitoring a sledovanie

### 1. **Bezpečnostné logy v konzole**
```javascript
// Sledujte konzolu pre bezpečnostné udalosti
[SECURITY] Order created: { orderId: "...", customerEmail: "...", totalAmount: 100 }
[SECURITY] Rate limit exceeded: { clientIP: "...", action: "order" }
```

### 2. **Databázové audit logy**
```sql
-- Zobraziť audit logy objednávok
SELECT * FROM order_audit_log ORDER BY changed_at DESC LIMIT 10;

-- Zobraziť rate limit logy
SELECT * FROM rate_limit_log ORDER BY created_at DESC LIMIT 10;
```

### 3. **Supabase Logs**
- Choďte do Supabase dashboard
- Sekcia "Logs"
- Sledujte chyby a varovania

### 4. **Optimalizácia výkonu (voliteľné)**
Po úspešnom spustení bezpečnostných opatrení môžete spustiť optimalizáciu:

```sql
-- Spustite SAMOSTATNE v novom SQL query
VACUUM ANALYZE;
```

Toto optimalizuje výkon databázy, ale nemôže bežať v transakčnom bloku.

## 🚨 Riešenie problémov

### Chyba: "RLS policy does not exist"
```sql
-- Skontrolujte či sú policies vytvorené
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### Chyba: "Constraint violation"
```sql
-- Skontrolujte constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'products'::regclass;
```

### Chyba: "Rate limit exceeded"
- Počkajte 1 minútu
- Alebo znížte rate limit v `src/lib/security.ts`

### Chyba: "Invalid input"
- Skontrolujte validáciu v `InputValidator`
- Overte formát vstupných údajov

## 📊 Metriky a výkon

### Bezpečnostné metriky
- **Rate limit porušení:** Sledujte v rate_limit_log
- **Neplatné objednávky:** Sledujte v konzole
- **Audit udalosti:** Sledujte v order_audit_log

### Výkonnostné metriky
- **Čas odozvy:** Sledujte v Supabase Logs
- **Databázové queries:** Sledujte v Supabase Dashboard
- **Frontend výkon:** Sledujte v DevTools

## 🔮 Budúce vylepšenia

### 1. **Discord autentifikácia**
- Implementovať OAuth2 flow
- Pridať rôzne úrovne prístupu
- Exkluzívne produkty pre členov

### 2. **Pokročilé monitoring**
- Grafické dashboardy
- Email notifikácie
- Automatické blokovanie IP

### 3. **CAPTCHA**
- Google reCAPTCHA
- Ochrana pred botmi
- Rate limiting na CAPTCHA úrovni

## 📞 Podpora

Ak máte problémy:
1. Skontrolujte Supabase logs
2. Pozrite konzolu prehliadača
3. Overte či sú všetky SQL príkazy spustené
4. Skontrolujte environment premenné

---

**Status:** ✅ Implementované  
**Nasadenie:** Postupujte podľa krokov vyššie  
**Monitoring:** Sledujte logy a metriky 