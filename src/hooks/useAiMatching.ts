
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import mockDatabaseService, { AiMatch, BloodRequest, BloodInventory } from '@/services/mockDatabase';

// Blood compatibility chart - defining which blood types can donate to which recipients
const bloodCompatibility = {
  'A Rh+ (A+)': ['A Rh+ (A+)', 'AB Rh+ (AB+)'],
  'A Rh- (A-)': ['A Rh+ (A+)', 'A Rh- (A-)', 'AB Rh+ (AB+)', 'AB Rh- (AB-)'],
  'B Rh+ (B+)': ['B Rh+ (B+)', 'AB Rh+ (AB+)'],
  'B Rh- (B-)': ['B Rh+ (B+)', 'B Rh- (B-)', 'AB Rh+ (AB+)', 'AB Rh- (AB-)'],
  'AB Rh+ (AB+)': ['AB Rh+ (AB+)'],
  'AB Rh- (AB-)': ['AB Rh+ (AB+)', 'AB Rh- (AB-)'],
  'O Rh+ (O+)': ['A Rh+ (A+)', 'B Rh+ (B+)', 'AB Rh+ (AB+)', 'O Rh+ (O+)'],
  'O Rh- (O-)': ['A Rh+ (A+)', 'A Rh- (A-)', 'B Rh+ (B+)', 'B Rh- (B-)', 'AB Rh+ (AB+)', 'AB Rh- (AB-)', 'O Rh+ (O+)', 'O Rh- (O-)'],
};

// Function to calculate blood compatibility score
const calculateBloodCompatibilityScore = (donorBloodType: string, recipientBloodType: string): number => {
  // Perfect match - same blood type
  if (donorBloodType === recipientBloodType) {
    return 100;
  }
  
  // Check if donor can donate to recipient
  if (bloodCompatibility[donorBloodType]?.includes(recipientBloodType)) {
    // Universal donor (O-) gets a high score but not 100 (reserve 100 for exact matches)
    if (donorBloodType === 'O Rh- (O-)') {
      return 95;
    }
    // Other compatible types get a good score
    return 90;
  }
  
  // Not compatible
  return 0;
}

// Function to calculate age compatibility score
const calculateAgeCompatibilityScore = (donorAge: number, patientAge: number): number => {
  const ageDifference = Math.abs(donorAge - patientAge);
  
  // Perfect age match (same age)
  if (ageDifference === 0) {
    return 100;
  }
  
  // Within 10 years - excellent match
  if (ageDifference <= 10) {
    return 90 - (ageDifference * 2); // 90% for 1 year diff, 70% for 10 years diff
  }
  
  // Within 20 years - good match
  if (ageDifference <= 20) {
    return 70 - (ageDifference - 10); // 60% for 20 years diff
  }
  
  // Within 30 years - acceptable match
  if (ageDifference <= 30) {
    return 50 - ((ageDifference - 20) * 2); // 30% for 30 years diff
  }
  
  // Too much age difference
  return 20;
}

// Function to calculate medical condition compatibility
const calculateMedicalCompatibilityScore = (donorAttributes: string[], patientCondition: string, specialRequirements: string[]): number => {
  let score = 80; // Base score
  
  // Check for special requirements match
  if (specialRequirements && specialRequirements.length > 0) {
    const matchedRequirements = specialRequirements.filter(req => 
      donorAttributes?.includes(req) || donorAttributes?.includes(req.replace('-', ' '))
    ).length;
    
    if (matchedRequirements === specialRequirements.length) {
      score = 100; // All requirements met
    } else if (matchedRequirements > 0) {
      score = 90; // Some requirements met
    } else {
      score = 40; // No special requirements met
    }
  }
  
  // Check for medical condition specific factors
  const medicalConditionLower = patientCondition.toLowerCase();
  
  if (medicalConditionLower.includes('cancer') || medicalConditionLower.includes('leukemia')) {
    // Cancer patients need high-quality blood
    if (donorAttributes?.includes('irradiated') || donorAttributes?.includes('leukoreduced')) {
      score += 10;
    }
  }
  
  if (medicalConditionLower.includes('pregnancy') || medicalConditionLower.includes('maternal')) {
    // Pregnant patients need CMV-negative blood
    if (donorAttributes?.includes('cmv-negative')) {
      score += 15;
    }
  }
  
  return Math.min(score, 100);
}

const formatBloodType = (bloodType: string, rhFactor: string) => {
  return `${bloodType} ${rhFactor === 'positive' ? `Rh+ (${bloodType}+)` : `Rh- (${bloodType}-)`}`;
};

export function useAiMatching() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [matches, setMatches] = useState<AiMatch[]>([]);
  const { toast } = useToast();

  const runAiMatching = async (request: BloodRequest | { id: string }) => {
    setIsProcessing(true);
    toast({
      title: "AI Blood Matching",
      description: "Analyzing blood inventory across all hospitals with medical compatibility factors...",
    });

    try {
      // Get actual inventory data for matching
      const inventory = await mockDatabaseService.getBloodInventoryDetails();
      const hospitals = await mockDatabaseService.getRegisteredHospitals();
      
      // Find the blood request
      const bloodRequests = await mockDatabaseService.getBloodRequests();
      const bloodRequest = bloodRequests.find(req => req.id === request.id);
      
      if (!bloodRequest) {
        throw new Error('Blood request not found');
      }

      console.log(`🤖 AI Matching for: ${bloodRequest.bloodType}, Patient Age: ${bloodRequest.patientAge}, Condition: ${bloodRequest.medicalCondition}`);

      // Create matches based on actual inventory with realistic medical criteria
      const potentialMatches: AiMatch[] = [];
      
      inventory.forEach(inv => {
        const hospital = hospitals.find(h => h.name === inv.hospital);
        if (!hospital || inv.units <= 0) return;
        
        const donorBloodType = formatBloodType(inv.bloodType, inv.rhFactor);
        
        // Calculate compatibility scores
        const bloodCompatibilityScore = calculateBloodCompatibilityScore(donorBloodType, bloodRequest.bloodType);
        const ageCompatibilityScore = calculateAgeCompatibilityScore(inv.donorAge, bloodRequest.patientAge);
        const medicalCompatibilityScore = calculateMedicalCompatibilityScore(
          inv.specialAttributes || [], 
          bloodRequest.medicalCondition,
          bloodRequest.specialRequirements || []
        );
        
        // Only include if blood type is compatible
        if (bloodCompatibilityScore > 0) {
          // Calculate distance (simulated based on hospital location)
          const distance = Math.floor(Math.random() * 25) + 1;
          
          // Check expiration date compatibility
          const daysUntilExpiry = Math.floor((new Date(inv.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const expiryScore = daysUntilExpiry <= 0 ? 0 : daysUntilExpiry >= 14 ? 100 : (daysUntilExpiry * 7);
          
          // Calculate units availability score
          const unitsAvailableScore = Math.min(inv.units / bloodRequest.units, 1) * 100;
          const distanceScore = Math.max(0, 100 - (distance * 2));
          
          // Calculate urgency multiplier
          const urgencyMultiplier = bloodRequest.urgency === 'critical' ? 1.3 : 
                                    bloodRequest.urgency === 'urgent' ? 1.15 : 1.0;
          
          // Final comprehensive score calculation
          const finalScore = Math.round(
            (bloodCompatibilityScore * 0.3) +    // Blood type compatibility - 30%
            (ageCompatibilityScore * 0.25) +     // Age compatibility - 25%
            (medicalCompatibilityScore * 0.2) +  // Medical compatibility - 20%
            (unitsAvailableScore * 0.15) +       // Units availability - 15%
            (distanceScore * 0.1) +              // Distance - 10%
            (urgencyMultiplier * 5)              // Urgency bonus
          );
          
          // Only include matches with minimum score and valid expiry
          if (finalScore >= 40 && expiryScore > 0) {
            potentialMatches.push({
              donorId: hospital.id,
              requestId: bloodRequest.id,
              hospitalName: hospital.name,
              hospitalAddress: hospital.address,
              bloodType: donorBloodType,
              bloodRhFactor: inv.rhFactor,
              availableUnits: inv.units,
              distance: distance,
              matchScore: Math.min(finalScore, 100),
              status: 'potential',
              specialAttributes: inv.specialAttributes || [],
              compatibilityScore: bloodCompatibilityScore,
              donorAge: inv.donorAge,
              expiryDays: daysUntilExpiry,
              ageCompatibilityScore: ageCompatibilityScore,
              medicalCompatibilityScore: medicalCompatibilityScore
            });
            
            console.log(`✅ Match found: ${hospital.name} - ${donorBloodType} (Score: ${finalScore}, Age: ${inv.donorAge}, Expiry: ${daysUntilExpiry}d)`);
          }
        }
      });
      
      // Sort by match score (highest first) and take top matches
      const sortedMatches = potentialMatches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10); // Show top 10 matches
      
      setMatches(sortedMatches);
      
      // Update the request with match percentage based on best match
      const bestMatchScore = sortedMatches.length > 0 ? sortedMatches[0].matchScore : 0;
      await mockDatabaseService.updateBloodRequest(bloodRequest.id, { 
        matchPercentage: bestMatchScore 
      });
      
      console.log(`🎯 AI Matching Complete: ${sortedMatches.length} matches found, best score: ${bestMatchScore}%`);
      
      toast({
        title: "AI Matching Complete",
        description: `Found ${sortedMatches.length} compatible matches with medical factors considered.`,
      });
      
      return { 
        success: true,
        matches: sortedMatches,
        requestBloodType: bloodRequest.bloodType
      };
      
    } catch (error) {
      console.error("AI matching error:", error);
      toast({
        title: "AI Matching Failed",
        description: "Failed to process AI matching. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const contactHospital = async (hospitalId: string, requestId: string) => {
    try {
      const result = await mockDatabaseService.contactHospital(hospitalId, requestId);
      
      const processedResult = result as { success: boolean; error?: string };
      
      if (processedResult.success) {
        // Update local matches state
        setMatches(prev => prev.map(match => 
          match.donorId === hospitalId && match.requestId === requestId 
            ? { ...match, status: 'contacted' } 
            : match
        ));
        
        toast({
          title: "Hospital Contacted",
          description: "The hospital has been notified about this blood request.",
        });
      } else {
        toast({
          title: "Contact Failed",
          description: "Failed to contact the hospital. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error contacting hospital:", error);
      toast({
        title: "Contact Error",
        description: "An unexpected error occurred when trying to contact the hospital.",
        variant: "destructive",
      });
    }
  };

  const deleteMatch = (matchId: string) => {
    setMatches((prevMatches) =>
      prevMatches.filter(
        (match) => `${match.donorId}-${match.requestId}` !== matchId
      )
    );
    toast({
      title: "Match Hidden",
      description: "This match has been removed from your view.",
    });
  };

  return {
    isProcessing,
    matches,
    runAiMatching,
    contactHospital,
    deleteMatch,
  };
}

export default useAiMatching;
