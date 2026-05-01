export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  projectRole?: 'admin' | 'member';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  taskCount?: number;
  completedTasks?: number;
  members?: User[];
  taskStats?: TaskStats;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  createdBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  dueDate?: string;
  tags: string[];
  estimatedHours?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; avatar?: string };
  creator?: { id: string; name: string };
  project?: { id: string; name: string; color: string };
  commentCount?: number;
  isOverdue?: boolean;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  link?: string;
  taskId?: string;
  createdAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export interface DashboardStats {
  total: number;
  myTasks: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue: number;
  dueThisWeek: number;
  completionRate: number;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  details: string;
  taskId?: string;
  createdAt: string;
  user?: { id: string; name: string; avatar?: string };
}
