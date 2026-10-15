import React from 'react';
import styled from 'styled-components';
import { AddressInput, FieldErrors } from '../types';
import { FieldError } from './ui';

export const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'India'];

const POSTAL_CODES: Record<string, { pattern: RegExp; example: string }> = {
  'United States': { pattern: /^\d{5}(-\d{4})?$/, example: '94110 or 94110-1234' },
  'Canada': { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, example: 'K1A 0B1' },
  'United Kingdom': { pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: 'SW1A 1AA' },
  'India': { pattern: /^\d{6}$/, example: '560001' },
};

export const STATE_LABELS: Record<string, string> = {
  'United States': 'State',
  'Canada': 'Province',
  'United Kingdom': 'County (optional)',
  'India': 'State',
};

export const emptyAddress = (): AddressInput => ({
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
});

export const validateAddressInput = (a: AddressInput): FieldErrors => {
  const errors: FieldErrors = {};
  const name = a.fullName.trim();
  if (!name) errors.fullName = 'Full name is required';
  else if (name.length < 2 || name.length > 50) errors.fullName = 'Full name must be 2-50 characters';
  else if (!/^[A-Za-z][A-Za-z' -]*$/.test(name)) errors.fullName = 'Full name can only contain letters, spaces, hyphens and apostrophes';
  if (!a.phone.trim()) errors.phone = 'Phone number is required';
  else if (!/^\+?[0-9 ()-]{7,20}$/.test(a.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (!a.street.trim()) errors.street = 'Street address is required';
  else if (a.street.trim().length < 5) errors.street = 'Street address must be at least 5 characters';
  if (!a.city.trim()) errors.city = 'City is required';
  if (a.country !== 'United Kingdom' && !a.state.trim()) errors.state = 'State / province is required';
  const rule = POSTAL_CODES[a.country];
  if (!a.zipCode.trim()) errors.zipCode = 'Postal code is required';
  else if (rule && !rule.pattern.test(a.zipCode.trim())) errors.zipCode = `Enter a valid postal code for ${a.country} (e.g. ${rule.example})`;
  return errors;
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;

  .full {
    grid-column: 1 / -1;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

interface AddressFormProps {
  value: AddressInput;
  errors: FieldErrors;
  onChange: (value: AddressInput) => void;
  idPrefix: string;
}

const AddressForm: React.FC<AddressFormProps> = ({ value, errors, onChange, idPrefix }) => {
  const field = (name: keyof AddressInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, full = false) => (
    <div className={`form-group${full ? ' full' : ''}`}>
      <label className="form-label" htmlFor={`${idPrefix}-${name}`}>{label}</label>
      <input
        id={`${idPrefix}-${name}`}
        value={value[name]}
        aria-invalid={Boolean(errors[name])}
        data-testid={`${idPrefix}-${name}-input`}
        onChange={e => onChange({ ...value, [name]: e.target.value })}
        {...props}
      />
      <FieldError message={errors[name]} testId={`${idPrefix}-${name}-error`} />
    </div>
  );

  return (
    <Grid data-testid={`${idPrefix}-form`}>
      {field('fullName', 'Full name', { autoComplete: 'name' })}
      {field('phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
      {field('street', 'Street address', { autoComplete: 'street-address' }, true)}
      {field('city', 'City', { autoComplete: 'address-level2' })}
      {field('state', STATE_LABELS[value.country] || 'State', { autoComplete: 'address-level1' })}
      {field('zipCode', 'Postal code', { autoComplete: 'postal-code' })}
      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}-country`}>Country</label>
        <select
          id={`${idPrefix}-country`}
          value={value.country}
          data-testid={`${idPrefix}-country-select`}
          onChange={e => onChange({ ...value, country: e.target.value })}
        >
          {COUNTRIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <FieldError message={errors.country} testId={`${idPrefix}-country-error`} />
      </div>
    </Grid>
  );
};

export default AddressForm;
