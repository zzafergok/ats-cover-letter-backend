export interface UserLimits {
  cvUploads: number;
  savedCvs: number;
  coverLetters: number;
  generatedCvs: number;
}

export class UserLimitService {
  private static instance: UserLimitService;

  private constructor() {}

  public static getInstance(): UserLimitService {
    if (!UserLimitService.instance) {
      UserLimitService.instance = new UserLimitService();
    }
    return UserLimitService.instance;
  }
  private static readonly USER_LIMITS: UserLimits = {
    cvUploads: 5,
    savedCvs: 3,
    coverLetters: 3,
    generatedCvs: 5,
  };

  private static readonly ADMIN_LIMITS: UserLimits = {
    cvUploads: Number.MAX_SAFE_INTEGER,
    savedCvs: Number.MAX_SAFE_INTEGER,
    coverLetters: Number.MAX_SAFE_INTEGER,
    generatedCvs: Number.MAX_SAFE_INTEGER,
  };

  /**
   * Get user limits based on role
   */
  static getLimitsForUser(userRole: string): UserLimits {
    return userRole === 'ADMIN' ? this.ADMIN_LIMITS : this.USER_LIMITS;
  }

  /**
   * Check CV upload limit
   */
  async checkCvUploadLimit(
    userId: string
  ): Promise<{ allowed: boolean; message: string }> {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Get user and their upload count
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return { allowed: false, message: 'Kullanıcı bulunamadı' };
      }

      // Admin users have unlimited uploads
      if (user.role === 'ADMIN') {
        return { allowed: true, message: 'Admin - sınırsız yükleme' };
      }

      // Count user's CV uploads this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const uploadCount = await prisma.cvUpload.count({
        where: {
          userId,
          uploadDate: {
            gte: startOfMonth,
          },
        },
      });

      const limits = UserLimitService.getLimitsForUser(user.role);
      const canUpload = uploadCount < limits.cvUploads;

      if (canUpload) {
        return {
          allowed: true,
          message: `${uploadCount + 1}/${limits.cvUploads} CV yükleme hakkı kullanılacak`,
        };
      } else {
        return {
          allowed: false,
          message: `Aylık CV yükleme limitiniz (${limits.cvUploads}) dolmuş. Gelecek ay tekrar deneyebilirsiniz.`,
        };
      }
    } catch (error) {
      // console.error('CV upload limit check failed:', error);
      return { allowed: false, message: 'Limit kontrolü başarısız' };
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Check if user can upload more CVs
   */
  static canUploadCv(userRole: string, currentCount: number): boolean {
    const limits = this.getLimitsForUser(userRole);
    return currentCount < limits.cvUploads;
  }

  /**
   * Check if user can save more CVs
   */
  static canSaveCv(userRole: string, currentCount: number): boolean {
    const limits = this.getLimitsForUser(userRole);
    return currentCount < limits.savedCvs;
  }

  /**
   * Check if user can create more cover letters
   */
  static canCreateCoverLetter(userRole: string, currentCount: number): boolean {
    const limits = this.getLimitsForUser(userRole);
    return currentCount < limits.coverLetters;
  }

  /**
   * Check if user can generate more CVs
   */
  static canCreateCV(userRole: string, currentCount: number): boolean {
    const limits = this.getLimitsForUser(userRole);
    return currentCount < limits.generatedCvs;
  }

  /**
   * Get remaining quota for user
   */
  static getRemainingQuota(
    userRole: string,
    currentCount: number,
    type: keyof UserLimits
  ): number {
    const limits = this.getLimitsForUser(userRole);
    const limit = limits[type];

    if (limit === Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, limit - currentCount);
  }

  /**
   * Format limit info for response
   */
  static formatLimitInfo(
    userRole: string,
    currentCount: number,
    type: keyof UserLimits
  ) {
    const limits = this.getLimitsForUser(userRole);
    const limit = limits[type];
    const remaining = this.getRemainingQuota(userRole, currentCount, type);

    return {
      current: currentCount,
      maximum: limit === Number.MAX_SAFE_INTEGER ? 'unlimited' : limit,
      remaining:
        remaining === Number.MAX_SAFE_INTEGER ? 'unlimited' : remaining,
      isAdmin: userRole === 'ADMIN',
    };
  }
}
