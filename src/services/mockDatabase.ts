import { v4 as uuidv4 } from 'uuid';

export interface Hospital {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  website: string;
  contactPerson: string;
  registrationId: string;
  verified: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BloodInventory {
  id: string;
  hospitalId: string;
  hospital: string;
  bloodType: string;
  rhFactor: 'positive' | 'negative';
  units: number;
  processedDate: Date;
  expirationDate: Date;
  donorAge: number;
  specialAttributes: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface BloodRequest {
  id: string;
  hospitalId: string;
  hospital: string;
  bloodType: string;
  units: number;
  urgency: 'routine' | 'urgent' | 'critical';
  patientAge: number;
  patientWeight: number;
  medicalCondition: string;
  neededBy: Date;
  specialRequirements: string[];
  matchPercentage: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AiMatch {
  donorId: string;
  requestId: string;
  hospitalName: string;
  hospitalAddress: string;
  bloodType: string;
  bloodRhFactor: string;
  availableUnits: number;
  distance: number;
  matchScore: number;
  status: 'potential' | 'contacted' | 'accepted' | 'rejected';
  specialAttributes: string[];
  compatibilityScore: number;
  donorAge: number;
  expiryDays: number;
  ageCompatibilityScore: number;
  medicalCompatibilityScore: number;
}

const initialHospitals: Hospital[] = [
  {
    id: 'hospital-1',
    name: 'City General Hospital',
    email: 'info@citygeneral.com',
    address: '123 Main St, Anytown',
    phone: '555-1234',
    website: 'www.citygeneral.com',
    contactPerson: 'Dr. John Smith',
    registrationId: 'REG001',
    verified: true,
    createdAt: new Date(),
  },
  {
    id: 'hospital-2',
    name: 'Regional Medical Center',
    email: 'info@regionalmedical.com',
    address: '456 Oak Ave, Anytown',
    phone: '555-5678',
    website: 'www.regionalmedical.com',
    contactPerson: 'Dr. Jane Doe',
    registrationId: 'REG002',
    verified: true,
    createdAt: new Date(),
  },
  {
    id: 'hospital-3',
    name: 'University Teaching Hospital',
    email: 'info@universityhospital.com',
    address: '789 Pine Ln, Anytown',
    phone: '555-9012',
    website: 'www.universityhospital.com',
    contactPerson: 'Dr. Mike Johnson',
    registrationId: 'REG003',
    verified: true,
    createdAt: new Date(),
  }
];

const initialInventory: BloodInventory[] = [
  
];

const initialRequests: BloodRequest[] = [
  
];

class MockDatabaseService {
  private localStorage: Storage;

  constructor() {
    this.localStorage = window.localStorage;
    this.seedDatabase();
  }

  private seedDatabase() {
    // Initialize hospitals
    if (!this.getStoredData('hospitals')) {
      this.localStorage.setItem('bloodbank_hospitals', JSON.stringify(initialHospitals));
    }

    // Initialize inventory
    if (!this.getStoredData('inventory')) {
      this.localStorage.setItem('bloodbank_inventory', JSON.stringify(initialInventory));
    }

    // Initialize blood requests
    if (!this.getStoredData('bloodRequests')) {
      this.localStorage.setItem('bloodbank_bloodRequests', JSON.stringify(initialRequests));
    }

    // Initialize AI matches
    if (!this.getStoredData('matches')) {
      this.localStorage.setItem('bloodbank_matches', JSON.stringify([]));
    }
  }

  private getStoredData(key: string): any {
    const storedData = this.localStorage.getItem(`bloodbank_${key}`);
    return storedData ? JSON.parse(storedData) : [];
  }

  async registerHospital(hospitalData: Omit<Hospital, 'id' | 'createdAt' | 'verified'>): Promise<Hospital> {
    const newHospital: Hospital = {
      id: uuidv4(),
      ...hospitalData,
      verified: false,
      createdAt: new Date(),
    };

    const hospitals = this.getStoredData('hospitals') as Hospital[] || [];
    hospitals.push(newHospital);
    this.localStorage.setItem('bloodbank_hospitals', JSON.stringify(hospitals));

    return newHospital;
  }

  async getRegisteredHospitals(): Promise<Hospital[]> {
    return (this.getStoredData('hospitals') as Hospital[]) || [];
  }

  async getHospitalById(hospitalId: string): Promise<Hospital | undefined> {
    const hospitals = this.getStoredData('hospitals') as Hospital[];
    return hospitals.find(hospital => hospital.id === hospitalId);
  }

  async getPendingHospitals(): Promise<Hospital[]> {
    const hospitals = this.getStoredData('hospitals') as Hospital[] || [];
    return hospitals.filter(hospital => !hospital.verified);
  }

  async getAllHospitalsWithData(): Promise<{ hospitals: Hospital[], inventory: BloodInventory[], requests: BloodRequest[] }> {
    try {
      const [hospitals, inventory, requests] = await Promise.all([
        this.getRegisteredHospitals(),
        this.getBloodInventoryDetails(),
        this.getBloodRequests()
      ]);

      return { hospitals, inventory, requests };
    } catch (error) {
      console.error('Error fetching all hospitals data:', error);
      throw error;
    }
  }

  async getHospitalWithMatches(hospitalId: string): Promise<{ hospital: Hospital | undefined, matches: AiMatch[] }> {
    try {
      const hospital = await this.getHospitalById(hospitalId);
      const matches = await this.getAiMatches();
      
      return {
        hospital,
        matches: matches.filter(match => 
          match.donorId === hospitalId || match.requestId === hospitalId
        )
      };
    } catch (error) {
      console.error('Error fetching hospital with matches:', error);
      throw error;
    }
  }

  async getAllData(): Promise<{ hospitals: Hospital[], inventory: BloodInventory[], requests: BloodRequest[] }> {
    return this.getAllHospitalsWithData();
  }

  async verifyHospital(hospitalId: string): Promise<{ success: boolean; error?: string; hospitalName?: string }> {
    try {
      const hospitals = this.getStoredData('hospitals') as Hospital[];
      const hospitalIndex = hospitals.findIndex(h => h.id === hospitalId);
      
      if (hospitalIndex === -1) {
        return { success: false, error: 'Hospital not found' };
      }
      
      hospitals[hospitalIndex].verified = true;
      hospitals[hospitalIndex].updatedAt = new Date();
      
      this.localStorage.setItem('bloodbank_hospitals', JSON.stringify(hospitals));
      window.dispatchEvent(new CustomEvent('dataRefresh'));
      
      return { success: true, hospitalName: hospitals[hospitalIndex].name };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteHospital(hospitalId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all data first
      const hospitals = this.getStoredData('hospitals') as Hospital[];
      const inventory = this.getStoredData('bloodbank_inventory') as BloodInventory[];
      const requests = this.getStoredData('bloodbank_requests') as BloodRequest[];
      const matches = this.getStoredData('bloodbank_matches') as AiMatch[];

      // Filter out hospital
      const filteredHospitals = hospitals.filter(h => h.id !== hospitalId);
      
      if (filteredHospitals.length === hospitals.length) {
        return { success: false, error: 'Hospital not found' };
      }

      // Remove all inventory items related to this hospital
      const filteredInventory = inventory.filter(item => item.hospitalId !== hospitalId);
      
      // Remove all requests related to this hospital
      const filteredRequests = requests.filter(req => req.hospitalId !== hospitalId);
      
      // Remove all matches related to this hospital
      const filteredMatches = matches.filter(match => match.donorId !== hospitalId && match.requestId !== hospitalId);

      // Update all storage
      this.localStorage.setItem('bloodbank_hospitals', JSON.stringify(filteredHospitals));
      this.localStorage.setItem('bloodbank_inventory', JSON.stringify(filteredInventory));
      this.localStorage.setItem('bloodbank_requests', JSON.stringify(filteredRequests));
      this.localStorage.setItem('bloodbank_matches', JSON.stringify(filteredMatches));

      // Dispatch refresh event
      window.dispatchEvent(new CustomEvent('dataRefresh'));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addBloodInventory(hospitalName: string, inventoryData: Omit<BloodInventory, 'id' | 'hospitalId' | 'hospital' | 'createdAt' | 'updatedAt'>): Promise<BloodInventory> {
    const hospitals = this.getStoredData('hospitals') as Hospital[];
    const hospital = hospitals.find(h => h.name === hospitalName);

    if (!hospital) {
      throw new Error('Hospital not found');
    }

    const newInventory: BloodInventory = {
      id: uuidv4(),
      hospitalId: hospital.id,
      hospital: hospital.name,
      ...inventoryData,
      createdAt: new Date(),
    };

    const inventory = this.getStoredData('inventory') as BloodInventory[] || [];
    inventory.push(newInventory);
    this.localStorage.setItem('bloodbank_inventory', JSON.stringify(inventory));
    window.dispatchEvent(new CustomEvent('dataRefresh'));

    return newInventory;
  }

  async getBloodInventoryDetails(): Promise<BloodInventory[]> {
    return (this.getStoredData('inventory') as BloodInventory[]) || [];
  }

  async getHospitalBloodInventoryById(hospitalId: string): Promise<BloodInventory[]> {
    const inventory = this.getStoredData('inventory') as BloodInventory[];
    return inventory.filter(item => item.hospitalId === hospitalId);
  }

  async updateBloodInventory(inventoryId: string, updates: Partial<Omit<BloodInventory, 'id' | 'hospitalId' | 'hospital' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
    try {
      const inventory = this.getStoredData('inventory') as BloodInventory[];
      const inventoryIndex = inventory.findIndex(item => item.id === inventoryId);

      if (inventoryIndex === -1) {
        return { success: false, error: 'Inventory item not found' };
      }

      inventory[inventoryIndex] = {
        ...inventory[inventoryIndex],
        ...updates,
        updatedAt: new Date()
      };

      this.localStorage.setItem('bloodbank_inventory', JSON.stringify(inventory));
      window.dispatchEvent(new CustomEvent('dataRefresh'));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteBloodInventory(inventoryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const inventory = this.getStoredData('inventory') as BloodInventory[];
      const filteredInventory = inventory.filter(item => item.id !== inventoryId);

      if (filteredInventory.length === inventory.length) {
        return { success: false, error: 'Inventory item not found' };
      }

      this.localStorage.setItem('bloodbank_inventory', JSON.stringify(filteredInventory));
      window.dispatchEvent(new CustomEvent('dataRefresh'));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAiMatches(): Promise<AiMatch[]> {
    return (this.getStoredData('bloodbank_matches') as AiMatch[]) || [];
  }

  async setAiMatches(matches: AiMatch[]): Promise<void> {
    try {
      this.localStorage.setItem('bloodbank_matches', JSON.stringify(matches));
      window.dispatchEvent(new CustomEvent('dataRefresh'));
    } catch (error) {
      console.error('Error setting AI matches:', error);
      throw error;
    }
  }

  async getHospitalBloodRequests(hospitalName: string): Promise<BloodRequest[]> {
    const requests = this.getStoredData('bloodRequests') as BloodRequest[];
    return requests.filter(request => request.hospital === hospitalName);
  }

  async addBloodRequest(hospitalName: string, requestData: Omit<BloodRequest, 'id' | 'hospitalId' | 'hospital' | 'matchPercentage' | 'createdAt' | 'updatedAt'>): Promise<BloodRequest> {
    const hospitals = this.getStoredData('hospitals') as Hospital[];
    const hospital = hospitals.find(h => h.name === hospitalName);

    if (!hospital) {
      throw new Error('Hospital not found');
    }

    const newRequest: BloodRequest = {
      id: uuidv4(),
      hospitalId: hospital.id,
      hospital: hospital.name,
      ...requestData,
      matchPercentage: 0,
      createdAt: new Date(),
    };

    const bloodRequests = this.getStoredData('bloodRequests') as BloodRequest[] || [];
    bloodRequests.push(newRequest);
    this.localStorage.setItem('bloodbank_bloodRequests', JSON.stringify(bloodRequests));
    window.dispatchEvent(new CustomEvent('dataRefresh'));

    return newRequest;
  }

  async createBloodRequest(requestData: Omit<BloodRequest, 'id' | 'hospitalId' | 'matchPercentage' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error?: string; request?: BloodRequest }> {
    try {
      const hospitals = this.getStoredData('hospitals') as Hospital[];
      const hospital = hospitals.find(h => h.name === requestData.hospital);

      if (!hospital) {
        return { success: false, error: 'Hospital not found' };
      }

      const newRequest: BloodRequest = {
        id: uuidv4(),
        hospitalId: hospital.id,
        ...requestData,
        matchPercentage: 0,
        createdAt: new Date(),
      };

      const bloodRequests = this.getStoredData('bloodRequests') as BloodRequest[] || [];
      bloodRequests.push(newRequest);
      this.localStorage.setItem('bloodbank_bloodRequests', JSON.stringify(bloodRequests));
      window.dispatchEvent(new CustomEvent('dataRefresh'));

      return { success: true, request: newRequest };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBloodRequests(): Promise<BloodRequest[]> {
    return (this.getStoredData('bloodRequests') as BloodRequest[]) || [];
  }

  async getHospitalBloodRequestsById(hospitalId: string): Promise<BloodRequest[]> {
    const requests = this.getStoredData('bloodRequests') as BloodRequest[];
    return requests.filter(request => request.hospitalId === hospitalId);
  }

  async updateBloodRequest(requestId: string, updates: Partial<BloodRequest>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating blood request:', requestId, updates);
      
      const requests = this.getStoredData('bloodRequests') as BloodRequest[];
      const requestIndex = requests.findIndex(req => req.id === requestId);
      
      if (requestIndex === -1) {
        return { success: false, error: 'Blood request not found' };
      }
      
      // Update the request
      requests[requestIndex] = {
        ...requests[requestIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      this.localStorage.setItem('bloodbank_bloodRequests', JSON.stringify(requests));
      
      console.log('✅ Blood request updated successfully:', requests[requestIndex]);
      window.dispatchEvent(new CustomEvent('dataRefresh'));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating blood request:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteBloodRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting blood request:', requestId);
      
      const requests = this.getStoredData('bloodRequests') as BloodRequest[];
      const filteredRequests = requests.filter(req => req.id !== requestId);
      
      if (filteredRequests.length === requests.length) {
        return { success: false, error: 'Blood request not found' };
      }
      
      this.localStorage.setItem('bloodbank_bloodRequests', JSON.stringify(filteredRequests));
      
      console.log('✅ Blood request deleted successfully');
      window.dispatchEvent(new CustomEvent('dataRefresh'));
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting blood request:', error);
      return { success: false, error: error.message };
    }
  }

  async contactHospital(hospitalId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📞 Contacting hospital ${hospitalId} for request ${requestId}`);
      // In a real application, you would implement the logic to contact the hospital here
      // This could involve sending a notification, email, or any other form of communication.
      
      // For the mock database, we'll simulate a successful contact
      return { success: true };
    } catch (error) {
      console.error(`❌ Error contacting hospital ${hospitalId} for request ${requestId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

const mockDatabaseService = new MockDatabaseService();
export default mockDatabaseService;
