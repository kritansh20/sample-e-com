import { User } from '../models';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { seedId } from '../data/seed';

export const TEST_USER_PASSWORD = 'Ecomm@123';
export const TEST_USER_COUNT = 5;

class UserRepository {
  private users: User[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.users = [];
    const seedUsers: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { email: 'john@example.com', password: 'Ecomm@123', firstName: 'John', lastName: 'Doe', role: 'customer' },
      { email: 'jane@example.com', password: 'Ecomm@123', firstName: 'Jane', lastName: 'Smith', role: 'customer' },
      { email: 'admin@example.com', password: 'Admin@123', firstName: 'Ada', lastName: 'Admin', role: 'admin' },
      ...Array.from({ length: TEST_USER_COUNT }, (_, i) => ({
        email: `tester${i + 1}@example.com`, password: TEST_USER_PASSWORD, firstName: `Tester${i + 1}`, lastName: 'User', role: 'customer' as const
      })),
    ];

    for (const userData of seedUsers) {
      this.users.push({
        ...userData,
        id: seedId('user', userData.email),
        password: bcrypt.hashSync(userData.password, 10),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    return this.users.find(user => user.email.toLowerCase() === normalized) || null;
  }

  findByEmailSync(email: string): User | null {
    return this.users.find(user => user.email === email) || null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.users[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }
}

export default new UserRepository();
