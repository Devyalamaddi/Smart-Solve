export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
}

export interface Question {
  id: number;
  title: string;
  content: string;
  author: string;
  tags: string[];
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}