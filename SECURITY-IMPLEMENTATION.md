# 🔒 Bezpečnostné opatrenia - Yogapit systém

## 📋 Prehľad implementovaných zabezpečení

Implementovali sme komplexný bezpečnostný systém na ochranu pred zneužitím a útokmi na webovú aplikáciu.

## 🛡️ Frontend bezpečnosť

### 1. **Rate Limiting (Obmedzenie frekvencie požiadaviek)**
- **Objednávky:** Max 5 objednávok za minútu na IP adresu
- **Zákazníci:** Max 3 noví zákazníci za 5 minút na IP adresu
- **Produkty:** Max 20 produktových operácií za minútu
- **Admin:** Max 50 admin operácií za minútu

### 2. **Validácia vstupných údajov**
- **Email:** Regex validácia + maximálna dĺžka 254 znakov
- **Telefón:** Len čísla, medzery, +, -, (, ) - max 20 znakov
- **Meno:** Len písmená, medzery, bodky, pomlčky - 2-100 znakov
- **Adresa:** Písmená, čísla, medzery, bodky, pomlčky, čiarky - 5-200 znakov
- **PSČ:** Len čísla a medzery - 3-10 znakov
- **Množstvo:** Celé čísla 1-1000
- **Cena:** Čísla 0-10 000 €

### 3. **Sanitizácia vstupov**
- Odstránenie nebezpečných HTML tagov (`<`, `>`)
- Odstránenie JavaScript prefixov (`javascript:`)
- Odstránenie event handlerov (`onclick=`, `onload=`, atď.)
- Obmedzenie dĺžky textových polí

### 4. **Obmedzenia objednávok**
- Max 50 položiek v košíku
- Max 1000 kusov na objednávku
- Max 10 000 € hodnota objednávky
- Max 3 objednávky za hodinu na email

## 🗄️ Databázová bezpečnosť

### 1. **Row Level Security (RLS)**
- Všetky tabuľky majú povolené RLS
- Rôzne policies pre rôzne typy užívateľov
- Čítanie produktov povolené všetkým
- Editácia len pre adminov

### 2. **Constraints a validácie**
```sql
-- Obmedzenie ceny produktov
CHECK (price >= 0 AND price <= 10000)

-- Obmedzenie skladu
CHECK (stock_bratislava >= 0 AND stock_bratislava <= 10000)

-- Obmedzenie množstva v objednávke
CHECK (quantity > 0 AND quantity <= 1000)

-- Obmedzenie celkovej hodnoty objednávky
CHECK (total_amount >= 0 AND total_amount <= 10000)
```

### 3. **Triggers pre automatickú validáciu**
- **Kontrola dostupnosti skladu** pri vytváraní objednávky
- **Audit log** pre zmeny v objednávkach
- **Rate limiting** na databázovej úrovni

### 4. **Indexy pre výkon a bezpečnosť**
- Index na email zákazníka
- Index na číslo objednávky
- Index na dátum vytvorenia
- Index na stav objednávky

## 🔍 Audit a logovanie

### 1. **Bezpečnostné udalosti**
- Logovanie vytvorených objednávok
- Logovanie pokusov o zneužitie
- Logovanie rate limit porušení

### 2. **Audit log tabuľky**
- `order_audit_log` - zmeny v objednávkach
- `rate_limit_log` - rate limiting udalosti

### 3. **Automatické čistenie**
- Staré rate limit logy sa mažú po 1 hodine
- Optimalizácia výkonu databázy

## 🚫 Ochrana pred útokmi

### 1. **SQL Injection**
- Používanie Supabase ORM
- Parametrizované queries
- Validácia všetkých vstupov

### 2. **XSS (Cross-Site Scripting)**
- Sanitizácia všetkých textových vstupov
- Odstránenie nebezpečných HTML tagov
- Validácia emailov a URL

### 3. **CSRF (Cross-Site Request Forgery)**
- Supabase automaticky generuje CSRF tokeny
- Validácia origin headers

### 4. **DDoS a Spam**
- Rate limiting na všetkých endpointoch
- Obmedzenie veľkosti objednávok
- Kontrola duplicitných objednávok

## 📊 Monitoring a alerting

### 1. **Bezpečnostné metriky**
- Počet pokusov o zneužitie
- Rate limit porušení
- Neplatné objednávky

### 2. **Logovanie do konzoly**
```javascript
SecurityUtils.logSecurityEvent('Order created', {
  orderId: order.id,
  customerEmail: customerData.email,
  totalAmount: order.total_amount,
  itemCount: cartItems.length
});
```

## 🔧 Konfigurácia

### 1. **Rate Limiting nastavenia**
```javascript
// V src/lib/security.ts
export const orderRateLimiter = new RateLimiter(60000, 5); // 5 objednávok za minútu
export const customerRateLimiter = new RateLimiter(300000, 3); // 3 zákazníci za 5 minút
```

### 2. **Validácia nastavenia**
```javascript
// Maximálne hodnoty
const MAX_ORDER_VALUE = 10000; // €
const MAX_ORDER_QUANTITY = 1000; // kusov
const MAX_CART_ITEMS = 50; // položiek
```

## 🚀 Nasadenie

### 1. **Spustenie SQL**
```bash
# V Supabase SQL Editori spustite:
# database-security.sql
```

### 2. **Overenie nastavenia**
- Skontrolujte či sa vytvorili všetky constraints
- Otestujte rate limiting
- Overte validáciu vstupov

### 3. **Monitoring**
- Sledujte bezpečnostné logy v konzole
- Kontrolujte audit logy v databáze
- Monitorujte rate limit porušení

## 📈 Výkon a optimalizácia

### 1. **Indexy**
- Všetky často používané queries majú indexy
- Optimalizované pre rýchle vyhľadávanie

### 2. **Caching**
- Rate limiting cache v pamäti
- Minimalizácia databázových volaní

### 3. **Čistenie**
- Automatické mazanie starých logov
- Vákuum a analýza databázy

## 🔮 Budúce vylepšenia

### 1. **Discord autentifikácia**
- OAuth2 flow pre členov Yogapit
- Exkluzívne produkty len pre členov
- Rôzne úrovne prístupu

### 2. **Pokročilé monitoring**
- Grafické dashboardy pre bezpečnosť
- Email notifikácie pri pokusoch o zneužitie
- Automatické blokovanie IP adries

### 3. **CAPTCHA**
- Google reCAPTCHA pre objednávky
- Ochrana pred botmi
- Rate limiting na CAPTCHA úrovni

## ✅ Testovanie bezpečnosti

### 1. **Manuálne testy**
- Pokus o vytvorenie príliš veľkej objednávky
- Pokus o spam objednávok
- Pokus o XSS v textových poliach

### 2. **Automatické testy**
- Unit testy pre validáciu
- Integration testy pre rate limiting
- E2E testy pre bezpečnostné scenáre

---

**Status:** ✅ Implementované  
**Posledná aktualizácia:** Dnes  
**Ďalší krok:** Spustite SQL a otestujte bezpečnosť 