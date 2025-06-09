import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, XCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithGoogle, authError, clearAuthError } = useAuth();

  // Clear any existing auth errors when the component unmounts
  useEffect(() => {
    return () => {
      clearAuthError();
    };
  }, [clearAuthError]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Info */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-900 to-blue-700 text-white p-8 md:p-16 flex flex-col justify-center items-start">
        <div className="max-w-md mx-auto md:mx-0 fade-in">
          <div className="flex items-center gap-3 mb-8">
            <Brain size={40} />
            <h1 className="text-3xl font-bold">Nigest</h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-bold mb-6 leading-tight">
            Your AI-powered newsletter intelligence assistant
          </h2>
          
          <p className="text-lg mb-8 text-blue-100">
            Nigest helps you stay informed without the overwhelm by curating and summarizing your newsletter subscriptions.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-800 p-2 rounded-full mt-1">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gmail Integration</h3>
                <p className="text-blue-100">Securely connect to your Gmail account to scan newsletters</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-800 p-2 rounded-full mt-1">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI Summarization</h3>
                <p className="text-blue-100">Get concise summaries of newsletter content powered by advanced AI</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-800 p-2 rounded-full mt-1">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Secure & Private</h3>
                <p className="text-blue-100">Your data is protected and never shared with third parties</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login */}
      <div className="md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="max-w-md w-full slide-up">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Nigest</h2>
            <p className="text-slate-600">Sign in to start organizing your newsletters</p>
          </div>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700">{authError}</p>
                <button 
                  onClick={clearAuthError}
                  className="text-sm text-red-600 hover:text-red-800 mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={signInWithGoogle}
            className="w-full py-3 px-4 border border-slate-200 rounded-lg shadow-sm bg-white hover:bg-slate-50 flex items-center justify-center gap-3 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Sign in with Google
          </button>
          
          <p className="mt-6 text-center text-sm text-slate-500">
            By signing in, you agree to our 
            <a href="#" className="text-blue-700 hover:text-blue-800 mx-1">Terms of Service</a> 
            and 
            <a href="#" className="text-blue-700 hover:text-blue-800 ml-1">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;