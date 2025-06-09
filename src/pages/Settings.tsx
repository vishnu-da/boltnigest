import React, { useState } from 'react';
import { Save, Clock, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [scanFrequency, setScanFrequency] = useState('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main settings form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Clock className="mr-2 text-blue-700" size={20} />
                Scan Preferences
              </h2>
              
              <div className="mb-4">
                <label className="label">
                  How often should we scan your inbox for newsletters?
                </label>
                <select
                  value={scanFrequency}
                  onChange={(e) => setScanFrequency(e.target.value)}
                  className="input w-full"
                >
                  <option value="daily">Daily (Recommended)</option>
                  <option value="twice-daily">Twice Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual Only</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="label">
                  When should we scan for newsletters?
                </label>
                <select className="input w-full">
                  <option value="morning">Morning (7 AM)</option>
                  <option value="noon">Noon (12 PM)</option>
                  <option value="evening">Evening (6 PM)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  All times are in your local timezone.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Only summarize unread newsletters
                  </span>
                </label>
              </div>
            </div>
            
            <div className="card p-6 mb-6">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Mail className="mr-2 text-blue-700" size={20} />
                Newsletter Management
              </h2>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-700 rounded border-slate-300 focus:ring-blue-500"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    Automatically detect and add new newsletters
                  </span>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="label">
                  What keywords should we use to identify newsletters?
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="newsletter, digest, weekly, roundup, etc."
                  defaultValue="newsletter, digest, weekly, roundup"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Separate keywords with commas.
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
        
        {/* Account Info */}
        <div className="md:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Lock className="mr-2 text-blue-700" size={20} />
              Account
            </h2>
            
            <div className="mb-4">
              <div className="flex items-center mb-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-16 h-16 rounded-full mr-4"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center mr-4">
                    <span className="text-blue-800 text-xl font-medium">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{user?.displayName || 'User'}</h3>
                  <p className="text-sm text-slate-600">{user?.email}</p>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 mb-6">
                <p>Connected with Google Account</p>
                <p>Gmail access: Enabled</p>
              </div>
              
              <button className="btn btn-secondary w-full">
                Manage Google Account Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;