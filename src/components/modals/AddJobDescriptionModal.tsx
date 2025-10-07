import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AddJobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobDescriptionFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
  submitSuccess?: string | null;
}

export interface JobDescriptionFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: string;
  salaryRange: string;
}

const AddJobDescriptionModal: React.FC<AddJobDescriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = null,
  submitSuccess = null
}) => {
  const [formData, setFormData] = useState<JobDescriptionFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'full-time',
    salaryRange: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      location: '',
      employmentType: 'full-time',
      salaryRange: ''
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Job Description"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Job Title"
            value={formData.title}
            onChange={(value) => setFormData({ ...formData, title: value })}
            required
            placeholder="e.g., Senior Developer"
          />
          <Input
            label="Location"
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder="e.g., New York, NY"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Type
            </label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            >
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <Input
            label="Salary Range"
            value={formData.salaryRange}
            onChange={(value) => setFormData({ ...formData, salaryRange: value })}
            placeholder="e.g., $80,000 - $120,000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requirements
          </label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            placeholder="List the required skills, experience, and qualifications..."
          />
        </div>

        {submitError && (
          <div className="bg-ai-coral/10 border border-ai-coral/20 rounded-lg p-3">
            <p className="text-ai-coral-dark text-sm">{submitError}</p>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">{submitSuccess}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Job Description'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddJobDescriptionModal;
