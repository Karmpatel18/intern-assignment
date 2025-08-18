import mongoose, { Schema, Document, Types } from 'mongoose';

export type QuestionType = 'mcq' | 'short' | 'coding' | 'scenario';

export interface QuestionMetadata {
	skillTag: string;
	difficulty: 'easy' | 'medium' | 'hard';
	timeEstimateMin: number;
}

export interface QuestionTest {
	name: string;
	input?: any;
	expected: any;
	functionName?: string;
	call?: string;
}

export interface Question {
	_id?: Types.ObjectId | string;
	questionId: string;
	type: QuestionType;
	prompt: string;
	options?: string[];
	correctAnswers?: string[];
	starterCode?: string;
	tests?: QuestionTest[];
	metadata: QuestionMetadata;
}

export interface AssessmentDocument extends Document {
	userId: Types.ObjectId;
	role: string;
	techStack: string[];
	experienceLevel: string;
	preferredQuestionTypes: QuestionType[];
	durationMinutes: number;
	naturalLanguageNotes?: string;
	questions: Question[];
	createdAt: Date;
	updatedAt: Date;
}

const QuestionSchema = new Schema<Question>({
	questionId: { type: String, required: true },
	type: { type: String, enum: ['mcq', 'short', 'coding', 'scenario'], required: true },
	prompt: { type: String, required: true },
	options: { type: [String], default: [] },
	correctAnswers: { type: [String], default: [] },
	starterCode: String,
	tests: [{ name: String, input: Schema.Types.Mixed, expected: Schema.Types.Mixed, functionName: String, call: String }],
	metadata: {
		skillTag: { type: String, required: true },
		difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
		timeEstimateMin: { type: Number, required: true },
	},
});

const AssessmentSchema = new Schema<AssessmentDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	role: { type: String, required: true },
	techStack: { type: [String], default: [] },
	experienceLevel: { type: String, required: true },
	preferredQuestionTypes: { type: [String], default: [] },
	durationMinutes: { type: Number, required: true },
	naturalLanguageNotes: { type: String },
	questions: { type: [QuestionSchema], default: [] },
}, { timestamps: true });

export const Assessment = mongoose.model<AssessmentDocument>('Assessment', AssessmentSchema);

export interface SubmissionAnswer {
	questionId: string;
	response: any;
}

export interface PerSkillScore {
	skill: string;
	score: number;
}

export interface SubmissionDocument extends Document {
	userId: Types.ObjectId;
	assessmentId: Types.ObjectId;
	answers: SubmissionAnswer[];
	overallScore: number;
	perSkillBreakdown: PerSkillScore[];
	strengths: string[];
	weaknesses: string[];
	recommendations: string[];
	suggestedResources: string[];
	aiSummary?: string;
	questionFeedbacks?: { questionId: string; feedback: string }[];
	startedAt?: Date;
	completedAt?: Date;
}

const SubmissionSchema = new Schema<SubmissionDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
	answers: [{ questionId: String, response: Schema.Types.Mixed }],
	overallScore: { type: Number, default: 0 },
	perSkillBreakdown: [{ skill: String, score: Number }],
	strengths: [String],
	weaknesses: [String],
	recommendations: [String],
	suggestedResources: [String],
	aiSummary: { type: String },
	questionFeedbacks: [{ questionId: String, feedback: String }],
	startedAt: Date,
	completedAt: Date,
}, { timestamps: true });

export const Submission = mongoose.model<SubmissionDocument>('Submission', SubmissionSchema);

export interface TemplateDocument extends Document {
	userId: Types.ObjectId;
	name: string;
	role: string;
	techStack: string[];
	experienceLevel: string;
	preferredQuestionTypes: QuestionType[];
	durationMinutes: number;
	naturalLanguageNotes?: string;
}

const TemplateSchema = new Schema<TemplateDocument>({
	userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	name: { type: String, required: true },
	role: { type: String, required: true },
	techStack: { type: [String], default: [] },
	experienceLevel: { type: String, required: true },
	preferredQuestionTypes: { type: [String], default: [] },
	durationMinutes: { type: Number, required: true },
	naturalLanguageNotes: String,
}, { timestamps: true });

export const Template = mongoose.model<TemplateDocument>('Template', TemplateSchema); 