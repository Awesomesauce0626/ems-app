import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const incidentTypes = [
  { value: 'cardiac_arrest', label: 'Cardiac Arrest' },
  { value: 'respiratory_distress', label: 'Respiratory Distress' },
  { value: 'severe_bleeding', label: 'Severe Bleeding' },
  { value: 'vehicular_accident', label: 'Vehicular Accident' }, // Added
  { value: 'trauma', label: 'Trauma / Injury' },
  { value: 'stroke', label: 'Suspected Stroke' },
  { value: 'allergic_reaction', label: 'Severe Allergic Reaction' },
  { value: 'poisoning', label: 'Poisoning / Overdose' },
  { value: 'burn', label: 'Major Burn' },
  { value: 'drowning', label: 'Drowning' },
  { value: 'other', label: 'Other' },
];

const schema = z.object({
  reporterName: z.string().min(1, 'Name is required'),
  reporterPhone: z.string().min(1, 'Phone number is required'),
  incidentType: z.string().min(1, 'Incident type is required'),
  description: z.string().optional(),
  patientCount: z.number().int().min(1, 'At least one patient is required'),
});

const AlertForm = ({ onSubmit, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
        patientCount: 1,
        incidentType: incidentTypes[0].value,
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="alert-form">
      <div className="form-group">
        <label htmlFor="reporterName">Your Name</label>
        <input id="reporterName" {...register('reporterName')} />
        {errors.reporterName && <p className="error-message">{errors.reporterName.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="reporterPhone">Your Phone Number</label>
        <input id="reporterPhone" {...register('reporterPhone')} />
        {errors.reporterPhone && <p className="error-message">{errors.reporterPhone.message}</p>}
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
        <label htmlFor="description">Description of Incident</label>
        <textarea id="description" placeholder="Provide a brief description of the situation..." {...register('description')} />
        {errors.description && <p className="error-message">{errors.description.message}</p>}
      </div>

      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Alert'}
      </button>
    </form>
  );
};

export default AlertForm;
