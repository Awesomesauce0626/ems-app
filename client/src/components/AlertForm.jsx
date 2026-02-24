import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

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
        quality: 30, // Further reduced quality
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Select Image Source',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take a Picture',
        width: 600, // Further reduced width
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
        const formData = new FormData();
        formData.append('file', `data:image/${imageData.format};base64,${imageData.base64String}`);
        formData.append('upload_preset', 'prc-ems-app');

        const response = await fetch('https://api.cloudinary.com/v1_1/dbihhzu5y/image/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await response.json();

        if (!uploadResult.secure_url) {
          throw new Error('Image upload failed, no secure URL returned.');
        }
        imageUrl = uploadResult.secure_url;

      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed. Please try again.');
        setIsUploading(false);
        return; // Stop submission if upload fails
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="alert-form">
      <div className="form-group">
        <label htmlFor="incidentType">Type of Incident</label>
        <select id="incidentType" {...register('incidentType')}>
          {incidentTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        {errors.incidentType && <p className="error-message">{errors.incidentType.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="address">Address / Location Description</label>
        <textarea id="address" {...register('address')} />
        {errors.address && <p className="error-message">{errors.address.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Additional Details (Optional)</label>
        <textarea id="description" {...register('description')} />
      </div>

      <div className="form-group">
        <label htmlFor="patientCount">Number of Patients</label>
        <input id="patientCount" type="number" {...register('patientCount', { valueAsNumber: true })} />
        {errors.patientCount && <p className="error-message">{errors.patientCount.message}</p>}
      </div>

      <div className="form-group">
        <label>Incident Photo (Optional)</label>
        {imageData ? (
          <div className="image-preview-container">
            <img src={`data:image/${imageData.format};base64,${imageData.base64String}`} alt="Incident preview" className="image-preview" />
            <button type="button" onClick={removeImage} className="remove-image-btn">Remove Image</button>
          </div>
        ) : (
          <button type="button" onClick={takePicture} className="add-photo-btn">Add Photo</button>
        )}
      </div>

      <button type="submit" className="submit-button" disabled={totalIsSubmitting}>
        {isUploading ? 'Uploading Image...' : (isSubmitting ? 'Submitting Alert...' : 'Submit Alert')}
      </button>
    </form>
  );
};

export default AlertForm;
