# AI Integration Patterns and Error Handling Improvements

## 📋 Overview

This document outlines the comprehensive improvements made to the AI integration patterns and error handling for the DevRecruit AI quiz generation system. The enhancements focus on reliability, security, performance, and maintainability.

## 🏗️ Enhanced Architecture

### 1. AI Service Layer (`lib/services/ai-service.ts`)

#### **Key Features:**

- **Robust Error Handling**: Comprehensive error classification and recovery strategies
- **Retry Mechanism**: Exponential backoff with configurable retry policies
- **Input Sanitization**: Security measures against prompt injection attacks
- **Model Fallback**: Automatic fallback to alternative models when primary fails
- **Performance Monitoring**: Built-in tracking and timeout handling

#### **Security Enhancements:**

````typescript
// Input sanitization to prevent prompt injection
export const sanitizeAIInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "")
    .replace(/system:|assistant:|user:/gi, "")
    .replace(/```/g, "`")
    .slice(0, 2000)
    .trim();
};
````

#### **Retry Strategy:**

```typescript
// Exponential backoff with configurable parameters
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: AIGenerationConfig = DEFAULT_CONFIG
): Promise<T> => {
  // Implements smart retry logic with timeout protection
};
```

#### **Prompt Builder Pattern:**

```typescript
// Secure prompt construction
const prompt = new PromptBuilder()
  .addSection("Posizione", params.positionTitle)
  .addList("Competenze richieste", params.skills)
  .addPreviousQuestions(params.previousQuestions || [])
  .build();
```

### 2. Error Handling System (`lib/services/error-handler.ts`)

#### **Structured Error Types:**

- **AIGenerationError**: AI-specific failures with detailed context
- **QuizSystemError**: Business logic and system errors
- **ErrorLogger**: Centralized logging with production/development modes

#### **Error Classification:**

```typescript
export enum QuizErrorCode {
  // Input validation errors
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_QUIZ_PARAMS = "INVALID_QUIZ_PARAMS",

  // AI-specific errors
  RATE_LIMITED = "RATE_LIMITED",
  MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE",

  // System errors
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",
}
```

#### **User-Friendly Messages:**

```typescript
// Localized error messages for Italian users
export const getUserFriendlyErrorMessage = (error: QuizSystemError): string => {
  switch (error.code) {
    case QuizErrorCode.RATE_LIMITED:
      return "Troppe richieste. Attendi un minuto prima di riprovare.";
    // ... more cases
  }
};
```

### 3. Enhanced Server Actions (`lib/actions/quizzes-improved.ts`)

#### **Comprehensive Validation:**

```typescript
const generateQuizSchema = z.object({
  positionId: z.string().uuid("Invalid position ID format"),
  quizTitle: z.string().min(1).max(200),
  questionCount: z.number().int().min(1).max(50),
  difficulty: z.number().int().min(1).max(5),
  // ... with detailed validation rules
});
```

#### **Performance Monitoring:**

```typescript
class PerformanceMonitor {
  constructor(private operationName: string) {
    this.startTime = performance.now();
  }

  end(): void {
    const duration = performance.now() - this.startTime;
    console.log(`${this.operationName} completed in ${duration.toFixed(2)}ms`);
  }
}
```

#### **Enhanced Security:**

- **User authentication checks** on every operation
- **Ownership verification** before data access
- **Input sanitization** for all user-provided data
- **Transaction-like operations** for data consistency

### 4. Improved API Routes (`app/api/quiz-edit/generate-quiz-enhanced/route.ts`)

#### **Rate Limiting:**

```typescript
// Simple in-memory rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
```

#### **Request Validation:**

- **Content-Length checking** to prevent large payloads
- **JSON parsing** with error handling
- **Schema validation** with detailed error messages
- **Business rule validation** (at least one question type)

#### **Response Enhancement:**

- **Performance headers** for monitoring
- **Appropriate HTTP status codes** based on error types
- **Structured error responses** with error codes

## 🔧 Key Improvements

### 1. Security Enhancements

#### **Prompt Injection Prevention:**

- Input sanitization removes dangerous patterns
- Length limitations prevent prompt overflow
- Structured prompt building with safe concatenation

#### **Access Control:**

- User authentication on every request
- Resource ownership verification
- Database-level security with RLS policies

### 2. Reliability Improvements

#### **Retry Mechanisms:**

- Exponential backoff for transient failures
- Smart retry logic that avoids retrying permanent failures
- Timeout protection for long-running operations

#### **Fallback Strategies:**

- Alternative model selection when primary fails
- Graceful degradation for partial failures
- Circuit breaker patterns for system protection

### 3. Performance Optimizations

#### **Monitoring and Metrics:**

- Performance tracking for all operations
- Slow operation detection and logging
- Memory usage optimization for large requests

#### **Caching and Optimization:**

- Request size limitations
- Efficient prompt building
- Optimized database queries with explicit field selection

### 4. Error Handling Excellence

#### **Comprehensive Error Types:**

- Detailed error classification for better debugging
- Context-rich error objects with metadata
- User-friendly error messages in Italian

#### **Logging and Monitoring:**

- Structured logging for production environments
- Error metrics tracking for analytics
- Development-friendly error displays

## 📊 Implementation Examples

### Quiz Generation with Enhanced Error Handling

```typescript
export async function generateNewQuizActionImproved(
  params: GenerateQuizParams
) {
  const monitor = new PerformanceMonitor("generateNewQuizAction");

  try {
    // 1. Validate parameters with Zod schema
    const validatedParams = generateQuizSchema.parse(params);

    // 2. Check user authentication and authorization
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new QuizSystemError(
        "User not authenticated",
        QuizErrorCode.UNAUTHORIZED
      );
    }

    // 3. Verify resource ownership
    const { data: position } = await supabase
      .from("positions")
      .select("id, title, experience_level, skills, description")
      .eq("id", validatedParams.positionId)
      .eq("created_by", user.id) // Ownership check
      .single();

    // 4. Generate with AI service (includes retries and fallbacks)
    const quizData = await aiQuizService.generateQuiz({
      positionTitle: position.title,
      experienceLevel: position.experience_level,
      // ... other parameters
    });

    monitor.end();
    return quizData;
  } catch (error) {
    monitor.end();
    // Enhanced error handling with context
    await errorHandler.handleError(error, {
      operation: "generateNewQuizAction",
      positionId: params.positionId,
    });
  }
}
```

### API Route with Rate Limiting and Validation

```typescript
export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", code: QuizErrorCode.RATE_LIMITED },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // 2. Request size validation
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: "Request too large", code: QuizErrorCode.INVALID_INPUT },
        { status: 413 }
      );
    }

    // 3. JSON parsing with error handling
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON", code: QuizErrorCode.INVALID_INPUT },
        { status: 400 }
      );
    }

    // 4. Schema validation
    const validationResult = generateQuizRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid parameters",
          code: QuizErrorCode.INVALID_INPUT,
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // 5. Business logic with improved actions
    const aiQuiz = await generateNewQuizActionImproved(validatedData);

    return NextResponse.json(aiQuiz);
  } catch (error) {
    const errorResponse = getErrorResponse(error);
    const status = getHTTPStatusForError(error);
    return NextResponse.json(errorResponse, { status });
  }
}
```

## 🎯 Benefits Achieved

### 1. **Enhanced Security**

- ✅ Prompt injection protection
- ✅ Input sanitization and validation
- ✅ Rate limiting to prevent abuse
- ✅ Access control and authorization

### 2. **Improved Reliability**

- ✅ Retry mechanisms with exponential backoff
- ✅ Model fallback strategies
- ✅ Timeout protection
- ✅ Graceful error handling

### 3. **Better Performance**

- ✅ Performance monitoring and metrics
- ✅ Request size optimization
- ✅ Efficient prompt building
- ✅ Database query optimization

### 4. **Enhanced User Experience**

- ✅ User-friendly error messages in Italian
- ✅ Appropriate HTTP status codes
- ✅ Detailed error context for debugging
- ✅ Fast response times with monitoring

### 5. **Maintainability**

- ✅ Structured error types and handling
- ✅ Comprehensive logging system
- ✅ Modular architecture with clear separation
- ✅ Type-safe implementations with Zod validation

## 🔄 Migration Strategy

### Phase 1: Core Services

1. ✅ Implement AI service layer with error handling
2. ✅ Create structured error handling system
3. ✅ Add performance monitoring infrastructure

### Phase 2: Enhanced Actions

1. ✅ Upgrade server actions with validation
2. ✅ Add comprehensive error handling
3. ✅ Implement security measures

### Phase 3: API Enhancement

1. ✅ Create enhanced API routes with rate limiting
2. ✅ Add request validation and size checking
3. ✅ Implement proper HTTP status codes

### Phase 4: Frontend Integration

1. 🔄 Update frontend components to use enhanced APIs
2. 🔄 Implement better error display and handling
3. 🔄 Add loading states and retry mechanisms

## 📈 Monitoring and Metrics

### Performance Metrics

- **Request Duration**: Average and p95 response times
- **Error Rates**: Success/failure ratios by error type
- **AI Model Performance**: Generation success rates by model
- **Rate Limiting**: Blocked requests and patterns

### Error Analytics

- **Error Classification**: Distribution by error codes
- **Recovery Success**: Retry and fallback effectiveness
- **User Impact**: Error frequency per user session

### System Health

- **API Availability**: Uptime and response status
- **Resource Usage**: Memory and CPU utilization
- **Database Performance**: Query execution times

## 🚀 Future Enhancements

### 1. Advanced AI Features

- **Dynamic model selection** based on request complexity
- **Prompt optimization** using A/B testing
- **Content quality scoring** and validation
- **Multi-language support** for international users

### 2. Enhanced Monitoring

- **Real-time dashboards** for system health
- **Alerting system** for critical failures
- **Performance analytics** and optimization suggestions
- **User behavior tracking** for UX improvements

### 3. Scalability Improvements

- **Distributed rate limiting** using Redis
- **Horizontal scaling** for AI services
- **Caching strategies** for frequently requested content
- **Load balancing** for high availability

This comprehensive enhancement provides a robust, secure, and scalable foundation for the AI-powered quiz generation system, ensuring reliable performance and excellent user experience.
