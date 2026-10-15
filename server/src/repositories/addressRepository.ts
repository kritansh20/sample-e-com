import { SavedAddress } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { SEED_ADDRESSES, daysBefore } from '../data/seed';
import userRepository from './userRepository';

export const MAX_ADDRESSES = 5;

class AddressRepository {
  private addresses: SavedAddress[] = [];

  constructor() {
    for (const seed of SEED_ADDRESSES) {
      const user = userRepository.findByEmailSync(seed.email);
      if (!user) continue;
      const { email, ...fields } = seed;
      this.addresses.push({ id: uuidv4(), userId: user.id, ...fields, isDefault: true, createdAt: daysBefore(30) });
    }
  }

  async findByUserId(userId: string): Promise<SavedAddress[]> {
    return this.addresses
      .filter(a => a.userId === userId)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findById(id: string): Promise<SavedAddress | null> {
    return this.addresses.find(a => a.id === id) || null;
  }

  async create(data: Omit<SavedAddress, 'id' | 'createdAt' | 'isDefault'> & { isDefault?: boolean }): Promise<SavedAddress> {
    const existing = this.addresses.filter(a => a.userId === data.userId);
    const makeDefault = existing.length === 0 || Boolean(data.isDefault);
    if (makeDefault) existing.forEach(a => { a.isDefault = false; });
    const address: SavedAddress = { ...data, id: uuidv4(), isDefault: makeDefault, createdAt: new Date() };
    this.addresses.push(address);
    return address;
  }

  async update(id: string, updates: Partial<SavedAddress>): Promise<SavedAddress | null> {
    const address = this.addresses.find(a => a.id === id);
    if (!address) return null;
    Object.assign(address, updates);
    return address;
  }

  async setDefault(userId: string, id: string): Promise<SavedAddress | null> {
    const target = this.addresses.find(a => a.id === id && a.userId === userId);
    if (!target) return null;
    this.addresses.filter(a => a.userId === userId).forEach(a => { a.isDefault = a.id === id; });
    return target;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const index = this.addresses.findIndex(a => a.id === id && a.userId === userId);
    if (index === -1) return false;
    const [removed] = this.addresses.splice(index, 1);
    if (removed.isDefault) {
      const next = this.addresses
        .filter(a => a.userId === userId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      if (next) next.isDefault = true;
    }
    return true;
  }
}

export default new AddressRepository();
