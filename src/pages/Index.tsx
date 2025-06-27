
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Brain, DropletIcon, Hospital, Database } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Brain className="h-16 w-16 text-purple-600" />
          </div>
          <h1 className="text-5xl font-bold text-red-600 mb-6">
            Blood<span className="text-purple-600">Bank</span>AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with local blood banks and hospitals using our AI-powered matching system.
            Track real-time blood availability and help save lives by donating when it's needed most.
          </p>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 text-center">
              <Hospital className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Hospitals Connected</h3>
              <p className="text-gray-600">Growing network of medical facilities</p>
            </Card>

            <Card className="p-6 text-center">
              <DropletIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Life-Saving Matches</h3>
              <p className="text-gray-600">AI-powered blood type matching</p>
            </Card>

            <Card className="p-6 text-center">
              <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">Live inventory and request tracking</p>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-3 text-red-600">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our advanced AI algorithm matches donors with recipients based on blood type compatibility,
                location, and urgency to ensure timely and effective donations.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-3 text-red-600">Real-time Updates</h3>
              <p className="text-gray-600">
                Get instant notifications about blood requirements in your area and track availability in real-time.
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

        {/* Call to Action Section */}
        <div className="text-center mb-32">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Join the Blood Bank AI Network
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Be part of the future of blood donation and medical emergency response. 
            Our platform connects hospitals, blood banks, and donors for faster, more efficient life-saving operations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
