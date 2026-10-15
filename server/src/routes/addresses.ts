import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, setDefaultAddress, deleteAddress } from '../controllers/addressController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.put('/:id/default', setDefaultAddress);
router.delete('/:id', deleteAddress);

export default router;
