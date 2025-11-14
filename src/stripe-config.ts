export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_TLBwr7neRKLNCz',
    priceId: 'price_1SSpCn4MuCor2R33XL7HByNV',
    name: 'E-Signature Credits',
    description: 'One-time purchase of e-signature credits for document signing',
    price: 10.00,
    currency: 'usd',
    mode: 'payment'
  },
  {
    id: 'prod_TLBwvmtAB90TaF',
    priceId: 'price_1SOVYQ4MuCor2R33C72xRP2k',
    name: 'MagnetAgent Pro',
    description: 'Professional subscription plan with monthly e-signature credits',
    price: 10.00,
    currency: 'usd',
    mode: 'subscription'
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};