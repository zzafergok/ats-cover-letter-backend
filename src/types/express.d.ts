import { UserRole } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        emailVerified: boolean;
        deviceLimit: number;
        isMultiDevice: boolean;
        sessionId: string;
      };
    }
  }
}

export {};
