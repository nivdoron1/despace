import * as React from 'react';
import { Card, CardHeader, CardContent } from 'ui';
// import specific Stripe Element or UI when available

export const StripePayouts: React.FC = () => (
  <Card>
    <CardHeader>Payouts</CardHeader>
    <CardContent>
      {/* TODO: Replace with actual Stripe payouts display or hook up to a custom API component/table */}
      <div className="text-muted-foreground">Payout history will show here.</div>
    </CardContent>
  </Card>
);
