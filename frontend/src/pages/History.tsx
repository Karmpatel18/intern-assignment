import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function HistoryPage() {
	const [assessments, setAssessments] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		api.tests.list().then(d => setAssessments(d.assessments || [])).catch(e => setError(e.message));
	}, []);
	return (
		<div style={{ padding: 24 }}>
			<h2>Previous Tests</h2>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<ul>
				{assessments.map(a => (
					<li key={a._id}>
						<div>
							<b>{a.role}</b> · {a.techStack?.join(', ')} · {a.experienceLevel} · {a.durationMinutes} min
							<div>
								<a href={`/test/${a._id}`}>Open test</a> · <a href={`/history#${a._id}`} onClick={async (e) => { e.preventDefault(); const d = await api.submissions.listByAssessment(a._id); const last = d.submissions?.[0]; if (last) window.location.href = `/results/${last._id}`; }}>Last result</a>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
} 