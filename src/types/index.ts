export interface VerifyEmailRequest {
  token: string;
}

export interface ResendEmailVerificationRequest {
  email: string;
}

export interface RegisterResponse {
  success: boolean;
  data: RegisterData;
  message?: string;
}

export interface RegisterData {
  message: string;
  email: string;
  emailSent: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

export interface CreateColumnRequest {
  name: string;
  position: number;
  color?: string;
}

export interface UpdateColumnRequest {
  name?: string;
  position?: number;
  color?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  projectId: string; // Bu alan zorunlu olmalı
  columnId?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  estimatedTime?: number;
  tagIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position?: number;
  columnId?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  estimatedTime?: number;
  // assigneeId?: string;
  tagIds?: string[];
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MoveTaskRequest {
  columnId: string;
  position: number;
}

export interface CreateTaskTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTaskTagRequest {
  name?: string;
  color?: string;
}

export interface UploadTasksRequest {
  tasks: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    columnName?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    dueDate?: string;
    estimatedTime?: number;
    // assigneeEmail?: string;
    tags?: string[];
  }[];
}

export interface UploadTasksJsonRequest {
  tasks: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    columnName: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    dueDate?: string;
    estimatedTime?: number;
    assigneeEmail?: string;
    tags?: string[];
  }[];
  createMissingColumns?: boolean;
  createMissingTags?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'DEVELOPER' | 'PRODUCT_OWNER' | 'PROJECT_ANALYST';
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified?: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateUserProfileRequest {
  name: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface BulkMoveTasksRequest {
  taskIds: string[];
  targetColumnId: string;
}

export interface AvailableTasksResponse {
  tasks: {
    id: string;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    columnId: string;
    columnName: string;
    assignee?: {
      id: string;
      name: string;
      email: string;
    };
    tags?: {
      id: string;
      name: string;
      color: string;
    }[];
  }[];
}

export interface ChangeData {
  value: number;
  percentage: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    totalTasks: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByColumn: Record<string, number>;
    overdueTasks: number;
    unassignedTasks: number;
    previousPeriod: {
      totalTasks: number;
      tasksByStatus: Record<string, number>;
      overdueTasks: number;
      unassignedTasks: number;
    };
    changes: {
      totalTasks: ChangeData;
      completedTasks: ChangeData;
      pendingTasks: ChangeData;
      inProgressTasks: ChangeData;
      overdueTasks: ChangeData;
    };
  };
  message: string;
}

export interface ProjectStatisticsResponse {
  success: boolean;
  data: {
    current: number;
    previous: number;
    change: ChangeData;
  };
  message: string;
}
