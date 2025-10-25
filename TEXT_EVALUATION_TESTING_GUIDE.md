# Text Evaluation Testing Guide

## 🧪 **How to Test Text Evaluation System**

This guide provides multiple ways to test the text evaluation system we just implemented.

## **Prerequisites**

1. **n8n Workflow Setup**: Make sure your n8n instance is running and the text evaluation workflow is deployed
2. **Environment Variables**: Set the `REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK` environment variable
3. **Database Access**: Ensure you have access to the Supabase database

## **Testing Methods**

### **Method 1: Quick Webhook Test**

Test if your n8n webhook is accessible:

```bash
cd ai-interviewer
node test-n8n-webhook.js
```

This will:
- Test webhook connectivity
- Send a sample evaluation request
- Show response status and data

### **Method 2: Create Test Data and Evaluate**

1. **Add Test Text Questions**:
```bash
# Run this SQL script in your Supabase SQL editor
psql -f test-text-questions.sql
```

2. **Create Test Exam Session**:
```bash
node test-text-evaluation.js
```

This will:
- Create test text questions
- Create a test candidate
- Create a test exam session with text responses
- Prepare data for evaluation

### **Method 3: Manual Evaluation Test**

Test with existing exam data:

```bash
node manual-text-evaluation-test.js
```

This will:
- Find existing exam sessions with text questions
- Prepare evaluation request data
- Show you the JSON to send to n8n

### **Method 4: UI Testing**

1. **Start the application**:
```bash
npm start
```

2. **Navigate to Exam Results page**:
   - Go to `/admin/exam-results`
   - Find an exam with text questions
   - Click the brain icon (🧠) to trigger text evaluation

3. **View Results**:
   - Click the eye icon (👁️) to view detailed results
   - Check the "Question Evaluations" section
   - Look for text evaluation details

## **Testing Scenarios**

### **Scenario 1: Basic Text Evaluation**

**Test Data**:
- Question: "What is JavaScript?"
- Expected Keywords: "programming", "language", "web", "browser"
- Candidate Answer: "JavaScript is a programming language used for web development."

**Expected Result**:
- High technical accuracy score
- Good completeness score
- Clear explanation
- Keywords found: "programming", "language"

### **Scenario 2: Incomplete Answer**

**Test Data**:
- Question: "Explain React hooks with examples"
- Expected Keywords: "hooks", "useState", "useEffect", "functional components"
- Candidate Answer: "Hooks are functions in React."

**Expected Result**:
- Low completeness score
- Missing keywords identified
- Suggestions for improvement

### **Scenario 3: Excellent Answer**

**Test Data**:
- Question: "How would you optimize a slow website?"
- Expected Keywords: "performance", "caching", "compression", "CDN", "lazy loading"
- Candidate Answer: "I would optimize images, enable caching, use CDN, implement lazy loading, minify CSS/JS, and optimize database queries."

**Expected Result**:
- High scores across all criteria
- All keywords found
- Positive feedback with strengths

## **Expected Evaluation Results**

### **Score Breakdown**:
- **Technical Accuracy (40%)**: Factual correctness
- **Completeness (30%)**: Coverage of key points
- **Clarity (20%)**: Structure and communication
- **Relevance (10%)**: Applicability to question

### **Feedback Components**:
- **Overall Assessment**: Summary of the answer
- **Strengths**: What the candidate did well
- **Weaknesses**: Areas for improvement
- **Suggestions**: Specific recommendations

### **Keyword Analysis**:
- **Keywords Found**: Expected keywords present in answer
- **Missing Keywords**: Important concepts not mentioned
- **Coverage Percentage**: Percentage of expected keywords found

## **Troubleshooting**

### **Common Issues**:

1. **Webhook Not Accessible**:
   - Check n8n instance is running
   - Verify webhook URL is correct
   - Check network connectivity

2. **No Text Questions Found**:
   - Run `test-text-questions.sql` to add test questions
   - Check if questions are marked as active
   - Verify job description has text questions

3. **Evaluation Not Triggering**:
   - Check environment variables
   - Verify n8n workflow is deployed
   - Check browser console for errors

4. **Database Errors**:
   - Check Supabase connection
   - Verify RLS policies
   - Check table permissions

### **Debug Steps**:

1. **Check Console Logs**:
```javascript
// In browser console
console.log('Environment variables:', {
  webhook: process.env.REACT_APP_N8N_TEXT_EVALUATION_WEBHOOK
});
```

2. **Test Database Connection**:
```sql
-- In Supabase SQL editor
SELECT COUNT(*) FROM exam_questions WHERE question_type = 'text';
```

3. **Check n8n Workflow**:
   - Open n8n interface
   - Check workflow execution logs
   - Verify webhook is active

## **Success Criteria**

✅ **Text evaluation is working if**:
- Webhook responds with success status
- Database is updated with evaluation results
- UI shows detailed evaluation information
- Scores and feedback are generated
- Keywords are analyzed correctly

## **Next Steps After Testing**

1. **Review Evaluation Quality**: Check if AI feedback is helpful and accurate
2. **Adjust Criteria**: Modify evaluation weights if needed
3. **Test Edge Cases**: Try with very short/long answers, off-topic responses
4. **Performance Testing**: Test with multiple concurrent evaluations
5. **Integration Testing**: Test with real exam sessions

## **Production Deployment**

Before deploying to production:

1. **Set Production Environment Variables**
2. **Deploy n8n Workflow to Production**
3. **Test with Real Data**
4. **Monitor Performance**
5. **Set Up Error Handling**

---

**Happy Testing! 🎉**

If you encounter any issues, check the troubleshooting section or review the implementation details in the code.
