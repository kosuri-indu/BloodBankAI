import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DropletIcon, 
  Building2,
  Hospital,
  CheckCircle2,
  AlertCircle, 
  Clipboard,
  LogOut,
  User,
  RefreshCw,
  Trash2,
  Brain,
  MapPin,
  Clock,
  Phone,
  Bell
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import mockDatabaseService, { Hospital as HospitalType, BloodInventory, BloodRequest } from "@/services/mockDatabase";
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useAiMatching } from '@/hooks/useAiMatching';
import { useNotifications } from '@/hooks/useNotifications';

interface HospitalWithData {
  hospital: HospitalType;
  inventory: BloodInventory[];
  requests: BloodRequest[];
}

const GovernmentDashboardPage = () => {
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [pendingHospitals, setPendingHospitals] = useState<HospitalType[]>([]);
  const [hospitalsWithData, setHospitalsWithData] = useState<HospitalWithData[]>([]);
  const [allRequests, setAllRequests] = useState<BloodRequest[]>([]);
  const [allInventory, setAllInventory] = useState<BloodInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { approveHospital, logout, currentUser, refreshData } = useAuth();
  const { runAiMatching, contactHospital, matches, isProcessing } = useAiMatching();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Government Dashboard - Fetching comprehensive data');
      
      const [verifiedHospitals, unverifiedHospitals, hospitalsDataResult, requests, inventory] = await Promise.all([
        mockDatabaseService.getRegisteredHospitals(),
        mockDatabaseService.getPendingHospitals(),
        mockDatabaseService.getAllHospitalsWithData(),
        mockDatabaseService.getBloodRequests(),
        mockDatabaseService.getBloodInventoryDetails()
      ]);
      
      setHospitals(verifiedHospitals);
      setPendingHospitals(unverifiedHospitals);
      
      // Transform the data structure to match HospitalWithData[]
      const transformedHospitalsData: HospitalWithData[] = hospitalsDataResult.hospitals.map(hospital => ({
        hospital,
        inventory: hospitalsDataResult.inventory.filter(inv => inv.hospitalId === hospital.id),
        requests: hospitalsDataResult.requests.filter(req => req.hospital === hospital.name)
      }));
      
      setHospitalsWithData(transformedHospitalsData);
      setAllRequests(requests);
      setAllInventory(inventory);
      
      console.log('Government Dashboard Data:', {
        verifiedHospitals: verifiedHospitals.length,
        pendingHospitals: unverifiedHospitals.length,
        totalRequests: requests.length,
        totalInventory: inventory.length
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data for the dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [toast]);

  // Calculate system-wide stats
  const systemStats = {
    totalHospitals: hospitals.length,
    pendingHospitals: pendingHospitals.length,
    totalBloodUnits: allInventory.reduce((sum, item) => sum + item.units, 0),
    activeRequests: allRequests.length,
    criticalRequests: allRequests.filter(req => req.urgency === 'critical').length,
    unprocessedRequests: allRequests.filter(req => req.matchPercentage === 0).length
  };

  const handleVerifyHospital = async (hospitalId: string) => {
    try {
      const success = await approveHospital(hospitalId);
      
      if (success) {
        const verifiedHospital = pendingHospitals.find(h => h.id === hospitalId);
        
        if (verifiedHospital) {
          setPendingHospitals(prev => prev.filter(h => h.id !== hospitalId));
          setHospitals(prev => [...prev, {...verifiedHospital, verified: true}]);
          
          toast({
            title: "Hospital Verified",
            description: `${verifiedHospital.name} has been successfully verified.`,
          });
        }
      }
      
      await fetchData();
      
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during verification.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteHospital = async (hospitalId: string, hospitalName: string) => {
    try {
      const result = await mockDatabaseService.deleteHospital(hospitalId);
      
      if (result.success) {
        // Clear all related data
        setPendingHospitals([]);
        setHospitals([]);
        setHospitalsWithData([]);
        setAllRequests([]);
        setAllInventory([]);
        
        toast({
          title: "Hospital Deleted",
          description: `${hospitalName} has been removed from the system.`,
        });
        
        try {
          // Force a complete refresh of all data
          await fetchData();
          
          // Get all matches and update them
          const matches = await mockDatabaseService.getAiMatches();
          if (matches && Array.isArray(matches)) {
            const filteredMatches = matches.filter(match => 
              match.donorId !== hospitalId && match.requestId !== hospitalId
            );
            await mockDatabaseService.setAiMatches(filteredMatches);
          }
        } catch (refreshError) {
          console.error('Error during data refresh:', refreshError);
          toast({
            title: "Data Refresh Error",
            description: "Some data may not have been fully updated. Please refresh the page.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Delete Failed",
          description: result.error || "Failed to delete hospital.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during deletion.",
        variant: "destructive",
      });
    }
  };

  const handleRunAiMatching = async (requestId: string) => {
    try {
      const request = allRequests.find(req => req.id === requestId);
      if (!request) return;

      const result = await runAiMatching({ id: requestId });
      
      if (result.success) {
        await fetchData(); // Refresh to show updated match percentages
        toast({
          title: "AI Matching Complete",
          description: `Found ${result.matches?.length || 0} potential matches for the request.`,
        });
      }
    } catch (error) {
      console.error("AI matching error:", error);
      toast({
        title: "AI Matching Failed",
        description: "Failed to run AI matching. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    console.log('Manual refresh triggered');
    refreshData();
    await fetchData();
    toast({
      title: "Data Refreshed",
      description: "All system data has been refreshed.",
    });
  };

  const handleLogout = () => {
    console.log('Government Dashboard - LOGOUT BUTTON CLICKED');
    logout();
  };

  const formatBloodType = (bloodType: string, rhFactor: string) => {
    return `${bloodType} ${rhFactor === 'positive' ? '+' : '-'}`;
  };

  const getExpiryStatus = (expirationDate: Date) => {
    const daysRemaining = differenceInDays(new Date(expirationDate), new Date());
    
    if (daysRemaining <= 0) {
      return { status: 'expired', color: 'text-red-600', message: 'Expired' };
    } else if (daysRemaining <= 7) {
      return { status: 'critical', color: 'text-red-600', message: `${daysRemaining}d left` };
    } else if (daysRemaining <= 14) {
      return { status: 'warning', color: 'text-amber-600', message: `${daysRemaining}d left` };
    } else {
      return { status: 'good', color: 'text-green-600', message: `${daysRemaining}d left` };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-blue-600">
                Government Health Authority Dashboard
              </h1>
              <p className="text-gray-500">
                Central coordination of blood bank network and AI-powered matching
              </p>
              {unreadCount > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-red-500">
                    {unreadCount} new notifications
                  </Badge>
                  <Button size="sm" variant="outline" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm border">
                <User size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {currentUser?.name}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  Refresh
                </Button>
                
                <Button
                  variant="destructive"
                  size="lg"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 border-2 border-red-800 shadow-lg"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  <span className="text-lg">LOGOUT</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* System-wide Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-blue-100 p-3 mb-2">
                <Hospital className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500">Hospitals</p>
              <p className="text-2xl font-bold">{systemStats.totalHospitals}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-amber-100 p-3 mb-2">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{systemStats.pendingHospitals}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-red-100 p-3 mb-2">
                <DropletIcon className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-500">Blood Units</p>
              <p className="text-2xl font-bold">{systemStats.totalBloodUnits}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-green-100 p-3 mb-2">
                <Clipboard className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-500">Requests</p>
              <p className="text-2xl font-bold">{systemStats.activeRequests}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-orange-100 p-3 mb-2">
                <Brain className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-500">Unprocessed</p>
              <p className="text-2xl font-bold">{systemStats.unprocessedRequests}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <div className="rounded-full bg-red-100 p-3 mb-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold">{systemStats.criticalRequests}</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="matching" className="w-full">
          <TabsList className="w-full bg-white rounded-md shadow-sm grid grid-cols-5 p-2">
            <TabsTrigger value="matching">AI Blood Matching</TabsTrigger>
            <TabsTrigger value="hospitals">All Hospitals</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingHospitals.length})</TabsTrigger>
            <TabsTrigger value="inventory">System Inventory</TabsTrigger>
          </TabsList>
          
          <TabsContent value="matching" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-500" />
                  AI Blood Matching & Request Processing
                </CardTitle>
                <CardDescription>
                  Process blood requests from hospitals and coordinate matches using AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading requests...</div>
                ) : allRequests.length > 0 ? (
                  <div className="space-y-4">
                    {allRequests.map((request) => (
                      <div 
                        key={request.id}
                        className={`p-4 border rounded-lg ${
                          request.urgency === 'critical' ? 'bg-red-50 border-red-200' :
                          request.urgency === 'urgent' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <p className="font-semibold text-lg">
                                {request.bloodType} • {request.units} Units
                              </p>
                              <Badge 
                                className={`ml-2 ${
                                  request.urgency === 'critical' ? 'bg-red-500' :
                                  request.urgency === 'urgent' ? 'bg-amber-600' :
                                  'bg-blue-600'
                                }`}
                              >
                                {request.urgency.toUpperCase()}
                              </Badge>
                              {request.matchPercentage > 0 ? (
                                <Badge variant="outline" className="ml-2 bg-green-50">
                                  Matched: {request.matchPercentage}%
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="ml-2 bg-gray-50">
                                  Awaiting Processing
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Hospital className="h-4 w-4 mr-1" />
                                  <span className="font-medium">{request.hospital}</span>
                                </p>
                                <p className="text-xs text-gray-500 ml-5">Requesting Hospital</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Patient:</span> {request.patientAge}y, {request.patientWeight}kg
                                </p>
                                <p className="text-xs text-gray-500">{request.medicalCondition}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-600">
                                  <Clock className="h-4 w-4 inline mr-1" />
                                  <span className="font-medium">Needed by:</span> {format(new Date(request.neededBy), 'MMM d, HH:mm')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Created: {format(new Date(request.createdAt), 'MMM d, HH:mm')}
                                </p>
                              </div>
                            </div>
                            
                            {request.specialRequirements && request.specialRequirements.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Special Requirements:</p>
                                <div className="flex flex-wrap gap-1">
                                  {request.specialRequirements.map((req, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {req.replace('-', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4">
                            {request.matchPercentage === 0 ? (
                              <Button 
                                onClick={() => handleRunAiMatching(request.id)}
                                disabled={isProcessing}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Brain className="h-4 w-4 mr-1" />
                                {isProcessing ? 'Processing...' : 'Run Smart AI Match'}
                              </Button>
                            ) : (
                              <div className="text-sm text-green-600 font-medium">
                                ✓ {matches.filter(m => m.requestId === request.id).length} Matches Found
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Show matches for this request */}
                        {matches.filter(match => match.requestId === request.id).length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium mb-2 text-sm text-gray-700">AI Matched Hospitals:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {matches.filter(match => match.requestId === request.id).slice(0, 4).map((match, idx) => (
                                <div key={idx} className="p-3 bg-white border rounded-lg text-sm">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-medium">{match.hospitalName}</p>
                                      <p className="text-xs text-gray-600 flex items-center">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {match.distance}km away
                                      </p>
                                    </div>
                                    <Badge className="bg-green-600 text-xs">
                                      {match.matchScore}%
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <p><span className="font-medium">Blood:</span> {match.bloodType} ({match.availableUnits} units)</p>
                                    {match.donorAge && (
                                      <p><span className="font-medium">Donor Age:</span> {match.donorAge} years</p>
                                    )}
                                    {match.expiryDays && match.expiryDays > 0 && (
                                      <p><span className="font-medium">Expires:</span> {match.expiryDays} days</p>
                                    )}
                                    {match.specialAttributes && match.specialAttributes.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {match.specialAttributes.slice(0, 2).map((attr, i) => (
                                          <Badge key={i} variant="outline" className="text-xs">
                                            {attr.replace('-', ' ')}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex justify-between items-center mt-2">
                                    <div className="text-xs text-gray-500">
                                      {match.status === 'contacted' ? '✅ Contacted' : '⏳ Available'}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => contactHospital(match.donorId, match.requestId)}
                                      disabled={match.status === 'contacted'}
                                      className="text-xs px-2 py-1 h-6"
                                    >
                                      <Phone className="h-3 w-3 mr-1" />
                                      {match.status === 'contacted' ? 'Contacted' : 'Contact'}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {matches.filter(match => match.requestId === request.id).length > 4 && (
                              <p className="text-xs text-gray-500 mt-2 text-center">
                                +{matches.filter(match => match.requestId === request.id).length - 4} more matches available
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">No active blood requests</p>
                    <p className="text-sm text-gray-500">
                      Blood requests from hospitals will appear here for AI matching.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hospitals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Hospital className="mr-2 h-5 w-5 text-blue-500" />
                  All Hospital Data & Inventory
                </CardTitle>
                <CardDescription>
                  Complete overview of all verified hospitals with their inventory and requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading hospital data...</div>
                ) : hospitalsWithData.length > 0 ? (
                  <div className="space-y-6">
                    {hospitalsWithData.map((hospitalData) => (
                      <div key={hospitalData.hospital.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold flex items-center">
                              <Hospital className="mr-2 h-5 w-5" />
                              {hospitalData.hospital.name}
                            </h3>
                            <p className="text-gray-600 flex items-center mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {hospitalData.hospital.address}
                            </p>
                            <p className="text-sm text-gray-500">
                              Contact: {hospitalData.hospital.contactPerson} • {hospitalData.hospital.email}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{hospitalData.inventory.reduce((sum, item) => sum + item.units, 0)}</span> blood units
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{hospitalData.requests.length}</span> active requests
                              </p>
                            </div>
                            
                            <Button 
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteHospital(hospitalData.hospital.id, hospitalData.hospital.name)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Inventory */}
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <DropletIcon className="h-4 w-4 mr-1 text-red-600" />
                              Blood Inventory
                            </h4>
                            {hospitalData.inventory.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {hospitalData.inventory.map((item, idx) => {
                                  const expiryStatus = getExpiryStatus(item.expirationDate);
                                  return (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                      <div>
                                        <span className="font-medium">
                                          {formatBloodType(item.bloodType, item.rhFactor)}
                                        </span>
                                        <span className="ml-2 text-gray-600">{item.units} units</span>
                                      </div>
                                      <span className={`text-xs ${expiryStatus.color}`}>
                                        {expiryStatus.message}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No inventory recorded</p>
                            )}
                          </div>
                          
                          {/* Requests */}
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <Clipboard className="h-4 w-4 mr-1 text-blue-600" />
                              Blood Requests
                            </h4>
                            {hospitalData.requests.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {hospitalData.requests.map((request) => (
                                  <div key={request.id} className="p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">
                                        {request.bloodType} • {request.units} units
                                      </span>
                                      <Badge 
                                        className={`text-xs ${
                                          request.urgency === 'critical' ? 'bg-red-500' :
                                          request.urgency === 'urgent' ? 'bg-amber-600' :
                                          'bg-blue-600'
                                        }`}
                                      >
                                        {request.urgency}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-600 text-xs mt-1">
                                      {request.medicalCondition} • Match: {request.matchPercentage}%
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No active requests</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    <Hospital className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">No hospital data available</p>
                    <p className="text-sm text-gray-500">
                      Hospital data will appear here once hospitals are verified and add inventory.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
                  Pending Hospital Registrations
                </CardTitle>
                <CardDescription>
                  Review and verify new hospital registrations. Data persists across sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    Loading pending registrations...
                  </div>
                ) : pendingHospitals.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingHospitals.map((hospital) => (
                      <Card key={hospital.id} className="bg-white shadow-md rounded-md">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <Hospital className="mr-2 h-5 w-5 text-gray-700" />
                            {hospital.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">
                            <Building2 className="inline-block h-4 w-4 mr-1" />
                            {hospital.address}
                          </p>
                          <p className="text-gray-600">
                            <Clipboard className="inline-block h-4 w-4 mr-1" />
                            Registration ID: {hospital.registrationId}
                          </p>
                          <p className="text-gray-600">
                            <DropletIcon className="inline-block h-4 w-4 mr-1" />
                            Contact: {hospital.contactPerson}
                          </p>
                          <p className="text-gray-600">
                            <a href={`mailto:${hospital.email}`} className="text-blue-500 hover:underline">
                              {hospital.email}
                            </a>
                          </p>
                          <p className="text-gray-600">
                            Registered on: {format(new Date(hospital.createdAt), 'MMM d, yyyy')}
                          </p>
                        </CardContent>
                        <div className="p-4 flex justify-between gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => handleVerifyHospital(hospital.id)}
                            className="flex-1"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Verify
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleDeleteHospital(hospital.id, hospital.name)}
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    No pending hospital registrations.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DropletIcon className="mr-2 h-5 w-5 text-red-500" />
                  System Blood Inventory
                </CardTitle>
                <CardDescription>
                  View and manage the blood inventory across all hospitals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    Loading inventory data...
                  </div>
                ) : allInventory.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allInventory.map((item) => (
                      <Card key={item.id} className="bg-white shadow-md rounded-md">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <DropletIcon className="mr-2 h-5 w-5 text-red-600" />
                            {item.bloodType} {item.rhFactor === 'positive' ? '+' : '-'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">
                            <span className="font-medium">{item.units} units</span>
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Expiry: {format(new Date(item.expirationDate), 'MMM d, yyyy')}</span>
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    No blood inventory data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GovernmentDashboardPage;
