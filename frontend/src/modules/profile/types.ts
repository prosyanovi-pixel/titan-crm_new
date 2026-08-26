export interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department: string;
  joinDate: string;
  phone?: string;
  bio?: string;
  location?: string;
  documents: Document[];
  stats: DocumentStats;
}

export interface Document {
  id: string;
  name: string;
  size: string;
  date: string;
  type: string;
  status: 'draft' | 'pending' | 'completed' | 'archived';
}

export interface DocumentStats {
  total: number;
  pending: number;
  completed: number;
  recentActivity: number;
}

export interface ShareLink {
  id: string;
  url: string;
  expiresAt: Date;
  documentId: string;
}