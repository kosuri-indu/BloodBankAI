
import mockDatabaseService from './mockDatabase';
import { useAiMatching } from '@/hooks/useAiMatching';

class AutoMatchingService {
  private static instance: AutoMatchingService;
  private matchingInProgress = new Set<string>();

  static getInstance(): AutoMatchingService {
    if (!AutoMatchingService.instance) {
      AutoMatchingService.instance = new AutoMatchingService();
    }
    return AutoMatchingService.instance;
  }

  async processNewRequest(requestId: string) {
    if (this.matchingInProgress.has(requestId)) {
      return; // Already processing this request
    }

    this.matchingInProgress.add(requestId);

    try {
      console.log(`🤖 Auto-processing new blood request: ${requestId}`);
      
      // Get the request details
      const requests = await mockDatabaseService.getBloodRequests();
      const request = requests.find(req => req.id === requestId);
      
      if (!request) {
        console.error('Request not found for auto-matching:', requestId);
        return;
      }

      // Auto-trigger AI matching after a short delay
      setTimeout(async () => {
        try {
          // We need to simulate the AI matching process here
          // since we can't directly use the hook outside of a component
          const inventory = await mockDatabaseService.getBloodInventoryDetails();
          const hospitals = await mockDatabaseService.getRegisteredHospitals();
          
          // Simple matching logic - find compatible blood types
          const compatibleInventory = inventory.filter(inv => {
            const donorBloodType = `${inv.bloodType} ${inv.rhFactor === 'positive' ? 'Rh+ (' + inv.bloodType + '+)' : 'Rh- (' + inv.bloodType + '-)'}`;
            return donorBloodType === request.bloodType && inv.units > 0;
          });

          if (compatibleInventory.length > 0) {
            // Calculate a match percentage based on available units and age compatibility
            const bestMatch = compatibleInventory.reduce((best, current) => {
              const ageDiff = Math.abs(current.donorAge - request.patientAge);
              const ageScore = Math.max(0, 100 - (ageDiff * 2));
              const unitsScore = Math.min(100, (current.units / request.units) * 100);
              const totalScore = (ageScore + unitsScore) / 2;
              
              return totalScore > best.score ? { inventory: current, score: totalScore } : best;
            }, { inventory: compatibleInventory[0], score: 0 });

            // Update the request with match percentage
            await mockDatabaseService.updateBloodRequest(requestId, {
              matchPercentage: Math.round(bestMatch.score)
            });

            console.log(`✅ Auto-matching complete for ${requestId}: ${Math.round(bestMatch.score)}% match`);
          } else {
            console.log(`❌ No compatible matches found for ${requestId}`);
          }
        } catch (error) {
          console.error('Error in auto-matching:', error);
        } finally {
          this.matchingInProgress.delete(requestId);
        }
      }, 2000); // 2 second delay to simulate processing

    } catch (error) {
      console.error('Error processing new request:', error);
      this.matchingInProgress.delete(requestId);
    }
  }

  async processNewInventory(hospitalName: string) {
    try {
      console.log(`📦 Auto-processing new inventory from: ${hospitalName}`);
      
      // Check if there are any pending requests that could now be fulfilled
      const requests = await mockDatabaseService.getBloodRequests();
      const pendingRequests = requests.filter(req => req.matchPercentage < 70);
      
      // Re-process pending requests
      for (const request of pendingRequests) {
        await this.processNewRequest(request.id);
      }
      
    } catch (error) {
      console.error('Error processing new inventory:', error);
    }
  }
}

export const autoMatchingService = AutoMatchingService.getInstance();
