# Enhanced AI Question Generation System

## Overview

The Enhanced AI Generation System provides type-specific parameters and intelligent question generation for better assessment quality. This system includes both new question generation and enhanced regeneration capabilities with language precedence and conditional question types.

## 🚀 Current Features

### 1. **Enhanced Question Generation**

- Type-specific parameters for each question type (multiple choice, open questions, code snippets)
- Smart presets for frontend/backend positions
- Language detection and precedence handling
- Conditional bug vs improvement questions

### 2. **Enhanced Question Regeneration**

- Full enhanced parameters available for regeneration
- Question type detection for regenerating questions
- Same type-specific options as new generation

### 3. **Language Precedence System**

- Explicit language parameter takes highest precedence
- Smart skills detection as fallback
- Comprehensive language detection (JavaScript, TypeScript, Python, Java, C#, PHP)

### 4. **Conditional Question Types**

- **With `bugType`**: Generates debugging/bug-fixing questions with intentional bugs
- **Without `bugType`**: Generates code improvement/optimization questions

## 🏗️ Architecture

### Core Components

1. **Enhanced AI Generation Hook** (`use-enhanced-ai-generation.ts`)
2. **Enhanced AI Dialogs** (`enhanced-ai-dialogs.tsx`)
3. **Enhanced AI Generation Dialog** (`enhanced-ai-generation-dialog.tsx`)
4. **Modular Prompt Builder System** (`ai-service.ts`)
5. **Question Prompt Helpers** (`question-prompt-helpers.ts`)

### Question Type Parameters

#### Base Parameters (shared)

```typescript
interface BaseQuestionParams {
  quizTitle: string;
  questionIndex: number;
  positionTitle: string;
  experienceLevel: string;
  skills: string[];
}
```

#### Multiple Choice Parameters

```typescript
interface MultipleChoiceQuestionParams extends BaseQuestionParams {
  type: "multiple_choice";
  focusAreas?: string[];
  distractorComplexity?: "simple" | "moderate" | "complex";
}
```

#### Open Question Parameters

```typescript
interface OpenQuestionParams extends BaseQuestionParams {
  type: "open_question";
  requireCodeExample?: boolean;
  expectedResponseLength?: "short" | "medium" | "long";
  evaluationCriteria?: string[];
}
```

#### Code Snippet Parameters

```typescript
interface CodeSnippetQuestionParams extends BaseQuestionParams {
  type: "code_snippet";
  language?: string;
  bugType?: "syntax" | "logic" | "performance" | "security";
  codeComplexity?: "basic" | "intermediate" | "advanced";
  includeComments?: boolean;
}
```

## 🎯 Language Detection & Precedence

### Precedence Order

1. **Explicit `language` parameter** (highest precedence)
2. **Skills detection** from position requirements
3. **Default fallback** to JavaScript

### Language Detection Priority

| Priority | Language   | Detection Keywords                                    |
| -------- | ---------- | ----------------------------------------------------- |
| 1        | JavaScript | "javascript", "js", "node", "react", "vue", "angular" |
| 2        | TypeScript | "typescript", "ts"                                    |
| 3        | Python     | "python", "django", "flask"                           |
| 4        | Java       | "java", "spring"                                      |
| 5        | C#         | "c#", "csharp", ".net"                                |
| 6        | PHP        | "php", "laravel"                                      |
| Fallback | JavaScript | When no skills match                                  |

## 🎨 Question Generation Logic

### Bug Fixing Questions (with `bugType`)

- Focus on **debugging skills**
- Include **intentional bugs** based on specified type
- Provide **corrected solutions**
- Ask to "identifica e correggi il problema"

### Code Improvement Questions (without `bugType`)

- Focus on **best practices** and **optimization**
- Show **functional but improvable** code
- Demonstrate **modern coding techniques**
- Ask to "migliora per performance e leggibilità"

## 📝 Usage Examples

### Basic Enhanced Generation

```typescript
const { handleGenerateEnhancedQuestion } = useEnhancedAIGeneration({...});

// Generate multiple choice with focus areas
await handleGenerateEnhancedQuestion("multiple_choice", {
  llmModel: "llama-3.3-70b-versatile",
  difficulty: 4,
  focusAreas: ["React Hooks", "State Management"],
  distractorComplexity: "complex"
});

// Generate code snippet with specific language and bug type
await handleGenerateEnhancedQuestion("code_snippet", {
  llmModel: "llama-3.3-70b-versatile",
  difficulty: 3,
  language: "python",
  bugType: "security",
  includeComments: true
});
```

### Enhanced Regeneration

```typescript
const {
  handleRegenerateEnhancedQuestion,
  getRegeneratingQuestionType
} = useEnhancedAIGeneration({...});

// Regenerate with enhanced parameters
await handleRegenerateEnhancedQuestion(
  getRegeneratingQuestionType(),
  {
    llmModel: "llama-3.3-70b-versatile",
    difficulty: 4,
    language: "javascript",
    codeComplexity: "advanced"
  }
);
```

### Smart Presets

```typescript
// Frontend-optimized generation
await generateFrontendQuestion("code_snippet", {
  llmModel: "llama-3.3-70b-versatile",
  difficulty: 3,
  bugType: "logic",
  codeComplexity: "intermediate",
});

// Backend-optimized generation
await generateBackendQuestion("open_question", {
  llmModel: "llama-3.3-70b-versatile",
  difficulty: 4,
  requireCodeExample: true,
  evaluationCriteria: ["architecture", "scalability"],
});
```

## 🔧 Integration

### Feature Flag Control

```typescript
// In edit-quiz-form.tsx
const useEnhancedAI = true; // Enable enhanced features
```

### Enhanced Dialogs Integration

```typescript
{useEnhancedAI && handleGenerateEnhancedQuestion ? (
  <EnhancedAIDialogs
    aiDialogOpen={aiDialogOpen}
    setAiDialogOpen={setAiDialogOpen}
    generatingQuestionType={generatingQuestionType}
    onGenerateEnhancedQuestion={handleGenerateEnhancedQuestion}
    regenerateDialogOpen={regenerateDialogOpen}
    setRegenerateDialogOpen={setRegenerateDialogOpen}
    regeneratingQuestionType={getRegeneratingQuestionType()}
    onRegenerateEnhancedQuestion={handleRegenerateEnhancedQuestion}
    // ... other props
    useEnhancedDialogs={true}
  />
) : (
  // Legacy AI dialogs fallback
)}
```

## 🧪 Example Scenarios

### Scenario 1: Explicit Language Override

```typescript
// Position skills: ["Python", "Django", "PostgreSQL"]
const params = createCodeSnippetParams(baseConfig, 1, {
  language: "javascript", // Overrides Python detection
  bugType: "performance",
});
// Result: JavaScript performance bug question
```

### Scenario 2: Skills Detection

```typescript
// Position skills: ["TypeScript", "React", "Node.js"]
const params = createCodeSnippetParams(baseConfig, 2, {
  // No language specified → detects TypeScript
  codeComplexity: "advanced",
});
// Result: TypeScript code improvement question
```

### Scenario 3: Code Improvement vs Bug Fixing

```typescript
// Bug fixing question
const bugParams = createCodeSnippetParams(baseConfig, 3, {
  language: "python",
  bugType: "security", // Generates security bug question
});

// Code improvement question
const improvementParams = createCodeSnippetParams(baseConfig, 4, {
  language: "python",
  // No bugType → generates improvement question
});
```

## 🎉 Benefits

### For Recruiters

- **Better Targeting**: Type-specific parameters generate more relevant questions
- **Consistency**: Standardized approach across question types
- **Quality Control**: Smart defaults and validation
- **Flexibility**: Fine-tune generation for specific needs

### For Developers

- **Type Safety**: Full TypeScript support for all parameters
- **Reusability**: Shared prompt builders and parameter helpers
- **Extensibility**: Easy to add new question types and parameters
- **Maintainability**: Clean separation of concerns

### For Candidates

- **Relevant Assessment**: Questions match position requirements
- **Fair Evaluation**: Consistent difficulty and scope
- **Technology Focus**: Language-specific and role-appropriate questions

## 🔮 Future Enhancements

### Phase 1: UI Improvements

- Add preset generation buttons to UI
- Implement smart question suggestions
- Add bulk generation capabilities

### Phase 2: Analytics & Optimization

- Track prompt effectiveness by type
- A/B test enhanced vs legacy generation
- ML feedback loop from recruiter ratings

### Phase 3: Advanced Features

- Custom user presets
- Interview flow generation
- New question types (design, architecture, behavioral)

## 🛠️ Technical Implementation

### Files Structure

```
app/dashboard/quizzes/[id]/edit/
├── components/
│   ├── enhanced-ai-dialogs.tsx
│   ├── enhanced-ai-generation-dialog.tsx
│   └── edit-quiz-form.tsx
└── hooks/
    └── use-enhanced-ai-generation.ts

lib/
├── services/
│   └── ai-service.ts (modular prompt system)
└── utils/
    └── question-prompt-helpers.ts
```

### Key Features

- ✅ **Backward Compatibility**: All existing functionality preserved
- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Feature Flags**: Gradual rollout capabilities
- ✅ **Error Handling**: Comprehensive error cases and fallbacks
- ✅ **Performance**: Efficient rendering and smart defaults

The Enhanced AI Generation System provides a robust, extensible foundation for creating high-quality assessment questions with precise control over generation parameters while maintaining full backward compatibility.
