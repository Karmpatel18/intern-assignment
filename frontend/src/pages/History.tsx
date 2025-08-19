import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function HistoryPage() {
	const [assessments, setAssessments] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		api.tests.list().then(d => setAssessments(d.assessments || [])).catch(e => setError(e.message));
	}, []);
	return (
		<div className="container">
			<div className="toolbar" style={{ marginBottom: 12 }}>
				<h2>Previous Tests</h2>
				<a href="/dashboard"><button>Back</button></a>
			</div>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<div className="card">
				<div className="stack">
					{assessments.map(a => (
						<div key={a._id} className="option" style={{ justifyContent: 'space-between' }}>
							<div>
								<div style={{ fontWeight: 600 }}>{a.role}</div>
								<div className="muted" style={{ fontSize: 13 }}>{a.techStack?.join(', ')} · {a.experienceLevel} · {a.durationMinutes} min</div>
							</div>
							<div style={{ display: 'flex', gap: 8 }}>
								<a href={`/test/${a._id}`}><button>Open</button></a>
								<a href={`/history#${a._id}`} onClick={async (e) => { e.preventDefault(); const d = await api.submissions.listByAssessment(a._id); const last = d.submissions?.[0]; if (last) window.location.href = `/results/${last._id}`; }}><button className="btn-primary">Last result</button></a>
							</div>
						</div>
					))}
					{assessments.length === 0 && <p className="muted">No tests found.</p>}
				</div>
			</div>
		</div>
	);
} 