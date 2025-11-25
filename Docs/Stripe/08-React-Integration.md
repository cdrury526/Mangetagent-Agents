# React Stripe Integration

Complete guide to integrating Stripe with React applications using `@stripe/react-stripe-js`.

## Installation

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
```

## Basic Setup

### 1. Load Stripe

```jsx
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside component to avoid recreating
const stripePromise = loadStripe('pk_test_...');

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

### 2. Payment Form

```jsx
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    // Get client secret from your server
    const response = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2000 })
    });
    const { clientSecret } = await response.json();

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Jenny Rosen',
          },
        },
      }
    );

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      console.log('Payment successful!');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}

export default CheckoutForm;
```

## Elements

### CardElement (All-in-One)

```jsx
import { CardElement } from '@stripe/react-stripe-js';

function CheckoutForm() {
  return (
    <CardElement
      options={{
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        },
      }}
    />
  );
}
```

### Individual Elements

```jsx
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js';

function CheckoutForm() {
  return (
    <div>
      <CardNumberElement />
      <CardExpiryElement />
      <CardCvcElement />
    </div>
  );
}
```

### Payment Element (Recommended)

```jsx
import { PaymentElement } from '@stripe/react-stripe-js';

function CheckoutForm() {
  return (
    <PaymentElement
      options={{
        layout: 'tabs', // or 'accordion'
      }}
    />
  );
}
```

## Complete Payment Flow

### With Payment Element

```jsx
import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: 'https://yoursite.com/order/complete',
      },
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={isLoading || !stripe || !elements}>
        {isLoading ? 'Processing...' : 'Pay now'}
      </button>
      {message && <div>{message}</div>}
    </form>
  );
}

export default function App() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    fetch('/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2000 }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <div>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
```

## Styling Elements

### Custom Styles

```jsx
const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '"Open Sans", sans-serif',
      letterSpacing: '0.025em',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

<CardElement options={ELEMENT_OPTIONS} />
```

### Appearance API

```jsx
const options = {
  clientSecret,
  appearance: {
    theme: 'stripe', // 'stripe', 'night', 'flat'
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    },
    rules: {
      '.Label': {
        color: '#32325d',
      },
      '.Input': {
        border: '1px solid #e6e6e6',
      },
    },
  },
};

<Elements options={options} stripe={stripePromise}>
  <CheckoutForm />
</Elements>
```

## Event Handling

### Element Events

```jsx
import { CardElement } from '@stripe/react-stripe-js';

function CheckoutForm() {
  const handleChange = (event) => {
    if (event.error) {
      console.error(event.error.message);
    } else {
      console.log('Card valid:', event.complete);
    }
  };

  const handleReady = (element) => {
    element.focus();
  };

  return (
    <CardElement
      onChange={handleChange}
      onReady={handleReady}
      onFocus={() => console.log('Focused')}
      onBlur={() => console.log('Blurred')}
    />
  );
}
```

## Digital Wallets

### Apple Pay / Google Pay

```jsx
import { PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';

function PaymentRequestButton() {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: 'Demo total',
        amount: 2000,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Check availability
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      // Get client secret from server
      const { clientSecret } = await fetch('/create-payment-intent', {
        method: 'POST',
      }).then((r) => r.json());

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: ev.paymentMethod.id,
        },
        { handleActions: false }
      );

      if (error) {
        ev.complete('fail');
      } else {
        ev.complete('success');
        if (paymentIntent.status === 'requires_action') {
          await stripe.confirmCardPayment(clientSecret);
        }
      }
    });
  }, [stripe]);

  if (!paymentRequest) {
    return null;
  }

  return <PaymentRequestButtonElement options={{ paymentRequest }} />;
}
```

## Subscription Checkout

```jsx
function SubscriptionForm({ priceId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    // Create subscription
    const response = await fetch('/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId })
    });

    const { clientSecret, subscriptionId } = await response.json();

    // Confirm payment
    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      // Subscription created successfully
      window.location.href = '/subscription/success';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Subscribe'}
      </button>
    </form>
  );
}
```

## Error Handling

```jsx
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  const handleCardChange = (event) => {
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );

    if (error) {
      switch (error.type) {
        case 'card_error':
          setPaymentError(error.message);
          break;
        case 'validation_error':
          setPaymentError('Please check your payment details');
          break;
        default:
          setPaymentError('An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement onChange={handleCardChange} />
      {cardError && <div className="card-error">{cardError}</div>}
      {paymentError && <div className="payment-error">{paymentError}</div>}
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}
```

## TypeScript Support

```tsx
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { FormEvent, useState } from 'react';

const stripePromise: Promise<Stripe | null> = loadStripe('pk_test_...');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (error) {
      setError(error.message ?? 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div>{error}</div>}
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}
```

## Testing

### Test Cards

```jsx
// In development, use test card
// 4242 4242 4242 4242 - Success
// 4000 0000 0000 0002 - Decline
// 4000 0025 0000 3155 - 3D Secure
```

### Mock Stripe

```jsx
import { render, screen } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';

const mockStripe = {
  confirmCardPayment: jest.fn(),
  elements: jest.fn(),
};

test('payment form', () => {
  render(
    <Elements stripe={mockStripe}>
      <CheckoutForm />
    </Elements>
  );

  // Test your component
});
```

## Best Practices

### 1. Load Stripe Outside Component

```jsx
// ✅ Good - Load once
const stripePromise = loadStripe('pk_test_...');

function App() {
  return <Elements stripe={stripePromise}>...</Elements>;
}

// ❌ Bad - Loads on every render
function App() {
  const stripePromise = loadStripe('pk_test_...');
  return <Elements stripe={stripePromise}>...</Elements>;
}
```

### 2. Check stripe and elements

```jsx
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe || !elements) {
    // Stripe.js hasn't loaded yet
    return;
  }

  // Proceed with payment
};
```

### 3. Handle Loading States

```jsx
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <button type="submit" disabled={!stripe || !elements}>
      {!stripe ? 'Loading...' : 'Pay'}
    </button>
  );
}
```

## References

- **React Stripe.js**: https://stripe.com/docs/stripe-js/react
- **GitHub**: https://github.com/stripe/react-stripe-js
- **Elements**: https://stripe.com/docs/payments/elements
- **Hooks**: https://stripe.com/docs/stripe-js/react#hooks
