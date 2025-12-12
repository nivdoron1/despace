import * as React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';

export interface StripeProviderProps {
  stripePromise: Promise<Stripe | null>;
  clientSecret: string;
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({
  stripePromise,
  clientSecret,
  children,
}) => {
  const options: StripeElementsOptions = React.useMemo(() => ({
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  }), [clientSecret]);

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};
