import { Router, Request, Response } from 'express';
import { Assessment, Question, QuestionType } from '../models/Assessment';
import { requireAuth } from '../middleware/auth';
import { combineToBlueprint } from '../services/nlp';
import { generateAssessmentQuestions } from '../services/ai';

const router = Router();

function ensureMcq(q: Question, fallbackSkill: string): Question {
	const optionsBase: string[] | undefined = Array.isArray(q.options)
		? q.options.filter((o): o is string => typeof o === 'string')
		: undefined;
	const options: string[] = (optionsBase && optionsBase.length >= 2)
		? optionsBase
		: ['Option A', 'Option B', 'Option C', 'Option D'];

	const correctBase: string[] | undefined = Array.isArray(q.correctAnswers)
		? q.correctAnswers.filter((c): c is string => typeof c === 'string')
		: undefined;
	const firstCorrect: string | undefined = (correctBase && correctBase.length > 0)
		? correctBase[0]
		: undefined;
	const fallbackOption: string = options[0] ?? 'Option A';
	const correct: string[] = (typeof firstCorrect === 'string' && options.includes(firstCorrect))
		? [firstCorrect]
		: [fallbackOption];

	return {
		...q,
		options,
		correctAnswers: correct,
		metadata: q.metadata || { skillTag: fallbackSkill, difficulty: 'easy', timeEstimateMin: 2 },
	};
}

function normalizeQuestions(allowed: QuestionType[], role: string, techStack: string[], questions: Question[]): Question[] {
	const mainSkill = techStack[0] || 'general';
	return questions
		.filter(q => allowed.includes(q.type))
		.map((q, i) => {
			let n: Question = {
				questionId: q.questionId || `q-${i+1}`,
				type: q.type,
				prompt: q.prompt || 'Question',
				metadata: q.metadata || { skillTag: mainSkill, difficulty: 'easy', timeEstimateMin: 2 },
			};
			if (n.type === 'mcq') {
				n = ensureMcq({ ...n, options: (q as any).options, correctAnswers: (q as any).correctAnswers }, mainSkill);
			}
			if (n.type === 'short' || n.type === 'scenario') {
				const ca: string[] = Array.isArray((q as any).correctAnswers)
					? (q as any).correctAnswers.filter((c: any) => typeof c === 'string')
					: [''];
				n = { ...n, correctAnswers: ca } as any;
			}
			if (n.type === 'coding') {
				const tests = Array.isArray((q as any).tests) ? (q as any).tests : [];
				n = { ...n, starterCode: (q as any).starterCode ?? '', tests } as any;
			}
			return n;
		});
}

router.post('/generate', requireAuth, async (req: Request, res: Response) => {
	const { role, techStack, experienceLevel, preferredQuestionTypes, durationMinutes, notes } = req.body || {};
	if (!role || !experienceLevel || !durationMinutes) return res.status(400).json({ error: 'Missing required fields' });
	const blueprint = combineToBlueprint({
		role,
		techStack: Array.isArray(techStack) ? techStack : (typeof techStack === 'string' ? techStack.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
		experienceLevel,
		preferredQuestionTypes: Array.isArray(preferredQuestionTypes) ? preferredQuestionTypes : [],
		durationMinutes: Number(durationMinutes),
		notes,
	});
	let questions = await generateAssessmentQuestions(blueprint);
	const allowed = (blueprint.preferredQuestionTypes && blueprint.preferredQuestionTypes.length) ? blueprint.preferredQuestionTypes : ['mcq', 'short', 'coding', 'scenario'];
	questions = normalizeQuestions(allowed as QuestionType[], blueprint.role, blueprint.techStack, questions);
	if (!questions.length) {
		return res.status(500).json({ error: 'Failed to generate questions' });
	}
	const userId = (req as any).auth.userId;
	const assessment = await Assessment.create({
		userId,
		role: blueprint.role,
		techStack: blueprint.techStack,
		experienceLevel: blueprint.experienceLevel,
		preferredQuestionTypes: blueprint.preferredQuestionTypes,
		durationMinutes: blueprint.durationMinutes,
		naturalLanguageNotes: blueprint.naturalLanguageNotes,
		questions,
	});
	res.json({ assessment });
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const list = await Assessment.find({ userId }).sort({ createdAt: -1 }).lean();
	res.json({ assessments: list });
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const a = await Assessment.findOne({ _id: req.params.id, userId }).lean();
	if (!a) return res.status(404).json({ error: 'Not found' });
	res.json({ assessment: a });
});

export default router;
