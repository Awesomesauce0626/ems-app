import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Phone, User, Siren, ArrowLeft, Camera, CheckCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://ems-app-e26y.onrender.com';
const API = `${BACKEND_URL}/api`;

export default function QuickAlert() {
  const navigate = useNavigate();
  const { login, token, user } = useAuth();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phoneNumber || '',
    address: '',
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
          toast.success('Location coordinates captured');
        },
        (error) => {
          console.error('Error getting location:', error);
          setGettingLocation(false);
          toast.error('Failed to get location. Please enable GPS.');
        }
      );
    } else {
      setGettingLocation(false);
      toast.error('Geolocation is not supported.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await CapacitorCamera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        width: 800,
      });

      if (image.base64String) {
        setIsUploading(true);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        const uploadFormData = new FormData();
        uploadFormData.append('file', `data:image/${image.format};base64,${image.base64String}`);
        uploadFormData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadResult = await response.json();
        if (uploadResult.secure_url) {
            setImageUrl(uploadResult.secure_url);
            toast.success('Image attached successfully.');
        } else {
            throw new Error("Upload failed");
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('Failed to process image.');
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
      toast.error('GPS coordinates are required.');
      return;
    }

    setLoading(true);
    try {
      let currentToken = token;

      // Create alert
      await axios.post(
        `${API}/alerts`,
        {
          reporterName: formData.name,
          reporterPhone: formData.phone,
          location,
          address: formData.address,
          incidentType: formData.emergency_type,
          description: formData.description,
          patientCount: parseInt(formData.num_patients),
          imageUrl: imageUrl,
        },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );

      toast.success('Emergency alert sent successfully!');
      navigate('/dashboard/citizen');
    } catch (error) {
      console.error('Error submitting alert:', error);
      toast.error(error.response?.data?.message || 'Failed to send alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-4 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-[#EE3224] rounded-full flex items-center justify-center shadow-lg shadow-red-200">
              <Siren className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Emergency Alert</h1>
              <p className="text-gray-600">Provide incident details</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 ${location ? 'text-green-600' : 'text-red-500'}`} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {gettingLocation ? 'Capturing GPS...' : location ? 'GPS Coordinates Captured' : 'GPS Required'}
                </p>
                {location && (
                  <p className="text-xs text-gray-600 font-mono">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                )}
              </div>
              {!location && (
                <Button onClick={getLocation} size="sm" variant="outline" className="rounded-full">
                  Retry GPS
                </Button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase text-gray-500">Your Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="rounded-lg h-12" placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase text-gray-500">Contact Number *</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="rounded-lg h-12" placeholder="09XXXXXXXXX" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase text-gray-500">Exact Location / Landmarks *</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} required className="rounded-lg h-12 border-red-100 focus:border-red-500" placeholder="e.g. In front of Jollibee, Brgy. 1" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergency_type" className="text-xs font-bold uppercase text-gray-500">Emergency Type *</Label>
                  <Select name="emergency_type" value={formData.emergency_type} onValueChange={(value) => setFormData({ ...formData, emergency_type: value })} required>
                    <SelectTrigger className="h-12 rounded-lg">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cardiac Emergency">Cardiac Emergency</SelectItem>
                      <SelectItem value="Vehicle Accident">Vehicle Accident</SelectItem>
                      <SelectItem value="Trauma/Injury">Trauma/Injury</SelectItem>
                      <SelectItem value="Respiratory Distress">Respiratory Distress</SelectItem>
                      <SelectItem value="Stroke">Stroke</SelectItem>
                      <SelectItem value="Other Emergency">Other Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_patients" className="text-xs font-bold uppercase text-gray-500">Patients *</Label>
                  <Input id="num_patients" name="num_patients" type="number" value={formData.num_patients} onChange={handleChange} required min="1" className="h-12 rounded-lg" />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase text-gray-500">Description (Optional)</Label>
              <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="rounded-lg min-h-[100px]" placeholder="Briefly describe the situation..." />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Incident Photo</Label>
                {imageUrl ? (
                    <div className="relative rounded-lg overflow-hidden border-2 border-green-100 shadow-sm h-40">
                        <img src={imageUrl} alt="Attached" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-green-600/10 flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600 drop-shadow-md"/>
                        </div>
                    </div>
                ) : (
                    <Button
                        type="button"
                        onClick={handleTakePhoto}
                        disabled={isUploading}
                        variant="outline"
                        className="w-full h-24 border-dashed border-2 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-all"
                    >
                        <Camera className="w-6 h-6 text-gray-400"/>
                        <span className="text-xs font-bold text-gray-500 uppercase">Attach Photo</span>
                    </Button>
                )}
            </div>

            <Button
              type="submit"
              disabled={loading || !location || isUploading}
              className="w-full rounded-xl bg-[#EE3224] hover:bg-[#D92015] text-white font-bold py-8 text-xl shadow-lg shadow-red-100"
            >
              {loading ? 'Sending Alert...' : 'Submit Emergency Alert'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
