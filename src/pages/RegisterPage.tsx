
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HospitalLoginForm from '../components/auth/HospitalLoginForm';
import HospitalRegisterForm from '../components/auth/HospitalRegisterForm';
import { Brain, Hospital, Briefcase } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { isAuthenticated, userType } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (userType === 'hospital') {
        navigate('/dashboard');
      } else if (userType === 'government') {
        navigate('/government-dashboard');
      }
    }
  }, [isAuthenticated, userType, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
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
        
        <Tabs 
          defaultValue="login" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value as 'login' | 'register')}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Hospital Login</TabsTrigger>
            <TabsTrigger value="register">Hospital Signup</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <HospitalLoginForm />
          </TabsContent>
          
          <TabsContent value="register">
            <HospitalRegisterForm />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Government Health Official?
          </p>
          <Button
            variant="outline"
            className="flex items-center justify-center mx-auto"
            onClick={() => navigate('/gov-login')}
          >
            <Briefcase className="mr-2 h-4 w-4 text-blue-600" />
            Access Government Portal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
