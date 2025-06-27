
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface UseAuthFormOptions {
  type: 'login' | 'register';
  userType: 'hospital' | 'government';
}

export default function useAuthForm({ type, userType }: UseAuthFormOptions) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (email: string, password: string, extraData?: any) => {
    setIsLoading(true);
    try {
      console.log(`Login attempt for ${userType} with email: ${email}`);
      if (userType === 'government') {
        const success = await login(email, password, userType);
        if (success) {
          navigate('/government-dashboard');
        }
      } else {
        const success = await login(email, password, userType, extraData);
        if (success) {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (email: string, password: string, userData: any) => {
    setIsLoading(true);
    try {
      // Debug log the userData to check what's being received
      console.log("useAuthForm received userData:", userData);
      
      // Ensure hospitalName exists and is not just whitespace
      if (!userData.hospitalName || typeof userData.hospitalName !== 'string' || userData.hospitalName.trim() === '') {
        console.error("Hospital name validation failed:", userData);
        throw new Error('Hospital name is required');
      }
      
      // Ensure the hospitalName is trimmed to avoid whitespace issues
      userData.hospitalName = userData.hospitalName.trim();
      
      // Pass the userData directly to register
      const success = await register(userData, userType);
      
      if (success) {
        navigate('/register', { state: { showMessage: `hospital-registered` } });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    isLoading,
    handleSubmit: type === 'login' ? handleLogin : handleRegister,
  };
}
