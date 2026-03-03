import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from './ui/button';
import { Camera as CameraIcon, X, Loader2 } from 'lucide-react';

const incidentTypes = [
  { value: 'cardiac_arrest', label: 'Cardiac Arrest' },
  { value: 'respiratory_distress', label: 'Respiratory Distress' },
  { value: 'severe_bleeding', label: 'Severe Bleeding' },
  { value: 'vehicular_accident', label: 'Vehicular Accident' },
  { value: 'trauma', label: 'Trauma / Injury' },
  { value: 'stroke', label: 'Suspected Stroke' },
  { value: 'allergic_reaction', label: 'Severe Allergic Reaction' },
  { value: 'poisoning', label: 'Poisoning / Overdose' },
  { value: 'burn', label: 'Major Burn' },
  { value: 'drowning', label: 'Drowning' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  address: z.string().min(1, 'Address / Location Description is required'),
  incidentType: z.string().min(1, 'Incident type is required'),
  description: z.string().optional(),
  patientCount: z.number().int().min(1, 'At least one patient is required'),
});

const AlertForm = ({ onSubmit, isSubmitting }) => {
  const [imageData, setImageData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      patientCount: 1,
      incidentType: incidentTypes[0].value,
    }
  });

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        width: 800,
      });
      setImageData(image);
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const handleFormSubmit = async (data) => {
    let imageUrl = null;
    if (imageData && imageData.base64String) {
      setIsUploading(true);
      try {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary configuration is missing.");
        }

        const formData = new FormData();
        formData.append('file', `data:image/${imageData.format};base64,${imageData.base64String}`);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await response.json();

        if (!uploadResult.secure_url) {
          throw new Error('Image upload failed: ' + (uploadResult.error?.message || 'Unknown error'));
        }
        imageUrl = uploadResult.secure_url;

      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed: ' + error.message);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    onSubmit({ ...data, imageUrl });
  };

  const removeImage = () => {
    setImageData(null);
  };

  const totalIsSubmitting = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider" htmlFor="incidentType">Type of Incident</label>
        <select
            id="incidentType"
            {...register('incidentType')}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
        >
          {incidentTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        {errors.incidentType && <p className="text-red-500 text-xs italic">{errors.incidentType.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider" htmlFor="address">Address / Location Description</label>
        <textarea
            id="address"
            {...register('address')}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none min-h-[80px]"
            placeholder="e.g., Near Market Plaza, 2nd floor"
        />
        {errors.address && <p className="text-red-500 text-xs italic">{errors.address.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider" htmlFor="description">Additional Details (Optional)</label>
        <textarea
            id="description"
            {...register('description')}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
            placeholder="Describe the situation..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider" htmlFor="patientCount">Number of Patients</label>
        <input
            id="patientCount"
            type="number"
            {...register('patientCount', { valueAsNumber: true })}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
        />
        {errors.patientCount && <p className="text-red-500 text-xs italic">{errors.patientCount.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Incident Photo (Optional)</label>
        {imageData ? (
          <div className="relative rounded-xl overflow-hidden border-2 border-red-100 shadow-md group">
            <img
                src={`data:image/${imageData.format};base64,${imageData.base64String}`}
                alt="Incident preview"
                className="w-full h-48 object-cover transition-transform group-hover:scale-105"
            />
            <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={takePicture}
            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <CameraIcon className="w-8 h-8 mb-2" />
            <span className="text-sm font-semibold">Take or Upload Photo</span>
          </button>
        )}
      </div>

      <Button
        type="submit"
        className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-red-200"
        disabled={totalIsSubmitting}
      >
        {isUploading ? (
            <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading Image...
            </>
        ) : (isSubmitting ? 'Submitting Alert...' : 'Submit Emergency Alert')}
      </Button>
    </form>
  );
};

export default AlertForm;
