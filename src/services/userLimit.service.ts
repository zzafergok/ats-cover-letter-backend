export interface UserLimits {
  cvUploads: number;
  savedCvs: number;
  coverLetters: number;
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
    cvUploads: 3,
    savedCvs: 3,
    coverLetters: 3,
  };

  private static readonly ADMIN_LIMITS: UserLimits = {
    cvUploads: Number.MAX_SAFE_INTEGER,
    savedCvs: Number.MAX_SAFE_INTEGER,
    coverLetters: Number.MAX_SAFE_INTEGER,
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
    // For now, allow all uploads (you can implement actual limit checking here)
    return { allowed: true, message: 'Upload allowed' };
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
