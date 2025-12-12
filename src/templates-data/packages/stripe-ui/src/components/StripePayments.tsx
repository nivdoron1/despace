import * as React from 'react';
import { Card, CardHeader, CardContent } from 'ui';

export const StripePayments: React.FC = () => (
  <Card>
    <CardHeader>Payments</CardHeader>
    <CardContent>
      <div className="text-muted-foreground">Payment history will show here.</div>
    </CardContent>
  </Card>
);
