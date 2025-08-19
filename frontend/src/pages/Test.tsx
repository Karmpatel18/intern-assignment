import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

function normalizeAssessment(raw: any) {
	if (!raw) return raw;
	const norm = { ...raw };
	norm.questions = Array.isArray(raw.questions) ? raw.questions.map((q: any, idx: number) => {
		const base: any = {
			questionId: q.questionId || `q-${idx+1}`,
			type: q.type,
			prompt: String(q.prompt || 'Question'),
			metadata: q.metadata || { skillTag: 'general', difficulty: 'easy', timeEstimateMin: 2 },
		};
		if (q.type === 'mcq') {
			let options: string[] = [];
			if (Array.isArray(q.options)) options = q.options.map((o: any) => String(o));
			else if (q.options && typeof q.options === 'object') options = Object.values(q.options).map((o: any) => String(o));
			if (options.length < 2) options = ['Option A', 'Option B', 'Option C', 'Option D'];
			let correct: string[] = [];
			if (Array.isArray(q.correctAnswers)) correct = q.correctAnswers.map((c: any) => String(c));
			if (correct.length === 0 || !options.includes(correct[0])) correct = [options[0]];
			return { ...base, options, correctAnswers: correct };
		}
		if (q.type === 'coding') {
			return { ...base, starterCode: String(q.starterCode || ''), tests: Array.isArray(q.tests) ? q.tests : [] };
		}
		// short or scenario
		let correct: string[] = [];
		if (Array.isArray(q.correctAnswers)) correct = q.correctAnswers.map((c: any) => String(c));
		if (correct.length === 0) correct = [''];
		return { ...base, correctAnswers: correct };
	}) : [];
	return norm;
}

export default function TestPage() {
	const { id } = useParams();
	const [assessment, setAssessment] = useState<any | null>(null);
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [timeLeft, setTimeLeft] = useState<number>(0);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [warn, setWarn] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const warnedRef = useRef(false);

	useEffect(() => {
		if (!id) return;
		api.tests.get(id).then(d => {
			const norm = normalizeAssessment(d.assessment);
			setAssessment(norm);
			setTimeLeft((norm?.durationMinutes || 0) * 60);
		}).catch(e => setError(e.message));
	}, [id]);

	// Timer
	useEffect(() => {
		if (!timeLeft) return;
		const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
		return () => clearInterval(t);
	}, [timeLeft]);

	useEffect(() => {
		if (timeLeft === 0 && assessment && !submitting) {
			onSubmit();
		}
	}, [timeLeft]);

	// Tab switch detection
	useEffect(() => {
		function onVis() {
			if (document.hidden) {
				setWarn('Tab switch detected. Please stay on the test page.');
			}
		}
		document.addEventListener('visibilitychange', onVis);
		return () => document.removeEventListener('visibilitychange', onVis);
	}, []);

	function setAnswer(questionId: string, value: any) {
		setAnswers(prev => ({ ...prev, [questionId]: value }));
	}

	function goNext() {
		if (!assessment) return;
		setCurrentIndex(i => Math.min(i + 1, (assessment?.questions?.length || 1) - 1));
	}

	function goPrev() {
		setCurrentIndex(i => Math.max(0, i - 1));
	}

	async function onSubmit() {
		if (!id) return;
		setSubmitting(true); setError(null);
		try {
			const formatted = Object.entries(answers).map(([questionId, response]) => ({ questionId, response }));
			const { submission } = await api.submissions.submit(id, formatted);
			window.location.href = `/results/${submission._id}`;
		} catch (e: any) {
			setError(e.message);
		} finally {
			setSubmitting(false);
		}
	}

	const mmss = useMemo(() => {
		const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
		const s = Math.floor(timeLeft % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	}, [timeLeft]);

	if (!assessment) return <div className="container"><div className="card"><p>Loading...</p>{error && <p style={{ color: 'red' }}>{error}</p>}</div></div>;

	const total = assessment.questions.length;
	const q = assessment.questions[currentIndex];

	return (
		<div className="container">
			<div className="toolbar" style={{ marginBottom: 16 }}>
				<div>
					<h2 style={{ fontSize: 22 }}>{assessment.role} Test</h2>
					<p className="muted">Question {currentIndex + 1} of {total}</p>
				</div>
				<div className="card" style={{ padding: '8px 12px' }}>
					<span className="muted">Time left</span> <b>{mmss}</b>
				</div>
			</div>

			{warn && <div className="card" style={{ borderColor: '#f59e0b', background: '#fffbeb', color: '#92400e', marginBottom: 12 }}>Tab switch detected. Please stay on the test page.</div>}

			<div className="card">
				<div className="grid-2">
					<div className="question-pane">
						<p className="muted" style={{ marginBottom: 6 }}>Q{currentIndex + 1} · {q.type}</p>
						<h3 style={{ fontSize: 18, marginBottom: 8 }}>{q.prompt}</h3>
					</div>
					<div className="answer-pane">
						{q.type === 'mcq' && Array.isArray(q.options) && q.options.length > 0 && (
							<div className="stack">
								{q.options.map((opt: string) => (
									<label key={opt} className="option">
										<input type="radio" name={q.questionId} value={opt} checked={answers[q.questionId] === opt} onChange={e => setAnswer(q.questionId, e.target.value)} />
										<span>{opt}</span>
									</label>
								))}
							</div>
						)}
						{q.type === 'short' && (
							<input type="text" placeholder="Your answer" value={answers[q.questionId] || ''} onChange={e => setAnswer(q.questionId, e.target.value)} />
						)}
						{q.type === 'scenario' && (
							<textarea rows={8} placeholder="Your approach" value={answers[q.questionId] || ''} onChange={e => setAnswer(q.questionId, e.target.value)} />
						)}
						{q.type === 'coding' && (
							<div className="stack">
								<label>Starter code</label>
								<textarea className="code-area" rows={12} placeholder="Write your solution here" value={answers[q.questionId] ?? (q.starterCode || '')} onChange={e => setAnswer(q.questionId, e.target.value)} />
							</div>
						)}
					</div>
				</div>
				<div className="toolbar" style={{ marginTop: 16 }}>
					<div style={{ display: 'flex', gap: 8 }}>
						<button onClick={goPrev} disabled={currentIndex === 0}>Previous</button>
						<button onClick={goNext} disabled={currentIndex === total - 1}>Next</button>
					</div>
					<div>
						<button className="btn-primary" onClick={onSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
					</div>
				</div>
			</div>

			{error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
		</div>
	);
} 