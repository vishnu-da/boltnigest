import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function getRandomTopics(): string[] {
  const allTopics = [
    'Technology', 'Business', 'Marketing', 
    'Design', 'AI', 'Finance', 'Startups',
    'Productivity', 'Health', 'Science'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 topics
  const shuffled = [...allTopics].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}