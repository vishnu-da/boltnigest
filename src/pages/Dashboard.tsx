import React, { useState } from 'react';
import { MailOpen, RefreshCw, ChevronRight, Clock, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { useNewsletters } from '../hooks/useNewsletters';
import { useSummaries } from '../hooks/useSummaries';
import { cn } from '../lib/utils';

// Example topic badges for display
const TOPIC_COLORS: Record<string, string> = {
  'Technology': 'badge-blue',
  'Business': 'badge-green',
  'Marketing': 'badge-purple',
  'Design': 'badge-amber',
  'AI': 'badge-teal',
  'Finance': 'badge-red',
  'Science': 'badge-blue',
  'Health': 'badge-green',
  'Startups': 'badge-purple',
  'Productivity': 'badge-amber',
};

const Dashboard: React.FC = () => {
  const { isLoading: isLoadingNewsletters } = useNewsletters();
  const { summaries, isLoading: isLoadingSummaries, isGenerating, refreshSummaries, generateNewSummary } = useSummaries();
  const [selectedSummary, setSelectedSummary] = useState<string | null>(null);

  // Select the first summary by default
  React.useEffect(() => {
    if (summaries.length > 0 && !selectedSummary) {
      setSelectedSummary(summaries[0].id);
    }
  }, [summaries, selectedSummary]);

  const currentSummary = summaries.find(s => s.id === selectedSummary);
  const isLoading = isLoadingNewsletters || isLoadingSummaries;

  const handleGenerateSummary = async () => {
    try {
      await generateNewSummary();
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Error generating summary. Please check your Gmail permissions and try again.');
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Nigest</h1>
          <p className="text-slate-600">AI-powered summaries of your newsletters</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleGenerateSummary}
            className="btn btn-primary"
            disabled={isLoading}
          >
            <Sparkles size={18} className={isGenerating ? 'animate-spin' : ''} />
            <span>{isGenerating ? 'Generating...' : 'Generate Summary'}</span>
          </button>

          <button 
            onClick={refreshSummaries}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Processing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center">
          <RefreshCw size={32} className="mx-auto mb-4 text-blue-700 animate-spin" />
          <h3 className="text-lg font-medium mb-1">
            {isGenerating ? 'Generating AI summary...' : 'Analyzing your newsletters'}
          </h3>
          <p className="text-slate-600">
            {isGenerating ? 'Creating intelligent summaries from your newsletters...' : 'This might take a moment...'}
          </p>
        </div>
      ) : summaries.length === 0 ? (
        <div className="card p-12 text-center">
          <MailOpen size={32} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-1">No summaries yet</h3>
          <p className="text-slate-600 mb-6">
            Generate your first AI-powered newsletter summary to get started.
          </p>
          <button 
            onClick={handleGenerateSummary} 
            className="btn btn-primary mx-auto"
          >
            <Sparkles size={16} />
            Generate first summary
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Summaries list (left sidebar) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-4">
              <h3 className="font-medium text-sm text-slate-500 mb-3 uppercase tracking-wide">Latest Summaries</h3>
              <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
                {summaries.map((summary) => (
                  <button
                    key={summary.id}
                    className={cn(
                      "w-full text-left p-3 rounded-md transition-colors border",
                      selectedSummary === summary.id
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white hover:bg-slate-50 border-slate-200"
                    )}
                    onClick={() => setSelectedSummary(summary.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-slate-500 shrink-0" />
                          <span className="text-xs text-slate-500">
                            {format(new Date(summary.dateGenerated), 'MMM d, yyyy')}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-sm mb-2 truncate">{summary.title || 'Newsletter Summary'}</h4>
                        
                        {/* Topic badges */}
                        <div className="flex flex-wrap gap-1">
                          {summary.topics.slice(0, 3).map((topic) => (
                            <span key={topic} className={cn("badge", TOPIC_COLORS[topic] || "badge-blue")}>
                              {topic}
                            </span>
                          ))}
                          {summary.topics.length > 3 && (
                            <span className="badge bg-slate-100 text-slate-700">
                              +{summary.topics.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary content (right area) */}
          <div className="lg:col-span-2">
            {currentSummary ? (
              <div className="card p-6 animate-[fadeIn_0.3s]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">{currentSummary.title || 'Newsletter Summary'}</h2>
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock size={14} className="mr-1" />
                    <span>{format(new Date(currentSummary.dateGenerated), 'MMMM d, yyyy')}</span>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentSummary.topics.map((topic) => (
                    <span key={topic} className={cn("badge", TOPIC_COLORS[topic] || "badge-blue")}>
                      {topic}
                    </span>
                  ))}
                </div>

                {/* Source newsletters */}
                {currentSummary.originalNewsletterIds?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">
                      Generated from {currentSummary.originalNewsletterIds.length} newsletters
                    </h3>
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-slate max-w-none markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  >
                    {currentSummary.summaryContent}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <MailOpen size={32} className="mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium">No summary selected</h3>
                <p className="text-slate-600">Select a summary from the list to view its content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;