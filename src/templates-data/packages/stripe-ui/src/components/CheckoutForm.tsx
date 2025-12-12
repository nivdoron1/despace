import * as React from 'react';

import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from 'ui';

export interface CheckoutFormProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    submitLabel?: string;
    className?: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
    onSuccess,
    onError,
    submitLabel = 'Pay Now',
    className,
}) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.href,
                },
                redirect: 'if_required',
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
                onError?.(new Error(error.message));
            } else {
                onSuccess?.();
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setErrorMessage(error.message);
            onError?.(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className={className}>
            <form onSubmit={handleSubmit}>
                <CardHeader>
                    <CardTitle>Complete Your Payment</CardTitle>
                    <CardDescription>Enter your payment details below</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PaymentElement />
                    {errorMessage && (
                        <div className="text-sm text-destructive">{errorMessage}</div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !stripe || !elements}
                    >
                        {isLoading ? 'Processing...' : submitLabel}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
