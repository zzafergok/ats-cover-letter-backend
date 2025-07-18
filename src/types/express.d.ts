import { UserRole } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        role: UserRole;
        emailVerified: boolean;
        deviceLimit: number;
        isMultiDevice: boolean;
      };
    }
  }
}

export {};
