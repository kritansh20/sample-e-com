import React, { useState } from 'react';
import styled from 'styled-components';

const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
};

const CURRENCIES = Object.keys(RATES);

const Page = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  margin-bottom: 20px;
  color: #222;
`;

const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const Result = styled.div`
  padding: 16px;
  border-radius: 6px;
  background: #f0f7ff;
  font-size: 18px;
  font-weight: 500;
  color: #0056b3;
  min-height: 54px;
`;

function convert(amount: number, from: string, to: string): number {
  const usd = amount / RATES[from];
  return usd * RATES[to];
}

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [result, setResult] = useState('');

  const doConvert = () => {
    const n = parseFloat(amount);
    if (Number.isNaN(n)) {
      setResult('Please enter a valid number');
      return;
    }
    const converted = convert(n, from, to);
    setResult(`${n.toFixed(2)} ${from} → ${converted.toFixed(2)} ${to}`);
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <Page data-testid="currency-page">
      <Title>Currency Converter</Title>
      <Card>
        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Row>
          <div className="form-group">
            <label className="form-label">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              data-testid="currency-from-select"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              data-testid="currency-to-select"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </Row>
        <ButtonRow>
          <button
            className="btn-primary"
            data-testid="currency-convert-button"
            onClick={doConvert}
          >
            Convert
          </button>
          <button
            className="btn-outline"
            data-testid="currency-swap-button"
            onClick={swap}
          >
            Swap
          </button>
        </ButtonRow>
        <Result data-testid="currency-result">{result}</Result>
      </Card>
    </Page>
  );
}
