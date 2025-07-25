export interface DeliveryPricing {
  provider: string;
  weightRange: string;
  basePrice: number;
  customerPrice: number;
  maxDimensions: string;
  description: string;
}

export interface CountryDeliveryOptions {
  country: string;
  providers: DeliveryPricing[];
  notes: string;
}

export const DELIVERY_PRICING: CountryDeliveryOptions[] = [
  {
    country: 'Slovensko',
    providers: [
      {
        provider: 'Slovenská pošta',
        weightRange: 'Do 2 kg',
        basePrice: 2.50,
        customerPrice: 3.50,
        maxDimensions: '23,5 x 12 cm (obálka) alebo 25 x 35 x 3 cm (ploché/zvinuté)',
        description: 'doporučený list'
      },
      {
        provider: 'Slovenská pošta',
        weightRange: '2kg-5kg',
        basePrice: 3.90,
        customerPrice: 5.00,
        maxDimensions: 'Max 150 cm pre akýkoľvek rozmer alebo 300 cm (dĺžka + obvod)',
        description: 'balík'
      },
      {
        provider: 'Slovenská pošta',
        weightRange: '5kg-10kg',
        basePrice: 4.30,
        customerPrice: 6.00,
        maxDimensions: 'Max 150 cm pre akýkoľvek rozmer alebo 300 cm (dĺžka + obvod)',
        description: 'balík'
      },
      {
        provider: 'Slovenská pošta',
        weightRange: '10kg-15kg',
        basePrice: 7.50,
        customerPrice: 10.00,
        maxDimensions: 'Max 200 cm pre akýkoľvek rozmer alebo 300 cm (dĺžka + obvod)',
        description: 'Express kuriér'
      },
      {
        provider: 'Packeta Slovensko',
        weightRange: 'Do 5 kg',
        basePrice: 3.40,
        customerPrice: 4.50,
        maxDimensions: '50 x 40 x 30 cm',
        description: 'balík'
      },
      {
        provider: 'Packeta Slovensko',
        weightRange: '5kg-15kg',
        basePrice: 5.60,
        customerPrice: 7.50,
        maxDimensions: '60 x 50 x 40 cm',
        description: 'balík'
      }
    ],
    notes: 'Pre zásielky do 2 kg sa používa Slovenská pošta, inak sa preferuje Packeta, pokiaľ zákazník výslovne nežiada poštu alebo nemá prístup k výdajnemu miestu. Zásielky nad 15 kg alebo vyžadujúce špeciálne spracovanie sa riešia individuálne.'
  },
  {
    country: 'Česko',
    providers: [
      {
        provider: 'Packeta Česko',
        weightRange: 'Do 5 kg',
        basePrice: 4.10,
        customerPrice: 5.00,
        maxDimensions: '50 x 40 x 30 cm',
        description: 'balík'
      },
      {
        provider: 'Packeta Česko',
        weightRange: '5kg-15kg',
        basePrice: 7.70,
        customerPrice: 9.50,
        maxDimensions: '60 x 50 x 40 cm',
        description: 'balík'
      }
    ],
    notes: 'Do Česka posielame výlučne cez Packeta. Zásielky nad 15kg alebo vyžadujúce špeciálne spracovanie sa riešia individuálne.'
  }
];

// Helper functions for easy access and future modifications
export const getDeliveryOptions = (country: string): DeliveryPricing[] => {
  const countryData = DELIVERY_PRICING.find(c => c.country === country);
  return countryData?.providers || [];
};

export const getDeliveryPrice = (country: string, weight: number, provider?: string): number => {
  const options = getDeliveryOptions(country);
  
  // Filter by provider if specified
  const relevantOptions = provider 
    ? options.filter(opt => opt.provider.includes(provider))
    : options;
  
  // Find the appropriate weight range
  const option = relevantOptions.find(opt => {
    const [min, max] = parseWeightRange(opt.weightRange);
    return weight >= min && weight <= max;
  });
  
  return option?.customerPrice || 0;
};

export const parseWeightRange = (weightRange: string): [number, number] => {
  if (weightRange.includes('Do')) {
    const max = parseFloat(weightRange.match(/\d+/)?.[0] || '0');
    return [0, max];
  }
  
  const matches = weightRange.match(/(\d+)kg-(\d+)kg/);
  if (matches) {
    return [parseFloat(matches[1]), parseFloat(matches[2])];
  }
  
  return [0, 0];
};

// For future admin panel - easy to modify prices
export const updateDeliveryPrice = (
  country: string, 
  provider: string, 
  weightRange: string, 
  newCustomerPrice: number
): void => {
  const countryIndex = DELIVERY_PRICING.findIndex(c => c.country === country);
  if (countryIndex === -1) return;
  
  const providerIndex = DELIVERY_PRICING[countryIndex].providers.findIndex(
    p => p.provider === provider && p.weightRange === weightRange
  );
  
  if (providerIndex !== -1) {
    DELIVERY_PRICING[countryIndex].providers[providerIndex].customerPrice = newCustomerPrice;
  }
}; 