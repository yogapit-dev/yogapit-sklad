import { supabase } from './supabase';
import { Order, Customer, OrderItem, CartItem } from './types';
import { OrderSecurity, InputValidator, SecurityUtils } from './security';

export class OrderService {
  // Generovanie čísla objednávky v formáte YYYYNNN
  static async generateOrderNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Získanie poslednej objednávky pre daný rok
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `${yearPrefix}%`)
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    if (!lastOrder) {
      return `${yearPrefix}001`;
    }

    // Extrahovanie čísla z poslednej objednávky
    const lastNumber = parseInt(lastOrder.order_number.slice(-3));
    const nextNumber = lastNumber + 1;
    
    return `${yearPrefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  // Získanie rezervovaných kusov pre produkt
  static async getReservedQuantity(productId: string): Promise<number> {
    const { data, error } = await supabase
      .from('reserved_products')
      .select('reserved_quantity')
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Chyba pri načítaní rezervovaných kusov: ${error.message}`);
    }

    return data?.reserved_quantity || 0;
  }

  // Získanie dostupných kusov pre produkt
  static async getAvailableQuantity(productId: string): Promise<number> {
    const { data, error } = await supabase
      .from('available_products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Chyba pri načítaní dostupných kusov: ${error.message}`);
    }

    return data?.stock || 0;
  }

  // Vytvorenie zákazníka
  static async createCustomer(customerData: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    // Sanitizácia vstupných údajov
    const sanitizedData = SecurityUtils.sanitizeObject(customerData);
    
    // Validácia údajov
    if (!InputValidator.validateName(sanitizedData.name)) {
      throw new Error('Neplatné meno zákazníka');
    }
    
    if (!InputValidator.validateEmail(sanitizedData.email)) {
      throw new Error('Neplatný email zákazníka');
    }
    
    if (sanitizedData.phone && !InputValidator.validatePhone(sanitizedData.phone)) {
      throw new Error('Neplatný telefón zákazníka');
    }

    const { data, error } = await supabase
      .from('customers')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      throw new Error(`Chyba pri vytváraní zákazníka: ${error.message}`);
    }

    return data;
  }

  // Vytvorenie objednávky
  static async createOrder(
    customerId: string,
    cartItems: CartItem[],
    deliveryMethod: string,
    deliveryAddress: string,
    notes?: string
  ): Promise<Order> {
    // Sanitizácia poznámok
    const sanitizedNotes = notes ? InputValidator.sanitizeString(notes, 1000) : null;
    
    // Validácia poznámok
    if (notes && !InputValidator.validateOrderNotes(notes)) {
      throw new Error('Neplatné poznámky k objednávke');
    }

    const orderNumber = await this.generateOrderNumber();
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Skontrolovať dostupnosť skladu pred vytvorením objednávky
    for (const item of cartItems) {
      const availableQuantity = await this.getAvailableQuantity(item.product.id);
      if (availableQuantity < item.quantity) {
        throw new Error(`Produkt "${item.product.name}" nie je dostupný v požadovanom množstve. Dostupné: ${availableQuantity} ks`);
      }
    }

    // Vytvorenie objednávky
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        status: 'new',
        delivery_method: deliveryMethod,
        delivery_address: deliveryAddress,
        total_amount: totalAmount,
        notes: sanitizedNotes,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Chyba pri vytváraní objednávky: ${orderError.message}`);
    }

    // Vytvorenie položiek objednávky (reserved_from zostáva NULL)
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      reserved_from: null, // Zostáva NULL až do expedície
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Chyba pri vytváraní položiek objednávky: ${itemsError.message}`);
    }

    return order;
  }

  // Kompletný proces vytvorenia objednávky
  static async submitOrder(
    customerData: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      zip_code: string;
      country: string;
    },
    cartItems: CartItem[],
    deliveryMethod: string,
    notes?: string
  ): Promise<{ order: Order; customer: Customer }> {
    try {
      // Bezpečnostná validácia objednávky
      const validation = await OrderSecurity.validateOrderRequest(customerData, cartItems);
      if (!validation.valid) {
        throw new Error(validation.error || 'Neplatná objednávka');
      }

      // 1. Skontrolovať či zákazník už existuje podľa emailu
      let customer: Customer;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        customer = existingCustomer;
        // Aktualizovať údaje ak sa zmenili
        await supabase
          .from('customers')
          .update(customerData)
          .eq('id', customer.id);
      } else {
        // 2. Vytvoriť nového zákazníka
        customer = await this.createCustomer({
          ...customerData,
          customer_type: 'regular',
        });
      }

      // 3. Vytvoriť objednávku
      const deliveryAddress = deliveryMethod === 'personal' 
        ? 'Ľudové námestie 503/34, 831 03 Bratislava, Slovakia'
        : `${customerData.address}, ${customerData.city}, ${customerData.zip_code}, ${customerData.country}`;
      
      const order = await this.createOrder(customer.id, cartItems, deliveryMethod, deliveryAddress, notes);

      // Log bezpečnostnej udalosti
      SecurityUtils.logSecurityEvent('Order created', {
        orderId: order.id,
        customerEmail: customerData.email,
        totalAmount: order.total_amount,
        itemCount: cartItems.length
      });

      return { order, customer };
    } catch (error) {
      throw new Error(`Chyba pri odosielaní objednávky: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
    }
  }

  // Získanie objednávky s položkami
  static async getOrderWithItems(orderId: string): Promise<Order & { items: OrderItem[] }> {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      throw new Error(`Chyba pri načítaní objednávky: ${orderError.message}`);
    }

    // Najprv načítať položky
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      throw new Error(`Chyba pri načítaní položiek objednávky: ${itemsError.message}`);
    }

    // Potom načítať produkty pre každú položku
    const itemsWithProducts = [];
    if (items) {
      for (const item of items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error(`Chyba pri načítaní produktu ${item.product_id}:`, productError);
          continue;
        }

        itemsWithProducts.push({
          ...item,
          products: product
        });
      }
    }

    return {
      ...order,
      items: itemsWithProducts || [],
    };
  }

  // Aktualizácia stavu objednávky
  static async updateOrderStatus(orderId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Chyba pri aktualizácii stavu objednávky: ${error.message}`);
    }
  }

  // Aktualizácia stavu objednávky s výberom skladu pre expedíciu
  static async updateOrderStatusWithWarehouse(
    orderId: string, 
    status: string, 
    warehouseSelections?: { [productId: string]: 'bratislava' | 'ruzomberok' | 'bezo' }
  ): Promise<void> {
    // Ak sa mení na "shipped" alebo "delivered" a máme výbery skladov
    if ((status === 'shipped' || status === 'delivered') && warehouseSelections) {
      // Skontrolovať, či už bol sklad znížený pre túto objednávku
      const { data: existingItems, error: checkError } = await supabase
        .from('order_items')
        .select('product_id, reserved_from')
        .eq('order_id', orderId);

      if (checkError) {
        throw new Error(`Chyba pri kontrole existujúcich položiek: ${checkError.message}`);
      }

      // Zistiť, ktoré položky ešte nemajú nastavený reserved_from (ešte neboli expedované)
      const itemsToProcess = existingItems?.filter(item => !item.reserved_from) || [];

      if (itemsToProcess.length === 0) {
        console.log('Všetky položky tejto objednávky už boli expedované, preskakujem znižovanie skladu');
        // Aktualizovať stav objednávky bez znižovania skladu
        await this.updateOrderStatus(orderId, status);
        return;
      }

      // Aktualizovať reserved_from pre každú položku
      for (const [productId, warehouse] of Object.entries(warehouseSelections)) {
        const { error: updateError } = await supabase
          .from('order_items')
          .update({ reserved_from: warehouse })
          .eq('order_id', orderId)
          .eq('product_id', productId);

        if (updateError) {
          throw new Error(`Chyba pri aktualizácii skladu pre položku: ${updateError.message}`);
        }
      }

      // Znížiť reálny stav skladu podľa výberov (len pre položky, ktoré ešte neboli expedované)
      for (const [productId, warehouse] of Object.entries(warehouseSelections)) {
        const stockField = `stock_${warehouse}`;
        const { data: item, error: itemFetchError } = await supabase
          .from('order_items')
          .select('quantity')
          .eq('order_id', orderId)
          .eq('product_id', productId)
          .single();

        if (itemFetchError) {
          throw new Error(`Chyba pri načítaní množstva položky: ${itemFetchError.message}`);
        }

        // Najprv získať aktuálny stav skladu
        const { data: currentProduct, error: stockFetchError } = await supabase
          .from('products')
          .select(stockField)
          .eq('id', productId)
          .single();

        if (stockFetchError) {
          throw new Error(`Chyba pri načítaní stavu skladu: ${stockFetchError.message}`);
        }

        if (!currentProduct) {
          throw new Error(`Produkt s ID ${productId} nebol nájdený`);
        }

        const currentStock = currentProduct[stockField as keyof typeof currentProduct] as number;
        const newStock = Math.max(0, currentStock - item.quantity);

        const { error: stockError } = await supabase
          .from('products')
          .update({
            [stockField]: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (stockError) {
          throw new Error(`Chyba pri znižovaní stavu skladu: ${stockError.message}`);
        }
      }
    }

    // Aktualizovať stav objednávky
    await this.updateOrderStatus(orderId, status);
  }

  // Získanie všetkých objednávok (pre admin)
  static async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers (
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Chyba pri načítaní objednávok: ${error.message}`);
    }

    return data || [];
  }

  // Vymazanie objednávky
  static async deleteOrder(orderId: string): Promise<void> {
    // Najprv získať položky objednávky pre vrátenie stavu skladu
    const { data: orderItems, error: fetchError } = await supabase
      .from('order_items')
      .select('product_id, quantity, reserved_from')
      .eq('order_id', orderId);

    if (fetchError) {
      throw new Error(`Chyba pri načítaní položiek objednávky: ${fetchError.message}`);
    }

    // Vrátiť stav skladu pre každý produkt (ak už bol expedovaný)
    if (orderItems) {
      for (const item of orderItems) {
        if (item.reserved_from) {
          await this.restoreProductStock(item.product_id, item.quantity, item.reserved_from);
        }
      }
    }

    // Vymazať položky objednávky
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (itemsError) {
      throw new Error(`Chyba pri mazaní položiek objednávky: ${itemsError.message}`);
    }

    // Potom vymazať objednávku
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (orderError) {
      throw new Error(`Chyba pri mazaní objednávky: ${orderError.message}`);
    }
  }

  // Aktualizácia objednávky
  static async updateOrder(orderId: string, updateData: {
    status?: string;
    delivery_method?: string;
    delivery_address?: string;
    notes?: string;
    total_amount?: number;
  }): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      throw new Error(`Chyba pri aktualizácii objednávky: ${error.message}`);
    }
  }

  // Aktualizácia stavu skladu produktu (pre starý systém - už sa nepoužíva)
  static async updateProductStock(productId: string, quantityToReduce: number): Promise<void> {
    // Najprv získať aktuálny stav skladu
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_bratislava, stock_ruzomberok, stock_bezo')
      .eq('id', productId)
      .single();

    if (fetchError) {
      throw new Error(`Chyba pri načítaní stavu skladu: ${fetchError.message}`);
    }

    if (!product) {
      throw new Error(`Produkt s ID ${productId} nebol nájdený`);
    }

    // Vypočítať nový stav skladu - znižovať postupne z každého skladu
    let remainingQuantity = quantityToReduce;
    let newStockBratislava = product.stock_bratislava;
    let newStockRuzomberok = product.stock_ruzomberok;
    let newStockBezo = product.stock_bezo;

    // Znižovať najprv z Bratislavy
    if (newStockBratislava > 0 && remainingQuantity > 0) {
      const reduceFromBratislava = Math.min(newStockBratislava, remainingQuantity);
      newStockBratislava -= reduceFromBratislava;
      remainingQuantity -= reduceFromBratislava;
    }

    // Potom z Ružomberka
    if (newStockRuzomberok > 0 && remainingQuantity > 0) {
      const reduceFromRuzomberok = Math.min(newStockRuzomberok, remainingQuantity);
      newStockRuzomberok -= reduceFromRuzomberok;
      remainingQuantity -= reduceFromRuzomberok;
    }

    // Nakoniec z Beza
    if (newStockBezo > 0 && remainingQuantity > 0) {
      const reduceFromBezo = Math.min(newStockBezo, remainingQuantity);
      newStockBezo -= reduceFromBezo;
      remainingQuantity -= reduceFromBezo;
    }

    // Aktualizovať stav skladu
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_bratislava: newStockBratislava,
        stock_ruzomberok: newStockRuzomberok,
        stock_bezo: newStockBezo,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      throw new Error(`Chyba pri aktualizácii stavu skladu: ${updateError.message}`);
    }
  }

  // Vrátenie stavu skladu produktu (pri zrušení objednávky)
  static async restoreProductStock(productId: string, quantityToRestore: number, warehouse?: string): Promise<void> {
    // Najprv získať aktuálny stav skladu
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_bratislava, stock_ruzomberok, stock_bezo')
      .eq('id', productId)
      .single();

    if (fetchError) {
      throw new Error(`Chyba pri načítaní stavu skladu: ${fetchError.message}`);
    }

    if (!product) {
      throw new Error(`Produkt s ID ${productId} nebol nájdený`);
    }

    // Ak máme špecifický sklad, vrátiť tam
    if (warehouse) {
      const stockField = `stock_${warehouse}`;
      const currentStock = product[stockField as keyof typeof product] as number;
      const newStock = currentStock + quantityToRestore;

      const { error: updateError } = await supabase
        .from('products')
        .update({
          [stockField]: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        throw new Error(`Chyba pri vrátení stavu skladu: ${updateError.message}`);
      }
      return;
    }

    // Vrátiť stav skladu - pridávať postupne do každého skladu
    let remainingQuantity = quantityToRestore;
    let newStockBratislava = product.stock_bratislava;
    let newStockRuzomberok = product.stock_ruzomberok;
    let newStockBezo = product.stock_bezo;

    // Pridať najprv do Bratislavy (ak je tam miesto)
    const spaceInBratislava = 1000 - newStockBratislava; // Predpokladáme max 1000 ks na sklad
    if (spaceInBratislava > 0 && remainingQuantity > 0) {
      const addToBratislava = Math.min(spaceInBratislava, remainingQuantity);
      newStockBratislava += addToBratislava;
      remainingQuantity -= addToBratislava;
    }

    // Potom do Ružomberka
    const spaceInRuzomberok = 1000 - newStockRuzomberok;
    if (spaceInRuzomberok > 0 && remainingQuantity > 0) {
      const addToRuzomberok = Math.min(spaceInRuzomberok, remainingQuantity);
      newStockRuzomberok += addToRuzomberok;
      remainingQuantity -= addToRuzomberok;
    }

    // Nakoniec do Beza
    const spaceInBezo = 1000 - newStockBezo;
    if (spaceInBezo > 0 && remainingQuantity > 0) {
      const addToBezo = Math.min(spaceInBezo, remainingQuantity);
      newStockBezo += addToBezo;
      remainingQuantity -= addToBezo;
    }

    // Aktualizovať stav skladu
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_bratislava: newStockBratislava,
        stock_ruzomberok: newStockRuzomberok,
        stock_bezo: newStockBezo,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      throw new Error(`Chyba pri vrátení stavu skladu: ${updateError.message}`);
    }
  }
} 