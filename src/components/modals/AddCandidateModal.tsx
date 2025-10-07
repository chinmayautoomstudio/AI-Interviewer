import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CandidateFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
  submitSuccess?: string | null;
}

export interface CandidateFormData {
  name: string;
  email: string;
  phone: string;
  skills: string;
  experience: string;
  education: string;
}

const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitError = null,
  submitSuccess = null
}) => {
  const [formData, setFormData] = useState<CandidateFormData>({
    name: '',
    email: '',
    phone: '',
    skills: '',
    experience: '',
    education: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      skills: '',
      experience: '',
      education: ''
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Candidate"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            required
            placeholder="e.g., John Smith"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            required
            placeholder="e.g., john@example.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder="e.g., +1 (555) 123-4567"
          />
          <Input
            label="Skills"
            value={formData.skills}
            onChange={(value) => setFormData({ ...formData, skills: value })}
            placeholder="e.g., React, Node.js, Python"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Experience
          </label>
          <textarea
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            placeholder="Describe the candidate's work experience and background..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education
          </label>
          <textarea
            value={formData.education}
            onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
            placeholder="List educational background, degrees, certifications..."
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
                Adding...
              </>
            ) : (
              'Add Candidate'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCandidateModal;
