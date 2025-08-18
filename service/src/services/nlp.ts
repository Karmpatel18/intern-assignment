import { QuestionType } from '../models/Assessment';

export interface StructuredInputs {
	role: string;
	techStack: string[];
	experienceLevel: string;
	preferredQuestionTypes: QuestionType[];
	durationMinutes: number;
	notes?: string;
}

export interface ParsedConstraints {
	makeHeavierOnProblemSolving: boolean;
	includeSystemDesign: boolean;
	focusSkills: string[];
}

export function parseNaturalLanguage(notes: string | undefined): ParsedConstraints {
	const normalized = (notes || '').toLowerCase();
	return {
		makeHeavierOnProblemSolving: /problem\s*solv(ing|e)/.test(normalized),
		includeSystemDesign: /system\s*design/.test(normalized),
		focusSkills: Array.from(new Set((normalized.match(/focus on ([a-z0-9\-\+\.# ]+)/g) || [])
			.flatMap(s => s.replace('focus on ', '').split(/[ ,]+/).filter(Boolean)))).slice(0, 5),
	};
}

export function combineToBlueprint(inputs: StructuredInputs) {
	const parsed = parseNaturalLanguage(inputs.notes);
	const preferredTypes = inputs.preferredQuestionTypes.length
		? inputs.preferredQuestionTypes
		: ['mcq', 'short', 'coding', 'scenario'];

	return {
		role: inputs.role,
		techStack: inputs.techStack,
		experienceLevel: inputs.experienceLevel,
		preferredQuestionTypes: preferredTypes as QuestionType[],
		durationMinutes: inputs.durationMinutes,
		naturalLanguageNotes: inputs.notes,
		parsed,
	};
} 