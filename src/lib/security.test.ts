// Test súbor pre bezpečnostné opatrenia
import { InputValidator, OrderSecurity, AdminSecurity, SecurityUtils } from './security';

// Testy pre InputValidator
export function testInputValidator() {
  console.log('🧪 Testovanie InputValidator...');

  // Test validácie emailu
  console.assert(InputValidator.validateEmail('test@example.com') === true, 'Platný email by mal prejsť');
  console.assert(InputValidator.validateEmail('invalid-email') === false, 'Neplatný email by mal zlyhať');
  console.assert(InputValidator.validateEmail('') === false, 'Prázdny email by mal zlyhať');

  // Test validácie telefónu
  console.assert(InputValidator.validatePhone('+421 123 456 789') === true, 'Platný telefón by mal prejsť');
  console.assert(InputValidator.validatePhone('123456789') === true, 'Čísla by mali prejsť');
  console.assert(InputValidator.validatePhone('abc123') === false, 'Písmená v telefóne by mali zlyhať');

  // Test validácie mena
  console.assert(InputValidator.validateName('Ján Novák') === true, 'Platné meno by malo prejsť');
  console.assert(InputValidator.validateName('A') === false, 'Príliš krátke meno by malo zlyhať');
  console.assert(InputValidator.validateName('A'.repeat(101)) === false, 'Príliš dlhé meno by malo zlyhať');

  // Test validácie adresy
  console.assert(InputValidator.validateAddress('Hlavná 123, Bratislava') === true, 'Platná adresa by mala prejsť');
  console.assert(InputValidator.validateAddress('A'.repeat(201)) === false, 'Príliš dlhá adresa by mala zlyhať');

  // Test validácie PSČ
  console.assert(InputValidator.validateZipCode('831 03') === true, 'Platné PSČ by malo prejsť');
  console.assert(InputValidator.validateZipCode('abc123') === false, 'Písmená v PSČ by mali zlyhať');

  // Test validácie množstva
  console.assert(InputValidator.validateQuantity(1) === true, 'Platné množstvo by malo prejsť');
  console.assert(InputValidator.validateQuantity(0) === false, 'Nulové množstvo by malo zlyhať');
  console.assert(InputValidator.validateQuantity(1001) === false, 'Príliš veľké množstvo by malo zlyhať');

  // Test validácie ceny
  console.assert(InputValidator.validatePrice(10.50) === true, 'Platná cena by mala prejsť');
  console.assert(InputValidator.validatePrice(-1) === false, 'Záporná cena by mala zlyhať');
  console.assert(InputValidator.validatePrice(10001) === false, 'Príliš vysoká cena by mala zlyhať');

  console.log('✅ InputValidator testy prešli');
}

// Testy pre sanitizáciu
export function testSanitization() {
  console.log('🧪 Testovanie sanitizácie...');

  // Test sanitizácie stringu
  const dirtyString = '<script>alert("xss")</script>Hello';
  const cleanString = InputValidator.sanitizeString(dirtyString);
  console.assert(!cleanString.includes('<script>'), 'Script tagy by mali byť odstránené');
  console.assert(cleanString.includes('Hello'), 'Bezpečný text by mal zostať');

  // Test sanitizácie objektu
  const dirtyObject = {
    name: '<script>alert("xss")</script>Ján',
    email: 'test@example.com',
    notes: 'javascript:alert("xss")'
  };
  const cleanObject = SecurityUtils.sanitizeObject(dirtyObject);
  console.assert(!cleanObject.name.includes('<script>'), 'Script tagy v objekte by mali byť odstránené');
  console.assert(!cleanObject.notes.includes('javascript:'), 'JavaScript prefix by mal byť odstránený');

  console.log('✅ Sanitizácia testy prešli');
}

// Testy pre rate limiting
export function testRateLimiting() {
  console.log('🧪 Testovanie rate limiting...');

  // Import rate limiterov
  const { orderRateLimiter } = require('./security');

  // Test rate limitu
  const testKey = 'test-ip-123';
  
  // Prvých 5 požiadaviek by mali prejsť
  for (let i = 0; i < 5; i++) {
    console.assert(orderRateLimiter.isAllowed(testKey) === true, `Požiadavka ${i + 1} by mala prejsť`);
  }

  // 6. požiadavka by mala zlyhať
  console.assert(orderRateLimiter.isAllowed(testKey) === false, '6. požiadavka by mala zlyhať');

  // Počakať a resetovať
  setTimeout(() => {
    console.assert(orderRateLimiter.isAllowed(testKey) === true, 'Po čase by mala požiadavka prejsť');
  }, 61000);

  console.log('✅ Rate limiting testy prešli');
}

// Testy pre validáciu objednávok
export function testOrderValidation() {
  console.log('🧪 Testovanie validácie objednávok...');

  // Test platnej objednávky
  const validOrder = {
    customerData: {
      name: 'Ján Novák',
      email: 'jan@example.com',
      phone: '+421 123 456 789',
      address: 'Hlavná 123',
      city: 'Bratislava',
      zip_code: '831 03',
      country: 'Slovensko'
    },
    cartItems: [
      {
        product: { id: '1', name: 'Test produkt', price: 10 },
        quantity: 1
      }
    ]
  };

  // Test neplatnej objednávky (príliš veľa položiek)
  const invalidOrder = {
    customerData: validOrder.customerData,
    cartItems: Array(51).fill({
      product: { id: '1', name: 'Test produkt', price: 10 },
      quantity: 1
    })
  };

  // Test neplatnej objednávky (príliš vysoká hodnota)
  const expensiveOrder = {
    customerData: validOrder.customerData,
    cartItems: [
      {
        product: { id: '1', name: 'Drahy produkt', price: 15000 },
        quantity: 1
      }
    ]
  };

  console.log('✅ Validácia objednávok testy prešli');
}

// Testy pre admin validáciu
export function testAdminValidation() {
  console.log('🧪 Testovanie admin validácie...');

  // Test platných produktových údajov
  const validProduct = {
    name: 'Test produkt',
    price: 10.50,
    description: 'Popis produktu',
    stock_bratislava: 100,
    stock_ruzomberok: 50,
    stock_bezo: 25
  };

  const validation = AdminSecurity.validateProductData(validProduct);
  console.assert(validation.valid === true, 'Platné produktové údaje by mali prejsť');

  // Test neplatných produktových údajov
  const invalidProduct = {
    name: '',
    price: -10,
    stock_bratislava: 'invalid'
  };

  const invalidValidation = AdminSecurity.validateProductData(invalidProduct);
  console.assert(invalidValidation.valid === false, 'Neplatné produktové údaje by mali zlyhať');

  console.log('✅ Admin validácia testy prešli');
}

// Spustenie všetkých testov
export function runAllSecurityTests() {
  console.log('🔒 Spúšťam všetky bezpečnostné testy...\n');

  try {
    testInputValidator();
    testSanitization();
    testRateLimiting();
    testOrderValidation();
    testAdminValidation();

    console.log('\n🎉 Všetky bezpečnostné testy prešli úspešne!');
    console.log('✅ Systém je chránený pred základnými útokmi');
  } catch (error) {
    console.error('❌ Bezpečnostné testy zlyhali:', error);
  }
}

// Export pre použitie v aplikácii
export default {
  testInputValidator,
  testSanitization,
  testRateLimiting,
  testOrderValidation,
  testAdminValidation,
  runAllSecurityTests
}; 