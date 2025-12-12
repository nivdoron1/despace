import * as React from 'react';
import { Card, CardHeader, CardContent, CardFooter, Button } from 'ui';
import { PaymentElement } from '@stripe/react-stripe-js';

export interface StripeOnboardingProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const StripeOnboarding: React.FC<StripeOnboardingProps> = ({ onSubmit }) => (
  <Card>
    <form onSubmit={onSubmit}>
      <CardHeader>Stripe Onboarding</CardHeader>
      <CardContent>
        <PaymentElement />
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full mt-4">Submit</Button>
      </CardFooter>
    </form>
  </Card>
);
