// Exam Result Details Modal
// Modal for viewing detailed exam results and candidate performance

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Download, Clock, CheckCircle, XCircle, AlertCircle, User, Briefcase, BarChart3, Shield, Globe, AlertTriangle } from 'lucide-react';
import { ExamResultWithDetails } from '../../services/examResultsService';
import { ExamQuestion } from '../../types';
import { examService } from '../../services/examService';
import TextEvaluationDetails from './TextEvaluationDetails';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExamResultDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultId: string | null;
}

const ExamResultDetailsModal: React.FC<ExamResultDetailsModalProps> = ({
  isOpen,
  onClose,
  resultId
}) => {
  const [result, setResult] = useState<ExamResultWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [allQuestions, setAllQuestions] = useState<Array<{ question: ExamQuestion; response?: any; isSkipped: boolean; questionOrder: number }>>([]);
  const [exportingPDF, setExportingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadResultDetails = useCallback(async () => {
    if (!resultId) return;

    try {
      setLoading(true);
      setError(null);

      // Import the service dynamically to avoid circular dependencies
      const { examResultsService } = await import('../../services/examResultsService');
      const response = await examResultsService.getExamResultById(resultId);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to load exam result details');
      }
    } catch (error) {
      console.error('Error loading result details:', error);
      setError('Failed to load exam result details');
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  const loadResponses = useCallback(async () => {
    if (!result || !result.examSessionId) return;

    try {
      setLoadingResponses(true);
      
      // Fetch answered responses
      const responses = await examService.getSessionResponses(result.examSessionId);
      
      // Fetch stored questions for the session
      const storedQuestions = await examService.getStoredSessionQuestions(result.examSessionId);
      
      // Create a map of answered question IDs for quick lookup
      const answeredQuestionIds = new Set(responses.map(r => r.question_id));
      const responseMap = new Map(responses.map(r => [r.question_id, r]));

      // Identify skipped questions and combine with answered questions
      const combinedQuestions: Array<{ question: ExamQuestion; response?: any; isSkipped: boolean; questionOrder: number }> = [];

      if (storedQuestions.length > 0) {
        // If we have stored questions, use them as the source of truth for order
        storedQuestions.forEach((question, index) => {
          const response = responseMap.get(question.id);
          const isSkipped = !answeredQuestionIds.has(question.id);
          
          combinedQuestions.push({
            question,
            response,
            isSkipped,
            questionOrder: index + 1
          });
        });
      } else {
        // Fallback: if no stored questions, only show answered questions (legacy sessions)
        responses.forEach((response, index) => {
          combinedQuestions.push({
            question: response.question || {} as ExamQuestion,
            response,
            isSkipped: false,
            questionOrder: index + 1
          });
        });
      }
      
      setAllQuestions(combinedQuestions);
    } catch (err) {
      console.error('Error loading responses:', err);
    } finally {
      setLoadingResponses(false);
    }
  }, [result]);

  useEffect(() => {
    if (isOpen && resultId) {
      loadResultDetails();
    }
  }, [isOpen, resultId, loadResultDetails]);

  useEffect(() => {
    if (result && result.examSessionId) {
      loadResponses();
    }
  }, [result, loadResponses]);

  const handleClose = () => {
    setResult(null);
    setError(null);
    setAllQuestions([]);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return 'Passed';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending Review';
      default: return status;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportToPDF = async () => {
    if (!result || !contentRef.current) return;

    // Ensure questions are loaded before exporting
    if (loadingResponses) {
      alert('Please wait for questions to finish loading before exporting PDF.');
      return;
    }

    if (allQuestions.length === 0) {
      alert('No questions available to export. Please wait for questions to load.');
      return;
    }

    try {
      setExportingPDF(true);

      // Log question count for debugging
      console.log('PDF Export - Total questions loaded:', allQuestions.length);
      console.log('PDF Export - Expected questions:', result.examSession?.total_questions || 'Unknown');
      
      // Verify completeness
      const expectedQuestions = result.examSession?.total_questions;
      if (expectedQuestions && allQuestions.length !== expectedQuestions) {
        console.warn(`PDF Export Warning: Expected ${expectedQuestions} questions but found ${allQuestions.length}. Proceeding with available questions.`);
      }

      // A4 dimensions in mm
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 15;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
      
      // Convert mm to pixels (assuming 96 DPI)
      const MM_TO_PX = 96 / 25.4; // ~3.7795 pixels per mm
      const contentWidthPx = CONTENT_WIDTH_MM * MM_TO_PX;

      // Create a temporary container for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.width = `${contentWidthPx}px`;
      pdfContent.style.padding = `${MARGIN_MM * MM_TO_PX}px`;
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      document.body.appendChild(pdfContent);

      // Build PDF content HTML
      const candidateName = result.candidate?.name || 'N/A';
      const candidateEmail = result.candidate?.email || 'N/A';
      const candidatePhone = result.candidate?.phone || 'N/A';
      const jobTitle = result.jobDescription?.title || 'N/A';
      const jobDepartment = result.jobDescription?.department || 'N/A';
      const jobExperience = result.jobDescription?.experienceLevel || 'N/A';
      const examDate = formatDate(result.createdAt);

      pdfContent.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 5px; border-bottom: 3px solid #2563eb; padding-bottom: 10px;">Exam Result Details</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Detailed Performance Analysis</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <span>👤</span> Candidate Information
            </h3>
            <div style="font-size: 12px; line-height: 1.8;">
              <div><strong>Name:</strong> ${candidateName}</div>
              <div><strong>Email:</strong> ${candidateEmail}</div>
              <div><strong>Phone:</strong> ${candidatePhone}</div>
            </div>
          </div>

          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
              <span>💼</span> Job Information
            </h3>
            <div style="font-size: 12px; line-height: 1.8;">
              <div><strong>Position:</strong> ${jobTitle}</div>
              <div><strong>Department:</strong> ${jobDepartment}</div>
              <div><strong>Experience Level:</strong> ${jobExperience}</div>
            </div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 20px;">Score Overview</h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center;">
            <div>
              <div style="font-size: 32px; font-weight: bold; color: ${result.percentage >= 90 ? '#16a34a' : result.percentage >= 70 ? '#2563eb' : result.percentage >= 50 ? '#ca8a04' : '#dc2626'};">
                ${result.percentage.toFixed(1)}%
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Overall Score</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #111827;">
                ${result.totalScore}/${result.maxScore}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Points</div>
            </div>
            <div>
              <div style="font-size: 28px; font-weight: bold; color: #111827;">
                ${result.timeTakenMinutes || 0} min
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Time Taken</div>
            </div>
            <div>
              <div style="font-size: 16px; font-weight: 600; color: ${result.evaluationStatus === 'passed' ? '#16a34a' : result.evaluationStatus === 'failed' ? '#dc2626' : '#ca8a04'};">
                ${getStatusText(result.evaluationStatus)}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Status</div>
            </div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 20px;">Answer Breakdown</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0;">
              <div style="font-size: 28px; font-weight: bold; color: #16a34a;">${result.correctAnswers}</div>
              <div style="font-size: 12px; color: #15803d; margin-top: 5px;">Correct Answers</div>
            </div>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #fecaca;">
              <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${result.wrongAnswers}</div>
              <div style="font-size: 12px; color: #991b1b; margin-top: 5px;">Wrong Answers</div>
            </div>
            <div style="background: #fefce8; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #fde047;">
              <div style="font-size: 28px; font-weight: bold; color: #ca8a04;">${result.skippedQuestions}</div>
              <div style="font-size: 12px; color: #854d0e; margin-top: 5px;">Skipped Questions</div>
            </div>
          </div>
        </div>

        ${result.examSession ? `
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 15px;">Exam Session Details</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
              <div><strong>Session ID:</strong> ${result.examSessionId}</div>
              <div><strong>Total Questions:</strong> ${result.examSession?.total_questions || 'N/A'}</div>
              <div><strong>Duration:</strong> ${result.examSession?.duration_minutes || 'N/A'} minutes</div>
              <div><strong>Completed At:</strong> ${examDate}</div>
            </div>
          </div>
        ` : ''}

        ${allQuestions.length > 0 ? `
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 20px;">
              Question Evaluations (${allQuestions.length} of ${result.examSession?.total_questions || allQuestions.length} questions)
            </h3>
            ${allQuestions.map((item, idx) => {
              // Log each question being processed
              if (idx === 0 || idx === Math.floor(allQuestions.length / 2) || idx === allQuestions.length - 1) {
                console.log(`PDF Export - Processing question ${idx + 1}/${allQuestions.length}: Order ${item.questionOrder}, Type: ${item.question.question_type}`);
              }
              
              return `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h4 style="font-weight: 600; color: #111827; font-size: 14px;">
                    Question ${item.questionOrder}: ${item.question.question_type?.toUpperCase() || 'N/A'}
                  </h4>
                  ${item.isSkipped ? 
                    '<span style="background: #fefce8; color: #ca8a04; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Skipped</span>' :
                    item.response ? 
                      `<span style="background: ${item.response.is_correct ? '#f0fdf4' : '#fef2f2'}; color: ${item.response.is_correct ? '#16a34a' : '#dc2626'}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                        ${item.response.is_correct ? '✓ Correct' : '✗ Incorrect'} - ${item.response.points_earned}/${item.question.points || 1} pts
                      </span>` : ''
                  }
                </div>
                <div style="font-size: 12px; color: #374151; margin-bottom: 12px; line-height: 1.6;">
                  <strong>Question:</strong> ${(item.question.question_text || 'Question not available').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
                
                ${item.question.question_type === 'mcq' ? `
                  ${!item.isSkipped && item.response ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                      <div style="background: #dbeafe; border: 1px solid #93c5fd; border-radius: 6px; padding: 10px;">
                        <div style="font-size: 11px; font-weight: 600; color: #1e40af; margin-bottom: 4px;">Candidate's Response:</div>
                        <div style="font-size: 12px; color: #111827; font-weight: 500;">
                          ${(item.response.evaluation_details?.selectedOption || item.response.answer_text || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </div>
                      </div>
                      <div style="background: #d1fae5; border: 1px solid #86efac; border-radius: 6px; padding: 10px;">
                        <div style="font-size: 11px; font-weight: 600; color: #166534; margin-bottom: 4px;">Correct Response:</div>
                        <div style="font-size: 12px; color: #111827; font-weight: 500;">
                          ${(item.response.evaluation_details?.correctOption || item.question.correct_answer || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </div>
                      </div>
                    </div>
                  ` : item.isSkipped ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                      <div style="background: #fef3c7; border: 1px solid #fde047; border-radius: 6px; padding: 10px;">
                        <div style="font-size: 11px; font-weight: 600; color: #92400e; margin-bottom: 4px;">Candidate's Response:</div>
                        <div style="font-size: 12px; color: #92400e; font-style: italic;">Not answered (Skipped)</div>
                      </div>
                      <div style="background: #d1fae5; border: 1px solid #86efac; border-radius: 6px; padding: 10px;">
                        <div style="font-size: 11px; font-weight: 600; color: #166534; margin-bottom: 4px;">Correct Response:</div>
                        <div style="font-size: 12px; color: #111827; font-weight: 500;">
                          ${(item.question.correct_answer || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </div>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${item.question.mcq_options && item.question.mcq_options.length > 0 ? `
                    <div style="margin-bottom: 12px;">
                      <div style="font-size: 11px; font-weight: 600; color: #111827; margin-bottom: 6px;">Options:</div>
                      <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${item.question.mcq_options.map((option: any, optIdx: number) => {
                          const candidateAnswer = !item.isSkipped && item.response 
                            ? (item.response.evaluation_details?.selectedOption || item.response.answer_text)
                            : null;
                          const correctAnswer = item.question.correct_answer 
                            || item.response?.evaluation_details?.correctOption
                            || null;
                          
                          const isSelected = candidateAnswer && (
                            option.option === candidateAnswer || 
                            option.text === candidateAnswer ||
                            (typeof candidateAnswer === 'string' && (candidateAnswer.includes(option.option) || candidateAnswer.includes(option.text)))
                          );
                          const isCorrect = correctAnswer && (
                            option.option === correctAnswer || 
                            option.text === correctAnswer ||
                            (typeof correctAnswer === 'string' && (correctAnswer.includes(option.option) || correctAnswer.includes(option.text)))
                          );
                          
                          const borderColor = isCorrect ? '#16a34a' : isSelected && !isCorrect ? '#dc2626' : '#e5e7eb';
                          const bgColor = isCorrect ? '#f0fdf4' : isSelected && !isCorrect ? '#fef2f2' : '#ffffff';
                          const textColor = isCorrect ? '#15803d' : isSelected ? '#991b1b' : '#374151';
                          
                          const optionText = (option.text || option.option || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                          
                          return `
                            <div style="border: 1px solid ${borderColor}; background: ${bgColor}; border-radius: 4px; padding: 6px;">
                              <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 600; font-size: 12px; color: ${textColor};">${(option.option || String.fromCharCode(65 + optIdx)).replace(/</g, '&lt;').replace(/>/g, '&gt;')}.</span>
                                <span style="font-size: 12px; color: ${textColor};">${optionText}</span>
                                ${isCorrect ? '<span style="color: #16a34a; font-size: 11px; font-weight: 600;">✓</span>' : ''}
                                ${isSelected && !isCorrect ? '<span style="color: #dc2626; font-size: 11px; font-weight: 600;">✗</span>' : ''}
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${!item.isSkipped && item.response && item.response.evaluation_details?.explanation ? `
                    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-top: 8px;">
                      <div style="font-size: 11px; font-weight: 600; color: #111827; margin-bottom: 4px;">Explanations:</div>
                      <div style="font-size: 11px; color: #6b7280; line-height: 1.5;">${(item.response.evaluation_details.explanation || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </div>
                  ` : ''}
                  
                  ${item.isSkipped ? `
                    <div style="background: #fef3c7; border: 1px solid #fde047; border-radius: 6px; padding: 10px; margin-top: 8px;">
                      <div style="font-size: 12px; color: #92400e; font-style: italic;">This question was not answered</div>
                    </div>
                  ` : ''}
                ` : `
                  ${!item.isSkipped && item.response ? `
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.5;">
                      <strong>Answer:</strong> ${(item.response.answer_text || 'N/A').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    </div>
                  ` : item.isSkipped ? `
                    <div style="font-size: 12px; color: #9ca3af; font-style: italic; margin-bottom: 8px;">
                      This question was not answered
                    </div>
                  ` : ''}
                `}
              </div>
            `;
            }).join('')}
          </div>
        ` : `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
            <h3 style="color: #dc2626; font-size: 18px; font-weight: 600; margin-bottom: 10px;">Question Evaluations</h3>
            <p style="color: #991b1b; font-size: 14px;">No questions available to display. Questions may still be loading.</p>
          </div>
        `}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px;">
          Generated on ${new Date().toLocaleString()}
        </div>
      `;

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert to canvas with proper dimensions
      const canvas = await html2canvas(pdfContent, {
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: pdfContent.scrollWidth,
        height: pdfContent.scrollHeight,
        scale: 2 // Higher resolution for better quality
      } as any);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Convert canvas dimensions from pixels to mm
      // Canvas was created with scale: 2, so actual content size is canvas size / 2
      const actualCanvasWidthPx = canvas.width / 2;
      const actualCanvasHeightPx = canvas.height / 2;
      const imgWidthMM = actualCanvasWidthPx / MM_TO_PX;
      const imgHeightMM = actualCanvasHeightPx / MM_TO_PX;
      
      // Calculate the width ratio to fit content width to PDF page width (with margins)
      const widthRatio = CONTENT_WIDTH_MM / imgWidthMM;
      const scaledWidthMM = CONTENT_WIDTH_MM;
      const scaledHeightMM = imgHeightMM * widthRatio;
      
      // Calculate how many pages are needed
      const pageContentHeightMM = A4_HEIGHT_MM - (MARGIN_MM * 2);
      const totalPages = Math.ceil(scaledHeightMM / pageContentHeightMM);
      
      // Add image to PDF, splitting across multiple pages
      let sourceY = 0; // Source Y position in actual pixels (not scaled)
      let remainingHeightMM = scaledHeightMM;
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate the portion of the image to show on this page (in mm)
        const pageHeightMM = Math.min(remainingHeightMM, pageContentHeightMM);
        
        // Calculate corresponding pixel height for this page portion
        // Convert from mm back to actual pixels, then multiply by 2 for canvas scale
        const pageHeightPx = (pageHeightMM / widthRatio) * MM_TO_PX;
        const pageHeightCanvasPx = pageHeightPx * 2; // Account for canvas scale
        
        // Create a temporary canvas for this page's portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightCanvasPx;
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          // Draw the portion of the image for this page
          // Source Y is in actual pixels, need to multiply by 2 for canvas scale
          const sourceYCanvas = sourceY * 2;
          pageCtx.drawImage(
            canvas,
            0, sourceYCanvas, // Source position (in canvas pixels)
            canvas.width, pageHeightCanvasPx, // Source size
            0, 0, // Destination position
            canvas.width, pageHeightCanvasPx // Destination size
          );
          
          // Convert to image data
          const pageImgData = pageCanvas.toDataURL('image/png');
          
          // Add to PDF at the correct position
          pdf.addImage(
            pageImgData,
            'PNG',
            MARGIN_MM,
            MARGIN_MM,
            scaledWidthMM,
            pageHeightMM
          );
          
          // Update source Y position for next page (in actual pixels)
          sourceY += pageHeightPx;
          remainingHeightMM -= pageHeightMM;
        }
      }

      // Clean up
      document.body.removeChild(pdfContent);

      // Download PDF
      const fileName = `exam-result-${candidateName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Exam Result Details</h2>
              <p className="text-sm text-gray-600">Detailed performance analysis</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportToPDF}
              disabled={exportingPDF || !result || loadingResponses || allQuestions.length === 0}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              title={loadingResponses ? "Loading questions..." : allQuestions.length === 0 ? "No questions available" : "Export as PDF"}
            >
              {exportingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <Download className="w-4 h-4" />
                </>
              ) : (
              <Download className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading result details...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6">
              {/* Candidate and Job Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Candidate Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <span className="ml-2 text-gray-900">{result.candidate?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{result.candidate?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900">{result.candidate?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Briefcase className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Job Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Position:</span>
                      <span className="ml-2 text-gray-900">{result.jobDescription?.title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Department:</span>
                      <span className="ml-2 text-gray-900">{result.jobDescription?.department || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Experience Level:</span>
                      <span className="ml-2 text-gray-900">{result.jobDescription?.experienceLevel || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Overview */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Score Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${getScoreColor(result.percentage)}`}>
                      {result.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.totalScore}/{result.maxScore}
                    </div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {result.timeTakenMinutes || 0} min
                    </div>
                    <div className="text-sm text-gray-600">Time Taken</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon(result.evaluationStatus)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(result.evaluationStatus)}`}>
                        {getStatusText(result.evaluationStatus)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Status</div>
                  </div>
                </div>
              </div>

              {/* Answer Breakdown */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Answer Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                    <div className="text-sm text-green-700">Correct Answers</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.wrongAnswers}</div>
                    <div className="text-sm text-red-700">Wrong Answers</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{result.skippedQuestions}</div>
                    <div className="text-sm text-yellow-700">Skipped Questions</div>
                  </div>
                </div>
              </div>

              {/* Category Scores */}
              {(result.technicalScore !== undefined || result.aptitudeScore !== undefined) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Category Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.technicalScore !== undefined && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Technical</span>
                          <span className="text-xl font-bold text-blue-600">{result.technicalScore}</span>
                        </div>
                      </div>
                    )}
                    {result.aptitudeScore !== undefined && (
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-900">Aptitude</span>
                          <span className="text-xl font-bold text-purple-600">{result.aptitudeScore}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Security & IP Information - Prominent Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Security & IP Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* IP Address */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">IP Address</span>
                    </div>
                    {result.examSession?.ip_address ? (
                      <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                        {result.examSession.ip_address}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not available</p>
                    )}
                  </div>
                  
                  {/* User Agent */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">User Agent</span>
                    </div>
                    {result.examSession?.user_agent ? (
                      <p className="text-xs text-gray-900 bg-gray-50 p-2 rounded break-words max-h-20 overflow-y-auto">
                        {result.examSession.user_agent}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Not available</p>
                    )}
                  </div>
                </div>

                {/* Security Violations Summary */}
                {result.securityViolations && result.securityViolations.length > 0 ? (
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-semibold text-gray-900">Security Violations Detected</span>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        {result.securityViolations.length} Total
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      {result.securityViolations.filter((v: any) => v.severity === 'high').length > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                          {result.securityViolations.filter((v: any) => v.severity === 'high').length} High
                        </span>
                      )}
                      {result.securityViolations.filter((v: any) => v.severity === 'medium').length > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                          {result.securityViolations.filter((v: any) => v.severity === 'medium').length} Medium
                        </span>
                      )}
                      {result.securityViolations.filter((v: any) => v.severity === 'low').length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                          {result.securityViolations.filter((v: any) => v.severity === 'low').length} Low
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">No Security Violations</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">No security violations detected during this exam session.</p>
                  </div>
                )}
              </div>

              {/* Detailed Security Violations */}
              {result.securityViolations && result.securityViolations.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-gray-900">Security Violations Details</h3>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                      {result.securityViolations.length} Total
                    </span>
                  </div>
                  <div className="space-y-3">
                    {result.securityViolations.map((violation: any, index: number) => (
                      <div key={violation.id || index} className={`border-l-4 rounded p-3 ${
                        violation.severity === 'high' ? 'border-red-500 bg-red-50' :
                        violation.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                violation.severity === 'high' ? 'bg-red-200 text-red-800' :
                                violation.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {violation.severity.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {violation.violation_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{violation.violation_details}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(violation.timestamp)}
                            </p>
                          </div>
                          {violation.severity === 'high' && (
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Session Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Exam Session Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Session ID:</span>
                    <span className="ml-2 text-gray-900 font-mono text-sm">{result.examSessionId}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total Questions:</span>
                    <span className="ml-2 text-gray-900">{result.examSession?.total_questions || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Duration:</span>
                    <span className="ml-2 text-gray-900">{result.examSession?.duration_minutes || 'N/A'} minutes</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Completed At:</span>
                    <span className="ml-2 text-gray-900">{formatDate(result.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Question Evaluations */}
              {result.examSession && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Question Evaluations</h3>
                  <div className="space-y-4">
                    {loadingResponses ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p>Loading question evaluations...</p>
                      </div>
                    ) : allQuestions.length > 0 ? (
                      allQuestions.map((item) => (
                        <div key={item.question.id || `question-${item.questionOrder}`} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              Question {item.questionOrder}: {item.question.question_type?.toUpperCase() || 'N/A'}
                            </h4>
                            <div className="flex items-center space-x-2">
                              {item.isSkipped ? (
                                <>
                                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-yellow-600 bg-yellow-100">
                                    Skipped
                                  </span>
                                </>
                              ) : item.response ? (
                                <>
                                  {item.response.is_correct ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                  <span className="text-sm font-medium text-gray-600">
                                    {item.response.points_earned}/{item.question.points || 1} points
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 mb-3">
                              <strong>Question:</strong> {item.question.question_text || 'Question not available'}
                            </p>
                            
                            {/* MCQ Structured Display */}
                            {item.question.question_type === 'mcq' && (
                              <>
                                {/* Candidate's Response vs Correct Response - Side by side */}
                                {!item.isSkipped && item.response && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-blue-900 mb-1">Candidate's Response:</p>
                                      <p className="text-sm text-gray-900 font-medium">
                                        {item.response.evaluation_details?.selectedOption || item.response.answer_text || 'N/A'}
                                      </p>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-green-900 mb-1">Correct Response:</p>
                                      <p className="text-sm text-gray-900 font-medium">
                                        {item.response.evaluation_details?.correctOption || item.question.correct_answer || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Options List */}
                                {item.question.mcq_options && item.question.mcq_options.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-900 mb-2">Options:</p>
                                    <div className="space-y-2">
                                      {item.question.mcq_options.map((option, optIdx) => {
                                        const candidateAnswer = !item.isSkipped && item.response 
                                          ? (item.response.evaluation_details?.selectedOption || item.response.answer_text)
                                          : null;
                                        const correctAnswer = item.question.correct_answer 
                                          || item.response?.evaluation_details?.correctOption
                                          || null;
                                        
                                        const isSelected = candidateAnswer && (
                                          option.option === candidateAnswer || 
                                          option.text === candidateAnswer ||
                                          candidateAnswer.includes(option.option) ||
                                          candidateAnswer.includes(option.text)
                                        );
                                        const isCorrect = correctAnswer && (
                                          option.option === correctAnswer || 
                                          option.text === correctAnswer ||
                                          correctAnswer.includes(option.option) ||
                                          correctAnswer.includes(option.text)
                                        );
                                        
                                        return (
                                          <div
                                            key={optIdx}
                                            className={`p-2 rounded-lg border ${
                                              isCorrect
                                                ? 'border-green-500 bg-green-50'
                                                : isSelected && !isCorrect
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-200 bg-white'
                                            }`}
                                          >
                                            <div className="flex items-center space-x-2">
                                              <span className={`font-semibold text-sm ${
                                                isCorrect ? 'text-green-700' : isSelected ? 'text-red-700' : 'text-gray-700'
                                              }`}>
                                                {option.option}.
                                              </span>
                                              <span className={`text-sm ${
                                                isCorrect ? 'text-green-700' : isSelected ? 'text-red-700' : 'text-gray-700'
                                              }`}>
                                                {option.text}
                                              </span>
                                              {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                                              {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Explanations */}
                                {!item.isSkipped && item.response && item.response.evaluation_details?.explanation && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-gray-900 mb-2">Explanations:</p>
                                    <p className="text-sm text-gray-700">{item.response.evaluation_details.explanation}</p>
                                  </div>
                                )}
                                
                                {item.isSkipped && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800 italic">
                                      This question was not answered
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Non-MCQ questions */}
                            {item.question.question_type !== 'mcq' && (
                              <>
                            {!item.isSkipped && item.response && (
                              <p className="text-sm text-gray-600">
                                <strong>Answer:</strong> {item.response.answer_text}
                              </p>
                            )}
                            {item.isSkipped && (
                              <p className="text-sm text-gray-500 italic">
                                This question was not answered
                              </p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Text Evaluation Details - Only for answered questions */}
                          {!item.isSkipped && item.response && item.question.question_type === 'text' && item.response.evaluation_details && (
                            <TextEvaluationDetails
                              evaluationDetails={item.response.evaluation_details}
                              question={item.question}
                              candidateAnswer={item.response.answer_text}
                              isCorrect={item.response.is_correct || false}
                              score={item.response.points_earned}
                              maxScore={item.question.points}
                            />
                          )}

                          {/* Basic evaluation for answered questions without detailed evaluation */}
                          {!item.isSkipped && item.response && !item.response.evaluation_details && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-sm text-gray-600">
                                <strong>Status:</strong> {item.response.is_correct ? 'Correct' : 'Incorrect'}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Points Earned:</strong> {item.response.points_earned}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Time Taken:</strong> {item.response.time_taken_seconds || 'N/A'} seconds
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No question evaluations available</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Responses may not be loaded or evaluation is still in progress
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Evaluation */}
              {result.aiEvaluation && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">AI Evaluation</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(result.aiEvaluation, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-white rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResultDetailsModal;

