import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Candidate } from '../../types';
import { CandidatesService } from '../../services/candidates';

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSuccess: () => void;
}

const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    skills: [] as string[],
    experience: [] as any[],
    education: [] as any[],
    status: 'active' as 'active' | 'inactive' | 'archived'
  });
  const [skillsInput, setSkillsInput] = useState('');
  const [experienceInput, setExperienceInput] = useState('');
  const [educationInput, setEducationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (candidate && isOpen) {
      setFormData({
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        summary: candidate.summary || '',
        skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        experience: Array.isArray(candidate.experience) ? candidate.experience : [],
        education: Array.isArray(candidate.education) ? candidate.education : [],
        status: candidate.status || 'active'
      });
      setSkillsInput(Array.isArray(candidate.skills) ? candidate.skills.join(', ') : '');
      setExperienceInput(Array.isArray(candidate.experience) ? candidate.experience.join('\n') : '');
      setEducationInput(Array.isArray(candidate.education) ? candidate.education.join('\n') : '');
      setError(null);
    }
  }, [candidate, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    setFormData(prev => ({ ...prev, skills: skillsArray }));
  };

  const handleExperienceChange = (value: string) => {
    setExperienceInput(value);
    const experienceArray = value.split('\n').map(exp => exp.trim()).filter(exp => exp.length > 0);
    setFormData(prev => ({ ...prev, experience: experienceArray }));
  };

  const handleEducationChange = (value: string) => {
    setEducationInput(value);
    const educationArray = value.split('\n').map(edu => edu.trim()).filter(edu => edu.length > 0);
    setFormData(prev => ({ ...prev, education: educationArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidate?.id) {
      setError('No candidate selected');
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await CandidatesService.updateCandidate(candidate.id, formData);
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Failed to update candidate');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Candidate"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief summary of the candidate..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Skills
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => handleSkillsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter skills separated by commas (e.g., React, Node.js, Python)"
          />
          {formData.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Experience
          </label>
          <textarea
            value={experienceInput}
            onChange={(e) => handleExperienceChange(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Work experience details (one per line)..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Education
          </label>
          <textarea
            value={educationInput}
            onChange={(e) => handleEducationChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Educational background (one per line)..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Candidate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCandidateModal;
