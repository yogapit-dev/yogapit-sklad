import React, { useState, useMemo } from 'react';
import { Trash2, Plus, Minus, ShoppingCart, User, MapPin, Truck, CheckCircle } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { DeliveryMethod } from '../lib/types';
import { OrderService } from '../lib/order-service';
import { getDeliveryPrice, getDeliveryOptions } from '../lib/delivery-pricing';
import { InputValidator } from '../lib/security';

export default function CartPage() {
  const { items, getTotal, removeItem, updateQuantity, clearCart } = useCartStore();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Calculate total weight and delivery price
  const totalWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      // Assuming each product has weight in grams, convert to kg
      const productWeight = (item.product as any).weight || 100; // default 100g if not specified
      return sum + (productWeight * item.quantity / 1000);
    }, 0);
  }, [items]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    deliveryMethod: 'personal' as DeliveryMethod,
    address: '',
    city: '',
    zipCode: '',
    country: 'Slovensko',
    notes: ''
  });
  
  const deliveryPrice = useMemo(() => {
    if (formData.deliveryMethod === 'personal') return 0;
    return getDeliveryPrice(formData.country, totalWeight, formData.deliveryMethod);
  }, [formData.deliveryMethod, formData.country, totalWeight]);
  
  // Výpočet medzisúčtu a celkovej sumy
  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const finalTotal = subtotal + deliveryPrice;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      // Skontrolovať dostupnosť skladu (reálny sklad - rezervované)
      const item = items.find(item => item.product.id === productId);
      if (item) {
        const totalStock = item.product.stock_bratislava + item.product.stock_ruzomberok + item.product.stock_bezo;
        // Pre teraz používame celkový sklad, neskôr sa to nahradí API volaním
        const availableStock = totalStock;
        if (newQuantity > availableStock) {
          alert(`Produkt "${item.product.name}" nie je dostupný v požadovanom množstve. Dostupné: ${availableStock} kusov`);
          return;
        }
      }
      updateQuantity(productId, newQuantity);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setStep('checkout');
  };

  const handleSubmitOrder = async () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate required fields with security validation
    if (!formData.firstName.trim() || !InputValidator.validateName(formData.firstName)) {
      newErrors.firstName = 'Meno je povinné a musí obsahovať len písmená';
    }
    if (!formData.lastName.trim() || !InputValidator.validateName(formData.lastName)) {
      newErrors.lastName = 'Priezvisko je povinné a musí obsahovať len písmená';
    }
    if (!formData.email.trim() || !InputValidator.validateEmail(formData.email)) {
      newErrors.email = 'Email je povinný a musí byť platný';
    }
    if (!formData.phone.trim() || !InputValidator.validatePhone(formData.phone)) {
      newErrors.phone = 'Telefón je povinný a musí byť platný';
    }
    
    // Validate delivery address if not personal pickup
    if (formData.deliveryMethod !== 'personal') {
      if (!formData.address.trim() || !InputValidator.validateAddress(formData.address)) {
        newErrors.address = 'Adresa je povinná a musí byť platná';
      }
      if (!formData.city.trim() || !InputValidator.validateName(formData.city)) {
        newErrors.city = 'Mesto je povinné a musí byť platné';
      }
      if (!formData.zipCode.trim() || !InputValidator.validateZipCode(formData.zipCode)) {
        newErrors.zipCode = 'PSČ je povinné a musí byť platné';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    setLoading(true);
    try {
      const result = await OrderService.submitOrder(
        {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address: formData.deliveryMethod === 'personal' ? 'Ľudové námestie 503/34, 831 03 Bratislava, Slovakia' : formData.address,
          city: formData.deliveryMethod === 'personal' ? 'Bratislava' : formData.city,
          zip_code: formData.deliveryMethod === 'personal' ? '831 03' : formData.zipCode,
          country: formData.country,
        },
        items,
        formData.deliveryMethod,
        formData.notes
      );

      setOrderNumber(result.order.order_number);
      setStep('success');
      // Vymazanie košíka až po zobrazení success správy
      setTimeout(() => {
        clearCart();
      }, 100);
    } catch (error) {
      console.error('Error submitting order:', error);
      setErrors({ general: `Chyba pri odosielaní objednávky: ${error instanceof Error ? error.message : 'Neznáma chyba'}` });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Váš košík je prázdny</h1>
            <p className="text-gray-300 mb-8 max-w-md mx-auto">Pridajte si produkty do košíka a pokračujte v objednávke</p>
            <a
              href="/"
              className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition-colors font-medium inline-flex items-center space-x-2"
            >
              <span>Pokračovať v nákupe</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <ShoppingCart className="h-8 w-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">
              {step === 'cart' ? 'Košík' : 'Dokončenie objednávky'}
        </h1>
            <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'položka' : items.length < 5 ? 'položky' : 'položiek'}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 text-sm">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${step === 'cart' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
              <ShoppingCart className="h-4 w-4" />
              <span>Košík</span>
            </div>
            <div className="text-gray-600">→</div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${step === 'checkout' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
              <User className="h-4 w-4" />
              <span>Kontaktné údaje</span>
            </div>
            {step === 'success' && (
              <>
                <div className="text-gray-600">→</div>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-green-600 text-white">
                  <CheckCircle className="h-4 w-4" />
                  <span>Dokončené</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-7">
            {step === 'success' ? (
              /* Success Step */
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">Objednávka bola úspešne odoslaná!</h2>
                <p className="text-gray-300 mb-6">
                  Ďakujeme za vašu objednávku. Číslo objednávky: <span className="text-purple-400 font-semibold">{orderNumber}</span>
                </p>
                <p className="text-gray-400 mb-8">
                  Potvrdenie objednávky sme odoslali na váš email. Budeme vás informovať o ďalších krokoch.
                </p>
                <div className="space-y-3">
                  <a
                    href="/"
                    className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors inline-block"
                  >
                    Pokračovať v nákupe
                  </a>
                  <button
                    onClick={() => {
                      setStep('cart');
                      clearCart();
                    }}
                    className="bg-gray-700 text-gray-300 px-6 py-3 rounded-full hover:bg-gray-600 transition-colors inline-block ml-3"
                  >
                    Zobraziť košík
                  </button>
                </div>
              </div>
            ) : step === 'cart' ? (
              /* Cart Items */
              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Produkty v košíku</h2>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1 px-3 py-1 rounded-full border border-red-400 hover:bg-red-400 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Vyprázdniť košík</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center">Obrázok</div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm">{item.product.name}</h3>
                          <p className="text-gray-300 text-xs">{item.product.price.toFixed(2)} € za kus</p>
                          {/* Stock warning removed */}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-white font-medium w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
                              disabled={item.product.stock <= item.quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="text-right min-w-[80px]">
                            <div className="text-white font-semibold text-sm">
                              {(item.product.price * item.quantity).toFixed(2)} €
                            </div>
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-red-400 hover:text-red-300 text-xs flex items-center space-x-1 mt-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Odobrať</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600">
                {errors.general && (
                  <div className="bg-red-900 border border-red-600 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">!</span>
                      </div>
                      <div>
                        <h3 className="text-red-400 font-semibold">Chyba pri odosielaní objednávky</h3>
                        <p className="text-red-300 text-sm mt-1">{errors.general}</p>
                      </div>
                    </div>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white mb-6">Kontaktné údaje</h2>
                
                <form className="space-y-6">
                  {/* Osobné údaje */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Meno *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                          errors.firstName ? 'border-red-500' : 'border-gray-500'
                        }`}
                        placeholder="Vaše meno"
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-sm mt-2">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Priezvisko *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                          errors.lastName ? 'border-red-500' : 'border-gray-500'
                        }`}
                        placeholder="Vaše priezvisko"
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-sm mt-2">{errors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                          errors.email ? 'border-red-500' : 'border-gray-500'
                        }`}
                        placeholder="vas@email.sk"
                      />
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-2">{errors.email}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Telefón *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                          errors.phone ? 'border-red-500' : 'border-gray-500'
                        }`}
                        placeholder="+421 XXX XXX XXX"
                      />
                      {errors.phone && (
                        <p className="text-red-400 text-sm mt-2">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Spôsob doručenia */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Spôsob doručenia *
                    </label>
                    <select
                      name="deliveryMethod"
                      value={formData.deliveryMethod}
                      onChange={handleInputChange}
                      className="w-full px-5 py-4 bg-gray-700 border-2 border-gray-500 rounded-xl text-white focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all"
                    >
                      <option value="personal">🏪 Osobne v Bratislave (Ľudové námestie 503/34) - Zdarma</option>
                      <option value="post">📮 Slovenská pošta (3-5 dní) - {getDeliveryPrice(formData.country, totalWeight, 'post').toFixed(2)} €</option>
                      <option value="packeta">📦 Packeta (2-3 dni) - {getDeliveryPrice(formData.country, totalWeight, 'packeta').toFixed(2)} €</option>
                    </select>
                    {formData.deliveryMethod === 'personal' && (
                      <p className="text-green-400 text-sm mt-3 font-medium">✓ Osobny odber je bezplatný</p>
                    )}
                  </div>
                  
                  {/* Dodacia adresa - zobrazí sa len ak nie je osobny odber */}
                  {formData.deliveryMethod !== 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-3">
                          PSČ *
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                            errors.zipCode ? 'border-red-500' : 'border-gray-500'
                          }`}
                          placeholder="123 45"
                        />
                        {errors.zipCode && (
                          <p className="text-red-400 text-sm mt-2">{errors.zipCode}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-3">
                          Krajina
                        </label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-5 py-4 bg-gray-700 border-2 border-gray-500 rounded-xl text-white focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all"
                        >
                          <option value="Slovensko">🇸🇰 Slovensko</option>
                          <option value="Česko">🇨🇿 Česko</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-3">
                          Adresa *
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                            errors.address ? 'border-red-500' : 'border-gray-500'
                          }`}
                          placeholder="Ulica a číslo domu"
                        />
                        {errors.address && (
                          <p className="text-red-400 text-sm mt-2">{errors.address}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-3">
                          Mesto *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-5 py-4 bg-gray-700 border-2 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all ${
                            errors.city ? 'border-red-500' : 'border-gray-500'
                          }`}
                          placeholder="Bratislava"
                        />
                        {errors.city && (
                          <p className="text-red-400 text-sm mt-2">{errors.city}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Poznámka */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                      Poznámka k objednávke
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-5 py-4 bg-gray-700 border-2 border-gray-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-gray-600 transition-all resize-none"
                      placeholder="Voliteľné poznámky k objednávke..."
                    />
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-3">
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-600 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4">
                {step === 'success' ? 'Potvrdenie objednávky' : 'Súhrn objednávky'}
              </h2>
              
              {step === 'success' ? (
                <div className="space-y-3 mb-4">
                  <div className="bg-green-900 border border-green-600 rounded-xl p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-semibold">Objednávka úspešne odoslaná!</p>
                    <p className="text-green-300 text-sm mt-1">Číslo: {orderNumber}</p>
                  </div>
                </div>
              ) : errors.general ? (
                <div className="space-y-3 mb-4">
                  <div className="bg-red-900 border border-red-600 rounded-xl p-4 text-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold text-lg">!</span>
                    </div>
                    <p className="text-red-400 font-semibold">Chyba pri odosielaní</p>
                    <p className="text-red-300 text-sm mt-1">{errors.general}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-xl border border-gray-500">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{item.product.name}</p>
                        <p className="text-gray-400 text-sm">× {item.quantity} {item.quantity === 1 ? 'kus' : item.quantity < 5 ? 'kusy' : 'kusov'}</p>
                      </div>
                      <span className="text-white font-bold ml-3">
                        {(item.product.price * item.quantity).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {step !== 'success' && (
                <div className="border-t border-gray-600 pt-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Medzisúčet:</span>
                      <span className="text-white font-semibold">{subtotal.toFixed(2)} €</span>
                    </div>
                    {formData.deliveryMethod !== 'personal' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Doručenie:</span>
                        <span className="text-white font-semibold">{deliveryPrice.toFixed(2)} €</span>
                      </div>
                    )}
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 text-lg font-semibold">Celková suma:</span>
                        <span className="text-white font-bold text-2xl">{finalTotal.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                  {formData.deliveryMethod === 'personal' && (
                    <p className="text-green-400 text-sm mt-3 font-semibold">✓ Osobny odber je bezplatný</p>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                {step === 'success' ? (
                  <>
                    <a
                      href="/"
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-full hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <span>Pokračovať v nákupe</span>
                    </a>
                    <button
                      onClick={() => {
                        setStep('cart');
                        clearCart();
                      }}
                      className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-full hover:bg-gray-600 transition-colors text-sm border border-gray-600"
                    >
                      Zobraziť košík
                    </button>
                  </>
                ) : errors.general ? (
                  <>
                    <button
                      onClick={() => setErrors({})}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-full hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <span>Skúsiť znova</span>
                    </button>
                    <button
                      onClick={() => setStep('cart')}
                      className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-full hover:bg-gray-600 transition-colors text-sm border border-gray-600"
                    >
                      Späť do košíka
                    </button>
                  </>
                ) : step === 'cart' ? (
                  <>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-full hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Pokračovať k zhrnutiu</span>
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-full hover:bg-gray-600 transition-colors text-sm border border-gray-600"
                    >
                      Vyprázdniť košík
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-full hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Odosielam objednávku...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Dokončiť objednávku</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setStep('cart')}
                      className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-full hover:bg-gray-600 transition-colors text-sm border border-gray-600"
                    >
                      Späť do košíka
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-600">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">!</span>
              </div>
              <h3 className="text-xl font-bold text-white">Chyba</h3>
            </div>
            <p className="text-gray-300 mb-6">{errors.general}</p>
            <button
              onClick={() => setErrors({})}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-full hover:bg-purple-700 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 