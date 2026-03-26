import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

class UserService {
  private collectionName = 'users';

  private getCollection() {
    return db.getCollection('_default', this.collectionName);
  }

  async getAll(): Promise<User[]> {
    try {
      const cluster = db.getCluster();
      const query = `SELECT META().id, users.* FROM \`${db.getBucket().name}\`._default.${this.collectionName} AS users`;
      
      const result = await cluster.query(query);
      return result.rows;
    } catch (error: any) {
      // If collection doesn't exist, return empty array
      if (error.message?.includes('not found')) {
        return [];
      }
      throw error;
    }
  }

  async getById(id: string): Promise<User> {
    try {
      const collection = this.getCollection();
      const result = await collection.get(id);
      return { id, ...result.content } as User;
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'User not found');
      }
      throw error;
    }
  }

  async create(payload: Partial<User>): Promise<User> {
    const id = uuidv4();
    const user: User = {
      id,
      name: payload.name || '',
      email: payload.email || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const collection = this.getCollection();
    await collection.insert(id, user);
    
    return user;
  }

  async update(id: string, payload: Partial<User>): Promise<User> {
    try {
      const collection = this.getCollection();
      const existing = await collection.get(id);
      
      const updated: User = {
        ...existing.content,
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
      } as User;

      await collection.replace(id, updated);
      return updated;
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'User not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.remove(id);
    } catch (error: any) {
      if (error.message?.includes('document not found')) {
        throw new AppError(404, 'User not found');
      }
      throw error;
    }
  }
}

export const userService = new UserService();
