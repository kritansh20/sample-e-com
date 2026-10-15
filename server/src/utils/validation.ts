import { Response } from 'express';

export type FieldErrors = Record<string, string>;

export const COUNTRIES = ['United States', 'Canada', 'United Kingdom', 'India'] as const;

const POSTAL_CODES: Record<string, { pattern: RegExp; example: string }> = {
  'United States': { pattern: /^\d{5}(-\d{4})?$/, example: '94110 or 94110-1234' },
  'Canada': { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, example: 'K1A 0B1' },
  'United Kingdom': { pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: 'SW1A 1AA' },
  'India': { pattern: /^\d{6}$/, example: '560001' },
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

export const sendValidationError = (res: Response, fields: FieldErrors, message = 'Please correct the highlighted fields') =>
  res.status(400).json({ success: false, error: message, fields });

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const validatePersonName = (value: unknown, label: string): string | undefined => {
  const v = text(value);
  if (!v) return `${label} is required`;
  if (v.length < 2 || v.length > 50) return `${label} must be 2-50 characters`;
  if (!NAME_PATTERN.test(v)) return `${label} can only contain letters, spaces, hyphens and apostrophes`;
  return undefined;
};

export const validateEmail = (value: unknown): string | undefined => {
  const v = text(value);
  if (!v) return 'Email is required';
  if (!EMAIL_PATTERN.test(v)) return 'Enter a valid email address';
  return undefined;
};

export const validatePassword = (value: unknown, label = 'Password'): string | undefined => {
  const v = typeof value === 'string' ? value : '';
  if (!v) return `${label} is required`;
  if (v.length < 8) return `${label} must be at least 8 characters`;
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return `${label} must contain at least one letter and one number`;
  return undefined;
};

export interface AddressInput {
  fullName?: unknown;
  phone?: unknown;
  street?: unknown;
  city?: unknown;
  state?: unknown;
  zipCode?: unknown;
  country?: unknown;
}

export const validateAddress = (input: AddressInput | undefined, options: { requireContact: boolean }): FieldErrors => {
  const errors: FieldErrors = {};
  const a = input || {};
  if (options.requireContact) {
    const nameError = validatePersonName(a.fullName, 'Full name');
    if (nameError) errors.fullName = nameError;
    const phone = text(a.phone);
    if (!phone) errors.phone = 'Phone number is required';
    else if (!PHONE_PATTERN.test(phone)) errors.phone = 'Enter a valid phone number';
  }
  const street = text(a.street);
  if (!street) errors.street = 'Street address is required';
  else if (street.length < 5) errors.street = 'Street address must be at least 5 characters';
  if (!text(a.city)) errors.city = 'City is required';
  const country = text(a.country);
  if (!country) errors.country = 'Country is required';
  else if (!(COUNTRIES as readonly string[]).includes(country)) errors.country = `We ship to ${COUNTRIES.join(', ')}`;
  if (country !== 'United Kingdom' && !text(a.state)) errors.state = 'State / province is required';
  const zip = text(a.zipCode);
  if (!zip) errors.zipCode = 'Postal code is required';
  else if (POSTAL_CODES[country] && !POSTAL_CODES[country].pattern.test(zip)) {
    errors.zipCode = `Enter a valid postal code for ${country} (e.g. ${POSTAL_CODES[country].example})`;
  }
  return errors;
};

export const cleanAddress = (input: AddressInput) => ({
  fullName: text(input.fullName),
  phone: text(input.phone),
  street: text(input.street),
  city: text(input.city),
  state: text(input.state),
  zipCode: text(input.zipCode).toUpperCase(),
  country: text(input.country)
});

export const isPositiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;
