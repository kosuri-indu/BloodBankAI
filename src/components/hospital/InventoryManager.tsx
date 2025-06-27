import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import mockDatabaseService, { BloodInventory } from '@/services/mockDatabase';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

const InventoryManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<BloodInventory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    bloodType: '',
    rhFactor: 'positive' as 'positive' | 'negative',
    units: 0,
    expirationDate: '',
    donorAge: 0,
    specialAttributes: [] as string[]
  });

  const fetchInventory = async () => {
    try {
      if (!currentUser?.id || !currentUser?.hospitalName) {
        console.log('🚫 No current user or hospital name available - clearing inventory');
        setInventory([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      console.log('🔍 Fetching inventory for hospital ID:', currentUser.id, 'name:', currentUser.hospitalName);
      
      // CRITICAL: Use hospital ID for strict data isolation
      const data = await mockDatabaseService.getHospitalBloodInventoryById(currentUser.id);
      
      // Double verification - ensure all inventory belongs to this hospital
      const verifiedData = data.filter(item => item.hospitalId === currentUser.id);
      
      setInventory(verifiedData);
      console.log('✅ Inventory fetched and verified:', verifiedData.length, 'items for hospital', currentUser.hospitalName);
    } catch (error) {
      console.error('❌ Error fetching inventory:', error);
      setInventory([]);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL: Clear inventory immediately when user changes and fetch new data
  useEffect(() => {
    console.log('👤 User changed in InventoryManager - clearing and fetching for:', currentUser?.hospitalName, 'ID:', currentUser?.id);
    
    // Immediately clear inventory to prevent showing old data
    setInventory([]);
    
    if (currentUser?.id) {
      fetchInventory();
    } else {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('📡 Data refresh event received - refreshing inventory for:', currentUser?.hospitalName);
      if (currentUser?.id) {
        fetchInventory();
      }
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, [currentUser?.id]);

  const resetForm = () => {
    setFormData({
      bloodType: '',
      rhFactor: 'positive',
      units: 0,
      expirationDate: '',
      donorAge: 0,
      specialAttributes: []
    });
  };

  const handleAdd = async () => {
    try {
      if (!currentUser?.hospitalName) {
        toast({
          title: "Error",
          description: "No hospital information available.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.bloodType || !formData.expirationDate || formData.units <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields with valid values.",
          variant: "destructive",
        });
        return;
      }

      console.log('➕ Adding inventory for hospital:', currentUser.hospitalName, 'ID:', currentUser.id);

      await mockDatabaseService.addBloodInventory(currentUser.hospitalName, {
        bloodType: formData.bloodType,
        rhFactor: formData.rhFactor,
        units: formData.units,
        expirationDate: new Date(formData.expirationDate),
        processedDate: new Date(),
        donorAge: formData.donorAge,
        specialAttributes: formData.specialAttributes
      });

      toast({
        title: "Success",
        description: "Blood inventory added successfully.",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('❌ Error adding inventory:', error);
      toast({
        title: "Error",
        description: "Failed to add blood inventory.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!editingItem) return;

      const result = await mockDatabaseService.updateBloodInventory(editingItem.id, {
        bloodType: formData.bloodType,
        rhFactor: formData.rhFactor,
        units: formData.units,
        expirationDate: new Date(formData.expirationDate),
        donorAge: formData.donorAge,
        specialAttributes: formData.specialAttributes
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Blood inventory updated successfully.",
        });
        setIsEditDialogOpen(false);
        setEditingItem(null);
        resetForm();
        fetchInventory();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update inventory.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update blood inventory.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      console.log('🗑️ Deleting inventory item:', itemId);
      
      const result = await mockDatabaseService.deleteBloodInventory(itemId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Blood inventory deleted successfully.",
        });
        fetchInventory();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete inventory.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting inventory:', error);
      toast({
        title: "Error",
        description: "Failed to delete blood inventory.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: BloodInventory) => {
    setEditingItem(item);
    setFormData({
      bloodType: item.bloodType,
      rhFactor: item.rhFactor as 'positive' | 'negative',
      units: item.units,
      expirationDate: format(new Date(item.expirationDate), 'yyyy-MM-dd'),
      donorAge: item.donorAge,
      specialAttributes: item.specialAttributes || []
    });
    setIsEditDialogOpen(true);
  };

  const formatBloodType = (bloodType: string, rhFactor: string) => {
    return `${bloodType} ${rhFactor === 'positive' ? '+' : '-'}`;
  };

  const getExpiryStatus = (expirationDate: Date) => {
    const daysLeft = Math.ceil((new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { color: 'bg-red-500', text: 'Expired' };
    if (daysLeft <= 7) return { color: 'bg-red-500', text: `${daysLeft}d left` };
    if (daysLeft <= 14) return { color: 'bg-amber-500', text: `${daysLeft}d left` };
    return { color: 'bg-green-500', text: `${daysLeft}d left` };
  };

  if (!currentUser?.hospitalName) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p>Please log in as a hospital to manage inventory.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Blood Inventory Management - {currentUser.hospitalName}</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Blood Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Blood Inventory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rhFactor">Rh Factor</Label>
                  <Select value={formData.rhFactor} onValueChange={(value) => setFormData({...formData, rhFactor: value as 'positive' | 'negative'})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive (+)</SelectItem>
                      <SelectItem value="negative">Negative (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="units">Units</Label>
                  <Input
                    type="number"
                    value={formData.units}
                    onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 0})}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="donorAge">Donor Age</Label>
                  <Input
                    type="number"
                    value={formData.donorAge}
                    onChange={(e) => setFormData({...formData, donorAge: parseInt(e.target.value) || 0})}
                    min="18"
                    max="65"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd}>Add Inventory</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading inventory...</div>
        ) : inventory.length > 0 ? (
          <div className="space-y-3">
            {inventory.map((item) => {
              const expiryStatus = getExpiryStatus(item.expirationDate);
              return (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="font-semibold text-lg">
                      {formatBloodType(item.bloodType, item.rhFactor)}
                    </div>
                    <div className="text-gray-600">
                      {item.units} units
                    </div>
                    <Badge className={expiryStatus.color}>
                      {expiryStatus.text}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      Donor: {item.donorAge}y
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-600">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">No blood inventory</p>
            <p className="text-sm text-gray-500">Add blood units to start managing your inventory.</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Blood Inventory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select value={formData.bloodType} onValueChange={(value) => setFormData({...formData, bloodType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="rhFactor">Rh Factor</Label>
                <Select value={formData.rhFactor} onValueChange={(value) => setFormData({...formData, rhFactor: value as 'positive' | 'negative'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive (+)</SelectItem>
                    <SelectItem value="negative">Negative (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="units">Units</Label>
                <Input
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({...formData, units: parseInt(e.target.value) || 0})}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="donorAge">Donor Age</Label>
                <Input
                  type="number"
                  value={formData.donorAge}
                  onChange={(e) => setFormData({...formData, donorAge: parseInt(e.target.value) || 0})}
                  min="18"
                  max="65"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit}>Update Inventory</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default InventoryManager;
