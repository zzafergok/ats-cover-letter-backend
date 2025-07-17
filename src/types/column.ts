export interface CreateColumnRequest {
  name: string;
  color?: string;
}

export interface ColumnWithDetails {
  id: string;
  name: string;
  position: number;
  color: string;
  projectId: string;
  createdAt: Date;
  project: {
    id: string;
    name: string;
    ownerId: string;
  };
  tasks: {
    id: string;
    title: string;
    description: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    position: number;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | null;
    dueDate: Date | null;
    estimatedTime: number | null;
    assignee: {
      id: string;
      name: string;
      email: string;
    } | null;
    tags: {
      id: string;
      name: string;
      color: string;
    }[];
  }[];
}

export interface CreateColumnData {
  name: string;
  color?: string;
  projectId: string;
}

export interface UpdateColumnData {
  name?: string;
  color?: string;
  position?: number;
}
