import React, { useState } from 'react';
import { Mail, RefreshCw, Calendar, AlertTriangle, CheckCircle, Search, Scan } from 'lucide-react';
import { format } from 'date-fns';
import { useNewsletters } from '../hooks/useNewsletters';

const Newsletters: React.FC = () => {
  const { newsletters, isLoading, isScanning, refreshNewsletters, scanEmailsForNewsletters } = useNewsletters();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredNewsletters = newsletters.filter(
    newsletter => newsletter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScanEmails = async () => {
    try {
      await scanEmailsForNewsletters();
    } catch (error) {
      console.error('Error scanning emails:', error);
      alert('Error scanning emails. Please check your Gmail permissions and try again.');
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Newsletters</h1>
          <p className="text-slate-600">Manage your newsletter subscriptions</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleScanEmails}
            className="btn btn-primary"
            disabled={isLoading}
          >
            <Scan size={18} className={isScanning ? 'animate-spin' : ''} />
            <span>{isScanning ? 'Scanning...' : 'Scan Emails'}</span>
          </button>
          
          <button 
            onClick={refreshNewsletters}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="card p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search newsletters..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center">
          <RefreshCw size={32} className="mx-auto mb-4 text-blue-700 animate-spin" />
          <h3 className="text-lg font-medium mb-1">
            {isScanning ? 'Scanning your inbox with AI...' : 'Loading newsletters...'}
          </h3>
          <p className="text-slate-600">
            {isScanning ? 'This might take a moment while we analyze your emails...' : 'Please wait...'}
          </p>
        </div>
      ) : newsletters.length === 0 ? (
        <div className="card p-12 text-center">
          <Mail size={32} className="mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium mb-1">No newsletters found</h3>
          <p className="text-slate-600 mb-6">
            Click "Scan Emails" to analyze your inbox and identify newsletters using AI.
          </p>
          <button 
            onClick={handleScanEmails} 
            className="btn btn-primary mx-auto"
          >
            <Scan size={16} />
            Scan emails now
          </button>
        </div>
      ) : (
        <div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Newsletter
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sender
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Topics
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Last Received
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredNewsletters.map((newsletter) => (
                    <tr key={newsletter.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{newsletter.name}</div>
                        {newsletter.confidence && (
                          <div className="text-xs text-slate-500">
                            AI Confidence: {Math.round(newsletter.confidence * 100)}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{newsletter.senderEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {newsletter.topics?.slice(0, 3).map((topic) => (
                            <span key={topic} className="badge badge-blue text-xs">
                              {topic}
                            </span>
                          ))}
                          {newsletter.topics && newsletter.topics.length > 3 && (
                            <span className="badge bg-slate-100 text-slate-700 text-xs">
                              +{newsletter.topics.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar size={14} className="mr-1" />
                          {format(new Date(newsletter.lastReceivedDate), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          newsletter.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {newsletter.isActive ? (
                            <CheckCircle size={12} className="mr-1" />
                          ) : (
                            <AlertTriangle size={12} className="mr-1" />
                          )}
                          {newsletter.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-700 hover:text-blue-900"
                          onClick={() => {
                            // Toggle newsletter status logic would go here
                            alert(`Toggle status for ${newsletter.name}`);
                          }}
                        >
                          {newsletter.isActive ? 'Pause' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {filteredNewsletters.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-600">No newsletters match your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Newsletters;