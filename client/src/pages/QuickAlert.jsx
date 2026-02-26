import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, User, Siren, ArrowLeft, Camera, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function QuickAlert() {
  const navigate = useNavigate();
  const { login, token } = useAuth(); // Use existing token if available
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    medical_conditions: '',
    num_patients: '1',
    emergency_type: '',
    description: ''
  });

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGettingLocation(false);
          toast.success('Location captured successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
          toast.error('Failed to get location. Please enable location services.');
        }
      );
    } else {
      setGettingLocation(false);
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        setIsUploading(true);
        const blob = await fetch(image.webPath).then(r => r.blob());
        const uploadData = new FormData();
        uploadData.append('file', blob, `incident-${Date.now()}.jpg`);

        const response = await axios.post(`${API}/upload`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        setImageUrl(response.data.imageUrl);
        toast.success('Image uploaded successfully.');
      }
    } catch (error) {
      console.error('Error taking photo or uploading:', error);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      toast.error('Location is required. Please allow location access.');
      return;
    }

    setLoading(true);
    try {
      let currentToken = token;

      // If user is not logged in, create a quick-access user
      if (!currentToken) {
        const authResponse = await axios.post(`${API}/auth/quick-access`, {
          name: formData.name,
          phone: formData.phone
        });
        const { token: newToken, user } = authResponse.data;
        login(newToken, user); // Log the user in
        currentToken = newToken;
      }

      // Create alert with the captured data
      await axios.post(
        `${API}/alerts`,
        {
          reporterName: formData.name,
          reporterPhone: formData.phone,
          location,
          address: "User-provided location", // This could be improved with reverse geocoding
          incidentType: formData.emergency_type,
          description: formData.description,
          patientCount: parseInt(formData.num_patients),
          imageUrl: imageUrl, // Add the image URL here
        },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );

      toast.success('Emergency alert sent successfully!');
      navigate('/citizen-dashboard');
    } catch (error) {
      console.error('Error submitting alert:', error);
      toast.error(error.response?.data?.message || 'Failed to send alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4 hover:bg-gray-100 rounded-full"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#EE3224] rounded-full flex items-center justify-center glow-animation">
              <Siren className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Emergency Alert</h1>
              <p className="text-gray-600">Fill in the details quickly</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 p-8">
          {/* Location Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 ${location ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {gettingLocation ? 'Getting your location...' : location ? 'Location Captured' : 'Location Required'}
                </p>
                {location && (
                  <p className="text-xs text-gray-600">
                    Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                  </p>
                )}
              </div>
              {!location && (
                <Button
                  onClick={getLocation}
                  size="sm"
                  className="rounded-full bg-[#EE3224] hover:bg-[#D92015]"
                  data-testid="get-location-btn"
                >
                  Get Location
                </Button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="alert-form">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-gray-700">Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="mt-2 rounded-lg border-gray-300" placeholder="Your full name" data-testid="name-input" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-bold uppercase tracking-wider text-gray-700">Phone Number *</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="mt-2 rounded-lg border-gray-300" placeholder="09XXXXXXXXX" data-testid="phone-input" />
              </div>
              <div>
                <Label htmlFor="age" className="text-sm font-bold uppercase tracking-wider text-gray-700">Age *</Label>
                <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} required className="mt-2 rounded-lg border-gray-300" placeholder="Age" data-testid="age-input" />
              </div>
              <div>
                <Label htmlFor="num_patients" className="text-sm font-bold uppercase tracking-wider text-gray-700">Number of Patients *</Label>
                <Input id="num_patients" name="num_patients" type="number" value={formData.num_patients} onChange={handleChange} required min="1" className="mt-2 rounded-lg border-gray-300" data-testid="num-patients-input" />
              </div>
            </div>

            <div>
              <Label htmlFor="emergency_type" className="text-sm font-bold uppercase tracking-wider text-gray-700">Emergency Type *</Label>
              <Select name="emergency_type" value={formData.emergency_type} onValueChange={(value) => setFormData({ ...formData, emergency_type: value })} required>
                <SelectTrigger className="mt-2 rounded-lg border-gray-300" data-testid="emergency-type-select">
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cardiac Emergency">Cardiac Emergency</SelectItem>
                  <SelectItem value="Trauma/Injury">Trauma/Injury</SelectItem>
                  <SelectItem value="Respiratory Distress">Respiratory Distress</SelectItem>
                  <SelectItem value="Stroke">Stroke</SelectItem>
                  <SelectItem value="Severe Bleeding">Severe Bleeding</SelectItem>
                  <SelectItem value="Vehicle Accident">Vehicle Accident</SelectItem>
                  <SelectItem value="Other Emergency">Other Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="medical_conditions" className="text-sm font-bold uppercase tracking-wider text-gray-700">Medical Conditions</Label>
              <Input id="medical_conditions" name="medical_conditions" value={formData.medical_conditions} onChange={handleChange} className="mt-2 rounded-lg border-gray-300" placeholder="Any known medical conditions, allergies, medications" data-testid="medical-conditions-input" />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-gray-700">Description *</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} required className="mt-2 rounded-lg border-gray-300" rows={4} placeholder="Describe the emergency situation in detail..." data-testid="description-input" />
            </div>

            <div>
                <Label className="text-sm font-bold uppercase tracking-wider text-gray-700">Attach Photo</Label>
                {imageUrl ? (
                    <div className="mt-2 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600"/>
                        <p className="text-sm text-green-800 font-medium">Image attached successfully.</p>
                    </div>
                ) : (
                    <Button
                        type="button"
                        onClick={handleTakePhoto}
                        disabled={isUploading}
                        variant="outline"
                        className="w-full mt-2 rounded-lg border-gray-300 flex items-center justify-center gap-2"
                        data-testid="attach-photo-btn"
                    >
                        <Camera className="w-4 h-4"/>
                        {isUploading ? 'Uploading...' : 'Open Camera & Attach'}
                    </Button>
                )}
            </div>

            <Button
              type="submit"
              disabled={loading || !location || isUploading}
              className="w-full rounded-full bg-[#EE3224] hover:bg-[#D92015] text-white font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              data-testid="submit-alert-btn"
            >
              {loading ? 'Sending Alert...' : 'Send Emergency Alert'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
