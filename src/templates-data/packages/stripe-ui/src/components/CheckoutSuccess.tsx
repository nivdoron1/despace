import * as React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, Button } from 'ui';

export interface CheckoutSuccessProps {
    title?: string;
    description?: string;
    redirectUrl?: string;
    redirectLabel?: string;
    onRedirect?: () => void;
    className?: string;
}

export const CheckoutSuccess: React.FC<CheckoutSuccessProps> = ({
    title = 'Payment Successful!',
    description = 'Thank you for your purchase. You will receive a confirmation email shortly.',
    redirectUrl,
    redirectLabel = 'Continue',
    onRedirect,
    className,
}) => {
    const handleRedirect = () => {
        if (onRedirect) {
            onRedirect();
        } else if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    };

    return (
        <Card className={className}>
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <svg
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            {(redirectUrl || onRedirect) && (
                <CardContent className="text-center">
                    <Button onClick={handleRedirect} className="w-full">
                        {redirectLabel}
                    </Button>
                </CardContent>
            )}
        </Card>
    );
};
