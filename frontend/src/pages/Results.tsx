import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ResultsPage() {
	const { submissionId } = useParams();
	const [submission, setSubmission] = useState<any | null>(null);
	const [error, setError] = useState<string | null>(null);

	function normalizeUrl(url: string): string | null {
		try {
			const u = new URL(url);
			return u.href;
		} catch {
			return null;
		}
	}

	function extractYouTubeId(url: string): string | null {
		try {
			const u = new URL(url);
			if (u.hostname.includes('youtube.com')) {
				if (u.pathname === '/watch') return u.searchParams.get('v');
				if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
				if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
			}
			if (u.hostname === 'youtu.be') {
				return u.pathname.split('/')[1] || null;
			}
			return null;
		} catch {
			return null;
		}
	}
	useEffect(() => {
		if (!submissionId) return;
		api.submissions.get(submissionId).then(d => setSubmission(d.submission)).catch(e => setError(e.message));
	}, [submissionId]);
	if (!submission) return <div className="container"><div className="card"><p>Loading...</p>{error && <p style={{ color: 'red' }}>{error}</p>}</div></div>;
	return (
		<div className="container">
			<div className="toolbar" style={{ marginBottom: 16 }}>
				<h2 style={{ fontSize: 20 }}>Assessment Report</h2>
				<a href="/dashboard"><button>Back to Dashboard</button></a>
			</div>
			<div className="card">
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
					<div>
						<h3 style={{ margin: 0, fontSize: 16 }}>Overall Score</h3>
						<div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round((submission.overallScore || 0) * 100)}%</div>
						<p className="muted" style={{ margin: 0, fontSize: 12 }}>AI-evaluated performance</p>
					</div>
					<div style={{ minWidth: 260, flex: 1 }}>
						<h3 style={{ marginBottom: 8, fontSize: 16 }}>Skills</h3>
						<div className="stack">
							{(submission.perSkillBreakdown || []).map((s: any) => {
								const pct = Math.round((s.score || 0) * 100);
								return (
									<div key={s.skill}>
										<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
											<span className="muted">{s.skill}</span>
											<span>{pct}%</span>
										</div>
										<div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
									</div>
								);
							})}

							{(!submission.perSkillBreakdown || submission.perSkillBreakdown.length === 0) && (
								<p className="muted">No skill data available.</p>
							)}
						</div>
					</div>
				</div>
				{submission.aiSummary && (
					<div style={{ marginTop: 12 }}>
						<h3 style={{ fontSize: 16 }}>Summary</h3>
						<div className="card" style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{submission.aiSummary}</div>
					</div>
				)}
				{submission.questionFeedbacks && submission.questionFeedbacks.length > 0 && (
					<div style={{ marginTop: 12 }}>
						<h3 style={{ fontSize: 16 }}>Per-question feedback</h3>
						<ul>
							{submission.questionFeedbacks.map((f: any) => (
								<li key={f.questionId}><b>{f.questionId}</b>: {f.feedback}</li>
							))}
						</ul>
					</div>
				)}
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
					<div>
						<h3 style={{ fontSize: 16 }}>Strengths</h3>
						<ul style={{ fontSize: 14 }}>{(submission.strengths || []).map((s: string) => <li key={s}>{s}</li>)}</ul>
					</div>
					<div>
						<h3 style={{ fontSize: 16 }}>Weaknesses</h3>
						<ul style={{ fontSize: 14 }}>{(submission.weaknesses || []).map((s: string) => <li key={s}>{s}</li>)}</ul>
					</div>
				</div>
				<div style={{ marginTop: 12 }}>
					<h3 style={{ fontSize: 16 }}>Recommendations</h3>
					<ul style={{ fontSize: 14 }}>{(submission.recommendations || []).map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
				</div>
				<div style={{ marginTop: 12 }}>
					<h3 style={{ fontSize: 16 }}>Suggested Resources</h3>
					<div className="stack">
						{(submission.suggestedResources || []).map((s: string, i: number) => {
							const href = normalizeUrl(s);
							const ytId = href ? extractYouTubeId(href) : null;
							return (
								<div key={i} className="card" style={{ padding: 12 }}>
									<div className="resource-card">
										{ytId ? (
											<iframe
												title={`yt-${i}`}
												className="resource-thumb"
												src={`https://www.youtube.com/embed/${ytId}`}
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
												allowFullScreen
											/>
										) : (
											<a href={href || undefined} target="_blank" rel="noreferrer" className="resource-thumb" />
										)}
										<div>
											<a href={href || undefined} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>
												{href ? s : s}
											</a>
											<div className="resource-meta">
												<span>Resource</span>
												{href && <span>·</span>}
												{href && <span>opens in new tab</span>}
											</div>
											<div className="resource-actions" style={{ marginTop: 6 }}>
												<a href={href || undefined} target="_blank" rel="noreferrer"><button>Open</button></a>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
		
	);
} 
