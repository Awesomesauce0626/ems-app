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
        quality: 90, // Keep JPEG quality high
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Select Image Source',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take a Picture',
        // Add these lines to resize the image
        width: 1024,
        height: 1024,
      });
      setImageData(image);
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const handleFormSubmit = (data) => {
      onSubmit({ ...data, image: imageData });
  };

  const removeImage = () => {
      setImageData(null);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="alert-form">
      <div className="form-group">
        <label htmlFor="address">Address / Location Description</label>
        <textarea id="address" placeholder="e.g., In front of SM City Daet, Vinzons Ave" {...register('address')} />
        {errors.address && <p className="error-message">{errors.address.message}</p>}
      </div>

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
        <label htmlFor="patientCount">Number of Patients</label>
        <input id="patientCount" type="number" {...register('patientCount', { valueAsNumber: true })} />
        {errors.patientCount && <p className="error-message">{errors.patientCount.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description of Incident (Optional)</label>
        <textarea id="description" placeholder="Provide a brief description of the situation..." {...register('description')} />
        {errors.description && <p className="error-message">{errors.description.message}</p>}
      </div>

      <div className="form-group">
        <label>Incident Photo (Optional)</label>
        {imageData ? (
          <div className="image-preview-container">
            <img src={imageData.dataUrl} alt="Incident preview" className="image-preview" />
            <button type="button" onClick={removeImage} className="remove-image-btn">Remove Image</button>
          </div>
        ) : (
          <button type="button" onClick={takePicture} className="add-photo-btn">Add Photo</button>
        )}
      </div>

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Alert'}
      </button>
    </form>
  );
};

export default AlertForm;
