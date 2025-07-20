// src/repositories/user.repository.ts
import { User, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CacheService } from '../services/cache.service';

export class UserRepository extends BaseRepository<User> {
  private cache = CacheService.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) return cached;

    const user = await this.model.findUnique({ where: { email } });

    if (user) {
      await this.cache.set(cacheKey, user, 300);
    }

    return user;
  }

  async updateEmailVerification(userId: string): Promise<User> {
    const user = await this.update(userId, {
      isEmailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    });

    await this.cache.del(`user:email:${user.email}`);
    await this.cache.del(`user:${userId}`);

    return user;
  }

  async findUnverifiedUsers(beforeDate: Date): Promise<User[]> {
    return await this.model.findMany({
      where: {
        isEmailVerified: false,
        createdAt: { lt: beforeDate },
      },
    });
  }
}
