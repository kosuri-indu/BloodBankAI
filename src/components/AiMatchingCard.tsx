
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, AlertCircle, UserCheck, MapPin, Clock, Filter } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BloodRequest {
  id: string;
  bloodType: string;
  hospital: string;
  urgency: 'critical' | 'urgent' | 'standard';
  distance: number;
  timeNeeded: string;
  matchPercentage: number;
  donorCount?: number;
  geneticFactors?: string[];
  medicalHistory?: string[];
}

interface AiMatchingCardProps {
  requests: BloodRequest[];
  isHospital?: boolean;
}

const AiMatchingCard: React.FC<AiMatchingCardProps> = ({ requests, isHospital = false }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">
          <div className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-500" />
            {isHospital ? "BloodBankAI Smart Matching System" : "AI Matched Requests"}
          </div>
        </CardTitle>
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Smart Matching
        </Badge>
      </CardHeader>
      <CardContent>
        {isHospital ? (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <h3 className="font-medium mb-2">BloodBankAI Match Parameters</h3>
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Distance Priority</span>
                    <span className="text-xs text-gray-500">High</span>
                  </div>
                  <Slider defaultValue={[75]} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Genetic Match Priority</span>
                    <span className="text-xs text-gray-500">Medium</span>
                  </div>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Historical Donation Quality</span>
                    <span className="text-xs text-gray-500">Medium</span>
                  </div>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
              </div>
              <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Apply AI Parameters
              </Button>
            </div>

            <Tabs defaultValue="potential" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="potential">Potential Donors</TabsTrigger>
                <TabsTrigger value="matched">Matched Donors</TabsTrigger>
              </TabsList>
              
              <TabsContent value="potential" className="space-y-3 mt-2">
                <div className="p-3 bg-white border rounded-lg shadow-sm relative">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600">Match: 97%</Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Rajesh Kumar</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserCheck className="mr-1 h-4 w-4 text-blue-500" />
                        <span>O Rh+ (O+) • 3 previous donations</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="mr-1 h-4 w-4 text-blue-500" />
                        <span>3.2km away</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Contact</Button>
                  </div>
                </div>
                
                <div className="p-3 bg-white border rounded-lg shadow-sm relative">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600">Match: 94%</Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Priya Singh</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserCheck className="mr-1 h-4 w-4 text-blue-500" />
                        <span>O Rh+ (O+) • 5 previous donations</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="mr-1 h-4 w-4 text-blue-500" />
                        <span>4.8km away</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Contact</Button>
                  </div>
                </div>
                
                <div className="p-3 bg-white border rounded-lg shadow-sm relative">
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-600">Match: 89%</Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Amit Sharma</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserCheck className="mr-1 h-4 w-4 text-blue-500" />
                        <span>O Rh- (O-) • 1 previous donation</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <MapPin className="mr-1 h-4 w-4 text-blue-500" />
                        <span>2.5km away</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Contact</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="matched" className="space-y-3 mt-2">
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg shadow-sm relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <p className="font-semibold">Neha Patel</p>
                        <Badge className="ml-2 bg-green-600">Confirmed</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserCheck className="mr-1 h-4 w-4 text-green-500" />
                        <span>AB Rh+ (AB+) • Appointment: Today, 4:00 PM</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="mr-1 h-4 w-4 text-green-500" />
                        <span>ETA: 35 minutes</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-green-500 text-green-700">Details</Button>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg shadow-sm relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <p className="font-semibold">Rahul Gupta</p>
                        <Badge className="ml-2 bg-amber-600">In Transit</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserCheck className="mr-1 h-4 w-4 text-amber-500" />
                        <span>O Rh+ (O+) • Appointment: Today, 5:30 PM</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="mr-1 h-4 w-4 text-amber-500" />
                        <span>ETA: 55 minutes</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-amber-500 text-amber-700">Details</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-md relative ${
                  request.urgency === 'critical' ? 'bg-red-50 border-red-200' :
                  request.urgency === 'urgent' ? 'bg-amber-50 border-amber-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="absolute top-2 right-2">
                  <Badge className={`${
                    request.matchPercentage > 90 ? 'bg-green-600' :
                    request.matchPercentage > 70 ? 'bg-amber-600' :
                    'bg-blue-600'
                  }`}>
                    Match: {request.matchPercentage}%
                  </Badge>
                </div>
                
                <p className="font-semibold">Blood Type: {request.bloodType}</p>
                <p className="text-sm text-gray-600">{request.hospital} - {request.distance}km away</p>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-xs text-gray-500">
                    <AlertCircle size={14} className={`mr-1 ${
                      request.urgency === 'critical' ? 'text-red-500' :
                      request.urgency === 'urgent' ? 'text-amber-500' :
                      'text-blue-500'
                    }`} />
                    <span>{request.timeNeeded}</span>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">Respond</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiMatchingCard;
