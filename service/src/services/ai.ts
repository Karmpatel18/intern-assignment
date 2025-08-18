import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { Question, QuestionType } from '../models/Assessment';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;

export interface BlueprintInput {
	role: string;
	techStack: string[];
	experienceLevel: string;
	preferredQuestionTypes: QuestionType[];
	durationMinutes: number;
	naturalLanguageNotes?: string | undefined;
}

export interface Insights {
	strengths: string[];
	weaknesses: string[];
	recommendations: string[];
	suggestedResources: string[];
}

export interface RichEvaluation {
	summary: string;
	perQuestionFeedback: { questionId: string; feedback: string }[];
}

function sanitizeOption(raw: string): string {
	let s = (raw ?? '').toString();
	s = s.replace(/^\s*[`\u201C\u201D\u2018\u2019]+|[`\u201C\u201D\u2018\u2019]+\s*$/g, '');
	s = s.replace(/^\s*[A-Za-z]\s*[\)|\.|\-\:]{1,2}\s*/g, '');
	s = s.replace(/^\s*[A-Za-z]\)\s*/g, '');
	s = s.replace(/^\s*\d+[\)\.]\s*/g, '');
	return s.trim();
}

function extractJsonArray(text: string): any[] | null {
	try {
		const direct = JSON.parse(text);
		if (Array.isArray(direct)) return direct;
	} catch {}
	const codeBlock = text.match(/```json\s*([\s\S]*?)```/i);
	if (codeBlock) {
		const block = typeof codeBlock[1] === 'string' ? codeBlock[1] : '';
		if (block) {
			try {
				const arr = JSON.parse(block);
				if (Array.isArray(arr)) return arr;
			} catch {}
		}
	}
	const first = text.indexOf('[');
	const last = text.lastIndexOf(']');
	if (first !== -1 && last !== -1 && last > first) {
		const slice = text.slice(first, last + 1);
		try {
			const arr = JSON.parse(slice);
			if (Array.isArray(arr)) return arr;
		} catch {}
	}
	return null;
}

function letterToIndex(letter: string): number | null {
	const m = letter.trim().toUpperCase().match(/^[A-Z]$/);
	if (!m) return null;
	return letter.charCodeAt(0) - 'A'.charCodeAt(0);
}

function ensureMcqValidity(q: Question, fallbackSkill: string): Question {
	const optionsBase: string[] | undefined = Array.isArray(q.options)
		? q.options.filter((o): o is string => typeof o === 'string')
		: undefined;
	let options: string[] = (optionsBase && optionsBase.length >= 2)
		? optionsBase.map(sanitizeOption)
		: ['Option A', 'Option B', 'Option C', 'Option D'];

	const correctBase: string[] | undefined = Array.isArray(q.correctAnswers)
		? q.correctAnswers.filter((c): c is string => typeof c === 'string')
		: undefined;
	const firstCorrect: string | undefined = (correctBase && correctBase.length > 0)
		? correctBase[0]
		: undefined;
	const fallbackOption: string = options[0] ?? 'Option A';
	let correct: string[];
	if (typeof firstCorrect === 'string') {
		const letterIdx = letterToIndex(firstCorrect);
		if (letterIdx !== null && letterIdx >= 0 && letterIdx < options.length) {
			const candidate = options[letterIdx] ?? fallbackOption;
			correct = [candidate];
		} else {
			const normalized = sanitizeOption(firstCorrect);
			correct = options.includes(normalized) ? [normalized] : [fallbackOption];
		}
	} else {
		correct = [fallbackOption];
	}

	return {
		...q,
		options,
		correctAnswers: correct,
		metadata: q.metadata || { skillTag: fallbackSkill, difficulty: 'easy', timeEstimateMin: 2 },
	};
}

function makeByType(t: QuestionType, idx: number, role: string, mainSkill: string): Question {
	if (t === 'mcq') {
		return ensureMcqValidity({
			questionId: `q-mcq-${idx}`,
			type: 'mcq',
			prompt: `Which statement about ${mainSkill} is true?`,
			options: ['Hooks let you use state', 'CSS in JS is mandatory', 'React requires classes only', 'JSX is plain HTML'],
			correctAnswers: ['Hooks let you use state'],
			metadata: { skillTag: mainSkill, difficulty: 'easy', timeEstimateMin: 2 },
		}, mainSkill);
	}
	if (t === 'short') {
		return {
			questionId: `q-short-${idx}`,
			type: 'short',
			prompt: `Briefly explain a core concept in ${role}.`,
			correctAnswers: [''],
			metadata: { skillTag: mainSkill, difficulty: 'medium', timeEstimateMin: 3 },
		};
	}
	if (t === 'coding') {
		return {
			questionId: `q-coding-${idx}`,
			type: 'coding',
			prompt: 'Implement a function add(a,b) that returns a + b.',
			starterCode: 'function add(a, b) {\n  // TODO\n}\n',
			tests: [
				{ name: '2+3', input: [2,3], expected: 5, functionName: 'add' },
				{ name: '0+0', input: [0,0], expected: 0, functionName: 'add' },
			],
			metadata: { skillTag: 'javascript', difficulty: 'easy', timeEstimateMin: 5 },
		};
	}
	return {
		questionId: `q-scenario-${idx}`,
		type: 'scenario',
		prompt: `You are designing a feature related to ${mainSkill}. Describe your approach and trade-offs.`,
		correctAnswers: [''],
		metadata: { skillTag: mainSkill, difficulty: 'medium', timeEstimateMin: 7 },
	};
}

function buildBaselineSet(input: BlueprintInput): Question[] {
	const mainSkill = input.techStack[0] || 'general';
	const count = Math.max(4, Math.ceil(input.durationMinutes / 10));
	const allowed = ((input.preferredQuestionTypes && input.preferredQuestionTypes.length) ? input.preferredQuestionTypes : ['mcq', 'short', 'coding', 'scenario']) as QuestionType[];
	const out: Question[] = [];
	for (let i = 0; i < count; i++) {
		const t = allowed[i % allowed.length] || 'mcq';
		out.push(makeByType(t, i + 1, input.role, mainSkill));
	}
	return out;
}

export async function generateAssessmentQuestions(input: BlueprintInput): Promise<Question[]> {
	const allowed = ((input.preferredQuestionTypes && input.preferredQuestionTypes.length) ? input.preferredQuestionTypes : ['mcq', 'short', 'coding', 'scenario']) as QuestionType[];
	if (!genAI) {
		return buildBaselineSet(input);
	}
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
	const prompt = `Generate ${Math.max(5, Math.ceil(input.durationMinutes/10))} assessment questions for role ${input.role}. 
Tech stack: ${input.techStack.join(', ')}. Experience: ${input.experienceLevel}. Preferred types: ${allowed.join(', ')}.
Notes: ${input.naturalLanguageNotes || 'none'}.
Return JSON array ONLY, with fields: questionId, type in [${allowed.join(', ')}], prompt, options (mcq), correctAnswers (mcq/short), starterCode (coding), tests (coding: array of {name,input,expected,functionName?}), metadata {skillTag,difficulty in [easy, medium, hard], timeEstimateMin}. Do not include labels like A) in options. Do not include descriptions outside JSON.`;
	const res = await model.generateContent(prompt);
	const text = res.response.text();
	const parsed = extractJsonArray(text);
	if (!parsed) return buildBaselineSet(input);
	let list = parsed as Question[];
	list = list.filter(q => allowed.includes((q.type || 'mcq') as QuestionType)).map((q, i) => {
		let mq: Question = {
			questionId: q.questionId || `q-${i+1}`,
			type: (q.type || 'mcq') as QuestionType,
			prompt: q.prompt || 'Question',
			metadata: q.metadata || { skillTag: input.techStack[0] || 'general', difficulty: 'easy', timeEstimateMin: 2 },
		};
		if (mq.type === 'mcq') {
			const seed: any = { ...mq };
			if (Array.isArray((q as any).options)) seed.options = (q as any).options.map((o: any) => sanitizeOption(String(o))).filter((s: any) => typeof s === 'string');
			if (Array.isArray((q as any).correctAnswers)) seed.correctAnswers = (q as any).correctAnswers.map((c: any) => String(c));
			mq = ensureMcqValidity(seed as Question, input.techStack[0] || 'general');
		}
		if (mq.type === 'coding') {
			const seed: any = { ...mq };
			if ((q as any).starterCode !== undefined) seed.starterCode = (q as any).starterCode;
			if ((q as any).tests) seed.tests = ((q as any).tests || []).map((t: any) => {
				const mt: any = { name: t.name || 't', input: t.input, expected: t.expected };
				if (t.functionName !== undefined) mt.functionName = t.functionName;
				if (t.call !== undefined) mt.call = t.call;
				return mt;
			});
			mq = seed as Question;
		}
		if (mq.type === 'short' || mq.type === 'scenario') {
			const seed: any = { ...mq };
			seed.correctAnswers = Array.isArray((q as any).correctAnswers) ? (q as any).correctAnswers.filter((c: any) => typeof c === 'string') : [''];
			mq = seed as Question;
		}
		return mq;
	});
	if (list.length === 0) list = buildBaselineSet(input);
	return list;
}

export async function evaluateOpenAnswer(prompt: string, expected: string, candidateAnswer: string): Promise<{score: number; feedback: string;}> {
	if (!genAI) {
		return { score: 0.7, feedback: 'Heuristic score without AI key. Consider providing more specifics and examples.' };
	}
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
	const res = await model.generateContent(`Evaluate the candidate answer against expected answer.
Prompt: ${prompt}
Expected: ${expected}
Answer: ${candidateAnswer}
Return STRICT JSON {score: number between 0 and 1, feedback: string}`);
	const text = res.response.text();
	try {
		const parsed = JSON.parse(text) as {score: number; feedback: string};
		return parsed;
	} catch {
		return { score: 0.6, feedback: 'Could not parse AI evaluation. Heuristic score applied.' };
	}
}

export async function richEvaluate(questions: Question[], answers: {questionId: string; response: any}[], overallScore: number, perSkill: {skill: string; score: number}[]): Promise<RichEvaluation> {
	if (!genAI) {
		const lines = [
			`Overall, you demonstrated competency across ${perSkill.length} skill areas.`,
			`Your overall score was ${(overallScore*100).toFixed(0)}%. Focus on weaker areas to improve.`
		];
		const perQ = questions.map(q => ({ questionId: q.questionId, feedback: `For ${q.type} question, aim to be more precise and cover edge cases.` }));
		return { summary: lines.join('\n\n'), perQuestionFeedback: perQ };
	}
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
	const prompt = `Create a comprehensive, multi-paragraph assessment summary and per-question feedback.
Questions (JSON): ${JSON.stringify(questions)}
Answers (JSON): ${JSON.stringify(answers)}
OverallScore: ${overallScore}
PerSkill: ${JSON.stringify(perSkill)}
Return STRICT JSON {summary: string, perQuestionFeedback: Array<{questionId:string, feedback:string}>}.`;
	const res = await model.generateContent(prompt);
	const text = res.response.text();
	try {
		const parsed = JSON.parse(text) as RichEvaluation;
		if (parsed && typeof parsed.summary === 'string' && Array.isArray(parsed.perQuestionFeedback)) return parsed;
	} catch {}
	return { summary: `Overall score ${(overallScore*100).toFixed(0)}%. See per-skill for details.`, perQuestionFeedback: questions.map(q => ({ questionId: q.questionId, feedback: 'Consider improving depth and clarity.' })) };
} 

export async function generateInsights(role: string, techStack: string[], overallScore: number, perSkill: {skill: string; score: number}[]): Promise<Insights> {
	// If AI available, ask for detailed, actionable insights with YouTube resources
	if (genAI) {
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
		const prompt = `Given role ${role}, tech stack ${techStack.join(', ')}, overall score ${(overallScore*100).toFixed(0)}%, and per-skill scores ${JSON.stringify(perSkill)}:
Return STRICT JSON with detailed insights:
{
  "strengths": [3-6 concise bullets],
  "weaknesses": [3-6 concise bullets],
  "recommendations": [5-8 concrete, actionable next steps],
  "suggestedResources": [6-10 items with YouTube course/tutorial URLs; include channel names]
}`;
		try {
			const res = await model.generateContent(prompt);
			const text = res.response.text();
			const parsed = JSON.parse(text) as Insights;
			if (parsed && Array.isArray(parsed.strengths) && Array.isArray(parsed.weaknesses) && Array.isArray(parsed.recommendations) && Array.isArray(parsed.suggestedResources)) {
				return parsed;
			}
		} catch {}
	}
	// Heuristic fallback with curated YouTube links
	const topSkills = perSkill.sort((a,b) => b.score - a.score);
	const strengths = topSkills.filter(s => s.score >= 0.75).slice(0, 4).map(s => `${s.skill}: consistently strong (${Math.round(s.score*100)}%)`);
	const weaknesses = topSkills.filter(s => s.score < 0.6).slice(0, 4).map(s => `${s.skill}: needs improvement (${Math.round(s.score*100)}%)`);
	const recs: string[] = [
		`Prioritize 2 weakest skills for the next 2 weeks with daily 45–60 min focused practice`,
		`Rebuild a small project emphasizing ${weaknesses.map(w=>w.split(':')[0]).slice(0,2).join(' & ')} to solidify fundamentals`,
		`Do spaced repetition for core concepts and error patterns you missed`,
		`Add timed practice (Pomodoro 25/5) to simulate assessment pressure`,
		`Write brief reflections after each session: what improved, what remains unclear`,
	];
	const ytByTopic: Record<string, string[]> = {
		'react': [
			'https://www.youtube.com/watch?v=SqcY0GlETPk', // freeCodeCamp React
			'https://www.youtube.com/watch?v=VozPNrt-LfE', // Web Dev Simplified hooks
			'https://www.youtube.com/watch?v=Rh3tobg7hEo', // Net Ninja React
		],
		'javascript': [
			'https://www.youtube.com/watch?v=PkZNo7MFNFg', // freeCodeCamp JS
			'https://www.youtube.com/watch?v=Mus_vwhTCq0', // Namaste JS
			'https://www.youtube.com/watch?v=W6NZfCO5SIk', // Mosh JS
		],
		'node': [
			'https://www.youtube.com/watch?v=Oe421EPjeBE', // freeCodeCamp Node
			'https://www.youtube.com/watch?v=TlB_eWDSMt4', // Mosh Node
		],
		'express': [
			'https://www.youtube.com/watch?v=G8uL0lFFoN0',
		],
		'mongodb': [
			'https://www.youtube.com/watch?v=-56x56UppqQ', // Mongoose
			'https://www.youtube.com/watch?v=ofme2o29ngU', // MongoDB basics
		],
		'css': [
			'https://www.youtube.com/watch?v=1Rs2ND1ryYc', // CSS full course
		],
		'system design': [
			'https://www.youtube.com/watch?v=UzLMhqg3_Wc', // System design intro
			'https://www.youtube.com/watch?v=Hxy2GQC9qWk',
		],
		'data structures': [
			'https://www.youtube.com/watch?v=8hly31xKli0',
			'https://www.youtube.com/watch?v=BBpAmxU_NQo',
		],
	};
	const topics = new Set<string>([
		...techStack.map(s => s.toLowerCase()),
		...perSkill.map(s => s.skill.toLowerCase()),
	]);
	const resources: string[] = [];
	for (const key of Object.keys(ytByTopic)) {
		const vids: string[] = ytByTopic[key] ?? [];
		if (topics.has(key)) resources.push(...vids);
		if (resources.length >= 8) break;
	}
	if (resources.length < 6) {
		resources.push('https://www.youtube.com/@freecodecamp', 'https://www.youtube.com/@WebDevSimplified', 'https://www.youtube.com/@Fireship');
	}
	return { strengths: strengths.length ? strengths : ['Solid foundational understanding in core areas'], weaknesses: weaknesses.length ? weaknesses : ['Focus areas not detected; consider adding scenario/coding questions'], recommendations: recs, suggestedResources: Array.from(new Set(resources)).slice(0, 10) };
} 