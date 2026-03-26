import { AppError } from '@/core/middleware/errorHandler';

class ExampleService {
  private data: any[] = [];

  async getAll() {
    return this.data;
  }

  async getById(id: string) {
    const item = this.data.find(d => d.id === id);
    if (!item) {
      throw new AppError(404, 'Item not found');
    }
    return item;
  }

  async create(payload: any) {
    const newItem = { id: Date.now().toString(), ...payload };
    this.data.push(newItem);
    return newItem;
  }

  async update(id: string, payload: any) {
    const index = this.data.findIndex(d => d.id === id);
    if (index === -1) {
      throw new AppError(404, 'Item not found');
    }
    this.data[index] = { ...this.data[index], ...payload };
    return this.data[index];
  }

  async delete(id: string) {
    const index = this.data.findIndex(d => d.id === id);
    if (index === -1) {
      throw new AppError(404, 'Item not found');
    }
    this.data.splice(index, 1);
  }
}

export const exampleService = new ExampleService();
