import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { FileText, Zap, CheckCircle, AlertCircle, Upload, File, Plus, X, Calendar } from 'lucide-react';
import JDParserService, { JDParserResponse } from '../../services/jdParser';
import { supabase } from '../../services/supabase';

interface AdvancedAddJobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editJobDescription?: {
    id: string;
    title: string;
    description: string;
    location: string;
    department: string;
    requirements: string[];
    skills: string[];
    responsibilities?: string[];
    benefits?: string[];
    // Database uses snake_case field names
    employment_type?: 'full-time' | 'part-time' | 'contract' | 'internship';
    experience_level?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
    salary_min?: number;
    salary_max?: number;
    currency?: string;
    company_name?: string;
    work_mode?: string;
    contact_email?: string;
    application_deadline?: string;
    experience?: string; // For backward compatibility
  };
}

const AdvancedAddJobDescriptionModal: React.FC<AdvancedAddJobDescriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editJobDescription
}) => {
  const isEditMode = !!editJobDescription;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'full-time',
    salaryRange: '',
    department: '',
    experienceLevel: 'mid',
    workMode: 'on-site',
    companyName: '',
    contactEmail: '',
    // New fields from the image
    minSalary: '',
    maxSalary: '',
    currency: 'INR',
    requirementsList: [] as string[],
    responsibilitiesList: [] as string[],
    skillsList: [] as string[],
    benefitsList: [] as string[],
    applicationDeadline: ''
  });

  // Auto-parsing fields
  const [rawJobDescription, setRawJobDescription] = useState('');

  // Populate form when in edit mode
  useEffect(() => {
    if (isEditMode && editJobDescription) {
      const parsedData = parseExistingJobData(editJobDescription);
      setFormData(parsedData);
    }
  }, [isEditMode, editJobDescription]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper functions for array inputs
  const addToArray = (field: string, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((_, i) => i !== index)
    }));
  };

  // Parse existing job description data for edit mode
  const parseExistingJobData = (jobData: any) => {
    // Extract custom ID from title if it exists
    const titleMatch = jobData.title.match(/^\[([^\]]+)\]\s*(.+)$/);
    const customId = titleMatch ? titleMatch[1] : '';
    const cleanTitle = titleMatch ? titleMatch[2] : jobData.title;

    // Use existing data directly from database (snake_case fields)
    let employmentType = jobData.employment_type || 'full-time';
    let experienceLevel = jobData.experience_level || 'mid';
    let workMode = jobData.work_mode || 'on-site';
    let companyName = jobData.company_name || '';
    let contactEmail = jobData.contact_email || '';
    let minSalary = jobData.salary_min?.toString() || '';
    let maxSalary = jobData.salary_max?.toString() || '';
    let currency = jobData.currency || 'INR';
    let responsibilitiesList = jobData.responsibilities || [];
    let benefitsList = jobData.benefits || [];
    let applicationDeadline = jobData.application_deadline || '';

    // For backward compatibility, also try to parse from experience field if it exists
    const experienceData = jobData.experience || '';
    if (experienceData) {
      const lines = experienceData.split('\n');

    // Parse structured data from experience field
    lines.forEach((line: string) => {
      if (line.startsWith('Employment Type:')) {
        employmentType = line.replace('Employment Type:', '').trim();
      } else if (line.startsWith('Experience Level:')) {
        experienceLevel = line.replace('Experience Level:', '').trim();
      } else if (line.startsWith('Work Mode:')) {
        workMode = line.replace('Work Mode:', '').trim();
      } else if (line.startsWith('Company:')) {
        companyName = line.replace('Company:', '').trim();
      } else if (line.startsWith('Contact:')) {
        contactEmail = line.replace('Contact:', '').trim();
      } else if (line.startsWith('Salary:')) {
        const salaryMatch = line.match(/₹(\d+)\s*-\s*₹(\d+)\s*(\w+)/);
        if (salaryMatch) {
          minSalary = salaryMatch[1];
          maxSalary = salaryMatch[2];
          currency = salaryMatch[3];
        }
      } else if (line.startsWith('Application Deadline:')) {
        applicationDeadline = line.replace('Application Deadline:', '').trim();
      }
    });

    // Extract responsibilities and benefits sections
    const responsibilitiesStart = lines.findIndex((line: string) => line.includes('Responsibilities:'));
    const benefitsStart = lines.findIndex((line: string) => line.includes('Benefits:'));
    
    if (responsibilitiesStart !== -1) {
      const responsibilitiesEnd = benefitsStart !== -1 ? benefitsStart : lines.length;
      responsibilitiesList = lines.slice(responsibilitiesStart + 1, responsibilitiesEnd)
        .filter((line: string) => line.trim() && !line.includes('Benefits:'))
        .map((line: string) => line.replace(/^[-•]\s*/, '').trim())
        .filter((line: string) => line);
    }
    
    if (benefitsStart !== -1) {
      const benefitsEnd = lines.findIndex((line: string, index: number) => index > benefitsStart && line.includes('Application Deadline:'));
      const endIndex = benefitsEnd !== -1 ? benefitsEnd : lines.length;
      benefitsList = lines.slice(benefitsStart + 1, endIndex)
        .filter((line: string) => line.trim() && !line.includes('Application Deadline:'))
        .map((line: string) => line.replace(/^[-•]\s*/, '').trim())
        .filter((line: string) => line);
    }
    }

    return {
      title: cleanTitle,
      description: jobData.description || '',
      requirements: '', // Not used in new form
      location: jobData.location || '',
      employmentType,
      salaryRange: '', // Not used in new form
      department: jobData.department || '',
      experienceLevel,
      workMode,
      companyName,
      contactEmail,
      minSalary,
      maxSalary,
      currency,
      requirementsList: jobData.requirements || [],
      responsibilitiesList,
      skillsList: jobData.skills || [],
      benefitsList,
      applicationDeadline
    };
  };

  // Generate custom JD ID: AS-WD-6581 format
  const generateJobDescriptionId = (title: string): string => {
    // Clean the title: remove special characters and keep only alphanumeric characters and spaces
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanTitle.split(/\s+/).filter(word => word.length > 0);
    let abbreviation = '';
    
    if (words.length >= 2) {
      // Take first letter of first two words (only alphanumeric)
      const firstWord = words[0].replace(/[^a-zA-Z0-9]/g, '');
      const secondWord = words[1].replace(/[^a-zA-Z0-9]/g, '');
      
      if (firstWord.length > 0 && secondWord.length > 0) {
        abbreviation = firstWord.substring(0, 1).toUpperCase() + secondWord.substring(0, 1).toUpperCase();
      } else if (firstWord.length > 0) {
        abbreviation = firstWord.substring(0, 2).toUpperCase();
      } else {
        abbreviation = 'JD';
      }
    } else if (words.length === 1) {
      // Take first 2 letters if only one word (only alphanumeric)
      const cleanWord = words[0].replace(/[^a-zA-Z0-9]/g, '');
      if (cleanWord.length >= 2) {
        abbreviation = cleanWord.substring(0, 2).toUpperCase();
      } else if (cleanWord.length === 1) {
        abbreviation = cleanWord.substring(0, 1).toUpperCase() + 'D';
      } else {
        abbreviation = 'JD';
      }
    } else {
      abbreviation = 'JD';
    }
    
    // Generate timestamp-based number (last 4 digits)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const timestampPart = timestamp.substring(timestamp.length - 4);
    
    return `AS-${abbreviation}-${timestampPart}`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const uploadAndParseFile = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      const result = await JDParserService.uploadAndParseJobDescriptionFile(selectedFile);
      
      if (result.success && result.data) {
        const data: NonNullable<JDParserResponse['data']> = result.data;
        
        // Generate custom ID for parsed data
        const parsedTitle = data.job_title || '';
        const customId = parsedTitle ? generateJobDescriptionId(parsedTitle) : '';
        
        // Parse salary range if available
        let parsedMinSalary = '';
        let parsedMaxSalary = '';
        let parsedCurrency = 'INR';
        
        if (data.salary_range) {
          // Parse salary range like "₹2.5L - ₹4L per annum" or "Up to ₹60,000.00 per year"
          const salaryText = data.salary_range;
          
          // Handle "Up to" format
          if (salaryText.toLowerCase().includes('up to')) {
            const upToMatch = salaryText.match(/up to\s*₹?([\d,]+(?:\.\d+)?)/i);
            if (upToMatch) {
              const amount = parseFloat(upToMatch[1].replace(/,/g, ''));
              parsedMinSalary = '0';
              parsedMaxSalary = amount.toString();
              parsedCurrency = 'INR';
            }
          } else {
            // Handle range format like "₹2.5L - ₹4L" or "₹300000 - ₹600000"
            const rangeMatch = salaryText.match(/₹?([\d,]+(?:\.\d+)?)\s*-\s*₹?([\d,]+(?:\.\d+)?)/i);
            if (rangeMatch) {
              const minAmount = parseFloat(rangeMatch[1].replace(/,/g, ''));
              const maxAmount = parseFloat(rangeMatch[2].replace(/,/g, ''));
              
              // Handle "L" suffix (Lakhs)
              if (salaryText.toLowerCase().includes('l')) {
                parsedMinSalary = (minAmount * 100000).toString();
                parsedMaxSalary = (maxAmount * 100000).toString();
              } else {
                parsedMinSalary = minAmount.toString();
                parsedMaxSalary = maxAmount.toString();
              }
              parsedCurrency = 'INR';
            }
          }
        }
        
        // Debug: Log the parsed experience_level from JD parser
        console.log('🔍 JD Parser experience_level:', data.experience_level);
        
        // Auto-fill form with parsed data
        setFormData(prev => ({
          ...prev,
          title: parsedTitle,
          description: data.job_summary || prev.description,
          location: data.location || prev.location,
          employmentType: data.employment_type || prev.employmentType,
          salaryRange: data.salary_range || prev.salaryRange,
          department: data.department || prev.department,
          experienceLevel: data.experience_level || prev.experienceLevel,
          workMode: data.work_mode || prev.workMode,
          companyName: data.company_name || prev.companyName,
          // Auto-fill salary fields (only if parsing was successful)
          minSalary: parsedMinSalary || prev.minSalary,
          maxSalary: parsedMaxSalary || prev.maxSalary,
          currency: parsedCurrency,
          // Auto-fill array fields
          requirementsList: data.required_skills || [],
          responsibilitiesList: data.key_responsibilities || [],
          skillsList: data.technical_stack || [],
          benefitsList: data.benefits || [],
        }));
        
        setSuccess(`Job description file uploaded and parsed successfully! Generated ID: ${customId}`);
        setSelectedFile(null); // Clear the selected file
        // Reset file input
        const fileInput = document.getElementById('jd-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(result.error || 'Failed to parse job description file');
      }
    } catch (err) {
      console.error('Error uploading and parsing job description file:', err);
      setError('Failed to upload and parse job description file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const parseJobDescription = async () => {
    if (!rawJobDescription.trim()) {
      setError('Please paste a job description to parse');
      return;
    }

    try {
      setIsParsing(true);
      setError(null);
      
      const result = await JDParserService.parseJobDescription(rawJobDescription);
      
      if (result.success && result.data) {
        const data: NonNullable<JDParserResponse['data']> = result.data;
        
        // Generate custom ID for parsed data
        const parsedTitle = data.job_title || '';
        const customId = parsedTitle ? generateJobDescriptionId(parsedTitle) : '';
        
        // Parse salary range if available
        let parsedMinSalary = '';
        let parsedMaxSalary = '';
        let parsedCurrency = 'INR';
        
        if (data.salary_range) {
          // Parse salary range like "₹2.5L - ₹4L per annum" or "Up to ₹60,000.00 per year"
          const salaryText = data.salary_range;
          
          // Handle "Up to" format
          if (salaryText.toLowerCase().includes('up to')) {
            const upToMatch = salaryText.match(/up to\s*₹?([\d,]+(?:\.\d+)?)/i);
            if (upToMatch) {
              const amount = parseFloat(upToMatch[1].replace(/,/g, ''));
              parsedMinSalary = '0';
              parsedMaxSalary = amount.toString();
              parsedCurrency = 'INR';
            }
          } else {
            // Handle range format like "₹2.5L - ₹4L" or "₹300000 - ₹600000"
            const rangeMatch = salaryText.match(/₹?([\d,]+(?:\.\d+)?)\s*-\s*₹?([\d,]+(?:\.\d+)?)/i);
            if (rangeMatch) {
              const minAmount = parseFloat(rangeMatch[1].replace(/,/g, ''));
              const maxAmount = parseFloat(rangeMatch[2].replace(/,/g, ''));
              
              // Handle "L" suffix (Lakhs)
              if (salaryText.toLowerCase().includes('l')) {
                parsedMinSalary = (minAmount * 100000).toString();
                parsedMaxSalary = (maxAmount * 100000).toString();
              } else {
                parsedMinSalary = minAmount.toString();
                parsedMaxSalary = maxAmount.toString();
              }
              parsedCurrency = 'INR';
            }
          }
        }
        
        // Debug: Log the parsed experience_level from JD parser
        console.log('🔍 JD Parser experience_level:', data.experience_level);
        
        // Auto-fill form with parsed data
        setFormData(prev => ({
          ...prev,
          title: parsedTitle,
          description: data.job_summary || prev.description,
          location: data.location || prev.location,
          employmentType: data.employment_type || prev.employmentType,
          salaryRange: data.salary_range || prev.salaryRange,
          department: data.department || prev.department,
          experienceLevel: data.experience_level || prev.experienceLevel,
          workMode: data.work_mode || prev.workMode,
          companyName: data.company_name || prev.companyName,
          // Auto-fill salary fields (only if parsing was successful)
          minSalary: parsedMinSalary || prev.minSalary,
          maxSalary: parsedMaxSalary || prev.maxSalary,
          currency: parsedCurrency,
          // Auto-fill array fields
          requirementsList: data.required_skills || [],
          responsibilitiesList: data.key_responsibilities || [],
          skillsList: data.technical_stack || [],
          benefitsList: data.benefits || [],
        }));
        
        setSuccess(`Job description parsed successfully! Generated ID: ${customId}`);
        setRawJobDescription(''); // Clear the input
      } else {
        setError(result.error || 'Failed to parse job description');
      }
    } catch (err) {
      console.error('Error parsing job description:', err);
      setError('Failed to parse job description. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.title || !formData.description || !formData.location) {
        setError('Please fill in all required fields (Job Title, Description, and Location)');
        return;
      }

      // Generate custom JD ID
      const customId = generateJobDescriptionId(formData.title);
      
      // Prepare job data for Supabase (matching current schema with snake_case fields)
      const jobData: any = {
        job_description_id: customId, // Custom ID field
        title: formData.title, // Clean title without custom ID prefix
        description: formData.description,
        location: formData.location,
        department: formData.department,
        // Convert arrays to the expected format
        requirements: formData.requirementsList,
        skills: formData.skillsList,
        status: 'active'
      };

      // Add optional fields using correct snake_case field names
      if (formData.employmentType) {
        jobData.employment_type = formData.employmentType;
      }
      // Validate and normalize experience_level
      const validExperienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
      let normalizedExperienceLevel = formData.experienceLevel || 'mid';
      
      // Handle old format values
      if (normalizedExperienceLevel === 'entry-level') normalizedExperienceLevel = 'entry';
      if (normalizedExperienceLevel === 'mid-level') normalizedExperienceLevel = 'mid';
      if (normalizedExperienceLevel === 'senior-level') normalizedExperienceLevel = 'senior';
      
      // Ensure it's a valid value
      if (!validExperienceLevels.includes(normalizedExperienceLevel)) {
        console.log('⚠️ Invalid experience_level:', formData.experienceLevel, 'using default: mid');
        normalizedExperienceLevel = 'mid';
      }
      
      jobData.experience_level = normalizedExperienceLevel;
      console.log('🔍 Setting experience_level:', normalizedExperienceLevel, '(original:', formData.experienceLevel, ')');
      if (formData.responsibilitiesList && formData.responsibilitiesList.length > 0) {
        jobData.responsibilities = formData.responsibilitiesList;
      }
      if (formData.benefitsList && formData.benefitsList.length > 0) {
        jobData.benefits = formData.benefitsList;
      }
      if (formData.minSalary && formData.maxSalary) {
        jobData.salary_min = parseInt(formData.minSalary);
        jobData.salary_max = parseInt(formData.maxSalary);
        jobData.currency = formData.currency;
      }
      if (formData.companyName) {
        jobData.company_name = formData.companyName;
      }
      if (formData.workMode) {
        jobData.work_mode = formData.workMode;
      }
      if (formData.contactEmail) {
        jobData.contact_email = formData.contactEmail;
      }
      if (formData.applicationDeadline) {
        jobData.application_deadline = formData.applicationDeadline;
      }

      // Debug: Log the complete jobData before sending to database
      console.log('🔍 Complete jobData being sent to database:', jobData);
      
      // Create or update job description in Supabase
      let data, error;
      
      if (isEditMode && editJobDescription) {
        // Update existing job description
        const { data: updateData, error: updateError } = await supabase
          .from('job_descriptions')
          .update(jobData)
          .eq('id', editJobDescription.id)
          .select()
          .single();
        data = updateData;
        error = updateError;
      } else {
        // Create new job description
        const { data: insertData, error: insertError } = await supabase
          .from('job_descriptions')
          .insert(jobData)
          .select()
          .single();
        data = insertData;
        error = insertError;
      }
      
      if (error) {
        console.error('Error creating job description:', error);
        setError(error.message);
        return;
      }
      
      setSuccess(isEditMode ? 
        `Job description updated successfully! ID: ${customId}` : 
        `Job description created successfully! ID: ${customId}`
      );
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        employmentType: 'full-time',
        salaryRange: '',
        department: '',
        experienceLevel: 'mid',
        workMode: 'on-site',
        companyName: '',
        contactEmail: '',
        minSalary: '',
        maxSalary: '',
        currency: 'INR',
        requirementsList: [],
        responsibilitiesList: [],
        skillsList: [],
        benefitsList: [],
        applicationDeadline: ''
      });
      setRawJobDescription('');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal after delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);

    } catch (err) {
      console.error('Error creating job description:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job description');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setError(null);
    setSuccess(null);
    setFormData({
      title: '',
      description: '',
      requirements: '',
      location: '',
      employmentType: 'full-time',
      salaryRange: '',
      department: '',
      experienceLevel: 'mid',
      workMode: 'on-site',
      companyName: '',
      contactEmail: '',
      minSalary: '300000',
      maxSalary: '600000',
      currency: 'INR',
      requirementsList: [],
      responsibilitiesList: [],
      skillsList: [],
      benefitsList: [],
      applicationDeadline: ''
    });
    setRawJobDescription('');
    setSelectedFile(null);
    // Reset file input
    const fileInput = document.getElementById('jd-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={isEditMode ? "Edit Job Description" : "Add New Job Description"} size="xl">
      <div className="space-y-6">
        {/* File Upload Section - Hidden in Edit Mode */}
        {!isEditMode && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload JD File</h3>
              <p className="text-gray-600 mb-4">Upload a PDF job description file and we'll automatically extract and fill in the details for you.</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    id="jd-file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="jd-file-upload"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {selectedFile ? selectedFile.name : 'Choose PDF file...'}
                    </span>
                  </label>
                  <Button
                    variant="outline"
                    onClick={uploadAndParseFile}
                    disabled={isUploading || !selectedFile}
                    className="flex-shrink-0"
                  >
                    {isUploading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Parse
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Supported format: PDF only. Maximum file size: 10MB.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Quick Import Section - Hidden in Edit Mode */}
        {!isEditMode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Import</h3>
              <p className="text-gray-600 mb-4">Paste an existing job description and we'll automatically fill in the details for you.</p>
              <div className="space-y-3">
                <textarea
                  value={rawJobDescription}
                  onChange={(e) => setRawJobDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  placeholder="Paste your job description here..."
                />
                <Button
                  variant="outline"
                  onClick={parseJobDescription}
                  disabled={isParsing || !rawJobDescription.trim()}
                  className="w-full"
                >
                  {isParsing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Parse & Auto-Fill
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Form Fields */}
        <div className="space-y-8">
          {/* Job Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Company Name
                 </label>
                 <input
                   type="text"
                   value={formData.companyName}
                   onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  placeholder="e.g., Autoom Studio OPC Pvt. Ltd."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  placeholder="e.g., Bhubaneswar, Odisha"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (3-5 years)</option>
                  <option value="senior">Senior Level (6+ years)</option>
                  <option value="lead">Lead Level (8+ years)</option>
                  <option value="executive">Executive Level (10+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Mode
                </label>
                <select
                  value={formData.workMode}
                  onChange={(e) => handleInputChange('workMode', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salary & Benefits */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Salary & Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary (Per Annum)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={formData.minSalary}
                    onChange={(e) => handleInputChange('minSalary', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    placeholder="300000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary (Per Annum)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={formData.maxSalary}
                    onChange={(e) => handleInputChange('maxSalary', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    placeholder="600000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Job Description</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the role and what makes it unique <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                placeholder="Tell candidates about the role, company culture, growth opportunities, and what makes this position special..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Tip: Include information about your company culture, team, and growth opportunities to attract better candidates.
              </p>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Requirements</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What skills and experience are required?
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., 3+ years of React experience"
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('requirementsList', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addToArray('requirementsList', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 border-ai-teal text-ai-teal hover:bg-ai-teal hover:text-white"
                >
                  Add
                </Button>
              </div>
              {formData.requirementsList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.requirementsList.map((req, index) => (
                    <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>{req}</span>
                      <button
                        onClick={() => removeFromArray('requirementsList', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Responsibilities</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What will the candidate be doing day-to-day?
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., Develop and maintain web applications"
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('responsibilitiesList', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addToArray('responsibilitiesList', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 border-ai-teal text-ai-teal hover:bg-ai-teal hover:text-white"
                >
                  Add
                </Button>
              </div>
              {formData.responsibilitiesList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.responsibilitiesList.map((resp, index) => (
                    <div key={index} className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <span>{resp}</span>
                      <button
                        onClick={() => removeFromArray('responsibilitiesList', index)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Required Skills</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What technical skills are needed?
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., React, Node.js, TypeScript"
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('skillsList', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addToArray('skillsList', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 border-ai-teal text-ai-teal hover:bg-ai-teal hover:text-white"
                >
                  Add
                </Button>
              </div>
              {formData.skillsList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.skillsList.map((skill, index) => (
                    <div key={index} className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      <span>{skill}</span>
                      <button
                        onClick={() => removeFromArray('skillsList', index)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Benefits & Perks */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Benefits & Perks</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What benefits do you offer?
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g., Health insurance, Flexible hours"
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('benefitsList', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      addToArray('benefitsList', input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 border-ai-teal text-ai-teal hover:bg-ai-teal hover:text-white"
                >
                  Add
                </Button>
              </div>
              {formData.benefitsList.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.benefitsList.map((benefit, index) => (
                    <div key={index} className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      <span>{benefit}</span>
                      <button
                        onClick={() => removeFromArray('benefitsList', index)}
                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Contact Email
                 </label>
                 <input
                   type="email"
                   value={formData.contactEmail}
                   onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                  placeholder="hr@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application Deadline
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.applicationDeadline}
                    onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-transparent"
                    placeholder="dd-----yyyy"
                  />
                  <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={closeModal} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update Job Description' : 'Create Job Description'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdvancedAddJobDescriptionModal;
