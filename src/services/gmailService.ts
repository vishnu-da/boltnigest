import { useAuth } from '../contexts/AuthContext';

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
  private getAccessToken(): string | null {
    // Get the access token from Firebase Auth
    const auth = useAuth();
    return auth.user?.accessToken || null;
  }

  async searchEmails(query: string, maxResults: number = 100): Promise<GmailResponse> {
    const accessToken = this.getAccessToken();
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
    const accessToken = this.getAccessToken();
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
        'Market Insights'
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

export const gmailService = new GmailService();