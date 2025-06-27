
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HospitalLoginForm from '../components/auth/HospitalLoginForm';
import { Brain, Hospital } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-10 w-10 text-purple-600" />
            <Hospital className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mt-2 text-2xl font-bold">
            BloodBank<span className="text-purple-600">AI</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Hospital Blood Bank Network & AI Matching System
          </p>
        </div>
        
        <HospitalLoginForm />
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            New hospital to the network?{" "}
            <button
              onClick={() => navigate('/register')}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
