import { useEffect, useState } from 'react';
import { api, setToken } from '../lib/api';

export default function DashboardPage() {
	const [assessments, setAssessments] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		api.tests.list().then(d => setAssessments(d.assessments || [])).catch(e => setError(e.message));
	}, []);
	return (
		<div style={{ padding: 24 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between' }}>
				<h2>Dashboard</h2>
				<div>
					<button onClick={() => { setToken(null); window.location.href = '/'; }}>Logout</button>
				</div>
			</div>
			<p>
				<a href="/create">Generate Test</a> · <a href="/history">Previous Tests</a>
			</p>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<h3>Recent Assessments</h3>
			<ul>
				{assessments.map(a => (
					<li key={a._id}>
						<a href={`/test/${a._id}`}>{a.role} · {a.techStack?.join(', ')}</a>
					</li>
				))}
			</ul>
		</div>
	);
} 