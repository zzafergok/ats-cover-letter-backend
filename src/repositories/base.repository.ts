// src/repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

export abstract class BaseRepository<T> {
  constructor(
    protected prisma: PrismaClient,
    protected model: any
  ) {}

  async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findUnique({ where: { id } });
    } catch (error) {
      logger.error('Repository findById error:', error);
      throw error;
    }
  }

  async findAll(options?: any): Promise<T[]> {
    try {
      return await this.model.findMany(options);
    } catch (error) {
      logger.error('Repository findAll error:', error);
      throw error;
    }
  }

  async create(data: any): Promise<T> {
    try {
      return await this.model.create({ data });
    } catch (error) {
      logger.error('Repository create error:', error);
      throw error;
    }
  }

  async update(id: string, data: any): Promise<T> {
    try {
      return await this.model.update({
        where: { id },
        data,
      });
    } catch (error) {
      logger.error('Repository update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<T> {
    try {
      return await this.model.delete({ where: { id } });
    } catch (error) {
      logger.error('Repository delete error:', error);
      throw error;
    }
  }

  async count(where?: any): Promise<number> {
    try {
      return await this.model.count({ where });
    } catch (error) {
      logger.error('Repository count error:', error);
      throw error;
    }
  }
}
