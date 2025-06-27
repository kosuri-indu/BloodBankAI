
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Briefcase, Loader2, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const GovernmentLoginForm = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<{
    [key: string]: string
  }>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Use the demo credentials for quick testing
      await login(formData.email.trim(), formData.password, 'government');
    } catch (error) {
      console.error('Government login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 space-y-6">
      <div className="flex items-center justify-center mb-2">
        <Briefcase className="w-8 h-8 text-blue-600" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-600">Government Health Portal</h2>
        <p className="text-gray-600">Access the hospital registration approval system</p>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              For demo purposes, use: <br />
              Email: admin@health.gov <br />
              Password: admin123
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="government@health.gov"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
            required
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={errors.password ? "border-red-500" : ""}
            required
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700" 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Logging in...
            </>
          ) : (
            'Access Portal'
          )}
        </Button>
      </form>
      
      <div className="text-center text-sm text-gray-500">
        <AlertCircle className="inline h-4 w-4 mr-1" />
        This portal is restricted to authorized government health officials only
      </div>
    </Card>
  );
};

export default GovernmentLoginForm;
