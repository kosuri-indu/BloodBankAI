import { useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, DropletIcon, Hospital, Database, ArrowRight, ChartBar, Shield, Users, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import mockDatabaseService from '../services/mockDatabase';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuth();

  // Fetch real-time blood inventory data with automatic refetching
  const { data: bloodInventory, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['bloodInventory'],
    queryFn: mockDatabaseService.getBloodInventoryDetails,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 0, // Always consider data stale for fresh updates
  });

  // Fetch hospital data with automatic refetching
  const { data: hospitals, isLoading: hospitalsLoading, refetch: refetchHospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: mockDatabaseService.getRegisteredHospitals,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Fetch blood requests data with automatic refetching
  const { data: bloodRequests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['bloodRequests'],
    queryFn: mockDatabaseService.getBloodRequests,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Listen for data refresh events
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('HomePage - Received data refresh event, refetching all data');
      refetchInventory();
      refetchHospitals();
      refetchRequests();
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, [refetchInventory, refetchHospitals, refetchRequests]);

  // Calculate dynamic stats
  const totalUnits = bloodInventory?.reduce((sum, item) => sum + item.units, 0) || 0;
  const totalHospitals = hospitals?.length || 0;
  const criticalRequests = bloodRequests?.filter(req => req.urgency === 'critical').length || 0;
  const pendingRequests = bloodRequests?.length || 0;

  // Calculate blood type availability
  const bloodTypeStats = bloodInventory?.reduce((acc, item) => {
    const key = `${item.bloodType}${item.rhFactor === 'positive' ? '+' : '-'}`;
    acc[key] = (acc[key] || 0) + item.units;
    return acc;
  }, {} as Record<string, number>) || {};

  const getBloodStatusColor = (units: number) => {
    if (units >= 20) return 'bg-green-100 text-green-700 border-green-200';
    if (units >= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getBloodStatus = (units: number) => {
    if (units >= 20) return 'High';
    if (units >= 10) return 'Medium';
    return 'Critical';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Brain className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold text-red-600 mb-6">
            Blood<span className="text-purple-600">Bank</span>AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {isAuthenticated ? (
              userType === 'hospital' ? 
                "Manage your blood inventory and connect with partner hospitals using AI-powered matching." :
                "Monitor blood supply across all registered hospitals and approve new hospital registrations."
            ) : (
              "Connect with other hospitals using our AI-powered blood matching system. Track real-time blood availability and help save lives by sharing blood resources across your network."
            )}
          </p>
          
          <div className="flex justify-center gap-4 mb-12">
            {isAuthenticated ? (
              <Button
                onClick={() => navigate(userType === 'hospital' ? '/dashboard' : '/government-dashboard')}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 text-lg"
              >
                Go to {userType === 'hospital' ? 'Hospital' : 'Government'} Dashboard
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 text-lg"
                >
                  Hospital Login/Register
                </Button>
                <Button
                  onClick={() => navigate('/gov-login')}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 text-lg"
                >
                  Government Portal
                </Button>
              </>
            )}
          </div>

          {/* Real-time Stats Section */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <Hospital className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{hospitalsLoading ? '...' : totalHospitals}</h3>
              <p className="text-gray-600">Registered Hospitals</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <DropletIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{inventoryLoading ? '...' : totalUnits}</h3>
              <p className="text-gray-600">Blood Units Available</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{requestsLoading ? '...' : criticalRequests}</h3>
              <p className="text-gray-600">Critical Requests</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
              <Database className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">{requestsLoading ? '...' : pendingRequests}</h3>
              <p className="text-gray-600">Pending Requests</p>
            </Card>
          </div>
        </div>

        {/* Real-time Blood Availability */}
        {!inventoryLoading && Object.keys(bloodTypeStats).length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Real-time Blood Availability
            </h2>
            <Card className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {Object.entries(bloodTypeStats).map(([bloodType, units]) => (
                  <div 
                    key={bloodType}
                    className={`${getBloodStatusColor(units)} rounded-lg p-4 text-center border-2 hover:scale-105 transition-transform duration-300`}
                  >
                    <div className="text-2xl font-bold mb-1">{bloodType}</div>
                    <div className="text-sm mb-2">{getBloodStatus(units)}</div>
                    <div className="font-medium">{units} units</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Data updated in real-time from {totalHospitals} connected hospitals
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* When no data is available */}
        {!inventoryLoading && Object.keys(bloodTypeStats).length === 0 && (
          <div className="mb-12">
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Blood Inventory Data</h3>
                <p>Start by registering hospitals and adding blood inventory to see real-time availability.</p>
              </div>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="rounded-full bg-purple-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our advanced AI algorithm matches blood across hospital networks based on blood type compatibility,
                Rh factor, special attributes, and urgency to ensure timely and effective transfusions.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="rounded-full bg-red-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <ChartBar className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">Real-time Inventory</h3>
              <p className="text-gray-600">
                Get instant visibility into your blood inventory and track expiration dates. Connect with nearby hospitals
                to fulfill urgent blood requirements.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="rounded-full bg-blue-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">Secure & Verified</h3>
              <p className="text-gray-600">
                All hospitals undergo government verification. Secure data handling ensures patient privacy while
                maintaining efficient blood distribution across the network.
              </p>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gradient-to-r from-red-50 to-purple-50 p-10 rounded-xl mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">How BloodBankAI Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white p-4 mb-3 shadow-md">
                  <DropletIcon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-medium mb-1">Record Inventory</h3>
                <p className="text-sm text-gray-600">Add your blood inventory with detailed information</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white p-4 mb-3 shadow-md">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-medium mb-1">AI Processing</h3>
                <p className="text-sm text-gray-600">Our AI finds the best matches based on multiple factors</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-white p-4 mb-3 shadow-md">
                  <Hospital className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-medium mb-1">Hospital Connection</h3>
                <p className="text-sm text-gray-600">Connect with matched hospitals to fulfill blood requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          {!isAuthenticated && (
            <Button 
              onClick={() => navigate('/register')} 
              className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6 group"
            >
              Join BloodBankAI Today
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
