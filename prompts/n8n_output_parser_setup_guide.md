# N8N Structured Output Parser Setup Guide

## 🎯 **Solution: Use N8N's Structured Output Parser**

Instead of fixing malformed JSON after generation, use n8n's **Structured Output Parser** to ensure the AI generates valid JSON from the start.

## 📋 **Step-by-Step Setup:**

### **1. Add Structured Output Parser Node**
- In your n8n workflow, add a **Structured Output Parser** node
- Place it between your AI Agent and the next processing node

### **2. Configure the Parser**
- **Method 1: Generate from JSON Example**
  - Use the example JSON provided below
  - The parser will automatically generate the schema

- **Method 2: Define using JSON Schema**
  - Copy the schema from `n8n_structured_output_schema.json`
  - Paste it into the parser configuration

### **3. Connect to AI Agent**
- Connect the **Structured Output Parser** node to the **Output Parser** input of your AI Agent
- In the AI Agent node settings, enable **"Require Specific Output Format"**

### **4. Update AI Agent Prompt**
Add this instruction to your AI Agent prompt:

```
IMPORTANT: You must output valid JSON that matches the exact schema provided by the output parser. 
Ensure all escape sequences are properly formatted:
- Use \\n for newlines
- Use \\t for tabs  
- Use \\r for carriage returns
- Escape all quotes properly
```

## 📄 **Example JSON for Parser:**

```json
{
  "generated_questions": [
    {
      "question_text": "What is the primary purpose of a RESTful API?",
      "question_type": "mcq",
      "question_category": "technical",
      "difficulty_level": "easy",
      "topic": "Web Development",
      "subtopic": "API Design",
      "points": 2,
      "time_limit_seconds": 60,
      "mcq_options": [
        {"option": "A", "text": "To store data in databases"},
        {"option": "B", "text": "To provide a standardized way for applications to communicate"},
        {"option": "C", "text": "To create user interfaces"},
        {"option": "D", "text": "To manage server hardware"}
      ],
      "correct_answer": "B",
      "answer_explanation": "RESTful APIs provide a standardized way for different applications to communicate over HTTP, following REST principles.",
      "tags": ["api", "rest", "web development"],
      "job_relevance": "Understanding RESTful APIs is essential for Full Stack Developers as they need to design and consume APIs for building scalable applications."
    }
  ],
  "generation_metadata": {
    "total_generated": 1,
    "technical_count": 1,
    "aptitude_count": 0,
    "mcq_count": 1,
    "text_count": 0,
    "difficulty_breakdown": {
      "easy": 1,
      "medium": 0,
      "hard": 0
    },
    "topic_distribution": {
      "Web Development": 1
    },
    "job_description_used": {
      "id": "example-id",
      "title": "Full Stack Developer",
      "key_skills_tested": ["api design", "web development"]
    },
    "generation_time": "2024-01-01T00:00:00Z",
    "ai_model_used": "gpt-4",
    "confidence_score": 0.95
  }
}
```

## ✅ **Benefits:**

1. **Guaranteed Valid JSON**: The parser ensures proper formatting
2. **No More Parsing Errors**: Eliminates escape sequence issues
3. **Consistent Structure**: All outputs follow the same format
4. **Better Performance**: No need for post-processing fixes
5. **Type Safety**: Schema validation ensures data integrity

## 🔧 **Alternative: Use JSON Schema**

If you prefer to define the schema manually, use the complete JSON schema from `n8n_structured_output_schema.json` which includes:

- **Required fields validation**
- **Enum constraints** for question types and difficulty levels
- **Array length constraints** for MCQ options
- **Data type validation** for all fields
- **Nested object validation** for metadata

## 🎯 **Result:**

With this setup, your AI Agent will always generate properly formatted JSON that can be parsed without errors, eliminating the need for complex parsing workarounds.

## 📚 **References:**

- [N8N Structured Output Parser Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/)
- [N8N AI Agent Tutorial](https://automategeniushub.com/mastering-the-n8n-ai-agent-a-comprehensive-tutorial/)
- [N8N Community Discussion](https://community.n8n.io/t/ai-agent-output-parser/116308)
