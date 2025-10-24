# N8N AI Agent Troubleshooting Guide

## 🚨 **Error: "Model output doesn't fit required format"**

This error occurs when the AI model generates output that doesn't match the Structured Output Parser schema.

## 🔍 **Root Causes & Solutions:**

### **1. AI Model Not Following Schema**
**Problem**: AI is generating malformed JSON or ignoring the parser requirements.

**Solutions**:
- ✅ **Update System Message**: Use the updated system message with explicit JSON formatting rules
- ✅ **Lower Temperature**: Set AI model temperature to 0.1-0.3 for more consistent output
- ✅ **Enable Strict Mode**: Ensure "Require Specific Output Format" is enabled in AI Agent
- ✅ **Add JSON Examples**: Include specific examples in the system message

### **2. Structured Output Parser Configuration Issues**
**Problem**: Parser not properly configured or connected.

**Solutions**:
- ✅ **Check Connection**: Ensure parser is connected to AI Agent's "Output Parser" input
- ✅ **Verify Schema**: Confirm the JSON schema matches your expected output
- ✅ **Test with Simple Example**: Start with a basic JSON example to verify parser works
- ✅ **Regenerate Schema**: Delete and recreate the parser with fresh example JSON

### **3. AI Model Parameters**
**Problem**: Model settings causing inconsistent output.

**Solutions**:
- ✅ **Temperature**: Set to 0.1-0.3 (lower = more consistent)
- ✅ **Top P**: Set to 0.9-0.95
- ✅ **Max Tokens**: Increase if responses are being cut off
- ✅ **Frequency Penalty**: Set to 0.0-0.1
- ✅ **Presence Penalty**: Set to 0.0-0.1

### **4. Prompt Engineering Issues**
**Problem**: System message not clear enough about JSON requirements.

**Solutions**:
- ✅ **Explicit JSON Rules**: Add specific escape sequence instructions
- ✅ **Examples**: Include complete JSON examples in the prompt
- ✅ **Validation Instructions**: Tell AI to validate its own output
- ✅ **Error Prevention**: Add instructions to avoid common JSON mistakes

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Update System Message**
Replace your current system message with the updated version that includes:
- Explicit JSON formatting rules
- Escape sequence instructions
- Complete JSON example
- Validation requirements

### **Step 2: Configure AI Agent Settings**
```
Temperature: 0.2
Top P: 0.9
Max Tokens: 4000
Frequency Penalty: 0.0
Presence Penalty: 0.0
```

### **Step 3: Verify Structured Output Parser**
1. **Check Connection**: Parser → AI Agent (Output Parser input)
2. **Verify Schema**: Use the example JSON from `n8n_output_parser_example.json`
3. **Test Parser**: Run a simple test to ensure parser works

### **Step 4: Add Error Handling**
1. **Set "On Error"**: Change to "Continue" in root node settings
2. **Add Error Node**: Add a node to catch and log parsing failures
3. **Add Retry Logic**: Implement retry mechanism for failed generations

### **Step 5: Test with Small Sample**
1. **Start Small**: Generate 3-5 questions first
2. **Verify Format**: Check that output matches expected JSON structure
3. **Scale Up**: Once working, increase to full 15 questions

## 🔧 **Alternative Solutions:**

### **Option 1: Use Different AI Model**
If current model continues to fail:
- Try GPT-4 instead of GPT-3.5
- Use Claude or other models with better JSON generation
- Test with different model versions

### **Option 2: Simplify Schema**
If complex schema causes issues:
- Start with basic schema (fewer required fields)
- Gradually add complexity
- Use optional fields where possible

### **Option 3: Post-Processing Fix**
As a last resort:
- Use the robust parsers we created earlier
- Implement JSON cleaning and validation
- Add fallback mechanisms

## 📊 **Testing Checklist:**

- [ ] System message updated with JSON formatting rules
- [ ] AI Agent temperature set to 0.1-0.3
- [ ] Structured Output Parser properly connected
- [ ] "Require Specific Output Format" enabled
- [ ] Error handling configured
- [ ] Test with small sample (3-5 questions)
- [ ] Verify JSON output format
- [ ] Scale up to full requirements

## 🎯 **Expected Result:**
After implementing these fixes, the AI should generate properly formatted JSON that matches the structured output parser requirements, eliminating the format errors.

## 🆘 **If Still Failing:**
1. **Check n8n Logs**: Look for detailed error messages
2. **Test Parser Separately**: Verify parser works with manual JSON input
3. **Try Different Approach**: Consider using the robust parsers as fallback
4. **Contact Support**: Reach out to n8n community for additional help
