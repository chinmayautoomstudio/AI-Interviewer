# Exam System - Security & Performance Implementation

## 🔒 Security Architecture Overview

The exam system implements multiple layers of security to ensure fair testing, prevent cheating, and protect candidate data. Security measures span from token-based authentication to real-time monitoring.

## 🛡️ 1. Authentication & Authorization

### Token-Based Security

```typescript
// Secure exam token generation
export class ExamSecurityService {
  static generateSecureToken(): string {
    // Generate cryptographically secure token
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Add timestamp and hash for additional security
    const timestamp = Date.now().toString(36);
    const hash = btoa(token + timestamp + 'exam_salt_2024').slice(0, 16);
    
    return `${token.slice(0, 16)}-${timestamp}-${hash}`;
  }

  static validateToken(token: string): { valid: boolean; error?: string } {
    try {
      // Token format: {16-char-hex}-{timestamp}-{hash}
      const parts = token.split('-');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const [tokenPart, timestamp, hash] = parts;
      
      // Validate token length and format
      if (tokenPart.length !== 16 || !/^[0-9a-f]+$/.test(tokenPart)) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Check token expiry (48 hours)
      const tokenTime = parseInt(timestamp, 36);
      const now = Date.now();
      const maxAge = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
      
      if (now - tokenTime > maxAge) {
        return { valid: false, error: 'Token expired' };
      }

      // Validate hash
      const expectedHash = btoa(tokenPart + timestamp + 'exam_salt_2024').slice(0, 16);
      if (hash !== expectedHash) {
        return { valid: false, error: 'Token tampered with' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Token validation failed' };
    }
  }
}
```

### Session Management

```typescript
// Secure session handling
export class ExamSessionSecurity {
  static async createSecureSession(candidateId: string, jobDescriptionId: string): Promise<{
    success: boolean;
    sessionId?: string;
    token?: string;
    error?: string;
  }> {
    try {
      // Generate secure token
      const token = ExamSecurityService.generateSecureToken();
      
      // Create session with security metadata
      const sessionData = {
        candidate_id: candidateId,
        job_description_id: jobDescriptionId,
        exam_token: token,
        status: 'pending',
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        security_metadata: {
          token_generated_at: new Date().toISOString(),
          candidate_verified: true,
          session_encrypted: true
        }
      };

      const { data, error } = await supabase
        .from('exam_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, sessionId: data.id, token };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create session' 
      };
    }
  }

  static async validateSessionAccess(token: string, candidateId: string): Promise<{
    valid: boolean;
    session?: any;
    error?: string;
  }> {
    try {
      // Validate token format and expiry
      const tokenValidation = ExamSecurityService.validateToken(token);
      if (!tokenValidation.valid) {
        return { valid: false, error: tokenValidation.error };
      }

      // Get session from database
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('exam_token', token)
        .eq('candidate_id', candidateId)
        .single();

      if (error || !session) {
        return { valid: false, error: 'Session not found' };
      }

      // Check session status
      if (session.status === 'expired' || session.status === 'completed') {
        return { valid: false, error: 'Session no longer active' };
      }

      // Check expiry
      if (new Date(session.expires_at) < new Date()) {
        // Mark session as expired
        await supabase
          .from('exam_sessions')
          .update({ status: 'expired' })
          .eq('id', session.id);
        
        return { valid: false, error: 'Session expired' };
      }

      return { valid: true, session };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Session validation failed' 
      };
    }
  }

  private static async getClientIP(): Promise<string> {
    try {
      // In production, this would be handled by the server
      // For now, we'll use a placeholder
      return 'client-ip-placeholder';
    } catch {
      return 'unknown';
    }
  }
}
```

## 🔐 2. Anti-Cheating Measures

### Browser Security

```typescript
// Anti-cheating browser detection
export class AntiCheatingService {
  static initializeSecurityChecks(): {
    visibilityCheck: () => void;
    tabSwitchDetection: () => void;
    copyPastePrevention: () => void;
    rightClickDisable: () => void;
  } {
    // Page visibility detection
    const visibilityCheck = () => {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.handleTabSwitch();
        }
      });
    };

    // Tab switch detection
    const tabSwitchDetection = () => {
      window.addEventListener('blur', () => {
        this.handleTabSwitch();
      });
      
      window.addEventListener('focus', () => {
        this.handleTabFocus();
      });
    };

    // Copy-paste prevention
    const copyPastePrevention = () => {
      document.addEventListener('copy', (e) => {
        e.preventDefault();
        this.logSecurityViolation('copy_attempt');
      });
      
      document.addEventListener('paste', (e) => {
        e.preventDefault();
        this.logSecurityViolation('paste_attempt');
      });
      
      document.addEventListener('cut', (e) => {
        e.preventDefault();
        this.logSecurityViolation('cut_attempt');
      });
    };

    // Right-click disable
    const rightClickDisable = () => {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.logSecurityViolation('right_click_attempt');
      });
    };

    return {
      visibilityCheck,
      tabSwitchDetection,
      copyPastePrevention,
      rightClickDisable
    };
  }

  private static handleTabSwitch(): void {
    // Log tab switch event
    this.logSecurityViolation('tab_switch');
    
    // Show warning to candidate
    this.showSecurityWarning('Please stay on the exam page. Multiple tab switches may result in exam termination.');
  }

  private static handleTabFocus(): void {
    // Reset warning state when candidate returns
    this.hideSecurityWarning();
  }

  private static logSecurityViolation(type: string): void {
    // Send security violation to server
    fetch('/api/security-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }).catch(console.error);
  }

  private static showSecurityWarning(message: string): void {
    // Create warning overlay
    const warning = document.createElement('div');
    warning.id = 'security-warning';
    warning.className = 'fixed top-0 left-0 w-full h-full bg-red-500 bg-opacity-90 flex items-center justify-center z-50';
    warning.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
        <div class="text-red-600 text-4xl mb-4">⚠️</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Security Warning</h3>
        <p class="text-gray-700 mb-4">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          I Understand
        </button>
      </div>
    `;
    document.body.appendChild(warning);
  }

  private static hideSecurityWarning(): void {
    const warning = document.getElementById('security-warning');
    if (warning) {
      warning.remove();
    }
  }
}
```

### Answer Submission Security

```typescript
// Secure answer submission
export class AnswerSubmissionSecurity {
  static async submitAnswerSecurely(
    sessionId: string, 
    questionId: string, 
    answer: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate session is still active
      const sessionValidation = await this.validateActiveSession(sessionId);
      if (!sessionValidation.valid) {
        return { success: false, error: sessionValidation.error };
      }

      // Rate limiting check
      const rateLimitCheck = await this.checkRateLimit(sessionId);
      if (!rateLimitCheck.allowed) {
        return { success: false, error: 'Too many submissions. Please wait.' };
      }

      // Validate answer format
      const answerValidation = this.validateAnswerFormat(answer);
      if (!answerValidation.valid) {
        return { success: false, error: answerValidation.error };
      }

      // Submit answer with security metadata
      const submissionData = {
        exam_session_id: sessionId,
        question_id: questionId,
        answer_text: answer,
        answered_at: new Date().toISOString(),
        security_metadata: {
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          submission_timestamp: Date.now(),
          answer_length: answer.length,
          time_taken: await this.calculateTimeTaken(questionId)
        }
      };

      const { error } = await supabase
        .from('exam_responses')
        .upsert(submissionData, { 
          onConflict: 'exam_session_id,question_id' 
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Log successful submission
      await this.logSubmission(sessionId, questionId, 'success');

      return { success: true };
    } catch (error) {
      await this.logSubmission(sessionId, questionId, 'error', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Submission failed' 
      };
    }
  }

  private static async validateActiveSession(sessionId: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('status, expires_at, started_at')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    if (session.status !== 'in_progress') {
      return { valid: false, error: 'Session not active' };
    }

    if (new Date(session.expires_at) < new Date()) {
      return { valid: false, error: 'Session expired' };
    }

    return { valid: true };
  }

  private static async checkRateLimit(sessionId: string): Promise<{ allowed: boolean }> {
    // Check submissions in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('exam_responses')
      .select('*', { count: 'exact', head: true })
      .eq('exam_session_id', sessionId)
      .gte('answered_at', oneMinuteAgo);

    // Allow max 10 submissions per minute
    return { allowed: (count || 0) < 10 };
  }

  private static validateAnswerFormat(answer: string): { valid: boolean; error?: string } {
    if (!answer || answer.trim().length === 0) {
      return { valid: false, error: 'Answer cannot be empty' };
    }

    if (answer.length > 5000) {
      return { valid: false, error: 'Answer too long (max 5000 characters)' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /onclick/i,
      /onload/i,
      /eval\(/i,
      /document\./i,
      /window\./i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(answer)) {
        return { valid: false, error: 'Answer contains invalid content' };
      }
    }

    return { valid: true };
  }

  private static async calculateTimeTaken(questionId: string): Promise<number> {
    // This would track time spent on each question
    // Implementation depends on how you're tracking question start times
    return 0; // Placeholder
  }

  private static async logSubmission(
    sessionId: string, 
    questionId: string, 
    status: 'success' | 'error', 
    error?: any
  ): Promise<void> {
    await supabase
      .from('exam_security_logs')
      .insert({
        exam_session_id: sessionId,
        question_id: questionId,
        event_type: 'answer_submission',
        status,
        error_message: error?.message,
        timestamp: new Date().toISOString()
      });
  }
}
```

## 🚀 3. Performance Optimization

### Database Performance

```sql
-- Optimized indexes for concurrent access
CREATE INDEX CONCURRENTLY idx_exam_sessions_token_active 
ON exam_sessions(exam_token) 
WHERE status IN ('pending', 'in_progress');

CREATE INDEX CONCURRENTLY idx_exam_responses_session_question 
ON exam_responses(exam_session_id, question_id) 
INCLUDE (answer_text, is_correct, points_earned);

CREATE INDEX CONCURRENTLY idx_exam_questions_job_active 
ON exam_questions(job_description_id, question_category, difficulty_level) 
WHERE status = 'approved' AND is_active = true;

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_exam_sessions_active_candidates 
ON exam_sessions(candidate_id, started_at) 
WHERE status = 'in_progress';

CREATE INDEX CONCURRENTLY idx_exam_results_recent 
ON exam_results(candidate_id, created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Connection Pooling

```typescript
// Supabase connection optimization
export class DatabasePerformanceService {
  static async optimizeConnection(): Promise<void> {
    // Configure connection pooling
    const supabaseConfig = {
      db: {
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          createTimeoutMillis: 30000,
          destroyTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
          reapIntervalMillis: 1000,
          createRetryIntervalMillis: 200
        }
      }
    };

    // Enable query optimization
    await supabase.rpc('enable_query_optimization');
  }

  static async batchInsertAnswers(responses: Array<{
    exam_session_id: string;
    question_id: string;
    answer_text: string;
    answered_at: string;
  }>): Promise<{ success: boolean; error?: string }> {
    try {
      // Batch insert for better performance
      const { error } = await supabase
        .from('exam_responses')
        .insert(responses);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch insert failed' 
      };
    }
  }

  static async getQuestionsBatch(questionIds: string[]): Promise<{
    questions: any[];
    error?: string;
  }> {
    try {
      // Use IN clause for efficient batch retrieval
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .in('id', questionIds);

      if (error) {
        return { questions: [], error: error.message };
      }

      return { questions: data || [] };
    } catch (error) {
      return { 
        questions: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch questions' 
      };
    }
  }
}
```

### Caching Strategy

```typescript
// Redis-like caching for frequently accessed data
export class ExamCacheService {
  private static cache = new Map<string, { data: any; expiry: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  static async getCachedQuestions(jobDescriptionId: string): Promise<any[]> {
    const cacheKey = `questions_${jobDescriptionId}`;
    let questions = this.get(cacheKey);

    if (!questions) {
      // Fetch from database
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('job_description_id', jobDescriptionId)
        .eq('status', 'approved')
        .eq('is_active', true);

      if (error) {
        throw new Error(error.message);
      }

      questions = data || [];
      this.set(cacheKey, questions, 10 * 60 * 1000); // Cache for 10 minutes
    }

    return questions;
  }

  static async getCachedSession(sessionId: string): Promise<any | null> {
    const cacheKey = `session_${sessionId}`;
    let session = this.get(cacheKey);

    if (!session) {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        return null;
      }

      session = data;
      this.set(cacheKey, session, 2 * 60 * 1000); // Cache for 2 minutes
    }

    return session;
  }

  static invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## 📊 4. Real-time Monitoring

### Performance Metrics

```typescript
// Real-time performance monitoring
export class ExamMonitoringService {
  static async trackExamMetrics(sessionId: string, metrics: {
    questionsAnswered: number;
    timeElapsed: number;
    accuracyRate: number;
    avgTimePerQuestion: number;
  }): Promise<void> {
    try {
      // Store metrics in database
      await supabase
        .from('exam_performance_metrics')
        .insert({
          exam_session_id: sessionId,
          questions_answered: metrics.questionsAnswered,
          time_elapsed_minutes: metrics.timeElapsed,
          accuracy_rate: metrics.accuracyRate,
          avg_time_per_question: metrics.avgTimePerQuestion,
          recorded_at: new Date().toISOString()
        });

      // Send to real-time monitoring service
      this.sendToMonitoringService(sessionId, metrics);
    } catch (error) {
      console.error('Failed to track exam metrics:', error);
    }
  }

  static async trackSystemPerformance(): Promise<void> {
    const metrics = {
      activeSessions: await this.getActiveSessionCount(),
      avgResponseTime: await this.getAverageResponseTime(),
      errorRate: await this.getErrorRate(),
      memoryUsage: process.memoryUsage?.() || null,
      timestamp: new Date().toISOString()
    };

    // Log to monitoring system
    console.log('System Performance Metrics:', metrics);

    // Store in database for historical analysis
    await supabase
      .from('system_performance_metrics')
      .insert(metrics);
  }

  private static async getActiveSessionCount(): Promise<number> {
    const { count } = await supabase
      .from('exam_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');
    
    return count || 0;
  }

  private static async getAverageResponseTime(): Promise<number> {
    // This would calculate average API response time
    // Implementation depends on your monitoring setup
    return 0;
  }

  private static async getErrorRate(): Promise<number> {
    // Calculate error rate from recent logs
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count: errorCount } = await supabase
      .from('exam_security_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error')
      .gte('timestamp', oneHourAgo);

    const { count: totalCount } = await supabase
      .from('exam_security_logs')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', oneHourAgo);

    return totalCount ? (errorCount || 0) / totalCount : 0;
  }

  private static sendToMonitoringService(sessionId: string, metrics: any): void {
    // Send to external monitoring service (e.g., DataDog, New Relic)
    if (process.env.REACT_APP_MONITORING_ENDPOINT) {
      fetch(process.env.REACT_APP_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          metrics,
          timestamp: new Date().toISOString()
        })
      }).catch(console.error);
    }
  }
}
```

### Security Monitoring

```typescript
// Security event monitoring
export class SecurityMonitoringService {
  static async logSecurityEvent(event: {
    type: 'tab_switch' | 'copy_attempt' | 'paste_attempt' | 'right_click' | 'suspicious_answer';
    sessionId: string;
    candidateId: string;
    details: any;
  }): Promise<void> {
    try {
      await supabase
        .from('exam_security_logs')
        .insert({
          exam_session_id: event.sessionId,
          candidate_id: event.candidateId,
          event_type: event.type,
          event_details: event.details,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      // Check for suspicious patterns
      await this.checkSuspiciousActivity(event.sessionId, event.candidateId);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private static async checkSuspiciousActivity(sessionId: string, candidateId: string): Promise<void> {
    // Check for multiple security violations
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('exam_security_logs')
      .select('*', { count: 'exact', head: true })
      .eq('exam_session_id', sessionId)
      .gte('timestamp', oneHourAgo);

    // If more than 5 violations in an hour, flag for review
    if ((count || 0) > 5) {
      await this.flagForReview(sessionId, candidateId, 'Multiple security violations');
    }
  }

  private static async flagForReview(sessionId: string, candidateId: string, reason: string): Promise<void> {
    await supabase
      .from('exam_security_flags')
      .insert({
        exam_session_id: sessionId,
        candidate_id: candidateId,
        flag_reason: reason,
        severity: 'high',
        created_at: new Date().toISOString()
      });
  }

  private static async getClientIP(): Promise<string> {
    // This would be implemented based on your infrastructure
    return 'client-ip-placeholder';
  }
}
```

## 🔧 5. Load Testing & Scalability

### Load Testing Configuration

```typescript
// Load testing utilities
export class LoadTestingService {
  static async simulateConcurrentUsers(userCount: number): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
  }> {
    const results: any[] = [];
    const errors: string[] = [];

    // Create concurrent user simulations
    const promises = Array.from({ length: userCount }, (_, index) => 
      this.simulateUser(index)
    );

    try {
      const userResults = await Promise.allSettled(promises);
      
      userResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push(`User ${index}: ${result.reason}`);
        }
      });

      return { success: true, results, errors };
    } catch (error) {
      return { 
        success: false, 
        results, 
        errors: [error instanceof Error ? error.message : 'Load test failed'] 
      };
    }
  }

  private static async simulateUser(userIndex: number): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Simulate user actions
      const session = await this.createTestSession(userIndex);
      const questions = await this.getTestQuestions();
      
      // Simulate answering questions
      const answers = await this.simulateAnswers(session.id, questions);
      
      // Complete exam
      const result = await this.completeTestExam(session.id);
      
      return {
        userIndex,
        duration: Date.now() - startTime,
        questionsAnswered: answers.length,
        success: true
      };
    } catch (error) {
      return {
        userIndex,
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async createTestSession(userIndex: number): Promise<any> {
    // Create test session for load testing
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert({
        candidate_id: `test-candidate-${userIndex}`,
        job_description_id: 'test-job-id',
        exam_token: `test-token-${userIndex}-${Date.now()}`,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        total_questions: 15,
        questions_list: Array.from({ length: 15 }, (_, i) => ({
          id: `test-question-${i}`,
          category: i < 10 ? 'technical' : 'aptitude',
          difficulty: 'medium'
        }))
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async getTestQuestions(): Promise<any[]> {
    // Get test questions for simulation
    const { data, error } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(15);

    if (error) throw error;
    return data || [];
  }

  private static async simulateAnswers(sessionId: string, questions: any[]): Promise<any[]> {
    const answers = [];
    
    for (const question of questions) {
      const answer = question.question_type === 'mcq' ? 'A' : 'Test answer';
      
      const { error } = await supabase
        .from('exam_responses')
        .insert({
          exam_session_id: sessionId,
          question_id: question.id,
          answer_text: answer,
          is_correct: Math.random() > 0.3, // 70% correct rate
          points_earned: Math.random() > 0.3 ? question.points : 0,
          time_taken_seconds: Math.floor(Math.random() * 60) + 30,
          answered_at: new Date().toISOString()
        });

      if (!error) {
        answers.push({ questionId: question.id, answer });
      }
    }

    return answers;
  }

  private static async completeTestExam(sessionId: string): Promise<any> {
    // Complete the test exam
    const { data, error } = await supabase
      .from('exam_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

## 📈 6. Performance Benchmarks

### Expected Performance Metrics

```typescript
// Performance benchmarks and targets
export const PERFORMANCE_TARGETS = {
  // Response Times
  API_RESPONSE_TIME: 200, // ms
  QUESTION_LOAD_TIME: 500, // ms
  ANSWER_SUBMISSION_TIME: 300, // ms
  RESULTS_CALCULATION_TIME: 1000, // ms

  // Throughput
  CONCURRENT_USERS: 60,
  QUESTIONS_PER_SECOND: 10,
  ANSWERS_PER_SECOND: 50,
  SESSIONS_PER_MINUTE: 20,

  // Resource Usage
  MAX_MEMORY_USAGE: 512, // MB
  MAX_CPU_USAGE: 80, // %
  DATABASE_CONNECTIONS: 20,
  CACHE_HIT_RATIO: 0.85, // 85%

  // Error Rates
  MAX_ERROR_RATE: 0.01, // 1%
  MAX_TIMEOUT_RATE: 0.005, // 0.5%
  MAX_FAILURE_RATE: 0.02, // 2%
};

// Performance monitoring
export class PerformanceBenchmark {
  static async runBenchmarks(): Promise<{
    passed: boolean;
    results: any[];
    recommendations: string[];
  }> {
    const results: any[] = [];
    const recommendations: string[] = [];

    // Test API response times
    const apiResponseTime = await this.testAPIResponseTime();
    results.push(apiResponseTime);
    if (apiResponseTime.value > PERFORMANCE_TARGETS.API_RESPONSE_TIME) {
      recommendations.push('API response time exceeds target. Consider caching or optimization.');
    }

    // Test concurrent user capacity
    const concurrentUsers = await this.testConcurrentUsers();
    results.push(concurrentUsers);
    if (concurrentUsers.value < PERFORMANCE_TARGETS.CONCURRENT_USERS) {
      recommendations.push('Concurrent user capacity below target. Consider scaling infrastructure.');
    }

    // Test database performance
    const dbPerformance = await this.testDatabasePerformance();
    results.push(dbPerformance);
    if (dbPerformance.value < PERFORMANCE_TARGETS.CACHE_HIT_RATIO) {
      recommendations.push('Database cache hit ratio below target. Consider query optimization.');
    }

    const passed = results.every(r => r.passed);
    return { passed, results, recommendations };
  }

  private static async testAPIResponseTime(): Promise<{ name: string; value: number; passed: boolean }> {
    const startTime = Date.now();
    
    try {
      await fetch('/api/test-endpoint');
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'API Response Time',
        value: responseTime,
        passed: responseTime <= PERFORMANCE_TARGETS.API_RESPONSE_TIME
      };
    } catch (error) {
      return {
        name: 'API Response Time',
        value: Infinity,
        passed: false
      };
    }
  }

  private static async testConcurrentUsers(): Promise<{ name: string; value: number; passed: boolean }> {
    const maxUsers = await LoadTestingService.simulateConcurrentUsers(60);
    const successfulUsers = maxUsers.results.filter(r => r.success).length;
    
    return {
      name: 'Concurrent Users',
      value: successfulUsers,
      passed: successfulUsers >= PERFORMANCE_TARGETS.CONCURRENT_USERS
    };
  }

  private static async testDatabasePerformance(): Promise<{ name: string; value: number; passed: boolean }> {
    // Test database query performance
    const startTime = Date.now();
    
    try {
      await supabase.from('exam_questions').select('*').limit(100);
      const queryTime = Date.now() - startTime;
      
      return {
        name: 'Database Query Time',
        value: queryTime,
        passed: queryTime <= 1000 // 1 second target
      };
    } catch (error) {
      return {
        name: 'Database Query Time',
        value: Infinity,
        passed: false
      };
    }
  }
}
```

---

**Next Steps**: Review the implementation checklist in `EXAM_IMPLEMENTATION_CHECKLIST.md`
