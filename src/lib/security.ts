// Bezpečnostné opatrenia pre Yogapit systém
import { supabase } from './supabase';

// Rate limiting store
interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry) {
      this.limits.set(key, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return true;
    }

    // Reset ak uplynul časový limit
    if (now - entry.firstRequest > this.windowMs) {
      this.limits.set(key, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return true;
    }

    // Skontrolovať limit
    if (entry.count >= this.maxRequests) {
      return false;
    }

    // Zvýšiť počítadlo
    entry.count++;
    entry.lastRequest = now;
    return true;
  }

  getRemainingTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    
    const now = Date.now();
    const elapsed = now - entry.firstRequest;
    return Math.max(0, this.windowMs - elapsed);
  }

  clear(): void {
    this.limits.clear();
  }
}

// Inštancie rate limiterov pre rôzne akcie
export const orderRateLimiter = new RateLimiter(60000, 5); // 5 objednávok za minútu
export const customerRateLimiter = new RateLimiter(300000, 3); // 3 noví zákazníci za 5 minút
export const productRateLimiter = new RateLimiter(60000, 20); // 20 produktových operácií za minútu
export const adminRateLimiter = new RateLimiter(60000, 50); // 50 admin operácií za minútu

// Validácia vstupných údajov
export class InputValidator {
  static sanitizeString(input: string, maxLength: number = 500): string {
    if (typeof input !== 'string') return '';
    
    // Odstrániť nebezpečné znaky
    let sanitized = input
      .replace(/[<>]/g, '') // Odstrániť < >
      .replace(/javascript:/gi, '') // Odstrániť javascript: prefix
      .replace(/on\w+=/gi, '') // Odstrániť event handlery
      .trim();
    
    // Obmedziť dĺžku
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
  }

  static validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    // Povoliť len čísla, medzery, +, -, (, )
    const phoneRegex = /^[\d\s+\-()]+$/;
    return phoneRegex.test(phone.trim()) && phone.length <= 20;
  }

  static validateName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    
    // Povoliť len písmená, čísla, medzery, bodky, pomlčky
    const nameRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\s.\-']+$/;
    return nameRegex.test(name.trim()) && name.length >= 2 && name.length <= 100;
  }

  static validateAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;
    
    // Povoliť písmená, čísla, medzery, bodky, pomlčky, čiarky
    const addressRegex = /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F0-9\s.\-,']+$/;
    return addressRegex.test(address.trim()) && address.length >= 5 && address.length <= 200;
  }

  static validateZipCode(zipCode: string): boolean {
    if (!zipCode || typeof zipCode !== 'string') return false;
    
    // Povoliť len čísla a medzery
    const zipRegex = /^[\d\s]+$/;
    return zipRegex.test(zipCode.trim()) && zipCode.length >= 3 && zipCode.length <= 10;
  }

  static validateQuantity(quantity: number): boolean {
    return typeof quantity === 'number' && 
           Number.isInteger(quantity) && 
           quantity > 0 && 
           quantity <= 1000; // Max 1000 kusov na objednávku
  }

  static validatePrice(price: number): boolean {
    return typeof price === 'number' && 
           price >= 0 && 
           price <= 10000 && // Max 10 000 €
           Number.isFinite(price);
  }

  static validateOrderNotes(notes: string): boolean {
    if (!notes) return true; // Prázdne poznámky sú OK
    
    const sanitized = this.sanitizeString(notes, 1000);
    return sanitized.length <= 1000;
  }
}

// Bezpečnostné kontroly pre objednávky
export class OrderSecurity {
  static async validateOrderRequest(
    customerData: any,
    cartItems: any[],
    clientIP?: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // 1. Rate limiting
      const rateLimitKey = clientIP || 'unknown';
      if (!orderRateLimiter.isAllowed(rateLimitKey)) {
        const remainingTime = orderRateLimiter.getRemainingTime(rateLimitKey);
        return {
          valid: false,
          error: `Príliš veľa objednávok. Skúste to znova za ${Math.ceil(remainingTime / 1000)} sekúnd.`
        };
      }

      // 2. Validácia zákazníckych údajov
      if (!InputValidator.validateName(customerData.name)) {
        return { valid: false, error: 'Neplatné meno zákazníka' };
      }

      if (!InputValidator.validateEmail(customerData.email)) {
        return { valid: false, error: 'Neplatný email' };
      }

      if (!InputValidator.validatePhone(customerData.phone)) {
        return { valid: false, error: 'Neplatný telefón' };
      }

      if (customerData.address && !InputValidator.validateAddress(customerData.address)) {
        return { valid: false, error: 'Neplatná adresa' };
      }

      if (customerData.city && !InputValidator.validateName(customerData.city)) {
        return { valid: false, error: 'Neplatné mesto' };
      }

      if (customerData.zip_code && !InputValidator.validateZipCode(customerData.zip_code)) {
        return { valid: false, error: 'Neplatné PSČ' };
      }

      // 3. Validácia košíka
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return { valid: false, error: 'Košík je prázdny' };
      }

      if (cartItems.length > 50) {
        return { valid: false, error: 'Príliš veľa položiek v košíku (max 50)' };
      }

      // 4. Validácia položiek
      let totalQuantity = 0;
      let totalAmount = 0;

      for (const item of cartItems) {
        if (!item.product || !item.product.id) {
          return { valid: false, error: 'Neplatná položka v košíku' };
        }

        if (!InputValidator.validateQuantity(item.quantity)) {
          return { valid: false, error: 'Neplatné množstvo položky' };
        }

        if (!InputValidator.validatePrice(item.product.price)) {
          return { valid: false, error: 'Neplatná cena produktu' };
        }

        totalQuantity += item.quantity;
        totalAmount += item.product.price * item.quantity;
      }

      // 5. Limity na objednávku
      if (totalQuantity > 1000) {
        return { valid: false, error: 'Príliš veľa kusov v objednávke (max 1000)' };
      }

      if (totalAmount > 10000) {
        return { valid: false, error: 'Príliš vysoká hodnota objednávky (max 10 000 €)' };
      }

      // 6. Kontrola duplicitných objednávok
      const recentOrders = await this.checkRecentOrders(customerData.email);
      if (recentOrders > 3) {
        return { valid: false, error: 'Príliš veľa objednávok v krátkom čase' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Order validation error:', error);
      return { valid: false, error: 'Chyba pri validácii objednávky' };
    }
  }

  private static async checkRecentOrders(email: string): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customers.email', email)
        .gte('created_at', oneHourAgo);

      if (error) {
        console.error('Error checking recent orders:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error checking recent orders:', error);
      return 0;
    }
  }

  static async validateProductAccess(productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, is_exclusive')
        .eq('id', productId)
        .single();

      if (error || !data) {
        return false;
      }

      // Pre teraz povoliť všetky produkty, neskôr sa pridá Discord auth
      return true;
    } catch (error) {
      console.error('Error validating product access:', error);
      return false;
    }
  }
}

// Bezpečnostné kontroly pre admin operácie
export class AdminSecurity {
  static async validateAdminOperation(operation: string, clientIP?: string): Promise<boolean> {
    const rateLimitKey = `admin_${clientIP || 'unknown'}`;
    return adminRateLimiter.isAllowed(rateLimitKey);
  }

  static validateProductData(productData: any): { valid: boolean; error?: string } {
    try {
      if (!productData.name || !InputValidator.sanitizeString(productData.name, 200)) {
        return { valid: false, error: 'Neplatný názov produktu' };
      }

      if (!InputValidator.validatePrice(productData.price)) {
        return { valid: false, error: 'Neplatná cena produktu' };
      }

      if (productData.description && !InputValidator.sanitizeString(productData.description, 2000)) {
        return { valid: false, error: 'Neplatný popis produktu' };
      }

      if (productData.stock_bratislava !== undefined && !Number.isInteger(productData.stock_bratislava)) {
        return { valid: false, error: 'Neplatný stav skladu Bratislava' };
      }

      if (productData.stock_ruzomberok !== undefined && !Number.isInteger(productData.stock_ruzomberok)) {
        return { valid: false, error: 'Neplatný stav skladu Ružomberok' };
      }

      if (productData.stock_bezo !== undefined && !Number.isInteger(productData.stock_bezo)) {
        return { valid: false, error: 'Neplatný stav skladu Bezo' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Product validation error:', error);
      return { valid: false, error: 'Chyba pri validácii produktu' };
    }
  }

  static validateCustomerData(customerData: any): { valid: boolean; error?: string } {
    try {
      if (!InputValidator.validateName(customerData.name)) {
        return { valid: false, error: 'Neplatné meno zákazníka' };
      }

      if (!InputValidator.validateEmail(customerData.email)) {
        return { valid: false, error: 'Neplatný email' };
      }

      if (customerData.phone && !InputValidator.validatePhone(customerData.phone)) {
        return { valid: false, error: 'Neplatný telefón' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Customer validation error:', error);
      return { valid: false, error: 'Chyba pri validácii zákazníka' };
    }
  }
}

// Utility funkcie pre bezpečnosť
export class SecurityUtils {
  static generateClientId(): string {
    // Jednoduchý generátor pre identifikáciu klienta
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = InputValidator.sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  static logSecurityEvent(event: string, details: any): void {
    console.warn(`[SECURITY] ${event}:`, details);
    // Tu by sa malo logovať do bezpečnostného systému
  }
} 