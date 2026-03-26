import { db } from '@/core/database';
import { AppError } from '@/core/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

class UserService {
  async getAll(): Promise<User[]> {
    try {
      const rows = await db.query<RowDataPacket[]>(
        `SELECT id, name, email, created_at as createdAt, updated_at as updatedAt FROM users`
      );
      return rows as User[];
    } catch (error: any) {
      // If table doesn't exist, return empty array
      if (error.code === 'ER_NO_SUCH_TABLE') {
        return [];
      }
      throw error;
    }
  }

  async getById(id: string): Promise<User> {
    try {
      const rows = await db.query<RowDataPacket[]>(
        `SELECT id, name, email, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        throw new AppError(404, 'User not found');
      }

      return rows[0] as User;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async create(payload: Partial<User>): Promise<User> {
    const id = uuidv4();
    const now = new Date();

    const user: User = {
      id,
      name: payload.name || '',
      email: payload.email || '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await db.query(
      `INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      [id, user.name, user.email, now, now]
    );

    return user;
  }

  async update(id: string, payload: Partial<User>): Promise<User> {
    try {
      const existing = await this.getById(id);
      const now = new Date();

      const updated: User = {
        ...existing,
        ...payload,
        id,
        updatedAt: now.toISOString(),
      };

      const result = await db.query<ResultSetHeader>(
        `UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?`,
        [updated.name, updated.email, now, id]
      );

      if (result.affectedRows === 0) {
        throw new AppError(404, 'User not found');
      }

      return updated;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await db.query<ResultSetHeader>(
        `DELETE FROM users WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new AppError(404, 'User not found');
      }
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw error;
    }
  }
}

export const userService = new UserService();
