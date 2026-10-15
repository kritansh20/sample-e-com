import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import addressRepository, { MAX_ADDRESSES } from '../repositories/addressRepository';
import { cleanAddress, sendValidationError, validateAddress } from '../utils/validation';

const serverError = (res: Response, label: string, error: unknown) => {
  console.error(`${label} error:`, error);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

const cleanLabel = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : 'Address');

export const getAddresses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    res.json({ success: true, data: await addressRepository.findByUserId(req.user!.userId) });
  } catch (error) {
    serverError(res, 'Get addresses', error);
  }
};

export const createAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const existing = await addressRepository.findByUserId(userId);
    if (existing.length >= MAX_ADDRESSES) {
      return res.status(400).json({ success: false, error: `You can save up to ${MAX_ADDRESSES} addresses` });
    }
    const fields = validateAddress(req.body, { requireContact: true });
    const label = cleanLabel(req.body.label);
    if (label.length > 30) fields.label = 'Label must be 30 characters or fewer';
    if (Object.keys(fields).length) return sendValidationError(res, fields);

    const address = await addressRepository.create({
      userId,
      label,
      ...cleanAddress(req.body),
      isDefault: Boolean(req.body.isDefault)
    });
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    serverError(res, 'Create address', error);
  }
};

export const updateAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const address = await addressRepository.findById(req.params.id);
    if (!address || address.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    const fields = validateAddress(req.body, { requireContact: true });
    const label = cleanLabel(req.body.label);
    if (label.length > 30) fields.label = 'Label must be 30 characters or fewer';
    if (Object.keys(fields).length) return sendValidationError(res, fields);

    const updated = await addressRepository.update(address.id, { label, ...cleanAddress(req.body) });
    if (req.body.isDefault) await addressRepository.setDefault(userId, address.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    serverError(res, 'Update address', error);
  }
};

export const setDefaultAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const address = await addressRepository.setDefault(req.user!.userId, req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    res.json({ success: true, data: await addressRepository.findByUserId(req.user!.userId) });
  } catch (error) {
    serverError(res, 'Set default address', error);
  }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await addressRepository.delete(req.user!.userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    res.json({ success: true, data: await addressRepository.findByUserId(req.user!.userId) });
  } catch (error) {
    serverError(res, 'Delete address', error);
  }
};
