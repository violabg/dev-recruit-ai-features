"use client"

import { InterviewResultsClient } from "@/components/interview/interview-results-client"

interface InterviewResultsProps {
  interviewId: string
  quizQuestions: any[]
  answers: Record<string, any>
  candidateName: string
}

export function InterviewResults({ interviewId, quizQuestions, answers, candidateName }: InterviewResultsProps) {
  return (
    <InterviewResultsClient
      interviewId={interviewId}
      quizQuestions={quizQuestions}
      answers={answers}
      candidateName={candidateName}
    />
  )
}
