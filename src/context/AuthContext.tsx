import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import mockDatabaseService, { AiMatch, BloodRequest } from '../services/mockDatabase';
import { useAiMatching as useAiMatchingHook } from '@/hooks/useAiMatching';

type UserType = 'hospital' | 'government' | null;

interface AuthUser {
  id: string;
  name: string;
  email: string;
  type: UserType;
  hospitalName?: string;
  isVerified?: boolean;
  isGovernmentOfficial?: boolean;
}

interface AuthContextType {
  matches: AiMatch[];
  isMatching: boolean;
  runAiMatching: (request: BloodRequest | { id: string }) => Promise<{ success: boolean; matches?: AiMatch[] }>;
  contactHospital: (hospitalId: string, requestId: string) => Promise<void>;
  deleteMatch: (matchId: string) => void;
  currentUser: AuthUser | null;
  userType: UserType;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: UserType) => Promise<boolean>;
  logout: () => void;
  register: (userData: any, userType: UserType) => Promise<boolean>;
  approveHospital: (hospitalId: string) => Promise<boolean>;
  refreshData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authenticateUser = async (email: string, password: string, userType: UserType) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (userType === 'government') {
      const isValidGovernment = email === 'admin@health.gov' && password === 'admin123';
      if (!isValidGovernment) throw new Error('Invalid government credentials');
      return {
        success: true,
        user: {
          id: 'gov-official-1',
          name: 'Government Health Official',
          email: email,
          type: 'government' as UserType,
          isGovernmentOfficial: true
        }
      };
    }
    
    if (userType === 'hospital') {
      const hospitals = await mockDatabaseService.getRegisteredHospitals();
      const hospital = hospitals.find(h => h.email.toLowerCase() === email.toLowerCase());
      
      if (!hospital) throw new Error('Invalid credentials or hospital not found');
      if (!hospital.verified) throw new Error('Your hospital account is pending verification');
      
      console.log(`🔒 Hospital login: ${hospital.name} (ID: ${hospital.id})`);
      
      return {
        success: true,
        user: {
          id: hospital.id,
          name: hospital.contactPerson,
          email: hospital.email,
          type: 'hospital' as UserType,
          hospitalName: hospital.name,
          isVerified: true
        }
      };
    }
    
    throw new Error('Invalid user type');
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
  }
};

const registerHospital = async (userData: any) => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const requiredFields = ['hospitalName', 'email', 'password', 'contactPerson', 'phoneNumber', 'registrationId'];
    for (const field of requiredFields) {
      if (!userData[field]) throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`);
    }
    
    const allData = await mockDatabaseService.getAllData();
    if (allData.hospitals.some(h => h.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('A hospital with this email already exists');
    }
    
    await mockDatabaseService.registerHospital({
      name: userData.hospitalName,
      email: userData.email,
      contactPerson: userData.contactPerson,
      registrationId: userData.registrationId,
      address: userData.address || '',
      phone: userData.phoneNumber || '',
      website: userData.website || ''
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { matches, isProcessing, runAiMatching, contactHospital, deleteMatch } = useAiMatchingHook();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    window.dispatchEvent(new CustomEvent('dataRefresh'));
  };
  
  useEffect(() => {
    const storedUser = localStorage.getItem('bloodbank_user');
    const storedUserType = localStorage.getItem('bloodbank_user_type');
    
    if (storedUser && (storedUserType === 'hospital' || storedUserType === 'government')) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setUserType(storedUserType as UserType);
        
        if (storedUserType === 'hospital') {
          mockDatabaseService.getRegisteredHospitals().then(hospitals => {
            const hospital = hospitals.find(h => h.id === user.id);
            if (!hospital || !hospital.verified) {
              logout();
            }
          });
        }
      } catch (error) {
        localStorage.removeItem('bloodbank_user');
        localStorage.removeItem('bloodbank_user_type');
      }
    }
  }, []);
  
  const login = async (email: string, password: string, type: UserType): Promise<boolean> => {
    const result = await authenticateUser(email, password, type);
    
    if (!result.success) {
      toast({ title: "Login Failed", description: result.error, variant: "destructive" });
      return false;
    }
    
    setCurrentUser(result.user);
    setUserType(type);
    localStorage.setItem('bloodbank_user', JSON.stringify(result.user));
    localStorage.setItem('bloodbank_user_type', type);
    
    toast({ title: "Login Successful", description: `Welcome back, ${result.user.name}!` });
    refreshData();
    navigate(type === 'government' ? '/government-dashboard' : '/dashboard');
    return true;
  };
  
  const register = async (userData: any, type: UserType): Promise<boolean> => {
    if (type !== 'hospital') {
      toast({ title: "Invalid User Type", description: "Only hospitals can register.", variant: "destructive" });
      return false;
    }
    
    const result = await registerHospital(userData);
    
    if (!result.success) {
      toast({ title: "Registration Failed", description: result.error, variant: "destructive" });
      return false;
    }
    
    toast({ title: "Registration Submitted", description: "Your registration is pending verification." });
    refreshData();
    return true;
  };
  
  const approveHospital = async (hospitalId: string): Promise<boolean> => {
    if (userType !== 'government') {
      toast({ title: "Permission Denied", description: "Only government officials can approve hospitals.", variant: "destructive" });
      return false;
    }
    
    const result = await mockDatabaseService.verifyHospital(hospitalId);
    
    if (!result.success) {
      toast({ title: "Approval Failed", description: result.error, variant: "destructive" });
      return false;
    }
    
    toast({ title: "Hospital Approved", description: `Hospital ${result.hospitalName} has been verified.` });
    refreshData();
    return true;
  };
  
  const logout = () => {
    const currentUserType = userType;
    setCurrentUser(null);
    setUserType(null);
    localStorage.removeItem('bloodbank_user');
    localStorage.removeItem('bloodbank_user_type');
    toast({ title: "Logged Out", description: "You have been logged out." });
    setTimeout(() => { window.location.href = currentUserType === 'government' ? '/gov-login' : '/register'; }, 100);
  };
  
  const value = {
    matches,
    isMatching: isProcessing,
    runAiMatching,
    contactHospital,
    deleteMatch,
    currentUser,
    userType,
    isAuthenticated: !!currentUser && !!userType,
    login,
    logout,
    register,
    approveHospital,
    refreshData,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
