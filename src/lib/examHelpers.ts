import type { Exam, ExamAnswer, ExamQuestion } from "@/lib/types";

/** Strip correct answers so a student never receives them. */
export function sanitizeQuestion(q: ExamQuestion): ExamQuestion {
  const { correctIndex, ...rest } = q;
  void correctIndex;
  return rest;
}

export function sanitizeExam(exam: Exam): Exam {
  return { ...exam, questions: exam.questions.map(sanitizeQuestion) };
}

export function totalPoints(questions: ExamQuestion[]): number {
  return questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
}

/**
 * Grade a submission's MCQ answers automatically. Essay answers get 0 for now
 * (the teacher grades them later). Returns per-answer awarded points plus totals.
 */
export function autoGrade(
  questions: ExamQuestion[],
  answers: ExamAnswer[]
): { answers: ExamAnswer[]; autoScore: number; maxScore: number; hasEssay: boolean } {
  const byId = new Map(questions.map((q) => [q.id, q]));
  let autoScore = 0;
  let hasEssay = false;

  const graded = answers.map((a) => {
    const q = byId.get(a.questionId);
    if (!q) return { ...a, awardedPoints: 0 };
    if (q.type === "mcq") {
      const correct =
        typeof a.selectedIndex === "number" && a.selectedIndex === q.correctIndex;
      const awarded = correct ? Number(q.points) || 0 : 0;
      autoScore += awarded;
      return { ...a, awardedPoints: awarded };
    }
    hasEssay = true;
    return { ...a, awardedPoints: 0 }; // essay graded later
  });

  return { answers: graded, autoScore, maxScore: totalPoints(questions), hasEssay };
}
