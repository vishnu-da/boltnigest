import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useGmailService } from '../services/gmailService';
import { aiService } from '../services/aiService';

export interface Summary {
  id: string;
  title: string;
  summaryContent: string;
  topics: string[];
  originalNewsletterIds: string[];
  dateGenerated: string;
  isRead: boolean;
}

export function useSummaries() {
  const { user } = useAuth();
  const gmailService = useGmailService();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSummaries = async () => {
    if (!user) return;

    setIsLoading(true);
    
    try {
      const summariesRef = collection(db, 'users', user.uid, 'summaries');
      const q = query(summariesRef, orderBy('dateGenerated', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedSummaries: Summary[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSummaries.push({
          id: doc.id,
          ...doc.data()
        } as Summary);
      });
      
      setSummaries(fetchedSummaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewSummary = async () => {
    if (!user) return;

    setIsGenerating(true);
    
    try {
      // Get recent newsletter emails
      const emailMessages = await gmailService.scanForNewsletters();
      
      // Process recent emails (last 10)
      const recentEmails = emailMessages.slice(0, 10);
      const newsletterData = [];
      
      for (const message of recentEmails) {
        try {
          const subject = gmailService.getHeader(message, 'subject');
          const sender = gmailService.getHeader(message, 'from');
          const content = gmailService.extractEmailContent(message);
          const date = new Date(parseInt(message.internalDate)).toLocaleDateString();
          
          // Analyze if it's a newsletter
          const analysis = await aiService.analyzeNewsletter(content, subject, sender);
          console.log("analysis : ", analysis);
          
          if (analysis.isNewsletter && analysis.confidence > 0.5) {
            newsletterData.push({
              title: analysis.title,
              content: content,
              sender: analysis.sender,
              date: date
            });
          }
        } catch (error) {
          console.warn('Error processing email for summary:', error);
        }
      }
      
      if (newsletterData.length === 0) {
        throw new Error('No newsletters found to summarize');
      }
      
      // Generate AI summary
      const summaryContent = await aiService.generateSummary(newsletterData);
      
      // Extract topics from the newsletters
      const allTopics = new Set<string>();
      for (const newsletter of newsletterData) {
        try {
          const analysis = await aiService.analyzeNewsletter(newsletter.content, newsletter.title, newsletter.sender);
          analysis.topics.forEach(topic => allTopics.add(topic));
        } catch (error) {
          console.warn('Error extracting topics:', error);
        }
      }
      
      const newSummary: Summary = {
        id: `summary-${Date.now()}`,
        title: `Newsletter Summary - ${new Date().toLocaleDateString()}`,
        summaryContent,
        topics: Array.from(allTopics).slice(0, 5), // Limit to 5 topics
        originalNewsletterIds: recentEmails.map(email => email.id),
        dateGenerated: new Date().toISOString(),
        isRead: false
      };
      
      // Save to Firestore
      try {
        const summariesRef = collection(db, 'users', user.uid, 'summaries');
        await addDoc(summariesRef, newSummary);
      } catch (firestoreError) {
        console.warn('Error saving summary to Firestore:', firestoreError);
      }
      
      // Update local state
      setSummaries(prev => [newSummary, ...prev]);
      
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const refreshSummaries = async () => {
    await generateNewSummary();
  };

  useEffect(() => {
    if (user) {
      fetchSummaries();
    }
  }, [user]);

  return { 
    summaries, 
    isLoading: isLoading || isGenerating, 
    isGenerating,
    refreshSummaries,
    generateNewSummary
  };
}