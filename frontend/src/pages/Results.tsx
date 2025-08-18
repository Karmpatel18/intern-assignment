import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResultsPage() {
	const { submissionId } = useParams();
	const [submission, setSubmission] = useState<any | null>(null);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		if (!submissionId) return;
		api.submissions.get(submissionId).then(d => setSubmission(d.submission)).catch(e => setError(e.message));
	}, [submissionId]);
	if (!submission) return <div style={{ padding: 24 }}><p>Loading...</p>{error && <p style={{ color: 'red' }}>{error}</p>}</div>;
	return (
		<div style={{ padding: 24 }}>
			<h2>Assessment Report</h2>
			<p>Overall Score: <b>{Math.round((submission.overallScore || 0) * 100)}%</b></p>
			{submission.aiSummary && (
				<div>
					<h3>Summary</h3>
					<div style={{ whiteSpace: 'pre-wrap' }}>{submission.aiSummary}</div>
				</div>
			)}
			{submission.questionFeedbacks && submission.questionFeedbacks.length > 0 && (
				<div>
					<h3>Per-question feedback</h3>
					<ul>
						{submission.questionFeedbacks.map((f: any) => (
							<li key={f.questionId}><b>{f.questionId}</b>: {f.feedback}</li>
						))}
					</ul>
				</div>
			)}
			<h3>Per-skill breakdown</h3>
			<ul>
				{(submission.perSkillBreakdown || []).map((s: any) => (
					<li key={s.skill}>{s.skill}: {Math.round((s.score || 0) * 100)}%</li>
				))}
			</ul>
			<h3>Strengths</h3>
			<ul>{(submission.strengths || []).map((s: string) => <li key={s}>{s}</li>)}</ul>
			<h3>Weaknesses</h3>
			<ul>{(submission.weaknesses || []).map((s: string) => <li key={s}>{s}</li>)}</ul>
			<h3>Recommendations</h3>
			<ul>{(submission.recommendations || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
			<h3>Suggested Resources</h3>
			<ul>{(submission.suggestedResources || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
			<p><a href="/dashboard">Back to Dashboard</a></p>
		</div>
	);
} 