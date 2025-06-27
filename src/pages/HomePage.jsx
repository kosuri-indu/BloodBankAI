
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const HomePage = () => {
  const navigate = useNavigate();

  // Example blood bank status data
  const bloodBankStatus = [
    { 
      hospital: "City General Hospital", 
      bloodTypes: [
        { type: "A+", status: "High", units: 50 },
        { type: "B+", status: "Medium", units: 30 },
        { type: "O-", status: "Critical", units: 5 },
        { type: "AB+", status: "High", units: 25 },
        { type: "A-", status: "Low", units: 15 },
        { type: "B-", status: "Medium", units: 20 },
        { type: "O+", status: "High", units: 45 },
        { type: "AB-", status: "Low", units: 10 }
      ]
    },
    { 
      hospital: "Memorial Medical Center", 
      bloodTypes: [
        { type: "A+", status: "Medium", units: 35 },
        { type: "B+", status: "High", units: 55 },
        { type: "O-", status: "Low", units: 8 },
        { type: "AB+", status: "Medium", units: 20 },
        { type: "A-", status: "High", units: 30 },
        { type: "B-", status: "Low", units: 12 },
        { type: "O+", status: "Critical", units: 5 },
        { type: "AB-", status: "Medium", units: 18 }
      ]
    },
    { 
      hospital: "Saint Mary's Hospital", 
      bloodTypes: [
        { type: "A+", status: "Low", units: 15 },
        { type: "B+", status: "Critical", units: 5 },
        { type: "O-", status: "High", units: 40 },
        { type: "AB+", status: "Low", units: 10 },
        { type: "A-", status: "Medium", units: 25 },
        { type: "B-", status: "High", units: 35 },
        { type: "O+", status: "Medium", units: 30 },
        { type: "AB-", status: "High", units: 28 }
      ]
    }
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'critical':
      case 'low': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-red-600 mb-6">
            Blood Donation & Availability Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with local blood banks and hospitals. Track real-time blood availability 
            and help save lives by donating when it's needed most.
          </p>
          
          <div className="flex justify-center gap-4 mb-12">
            <Button
              onClick={() => navigate('/login')}
              className="bg-red-600 hover:bg-red-700"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/register')}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              Register
            </Button>
          </div>
        </div>

        {/* Blood Bank Status Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Current Blood Bank Status
          </h2>
          <div className="grid gap-8">
            {bloodBankStatus.map((bank, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">{bank.hospital}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bank.bloodTypes.map((blood, idx) => (
                    <div 
                      key={idx} 
                      className={`${getStatusColor(blood.status)} rounded-lg p-4 text-center hover:scale-105 transition-transform duration-300`}
                    >
                      <div className="text-2xl font-bold mb-1">{blood.type}</div>
                      <div className="text-sm mb-2">{blood.status}</div>
                      <div className="font-medium">{blood.units} units</div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-3 text-red-600">Real-time Updates</h3>
            <p className="text-gray-600">
              Get instant notifications about blood requirements in your area and track availability in real-time.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-3 text-red-600">Quick Registration</h3>
            <p className="text-gray-600">
              Simple process to register as a donor. Your contribution can help save lives in emergency situations.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-3 text-red-600">Hospital Network</h3>
            <p className="text-gray-600">
              Connected with major hospitals and blood banks to ensure efficient distribution and management.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
