import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiClient, { getErrorMessage, getFieldErrors } from '../services/apiClient';
import { useCart } from '../hooks/useCart';
import { AddressInput, FieldErrors, PaymentMethod, Quote, SavedAddress, ShippingMethod, ShippingOption } from '../types';
import AddressForm, { emptyAddress, validateAddressInput } from '../components/AddressForm';
import { Alert, EmptyState, FieldError, Page, PageTitle } from '../components/ui';
import { formatCurrency } from '../utils/format';

const COD_LIMIT = 500;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 30px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  h2 {
    font-size: 1.2rem;
    margin-bottom: 16px;
  }
`;

const Option = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;

  input {
    width: auto;
    margin-top: 4px;
  }

  .grow {
    flex: 1;
  }
`;

const Summary = styled.aside`
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: fit-content;

  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .total {
    font-weight: 700;
    font-size: 1.2rem;
    border-top: 1px solid #e9ecef;
    padding-top: 10px;
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;

  .full {
    grid-column: 1 / -1;
  }
`;

interface CardDetails {
  name: string;
  number: string;
  expiry: string;
  cvv: string;
}

const luhnValid = (digits: string) => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

export const validateCard = (card: CardDetails, now = new Date()): FieldErrors => {
  const errors: FieldErrors = {};
  if (!card.name.trim()) errors.cardName = 'Name on card is required';
  const digits = card.number.replace(/\s/g, '');
  if (!digits) errors.cardNumber = 'Card number is required';
  else if (!/^\d{13,19}$/.test(digits) || !luhnValid(digits)) errors.cardNumber = 'Enter a valid card number';
  const match = /^(\d{2})\/(\d{2})$/.exec(card.expiry.trim());
  if (!match) errors.cardExpiry = 'Enter the expiry date as MM/YY';
  else {
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) errors.cardExpiry = 'Enter a valid month (01-12)';
    else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) errors.cardExpiry = 'This card has expired';
  }
  if (!/^\d{3,4}$/.test(card.cvv.trim())) errors.cardCvv = 'CVV must be 3 or 4 digits';
  return errors;
};

const formatCardNumber = (value: string) => value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, refreshCart } = useCart();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressChoice, setAddressChoice] = useState<string>('new');
  const [newAddress, setNewAddress] = useState<AddressInput>(emptyAddress());
  const [saveAddress, setSaveAddress] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('standard');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [card, setCard] = useState<CardDetails>({ name: '', number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    apiClient.getAddresses().then(list => {
      setAddresses(list);
      const preferred = list.find(a => a.isDefault) || list[0];
      if (preferred) setAddressChoice(preferred.id);
    }).catch(() => setAddresses([]));
    apiClient.getShippingOptions().then(setOptions).catch(() => setOptions([]));
  }, []);

  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    apiClient.getQuote(shippingMethod).then(setQuote).catch(err => setError(getErrorMessage(err, 'Could not calculate totals')));
  }, [shippingMethod, cart]);

  if (!cart && cartLoading) {
    return <Page><div className="loading">Loading checkout...</div></Page>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Page>
        <PageTitle>Checkout</PageTitle>
        <EmptyState data-testid="checkout-empty">
          <p>Your cart is empty. Add some items before checking out.</p>
          <Link to="/products" style={{ display: 'inline-block', marginTop: 12 }}>Browse products</Link>
        </EmptyState>
      </Page>
    );
  }

  const usingNewAddress = addressChoice === 'new';

  const handlePlaceOrder = async () => {
    setError(null);
    const nextErrors: FieldErrors = {};
    if (usingNewAddress) Object.assign(nextErrors, validateAddressInput(newAddress));
    if (paymentMethod === 'card') Object.assign(nextErrors, validateCard(card));
    if (paymentMethod === 'cod' && quote && quote.total > COD_LIMIT) {
      nextErrors.paymentMethod = `Cash on delivery is only available for orders up to ${formatCurrency(COD_LIMIT)}`;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Please correct the highlighted fields.');
      return;
    }

    setPlacing(true);
    try {
      const order = await apiClient.createOrder({
        ...(usingNewAddress ? { shippingAddress: newAddress, saveAddress } : { addressId: addressChoice }),
        shippingMethod,
        paymentMethod,
        cardLast4: paymentMethod === 'card' ? card.number.replace(/\s/g, '').slice(-4) : undefined,
      });
      navigate(`/orders/${order.id}`, { state: { placed: true } });
      refreshCart();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'Failed to place order'));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Page data-testid="checkout-page">
      <PageTitle>Checkout</PageTitle>
      {error && <Alert variant="error" testId="checkout-error">{error}</Alert>}
      <Layout>
        <div>
          <Section aria-labelledby="shipping-address-heading" data-testid="address-section">
            <h2 id="shipping-address-heading">1. Shipping address</h2>
            {addresses.map(address => (
              <Option key={address.id} data-testid="saved-address-option">
                <input
                  type="radio"
                  name="address"
                  value={address.id}
                  checked={addressChoice === address.id}
                  data-testid={`saved-address-radio-${address.id}`}
                  onChange={() => setAddressChoice(address.id)}
                />
                <span className="grow">
                  <strong>{address.label}</strong>{address.isDefault && ' (default)'}
                  <br />
                  {address.fullName}, {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}
                </span>
              </Option>
            ))}
            {addresses.length > 0 && (
              <Option>
                <input type="radio" name="address" value="new" checked={usingNewAddress} data-testid="new-address-radio" onChange={() => setAddressChoice('new')} />
                <span className="grow">Use a new address</span>
              </Option>
            )}
            {usingNewAddress && (
              <>
                <AddressForm idPrefix="shipping" value={newAddress} errors={errors} onChange={setNewAddress} />
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" style={{ width: 'auto' }} checked={saveAddress} data-testid="save-address-checkbox" onChange={e => setSaveAddress(e.target.checked)} />
                  Save this address to my account
                </label>
              </>
            )}
          </Section>

          <Section aria-labelledby="shipping-method-heading" data-testid="shipping-section">
            <h2 id="shipping-method-heading">2. Shipping method</h2>
            {options.map(option => {
              const free = option.id === 'standard' && quote?.shippingMethod === 'standard' && quote.shipping === 0;
              return (
                <Option key={option.id}>
                  <input
                    type="radio"
                    name="shipping"
                    value={option.id}
                    checked={shippingMethod === option.id}
                    data-testid={`shipping-option-${option.id}`}
                    onChange={() => setShippingMethod(option.id)}
                  />
                  <span className="grow">{option.label}</span>
                  <span data-testid={`shipping-price-${option.id}`}>{free ? 'FREE' : formatCurrency(option.price)}</span>
                </Option>
              );
            })}
          </Section>

          <Section aria-labelledby="payment-heading" data-testid="payment-section">
            <h2 id="payment-heading">3. Payment</h2>
            {([
              ['card', 'Credit or debit card'],
              ['paypal', 'PayPal'],
              ['cod', `Cash on delivery (orders up to ${formatCurrency(COD_LIMIT)})`],
            ] as [PaymentMethod, string][]).map(([value, label]) => (
              <Option key={value}>
                <input
                  type="radio"
                  name="payment"
                  value={value}
                  checked={paymentMethod === value}
                  data-testid={`payment-${value}`}
                  onChange={() => setPaymentMethod(value)}
                />
                <span className="grow">{label}</span>
              </Option>
            ))}
            <FieldError message={errors.paymentMethod} testId="payment-method-error" />
            {paymentMethod === 'card' && (
              <CardGrid data-testid="card-form">
                <div className="form-group full">
                  <label className="form-label" htmlFor="card-name">Name on card</label>
                  <input id="card-name" autoComplete="cc-name" value={card.name} data-testid="card-name-input" onChange={e => setCard({ ...card, name: e.target.value })} />
                  <FieldError message={errors.cardName} testId="card-name-error" />
                </div>
                <div className="form-group full">
                  <label className="form-label" htmlFor="card-number">Card number</label>
                  <input
                    id="card-number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    data-testid="card-number-input"
                    onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                  />
                  <FieldError message={errors.cardNumber} testId="card-number-error" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="card-expiry">Expiry (MM/YY)</label>
                  <input id="card-expiry" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} value={card.expiry} data-testid="card-expiry-input" onChange={e => setCard({ ...card, expiry: e.target.value })} />
                  <FieldError message={errors.cardExpiry} testId="card-expiry-error" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="card-cvv">CVV</label>
                  <input id="card-cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={card.cvv} data-testid="card-cvv-input" onChange={e => setCard({ ...card, cvv: e.target.value })} />
                  <FieldError message={errors.cardCvv} testId="card-cvv-error" />
                </div>
              </CardGrid>
            )}
            {paymentMethod === 'paypal' && <p data-testid="paypal-note">You will confirm the payment with PayPal after placing the order.</p>}
          </Section>
        </div>

        <Summary data-testid="order-summary">
          <h2 style={{ marginBottom: 16 }}>Order summary</h2>
          {cart.items.map(item => (
            <div className="row" key={item.id} data-testid="order-item">
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #e9ecef' }} />
          <div className="row"><span>Subtotal</span><span data-testid="order-subtotal">{formatCurrency(quote?.subtotal ?? cart.subtotal)}</span></div>
          {quote && quote.discount > 0 && (
            <div className="row" style={{ color: '#28a745' }}>
              <span>Discount ({quote.couponCode})</span>
              <span data-testid="order-discount">−{formatCurrency(quote.discount)}</span>
            </div>
          )}
          <div className="row"><span>Shipping</span><span data-testid="order-shipping">{quote ? (quote.shipping === 0 ? 'FREE' : formatCurrency(quote.shipping)) : '…'}</span></div>
          <div className="row"><span>Tax (8%)</span><span data-testid="order-tax">{quote ? formatCurrency(quote.tax) : '…'}</span></div>
          <div className="row total"><span>Total</span><span data-testid="order-total">{quote ? formatCurrency(quote.total) : '…'}</span></div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', marginTop: 16 }}
            data-testid="place-order-button"
            disabled={placing || !quote}
            onClick={handlePlaceOrder}
          >
            {placing ? 'Placing order...' : 'Place order'}
          </button>
          <Link to="/cart" style={{ display: 'block', textAlign: 'center', marginTop: 12 }} data-testid="back-to-cart">Back to cart</Link>
        </Summary>
      </Layout>
    </Page>
  );
};

export default Checkout;
