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
  {
    id: 'inventory-1',
    hospitalId: 'hospital-1',
    hospital: 'City General Hospital',
    bloodType: 'A',
    rhFactor: 'positive',
    units: 50,
    processedDate: new Date('2024-01-01'),
    expirationDate: new Date('2024-03-01'),
    donorAge: 25,
    specialAttributes: ['irradiated', 'leukoreduced'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inventory-2',
    hospitalId: 'hospital-1',
    hospital: 'City General Hospital',
    bloodType: 'B',
    rhFactor: 'negative',
    units: 30,
    processedDate: new Date('2024-01-15'),
    expirationDate: new Date('2024-03-15'),
    donorAge: 30,
    specialAttributes: ['cmv-negative'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inventory-3',
    hospitalId: 'hospital-2',
    hospital: 'Regional Medical Center',
    bloodType: 'O',
    rhFactor: 'positive',
    units: 40,
    processedDate: new Date('2024-02-01'),
    expirationDate: new Date('2024-04-01'),
    donorAge: 22,
    specialAttributes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'inventory-4',
    hospitalId: 'hospital-3',
    hospital: 'University Teaching Hospital',
    bloodType: 'AB',
    rhFactor: 'negative',
    units: 25,
    processedDate: new Date('2024-02-10'),
    expirationDate: new Date('2024-04-10'),
    donorAge: 28,
    specialAttributes: ['washed'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialRequests: BloodRequest[] = [
  {
    id: 'request-1',
    hospitalId: 'hospital-1',
    hospital: 'City General Hospital',
    bloodType: 'A Rh+ (A+)',
    units: 10,
    urgency: 'urgent',
    patientAge: 60,
    patientWeight: 75,
    medicalCondition: 'Anemia',
    neededBy: new Date('2024-02-28'),
    specialRequirements: [],
    matchPercentage: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'request-2',
    hospitalId: 'hospital-2',
    hospital: 'Regional Medical Center',
    bloodType: 'O Rh- (O-)',
    units: 5,
    urgency: 'critical',
    patientAge: 45,
    patientWeight: 68,
    medicalCondition: 'Trauma',
    neededBy: new Date('2024-03-05'),
    specialRequirements: ['cmv-negative'],
    matchPercentage: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

class MockDatabaseService {
  private localStorage: Storage;

  constructor() {
    this.localStorage = window.localStorage;
    this.seedDatabase();
  }

  private seedDatabase() {
    if (!this.getStoredData('hospitals')) {
      this.localStorage.setItem('bloodbank_hospitals', JSON.stringify(initialHospitals));
    }
    if (!this.getStoredData('inventory')) {
      this.localStorage.setItem('bloodbank_inventory', JSON.stringify(initialInventory));
    }
    if (!this.getStoredData('bloodRequests')) {
      this.localStorage.setItem('bloodbank_bloodRequests', JSON.stringify(initialRequests));
    }
  }

  private getStoredData(key: string): any {
    const storedData = this.localStorage.getItem(`bloodbank_${key}`);
    return storedData ? JSON.parse(storedData) : null;
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
    const hospitals = this.getStoredData('hospitals') as Hospital[] || [];
    const inventory = this.getStoredData('inventory') as BloodInventory[] || [];
    const requests = this.getStoredData('bloodRequests') as BloodRequest[] || [];
    
    return { hospitals, inventory, requests };
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
      const hospitals = this.getStoredData('hospitals') as Hospital[];
      const filteredHospitals = hospitals.filter(h => h.id !== hospitalId);
      
      if (filteredHospitals.length === hospitals.length) {
        return { success: false, error: 'Hospital not found' };
      }
      
      this.localStorage.setItem('bloodbank_hospitals', JSON.stringify(filteredHospitals));
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
