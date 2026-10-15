import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, getFieldErrors } from '../services/apiClient';
import { FieldErrors, SignupData } from '../types';

const Container = styled.div`
  max-width: 400px;
  margin: 60px auto;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 14px;
  text-align: center;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
`;

const LoginLink = styled.div`
  text-align: center;
  margin-top: 20px;
  color: #666;
  
  a {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;

const validate = (data: SignupData & { confirmPassword: string }, acceptTerms: boolean): FieldErrors => {
  const errors: FieldErrors = {};
  const name = (value: string, label: string, key: string) => {
    const v = value.trim();
    if (!v) errors[key] = `${label} is required`;
    else if (v.length < 2 || v.length > 50) errors[key] = `${label} must be 2-50 characters`;
    else if (!NAME_PATTERN.test(v)) errors[key] = `${label} can only contain letters, spaces, hyphens and apostrophes`;
  };
  name(data.firstName, 'First name', 'firstName');
  name(data.lastName, 'Last name', 'lastName');
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) errors.email = 'Enter a valid email address';
  if (!data.password) errors.password = 'Password is required';
  else if (data.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!/[A-Za-z]/.test(data.password) || !/\d/.test(data.password)) errors.password = 'Password must contain at least one letter and one number';
  if (data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords do not match';
  if (!acceptTerms) errors.terms = 'You must accept the terms to create an account';
  return errors;
};

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<SignupData & { confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nextErrors = validate(formData, acceptTerms);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      });
      navigate('/', { state: { welcome: true } });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setError(getErrorMessage(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fieldError = (key: string) =>
    errors[key] ? <div className="error-message" role="alert" data-testid={`${key}-error`}>{errors[key]}</div> : null;

  return (
    <Container>
      <Title>Sign Up</Title>

      {error && <ErrorMessage data-testid="signup-error">{error}</ErrorMessage>}

      <Form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label htmlFor="firstName">First Name</Label>
          <Input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} autoComplete="given-name" data-testid="firstName-input" />
          {fieldError('firstName')}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="lastName">Last Name</Label>
          <Input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} autoComplete="family-name" data-testid="lastName-input" />
          {fieldError('lastName')}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" data-testid="email-input" />
          {fieldError('email')}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="password">Password</Label>
          <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" data-testid="password-input" />
          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>At least 8 characters, including a letter and a number.</div>
          {fieldError('password')}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" data-testid="confirmPassword-input" />
          {fieldError('confirmPassword')}
        </FormGroup>

        <FormGroup>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={acceptTerms} data-testid="terms-checkbox" onChange={e => setAcceptTerms(e.target.checked)} />
            I agree to the Terms of Service and Privacy Policy
          </label>
          {fieldError('terms')}
        </FormGroup>

        <Button type="submit" disabled={loading} data-testid="signup-button">
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </Form>

      <LoginLink>
        Already have an account? <Link to="/login" data-testid="login-link-from-signup">Login here</Link>
      </LoginLink>
    </Container>
  );
};

export default Signup;
