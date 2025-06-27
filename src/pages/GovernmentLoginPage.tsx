
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GovernmentLoginForm from '../components/auth/GovernmentLoginForm';
import { Brain, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GovernmentLoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuth();
  
  // Redirect if already authenticated as government
  useEffect(() => {
    if (isAuthenticated && userType === 'government') {
      navigate('/government-dashboard');
    }
  }, [isAuthenticated, userType, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-10 w-10 text-purple-600" />
            <Briefcase className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-2 text-2xl font-bold">
            Government Health <span className="text-blue-600">Authority</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hospital Registration Approval Portal
          </p>
        </div>
        
        <GovernmentLoginForm />
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Hospital user?{" "}
            <button
              onClick={() => navigate('/register')}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GovernmentLoginPage;
