import * as React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button } from 'ui';

export interface Subscription {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
    planName: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd?: boolean;
}

export interface SubscriptionCardProps {
    subscription: Subscription;
    onManage?: () => void;
    onCancel?: () => void;
    className?: string;
}

const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100);
};

const getStatusColor = (status: Subscription['status']) => {
    switch (status) {
        case 'active':
        case 'trialing':
            return 'bg-green-100 text-green-800';
        case 'past_due':
        case 'unpaid':
            return 'bg-yellow-100 text-yellow-800';
        case 'canceled':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
    subscription,
    onManage,
    onCancel,
    className,
}) => {
    const { planName, amount, currency, interval, status, currentPeriodEnd, cancelAtPeriodEnd } = subscription;

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{planName}</CardTitle>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </span>
                </div>
                <CardDescription>
                    {formatCurrency(amount, currency)} / {interval}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    {cancelAtPeriodEnd ? (
                        <p>Cancels on {currentPeriodEnd.toLocaleDateString()}</p>
                    ) : (
                        <p>Renews on {currentPeriodEnd.toLocaleDateString()}</p>
                    )}
                </div>
                <div className="flex gap-2">
                    {onManage && (
                        <Button variant="outline" onClick={onManage} className="flex-1">
                            Manage
                        </Button>
                    )}
                    {onCancel && status === 'active' && !cancelAtPeriodEnd && (
                        <Button variant="destructive" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
