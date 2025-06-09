// User types
export interface User {
  id: string;
  email: string;
  googleOAuthToken?: string;
  scanFrequencyPreference?: string;
  createdAt: string;
}

// Newsletter types
export interface Newsletter {
  id: string;
  name: string;
  senderEmail: string;
  lastReceivedDate: string;
  isActive: boolean;
}

// Summary types
export interface Summary {
  id: string;
  title?: string;
  summaryContent: string;
  topics: string[];
  originalNewsletterIds: string[];
  dateGenerated: string;
  isRead: boolean;
}