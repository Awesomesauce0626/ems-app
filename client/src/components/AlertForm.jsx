import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Plugins } from '@capacitor/core';

const { MediaUpload } = Plugins;

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
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Select Image Source',
        promptLabelPhoto: 'From Gallery',
        promptLabelPicture: 'Take a Picture',
        width: 1000,
      });
      setImageData(image);
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const handleFormSubmit = async (data) => {
    if (imageData && imageData.path) {
      setIsUploading(true);
      try {
        const result = await MediaUpload.uploadMedia({ filePath: imageData.path });
        // The native plugin returns the secure URL, which we now submit.
        onSubmit({ ...data, imageUrl: result.url });
      } catch (error) {
        console.error('Upload failed', error);
        // Optionally, inform the user that the upload failed.
        alert('Image upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    } else {
      // Submit without an image
      onSubmit(data);
    }
  };

  const removeImage = () => {
      setImageData(null);
  }

  const totalIsSubmitting = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="alert-form">
      {/* ... other form groups ... */}

      <div className="form-group">
        <label>Incident Photo (Optional)</label>
        {imageData ? (
          <div className="image-preview-container">
            <img src={imageData.webPath} alt="Incident preview" className="image-preview" />
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