import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models';
import { FieldErrors, sendValidationError, validateEmail, validatePassword, validatePersonName } from '../utils/validation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const publicUser = (user: User) => {
  const { password: _, ...rest } = user;
  return rest;
};

const issueToken = (user: User) =>
  jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

const serverError = (res: Response, label: string, error: unknown) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const errors: FieldErrors = {};
    const firstNameError = validatePersonName(firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    const lastNameError = validatePersonName(lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (Object.keys(errors).length) return sendValidationError(res, errors);

    if (await userRepository.findByEmail(email)) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const user = await userRepository.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: 'customer'
    });

    res.status(201).json({ success: true, data: { user: publicUser(user), token: issueToken(user) } });
  } catch (error) {
    serverError(res, 'Signup', error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await userRepository.findByEmail(String(email));
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    res.json({ success: true, data: { user: publicUser(user), token: issueToken(user) } });
  } catch (error) {
    serverError(res, 'Login', error);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out' });
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await userRepository.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: publicUser(user) });
  } catch (error) {
    serverError(res, 'Get profile', error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName } = req.body;
    const errors: FieldErrors = {};
    const firstNameError = validatePersonName(firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    const lastNameError = validatePersonName(lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    if (Object.keys(errors).length) return sendValidationError(res, errors);

    const user = await userRepository.update(req.user!.userId, {
      firstName: firstName.trim(),
      lastName: lastName.trim()
    });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: publicUser(user) });
  } catch (error) {
    serverError(res, 'Update profile', error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await userRepository.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const errors: FieldErrors = {};
    if (!currentPassword) errors.currentPassword = 'Current password is required';
    const newPasswordError = validatePassword(newPassword, 'New password');
    if (newPasswordError) errors.newPassword = newPasswordError;
    if (Object.keys(errors).length) return sendValidationError(res, errors);

    if (!(await bcrypt.compare(String(currentPassword), user.password))) {
      return sendValidationError(res, { currentPassword: 'Current password is incorrect' });
    }
    if (currentPassword === newPassword) {
      return sendValidationError(res, { newPassword: 'New password must be different from the current password' });
    }

    await userRepository.update(user.id, { password: await bcrypt.hash(newPassword, 10) });
    res.json({ success: true, message: 'Password updated' });
  } catch (error) {
    serverError(res, 'Change password', error);
  }
};
