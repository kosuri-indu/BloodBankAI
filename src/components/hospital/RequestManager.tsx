
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit, Plus, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import mockDatabaseService, { BloodRequest } from '@/services/mockDatabase';
import { format } from 'date-fns';

interface RequestManagerProps {
  hospitalName: string;
}

const RequestManager: React.FC<RequestManagerProps> = ({ hospitalName }) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<BloodRequest | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    bloodType: '',
    units: 0,
    patientAge: 0,
    patientWeight: 0,
    medicalCondition: '',
    urgency: 'routine' as 'routine' | 'urgent' | 'critical',
    neededBy: '',
    specialRequirements: [] as string[]
  });

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const data = await mockDatabaseService.getHospitalBloodRequests(hospitalName);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch request data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [hospitalName]);

  const resetForm = () => {
    setFormData({
      bloodType: '',
      units: 0,
      patientAge: 0,
      patientWeight: 0,
      medicalCondition: '',
      urgency: 'routine',
      neededBy: '',
      specialRequirements: []
    });
  };

  const handleAdd = async () => {
    try {
      if (!formData.bloodType || !formData.medicalCondition || !formData.neededBy || formData.units <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields with valid values.",
          variant: "destructive",
        });
        return;
      }

      await mockDatabaseService.addBloodRequest(hospitalName, {
        bloodType: formData.bloodType,
        units: formData.units,
        patientAge: formData.patientAge,
        patientWeight: formData.patientWeight,
        medicalCondition: formData.medicalCondition,
        urgency: formData.urgency,
        neededBy: new Date(formData.neededBy),
        specialRequirements: formData.specialRequirements
      });

      toast({
        title: "Success",
        description: "Blood request submitted successfully.",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchRequests();
    } catch (error) {
      console.error('Error adding request:', error);
      toast({
        title: "Error",
        description: "Failed to submit blood request.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!editingRequest) return;

      const result = await mockDatabaseService.updateBloodRequest(editingRequest.id, {
        bloodType: formData.bloodType,
        units: formData.units,
        patientAge: formData.patientAge,
        patientWeight: formData.patientWeight,
        medicalCondition: formData.medicalCondition,
        urgency: formData.urgency,
        neededBy: new Date(formData.neededBy),
        specialRequirements: formData.specialRequirements
      });

      if (result) {
        toast({
          title: "Success",
          description: "Blood request updated successfully.",
        });
        setIsEditDialogOpen(false);
        setEditingRequest(null);
        resetForm();
        fetchRequests();
      } else {
        toast({
          title: "Error",
          description: "Failed to update request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update blood request.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      const result = await mockDatabaseService.deleteBloodRequest(requestId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Blood request deleted successfully.",
        });
        fetchRequests();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete request.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete blood request.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (request: BloodRequest) => {
    setEditingRequest(request);
    setFormData({
      bloodType: request.bloodType,
      units: request.units,
      patientAge: request.patientAge,
      patientWeight: request.patientWeight,
      medicalCondition: request.medicalCondition,
      urgency: request.urgency,
      neededBy: format(new Date(request.neededBy), 'yyyy-MM-dd\'T\'HH:mm'),
      specialRequirements: request.specialRequirements || []
    });
    setIsEditDialogOpen(true);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'urgent': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  const getTimeRemaining = (neededBy: Date) => {
    const now = new Date();
    const deadline = new Date(neededBy);
    const diffInHours = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffInHours <= 24) return { text: `${diffInHours}h left`, color: 'text-red-600' };
    if (diffInHours <= 72) return { text: `${Math.ceil(diffInHours / 24)}d left`, color: 'text-amber-600' };
    return { text: `${Math.ceil(diffInHours / 24)}d left`, color: 'text-green-600' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Blood Request Management</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Blood Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="units">Units Needed</Label>
                  <Input
                    type="number"
                    value={formData.units}
                    onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 0})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={formData.urgency} onValueChange={(value: any) => setFormData({...formData, urgency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="neededBy">Needed By</Label>
                  <Input
                    type="datetime-local"
                    value={formData.neededBy}
                    onChange={(e) => setFormData({...formData, neededBy: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="patientAge">Patient Age</Label>
                  <Input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({...formData, patientAge: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="patientWeight">Patient Weight (kg)</Label>
                  <Input
                    type="number"
                    value={formData.patientWeight}
                    onChange={(e) => setFormData({...formData, patientWeight: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="medicalCondition">Medical Condition</Label>
                  <Textarea
                    value={formData.medicalCondition}
                    onChange={(e) => setFormData({...formData, medicalCondition: e.target.value})}
                    placeholder="Describe the medical condition requiring blood transfusion"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd}>Create Request</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading requests...</div>
        ) : requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map((request) => {
              const timeRemaining = getTimeRemaining(request.neededBy);
              return (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="font-semibold text-lg">
                        {request.bloodType} • {request.units} units
                      </div>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency.toUpperCase()}
                      </Badge>
                      {request.matchPercentage > 0 && (
                        <Badge variant="outline" className="bg-green-50">
                          {request.matchPercentage}% Matched
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(request)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Patient:</span> {request.patientAge}y, {request.patientWeight}kg
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Condition:</span> {request.medicalCondition}
                      </p>
                    </div>
                    <div>
                      <p className={`flex items-center ${timeRemaining.color}`}>
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="font-medium">Deadline:</span> {timeRemaining.text}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Created:</span> {format(new Date(request.createdAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-600">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">No blood requests</p>
            <p className="text-sm text-gray-500">Create a blood request to get started.</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Blood Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="units">Units Needed</Label>
                <Input
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 0})}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={formData.urgency} onValueChange={(value: any) => setFormData({...formData, urgency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="neededBy">Needed By</Label>
                <Input
                  type="datetime-local"
                  value={formData.neededBy}
                  onChange={(e) => setFormData({...formData, neededBy: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="patientAge">Patient Age</Label>
                <Input
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => setFormData({...formData, patientAge: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="patientWeight">Patient Weight (kg)</Label>
                <Input
                  type="number"
                  value={formData.patientWeight}
                  onChange={(e) => setFormData({...formData, patientWeight: parseInt(e.target.value) || 0})}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="medicalCondition">Medical Condition</Label>
                <Textarea
                  value={formData.medicalCondition}
                  onChange={(e) => setFormData({...formData, medicalCondition: e.target.value})}
                  placeholder="Describe the medical condition requiring blood transfusion"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit}>Update Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RequestManager;
