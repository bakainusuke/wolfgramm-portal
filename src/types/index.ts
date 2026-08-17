import type { Timestamp } from "firebase/firestore";

export interface Client {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'Active' | 'Lead' | 'Archived';
  avatarUrl?: string;
  createdAt?: Timestamp;
}

export interface MediaResource {
  id?: string;
  clientId: string;
  title: string;
  category: 'Raw Footage' | 'Edited Video' | 'Short-form' | 'Photos' | 'Documents';
  mediaUrl: string;       // Link YouTube embed, Vimeo hoặc CDN
  thumbnailUrl?: string;
  fileSize?: string;
  status: 'In Review' | 'Approved' | 'Draft';
  createdAt?: Timestamp;
}
