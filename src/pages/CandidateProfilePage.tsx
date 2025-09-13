import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Award, 
  Briefcase, 
  GraduationCap,
  MapPin,
  Clock,
  User,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Candidate } from '../types';
import { getCandidateById, deleteCandidate } from '../services/candidates';

const CandidateProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadCandidate();
    }
  }, [id]);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      setError(null);
      const candidateData = await getCandidateById(id!);
      console.log('Loaded candidate data:', candidateData);
      setCandidate(candidateData);
    } catch (err) {
      console.error('Error loading candidate:', err);
      setError(err instanceof Error ? err.message : 'Failed to load candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!candidate?.id) return;

    try {
      setIsDeleting(true);
      await deleteCandidate(candidate.id);
      setShowDeleteDialog(false);
      navigate('/candidates');
    } catch (err) {
      console.error('Error deleting candidate:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete candidate');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadResume = () => {
    if (candidate?.resumeUrl || candidate?.resume_url) {
      window.open(candidate.resumeUrl || candidate.resume_url, '_blank');
    }
  };

  const handleEditCandidate = () => {
    navigate(`/candidates/edit/${id}`);
  };


  const handleScheduleInterview = () => {
    navigate(`/interviews/schedule?candidateId=${id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Candidate Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              {error || 'The candidate you are looking for does not exist.'}
            </p>
            <Button variant="primary" onClick={() => navigate('/candidates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Candidates
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/candidates')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name || 'Unknown Candidate'}</h1>
            <p className="text-gray-600">{candidate.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.status || 'unknown')}`}>
            {(candidate.status || 'unknown').replace('_', ' ').toUpperCase()}
          </span>
          <Button variant="outline" onClick={handleEditCandidate}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleScheduleInterview}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Interview
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteDialog(true)} 
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete Candidate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{candidate.email || 'No email'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{candidate.phone || candidate.contact_number || 'No phone number'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Applied</p>
                  <p className="font-medium">{formatDate(candidate.created_at || candidate.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{formatDate(candidate.updated_at || candidate.updatedAt)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Resume Summary */}
          {candidate.summary && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">{candidate.summary}</p>
            </Card>
          )}

          {/* Skills */}
          {candidate.skills && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <Award className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
              </div>
              <div className="space-y-4">
                {(() => {
                  // Handle different skill formats
                  if (typeof candidate.skills === 'object' && candidate.skills !== null && !Array.isArray(candidate.skills)) {
                    // Object format with categories
                    const skillEntries = Object.entries(candidate.skills);
                    if (skillEntries.length === 0) {
                      return <p className="text-gray-500 italic">No skills listed</p>;
                    }
                    
                    return skillEntries.map(([category, skills]) => {
                      if (Array.isArray(skills) && skills.length > 0) {
                        return (
                          <div key={category}>
                            <h3 className="font-medium text-gray-900 mb-2">{category}</h3>
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill, index) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }).filter(Boolean);
                  } else if (Array.isArray(candidate.skills) && candidate.skills.length > 0) {
                    // Array format
                    return (
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    );
                  } else {
                    // Empty or invalid format
                    return <p className="text-gray-500 italic">No skills listed</p>;
                  }
                })()}
              </div>
            </Card>
          )}

          {/* Experience */}
          {candidate.experience && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(candidate.experience) ? (
                  // Array format (structured data)
                  candidate.experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-blue-200 pl-4">
                      <h3 className="font-semibold text-gray-900">{exp.title || exp.position || 'Experience'}</h3>
                      <p className="text-gray-600">{exp.company || exp.organization || ''}</p>
                      {exp.duration && (
                        <p className="text-sm text-gray-500">{exp.duration}</p>
                      )}
                      {exp.description && (
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  // String format (parsed text)
                  <div className="border-l-4 border-blue-200 pl-4">
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {candidate.experience}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Education */}
          {candidate.education && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Education</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(candidate.education) ? (
                  // Array format (structured data)
                  candidate.education.map((edu, index) => (
                    <div key={index} className="border-l-4 border-green-200 pl-4">
                      <h3 className="font-semibold text-gray-900">{edu.degree || edu.course || 'Education'}</h3>
                      <p className="text-gray-600">{edu.institution || edu.school || edu.university || ''}</p>
                      {edu.year && (
                        <p className="text-sm text-gray-500">{edu.year}</p>
                      )}
                      {edu.gpa && (
                        <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                      )}
                    </div>
                  ))
                ) : (
                  // String format (parsed text)
                  <div className="border-l-4 border-green-200 pl-4">
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {candidate.education}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Projects */}
          {candidate.projects && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <Briefcase className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(candidate.projects) ? (
                  // Array format (structured data)
                  candidate.projects.map((project, index) => (
                    <div key={index} className="border-l-4 border-purple-200 pl-4">
                      <h3 className="font-semibold text-gray-900">{project.title || 'Project'}</h3>
                      {project.description && (
                        <p className="text-gray-700 mt-1">{project.description}</p>
                      )}
                      {project.technologies_used && Array.isArray(project.technologies_used) && project.technologies_used.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 mb-1">Technologies:</p>
                          <div className="flex flex-wrap gap-1">
                            {project.technologies_used.map((tech: string, techIndex: number) => (
                              <span 
                                key={techIndex}
                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // String format (parsed text)
                  <div className="border-l-4 border-purple-200 pl-4">
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {candidate.projects}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resume Download */}
          {(candidate.resumeUrl || candidate.resume_url) && (
            <Card>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Resume</h3>
              </div>
              <Button 
                variant="primary" 
                onClick={handleDownloadResume}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={handleScheduleInterview}
                className="w-full justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/candidates/${id}/interviews`)}
                className="w-full justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Interviews
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEditCandidate}
                className="w-full justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </Card>

          {/* Candidate Details */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Candidate ID</span>
                <span className="font-mono text-sm">{candidate.candidate_id || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Internal ID</span>
                <span className="font-mono text-xs text-gray-500">{candidate.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(candidate.status || 'unknown')}`}>
                  {candidate.status || 'unknown'}
                </span>
              </div>
              {(candidate.interview_id || candidate.interviewId) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Interview ID</span>
                  <span className="font-mono text-sm">{candidate.interview_id || candidate.interviewId}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteCandidate}
        title="Delete Candidate"
        message={`Are you sure you want to delete ${candidate?.name || 'this candidate'}? This action cannot be undone and will permanently remove all candidate data including resume, interview history, and notes.`}
        confirmText="Delete Candidate"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CandidateProfilePage;
