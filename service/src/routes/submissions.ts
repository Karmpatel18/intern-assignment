import { Router, Request, Response } from 'express';
import { Assessment, Submission } from '../models/Assessment';
import { requireAuth } from '../middleware/auth';
import { evaluateOpenAnswer, richEvaluate } from '../services/ai';
import { VM } from 'vm2';

const router = Router();

type FlexibleTest = {name: string; input?: any; expected: any; functionName?: string; call?: string};

function runCodingTests(userCode: string, tests: FlexibleTest[]) {
	const vm = new VM({ timeout: 1000, sandbox: {} });
	try {
		vm.run(userCode);
		const results = tests.map(t => {
			try {
				let expr: string;
				if (t.call) {
					expr = t.call;
				} else if (t.functionName) {
					const args = Array.isArray(t.input) ? t.input.map(a => JSON.stringify(a)).join(',') : (t.input !== undefined ? JSON.stringify(t.input) : '');
					expr = `${t.functionName}(${args})`;
				} else {
					return { name: t.name, pass: false };
				}
				const res = vm.run(expr);
				const pass = JSON.stringify(res) === JSON.stringify(t.expected);
				return { name: t.name, pass };
			} catch {
				return { name: t.name, pass: false };
			}
		});
		const passed = results.filter(r => r.pass).length;
		return { passed, total: results.length };
	} catch {
		return { passed: 0, total: tests.length };
	}
}

router.post('/:assessmentId', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const { answers } = req.body || {};
	if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers must be an array' });
	const assessment = await Assessment.findOne({ _id: req.params.assessmentId, userId });
	if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

	let totalScore = 0;
	let totalWeight = 0;
	const perSkill: Record<string, { scoreSum: number; weightSum: number }> = {};

	for (const q of assessment.questions) {
		const a = answers.find((x: any) => x.questionId === q.questionId);
		const weight = q.metadata.timeEstimateMin || 1;
		totalWeight += weight;
		let score = 0;
		if (!a) {
			continue;
		}
		if (q.type === 'mcq' || q.type === 'short') {
			const correct = (q.correctAnswers || []).map(s => s.trim().toLowerCase());
			const resp = String(a.response ?? '').trim().toLowerCase();
			score = correct.includes(resp) ? 1 : 0;
		} else if (q.type === 'coding') {
			const testRes = runCodingTests(String(a.response || ''), (q.tests || []) as unknown as FlexibleTest[]);
			score = testRes.total ? testRes.passed / testRes.total : 0;
		} else if (q.type === 'scenario') {
			const evalRes = await evaluateOpenAnswer(q.prompt, (q.correctAnswers || []).join('\n'), String(a.response || ''));
			score = Math.max(0, Math.min(1, evalRes.score));
		}
		totalScore += score * weight;
		const skill = q.metadata.skillTag || 'general';
		if (!perSkill[skill]) perSkill[skill] = { scoreSum: 0, weightSum: 0 };
		perSkill[skill].scoreSum += score * weight;
		perSkill[skill].weightSum += weight;
	}

	const overallScore = totalWeight ? +(totalScore / totalWeight).toFixed(2) : 0;
	const perSkillBreakdown = Object.entries(perSkill).map(([skill, v]) => ({ skill, score: +(v.scoreSum / v.weightSum).toFixed(2) }));

	const strengths = perSkillBreakdown.filter(s => s.score >= 0.75).map(s => s.skill);
	const weaknesses = perSkillBreakdown.filter(s => s.score < 0.5).map(s => s.skill);
	const recommendations = weaknesses.map(w => `Practice more advanced ${w} topics.`);
	const suggestedResources = weaknesses.map(w => `Read official docs and take a tutorial on ${w}.`);

	const rich = await richEvaluate(assessment.questions as any, answers, overallScore, perSkillBreakdown);

	const submission = await Submission.create({
		userId,
		assessmentId: assessment._id,
		answers,
		overallScore,
		perSkillBreakdown,
		strengths,
		weaknesses,
		recommendations,
		suggestedResources,
		aiSummary: rich.summary,
		questionFeedbacks: rich.perQuestionFeedback,
		completedAt: new Date(),
	});

	res.json({ submission });
});

router.get('/assessment/:assessmentId', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const subs = await Submission.find({ userId, assessmentId: req.params.assessmentId }).sort({ createdAt: -1 }).lean();
	res.json({ submissions: subs });
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
	const userId = (req as any).auth.userId;
	const sub = await Submission.findOne({ _id: req.params.id, userId }).lean();
	if (!sub) return res.status(404).json({ error: 'Not found' });
	res.json({ submission: sub });
});

export default router; 