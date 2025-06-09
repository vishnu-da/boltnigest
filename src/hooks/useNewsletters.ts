import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { gmailService } from '../services/gmailService';
import { aiService } from '../services/aiService';

export interface Newsletter {
  id: string;
  name: string;
  senderEmail: string;
  lastReceivedDate: string;
  isActive: boolean;
  topics?: string[];
  confidence?: number;
}

export function useNewsletters() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const { user } = useAuth();

  const fetchNewsletters = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const newslettersRef = collection(db, 'users', user.uid, 'newsletters');
      const q = query(newslettersRef, orderBy('lastReceivedDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedNewsletters: Newsletter[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNewsletters.push({
          id: doc.id,
          ...doc.data()
        } as Newsletter);
      });
      
      setNewsletters(fetchedNewsletters);
    } catch (error) {
      console.error('Error fetching newsletters:', error);
      // Fallback to mock data for development
      setNewsletters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const scanEmailsForNewsletters = async () => {
    if (!user) return;

    setIsScanning(true);
    
    try {
      // Scan Gmail for potential newsletters
      const emailMessages = await gmailService.scanForNewsletters();
      
      const processedNewsletters: Newsletter[] = [];
      
      // Process each email with AI
      for (const message of emailMessages.slice(0, 20)) { // Limit to 20 for demo
        try {
          const subject = gmailService.getHeader(message, 'subject');
          const sender = gmailService.getHeader(message, 'from');
          const content = gmailService.extractEmailContent(message);
          
          // Analyze with AI
          const analysis = await aiService.analyzeNewsletter(content, subject, sender);
          
          if (analysis.isNewsletter && analysis.confidence > 0.5) {
            const newsletter: Newsletter = {
              id: message.id,
              name: analysis.title,
              senderEmail: sender,
              lastReceivedDate: new Date(parseInt(message.internalDate)).toISOString(),
              isActive: true,
              topics: analysis.topics,
              confidence: analysis.confidence
            };
            
            processedNewsletters.push(newsletter);
            
            // Save to Firestore
            try {
              const newslettersRef = collection(db, 'users', user.uid, 'newsletters');
              await addDoc(newslettersRef, newsletter);
            } catch (firestoreError) {
              console.warn('Error saving to Firestore:', firestoreError);
            }
          }
        } catch (error) {
          console.warn('Error processing email:', error);
        }
      }
      
      // Update local state
      setNewsletters(prev => {
        const existing = new Set(prev.map(n => n.id));
        const newNewsletters = processedNewsletters.filter(n => !existing.has(n.id));
        return [...prev, ...newNewsletters];
      });
      
    } catch (error) {
      console.error('Error scanning emails:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  };

  const refreshNewsletters = async () => {
    await scanEmailsForNewsletters();
  };

  useEffect(() => {
    if (user) {
      fetchNewsletters();
    }
  }, [user]);

  return { 
    newsletters, 
    isLoading: isLoading || isScanning, 
    isScanning,
    refreshNewsletters,
    scanEmailsForNewsletters
  };
}