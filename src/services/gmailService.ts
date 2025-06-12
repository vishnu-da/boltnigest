import { useAuth } from '../contexts/AuthContext';
import React from 'react';

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

export interface GmailResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

class GmailService {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    console.log('Setting access token in GmailService:', token ? 'Token present' : 'Token null');
    this.accessToken = token;
  }
  private async getAccessToken(): Promise<string | null> {
    console.log('Getting access token from GmailService:', this.accessToken ? 'Token present' : 'Token null');
    return this.accessToken;
  }

  async searchEmails(query: string, maxResults: number = 100): Promise<GmailResponse> {
    console.log('accessToken in searchEmails', this.accessToken);
    const accessToken = await this.getAccessToken();
    console.log('accessToken', accessToken);
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    return response.json();
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`);
    }

    return response.json();
  }

  async scanForNewsletters(): Promise<GmailMessage[]> {
    try {
      // Search for potential newsletter emails
      const queries = [
        'newsletter',
        'digest',
        'weekly',
        'daily',
        'roundup',
        'update',
        'bulletin',
        'briefing',
        'Market Insights',
        // TAAFT specific queries
        'from:hi@mail.theresanaiforthat.com',
        'subject:"Disney and Universal Sue Midjourney"',
        'from:"TAAFT - There\'s An AI For That"'
      ];

      const allMessages: GmailMessage[] = [];

      for (const query of queries) {
        try {
          const searchResults = await this.searchEmails(query, 20);
          
          if (searchResults.messages) {
            // Get full message details for each result
            const messagePromises = searchResults.messages.map(msg => 
              this.getMessage(msg.id)
            );
            
            const messages = await Promise.all(messagePromises);
            allMessages.push(...messages);
          }
        } catch (error) {
          console.warn(`Error searching for "${query}":`, error);
        }
      }

      // Remove duplicates based on message ID
      const uniqueMessages = allMessages.filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      );

      return uniqueMessages;
    } catch (error) {
      console.error('Error scanning for newsletters:', error);
      throw error;
    }
  }

  extractEmailContent(message: GmailMessage): string {
    // Extract text content from email
    let content = message.snippet || '';

    if (message.payload.body?.data) {
      content = this.decodeBase64(message.payload.body.data);
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          content = this.decodeBase64(part.body.data);
          break;
        }
      }
    }

    return content;
  }

  private decodeBase64(data: string): string {
    try {
      // Gmail API returns base64url encoded data
      const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return atob(base64);
    } catch (error) {
      console.warn('Error decoding base64 data:', error);
      return '';
    }
  }

  getHeader(message: GmailMessage, headerName: string): string {
    const header = message.payload.headers.find(
      h => h.name.toLowerCase() === headerName.toLowerCase()
    );
    return header?.value || '';
  }
}

export function useGmailService() {
  const auth = useAuth();
  const service = React.useMemo(() => new GmailService(), []);
  
  // Set the access token whenever auth changes
  React.useEffect(() => {
    console.log('Auth state changed in useGmailService:', auth.user ? 'User present' : 'No user');
    console.log('User access token:', auth.user ? (auth.user as any).accessToken ? 'Present' : 'Missing' : 'No user');
    
    if (auth.user) {
      const token = (auth.user as any).accessToken;
      console.log('Setting token from auth user:', token ? 'Token present' : 'Token null');
      service.setAccessToken(token || null);
    } else {
      service.setAccessToken(null);
    }
  }, [auth.user, service]);

  return service;
}

export const gmailService = new GmailService();