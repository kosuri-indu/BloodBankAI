
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Hospital, DropletIcon, AlertCircle, Clock, CheckCircle, BadgeCheck, MapPin, ArrowRight, Trash2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import mockDatabaseService, { BloodRequest, AiMatch } from "@/services/mockDatabase";
import { useAuth } from '@/context/AuthContext';
import { Badge } from "@/components/ui/badge";

const bloodTypes = [
  { value: "A Rh+ (A+)", label: "A Positive (A+)" },
  { value: "A Rh- (A-)", label: "A Negative (A-)" },
  { value: "B Rh+ (B+)", label: "B Positive (B+)" },
  { value: "B Rh- (B-)", label: "B Negative (B-)" },
  { value: "AB Rh+ (AB+)", label: "AB Positive (AB+)" },
  { value: "AB Rh- (AB-)", label: "AB Negative (AB-)" },
  { value: "O Rh+ (O+)", label: "O Positive (O+)" },
  { value: "O Rh- (O-)", label: "O Negative (O-)" }
];

const specialRequirements = [
  { id: "irradiated", label: "Irradiated" },
  { id: "leukoreduced", label: "Leukoreduced" },
  { id: "cmv-negative", label: "CMV Negative" },
  { id: "washed", label: "Washed" }
];

const AiBloodMatchingSystem = () => {
  const { toast } = useToast();
  const { isMatching, matches, runAiMatching, contactHospital, deleteMatch } = useAuth();
  
  const [activeTab, setActiveTab] = useState('create-request');
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  
  const [requestForm, setRequestForm] = useState({
    bloodType: "",
    units: 1,
    urgency: "routine",
    patientAge: "",
    patientWeight: "",
    medicalCondition: "",
    neededBy: "",
    specialRequirements: [] as string[]
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const handleSpecialRequirementsChange = (requirementId: string, checked: boolean) => {
    if (checked) {
      setRequestForm({
        ...requestForm,
        specialRequirements: [...requestForm.specialRequirements, requirementId]
      });
    } else {
      setRequestForm({
        ...requestForm,
        specialRequirements: requestForm.specialRequirements.filter(id => id !== requirementId)
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!requestForm.bloodType) newErrors.bloodType = "Blood type is required";
    if (!requestForm.units || requestForm.units < 1) newErrors.units = "At least 1 unit is required";
    if (!requestForm.urgency) newErrors.urgency = "Urgency level is required";
    if (!requestForm.neededBy) newErrors.neededBy = "Needed by date is required";
    
    if (requestForm.patientAge && (isNaN(Number(requestForm.patientAge)) || Number(requestForm.patientAge) < 0)) {
      newErrors.patientAge = "Age must be a positive number";
    }
    
    if (requestForm.patientWeight && (isNaN(Number(requestForm.patientWeight)) || Number(requestForm.patientWeight) < 0)) {
      newErrors.patientWeight = "Weight must be a positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const today = new Date();
      const neededByDate = new Date(requestForm.neededBy);
      
      const newRequest: Partial<BloodRequest> = {
        bloodType: requestForm.bloodType,
        hospital: "City General Hospital",
        urgency: requestForm.urgency as 'routine' | 'urgent' | 'critical',
        units: Number(requestForm.units),
        neededBy: neededByDate,
        patientAge: requestForm.patientAge ? Number(requestForm.patientAge) : 0,
        patientWeight: requestForm.patientWeight ? Number(requestForm.patientWeight) : 0,
        medicalCondition: requestForm.medicalCondition || "",
        specialRequirements: requestForm.specialRequirements.length > 0 ? requestForm.specialRequirements : undefined
      };
      
      const result = await mockDatabaseService.createBloodRequest(newRequest as any);
      
      if (result.success && result.request) {
        toast({
          title: "Request Created",
          description: "Your blood request has been created successfully. Running AI matching...",
        });
        
        setIsLoadingMatches(true);
        await runAiMatching({ id: result.request.id });
        setIsLoadingMatches(false);
        
        setActiveTab('matching-results');
      }
      
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: "Failed to create blood request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleContactHospital = async (match: AiMatch) => {
    try {
      await contactHospital(match.donorId, match.requestId);
      
      toast({
        title: "Hospital Contacted",
        description: `${match.hospitalName} has been notified about your blood request.`,
      });
    } catch (error) {
      console.error("Error contacting hospital:", error);
      toast({
        title: "Contact Failed",
        description: "Failed to contact the hospital. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const formatCompatibilityDisplay = (score: number) => {
    if (score >= 95) return "Universal Donor";
    if (score === 100) return "Perfect Match";
    if (score >= 90) return "Compatible";
    if (score >= 80) return "Compatible (Emergency Only)";
    if (score > 0) return "Marginally Compatible";
    return "Not Compatible";
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-100 to-red-50">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-medium">BloodBankAI Matching Engine</h3>
        </div>
        <CardDescription>
          Our advanced AI algorithm matches blood requirements with available inventory across hospital networks.
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-6">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="create-request">Create Blood Request</TabsTrigger>
            <TabsTrigger value="matching-results">Matching Results</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="create-request">
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type Required <span className="text-red-500">*</span></Label>
                  <Select
                    value={requestForm.bloodType}
                    onValueChange={(value) => setRequestForm({...requestForm, bloodType: value})}
                  >
                    <SelectTrigger id="bloodType" className={errors.bloodType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Blood Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <DropletIcon className="h-4 w-4 mr-2 text-red-600" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bloodType && <p className="text-sm text-red-500">{errors.bloodType}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="units">Units Required <span className="text-red-500">*</span></Label>
                  <Input 
                    id="units"
                    type="number"
                    min="1"
                    value={requestForm.units}
                    onChange={(e) => setRequestForm({...requestForm, units: parseInt(e.target.value) || 1})}
                    className={errors.units ? "border-red-500" : ""}
                  />
                  {errors.units && <p className="text-sm text-red-500">{errors.units}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency <span className="text-red-500">*</span></Label>
                  <Select
                    value={requestForm.urgency}
                    onValueChange={(value) => setRequestForm({...requestForm, urgency: value})}
                  >
                    <SelectTrigger id="urgency" className={errors.urgency ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Urgency Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                          <span>Critical (Within 24 hours)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-amber-600" />
                          <span>Urgent (Within 48 hours)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="routine">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          <span>Routine (Within 7 days)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.urgency && <p className="text-sm text-red-500">{errors.urgency}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="neededBy">Needed By <span className="text-red-500">*</span></Label>
                  <Input 
                    id="neededBy"
                    type="date"
                    value={requestForm.neededBy}
                    onChange={(e) => setRequestForm({...requestForm, neededBy: e.target.value})}
                    className={errors.neededBy ? "border-red-500" : ""}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.neededBy && <p className="text-sm text-red-500">{errors.neededBy}</p>}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-semibold mb-4">Additional Patient Information (Improves AI Matching)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="patientAge">Patient Age</Label>
                    <Input 
                      id="patientAge"
                      type="number"
                      placeholder="Optional"
                      value={requestForm.patientAge}
                      onChange={(e) => setRequestForm({...requestForm, patientAge: e.target.value})}
                      className={errors.patientAge ? "border-red-500" : ""}
                    />
                    {errors.patientAge && <p className="text-sm text-red-500">{errors.patientAge}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patientWeight">Patient Weight (kg)</Label>
                    <Input 
                      id="patientWeight"
                      type="number"
                      placeholder="Optional"
                      value={requestForm.patientWeight}
                      onChange={(e) => setRequestForm({...requestForm, patientWeight: e.target.value})}
                      className={errors.patientWeight ? "border-red-500" : ""}
                    />
                    {errors.patientWeight && <p className="text-sm text-red-500">{errors.patientWeight}</p>}
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <Label htmlFor="medicalCondition">Medical Condition</Label>
                  <Textarea 
                    id="medicalCondition"
                    placeholder="Brief description of medical condition requiring transfusion (optional)"
                    value={requestForm.medicalCondition}
                    onChange={(e) => setRequestForm({...requestForm, medicalCondition: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Special Requirements</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {specialRequirements.map((requirement) => (
                      <div key={requirement.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={requirement.id}
                          checked={requestForm.specialRequirements.includes(requirement.id)}
                          onCheckedChange={(checked) => 
                            handleSpecialRequirementsChange(requirement.id, checked === true)
                          }
                        />
                        <label
                          htmlFor={requirement.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {requirement.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex gap-2 items-center mb-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-700">AI Matching Benefits</h4>
                </div>
                <p className="text-sm text-purple-700">
                  Our AI considers blood type compatibility, Rh factor, special requirements, and hospital proximity to find the best matches.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Create Blood Request & Run AI Matching
                </Button>
              </div>
            </form>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="matching-results">
          <CardContent className="pt-6 pb-2">
            {isMatching && <p>Finding best matches...</p> ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-purple-600 mx-auto animate-pulse mb-4" />
                <h3 className="text-lg font-medium mb-2">AI Matching In Progress</h3>
                <p className="text-gray-600 mb-6">Finding optimal blood matches based on compatibility and availability...</p>
                <Progress value={65} className="w-2/3 mx-auto" />
              </div>
            ) : matches.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    AI Found {matches.length} Potential Matches
                  </h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" />
                    <span>Sorted by compatibility</span>
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {matches.map((match) => (
                    <Card key={`${match.donorId}-${match.requestId}`} className="overflow-hidden">
                      <div className={`flex items-center px-4 py-2 
                        ${match.compatibilityScore === 100 ? 'bg-green-50 border-b border-green-100' :
                         match.compatibilityScore >= 90 ? 'bg-blue-50 border-b border-blue-100' : 
                         'bg-amber-50 border-b border-amber-100'}`}
                      >
                        <Hospital className="h-5 w-5 text-slate-600 mr-2" />
                        <h4 className="font-medium">{match.hospitalName}</h4>
                        <div className="ml-auto flex items-center gap-2">
                          <Badge 
                            variant={match.compatibilityScore === 100 ? 'default' : 
                                   match.compatibilityScore >= 90 ? 'secondary' : 'outline'}
                            className={match.compatibilityScore === 100 ? 'bg-green-600' : 
                                     match.compatibilityScore >= 90 ? 'bg-blue-600' : ''}
                          >
                            {formatCompatibilityDisplay(match.compatibilityScore || 0)}
                          </Badge>
                          <Badge variant="outline">
                            {match.matchScore}% Match
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Blood Available</p>
                            <div className="flex items-center">
                              <DropletIcon className="h-5 w-5 text-red-600 mr-2" />
                              <span className="font-medium">
                                {match.bloodType} {match.bloodRhFactor === 'positive' ? 'Rh+ ('+match.bloodType+'+)' : 'Rh- ('+match.bloodType+'-)'} · {match.availableUnits} units
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Distance</p>
                            <div className="flex items-center">
                              <MapPin className="h-5 w-5 text-slate-600 mr-2" />
                              <span>{match.distance.toFixed(1)} km away</span>
                            </div>
                          </div>
                          
                          {match.specialAttributes && match.specialAttributes.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Special Attributes</p>
                              <div className="flex flex-wrap gap-1">
                                {match.specialAttributes.map((attr) => (
                                  <Badge key={attr} variant="outline" className="capitalize">
                                    {attr.replace('-', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex justify-between items-center py-3 border-t bg-gray-50">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-600"
                          onClick={() => deleteMatch(`${match.donorId}-${match.requestId}`)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hide Match
                        </Button>
                        <Button 
                          onClick={() => handleContactHospital(match)} 
                          disabled={match.status !== 'potential'}
                          className="flex items-center gap-1"
                        >
                          {match.status === 'contacted' ? (
                            <>Request Sent</>
                          ) : (
                            <>
                              Contact Hospital <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Matches Found</h3>
                <p className="text-gray-600 mb-4">Create a blood request to find potential matches from partner hospitals.</p>
                <Button 
                  onClick={() => setActiveTab('create-request')} 
                  variant="outline"
                >
                  Create Blood Request
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AiBloodMatchingSystem;
