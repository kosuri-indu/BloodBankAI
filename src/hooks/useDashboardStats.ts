
import { useState, useEffect } from 'react';
import mockDatabaseService, { BloodInventory, BloodRequest } from '@/services/mockDatabase';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  totalBloodUnits: number;
  aiMatches: number;
  partnerHospitals: number;
  criticalRequests: number;
  lowStockTypes: string[];
  expiringUnits: number;
}

export function useDashboardStats() {
  const { currentUser, userType } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBloodUnits: 0,
    aiMatches: 0,
    partnerHospitals: 0,
    criticalRequests: 0,
    lowStockTypes: [],
    expiringUnits: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = async () => {
    try {
      setIsLoading(true);
      
      // CRITICAL: Reset stats to empty state first to ensure clean slate
      setStats({
        totalBloodUnits: 0,
        aiMatches: 0,
        partnerHospitals: 0,
        criticalRequests: 0,
        lowStockTypes: [],
        expiringUnits: 0
      });
      
      if (!currentUser?.id) {
        console.log('🚫 No current user - resetting stats to empty');
        setIsLoading(false);
        return;
      }
      
      let inventory: BloodInventory[];
      let requests: BloodRequest[];
      
      if (userType === 'hospital' && currentUser?.id) {
        // CRITICAL: Hospital-specific stats using hospital ID for complete data isolation
        console.log('🔒 Fetching ISOLATED stats for hospital ID:', currentUser.id, 'hospital name:', currentUser.hospitalName);
        [inventory, requests] = await Promise.all([
          mockDatabaseService.getHospitalBloodInventoryById(currentUser.id),
          mockDatabaseService.getHospitalBloodRequestsById(currentUser.id),
        ]);
        
        // Triple-check data isolation - ensure we only get data for THIS hospital
        const filteredInventory = inventory.filter(inv => inv.hospitalId === currentUser.id);
        const filteredRequests = requests.filter(req => req.hospitalId === currentUser.id);
        
        console.log(`🔒 Data isolation verified for ${currentUser.hospitalName}: ${filteredInventory.length} inventory items, ${filteredRequests.length} requests`);
        
        inventory = filteredInventory;
        requests = filteredRequests;
      } else {
        // System-wide stats for government or fallback
        [inventory, requests] = await Promise.all([
          mockDatabaseService.getBloodInventoryDetails(),
          mockDatabaseService.getBloodRequests(),
        ]);
      }
      
      const hospitals = await mockDatabaseService.getRegisteredHospitals();

      // Calculate total blood units
      const totalBloodUnits = inventory.reduce((sum, item) => sum + item.units, 0);

      // Calculate AI matches (requests with high match percentages)
      const aiMatches = requests.filter(req => req.matchPercentage > 70).length;

      // Count partner hospitals
      const partnerHospitals = hospitals.length;

      // Count critical requests
      const criticalRequests = requests.filter(req => req.urgency === 'critical').length;

      // Find low stock blood types
      const lowStockThreshold = userType === 'hospital' ? 10 : 20;
      const bloodTypeStock = inventory.reduce((acc, item) => {
        const bloodType = `${item.bloodType} ${item.rhFactor === 'positive' ? '+' : '-'}`;
        acc[bloodType] = (acc[bloodType] || 0) + item.units;
        return acc;
      }, {} as Record<string, number>);

      const lowStockTypes = Object.entries(bloodTypeStock)
        .filter(([, units]) => units < lowStockThreshold)
        .map(([type]) => type);

      // Calculate expiring units (within 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const expiringUnits = inventory
        .filter(item => new Date(item.expirationDate) <= sevenDaysFromNow)
        .reduce((sum, item) => sum + item.units, 0);

      const newStats = {
        totalBloodUnits,
        aiMatches,
        partnerHospitals,
        criticalRequests,
        lowStockTypes,
        expiringUnits
      };

      console.log('📊 Dashboard stats updated for hospital:', currentUser?.hospitalName, 'ID:', currentUser?.id, newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Reset to empty stats on error
      setStats({
        totalBloodUnits: 0,
        aiMatches: 0,
        partnerHospitals: 0,
        criticalRequests: 0,
        lowStockTypes: [],
        expiringUnits: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL: Clear stats immediately when user changes
  useEffect(() => {
    console.log('👤 User changed - clearing stats and refreshing for:', currentUser?.hospitalName, 'ID:', currentUser?.id);
    
    // Immediately reset stats to prevent showing old data
    setStats({
      totalBloodUnits: 0,
      aiMatches: 0,
      partnerHospitals: 0,
      criticalRequests: 0,
      lowStockTypes: [],
      expiringUnits: 0
    });
    
    if (currentUser?.id) {
      console.log('🔄 Dashboard stats refresh triggered for hospital:', currentUser.hospitalName, 'ID:', currentUser.id);
      refreshStats();
    } else {
      console.log('🚫 No user - keeping empty stats');
      setIsLoading(false);
    }
  }, [currentUser?.id, userType]);

  useEffect(() => {
    const handleDataRefresh = () => {
      if (currentUser?.id) {
        console.log('📡 Data refresh event received - refreshing stats for hospital:', currentUser.hospitalName);
        refreshStats();
      }
    };

    window.addEventListener('dataRefresh', handleDataRefresh);
    return () => window.removeEventListener('dataRefresh', handleDataRefresh);
  }, [currentUser?.id, userType]);

  return {
    stats,
    isLoading,
    refreshStats
  };
}
