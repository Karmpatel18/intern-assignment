import { useEffect, useMemo, useState } from 'react';
import { api, setToken } from '../lib/api';

export default function DashboardPage() {
	const [assessments, setAssessments] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [growthLoading, setGrowthLoading] = useState(false);
	const [growthSubs, setGrowthSubs] = useState<any[]>([]);
	useEffect(() => {
		api.tests.list().then(d => { const arr = d.assessments || []; setAssessments(arr); if (arr[0]?._id) setSelectedId(arr[0]._id); }).catch(e => setError(e.message));
	}, []);
	useEffect(() => {
		if (!selectedId) return;
		setGrowthLoading(true);
		api.submissions.listByAssessment(selectedId).then(d => {
			const subs = (d.submissions || []).slice().sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
			setGrowthSubs(subs);
		}).catch(() => setGrowthSubs([])).finally(() => setGrowthLoading(false));
	}, [selectedId]);
	const skillSeries = useMemo(() => {
		const map: Record<string, number[]> = {};
		for (const s of growthSubs) {
			for (const ps of (s.perSkillBreakdown || [])) {
				const k = ps.skill || 'General'; if (!map[k]) map[k] = []; map[k].push(Math.round((ps.score || 0) * 100));
			}
		}
		return Object.entries(map).slice(0, 3);
	}, [growthSubs]);
	function linePath(values: number[], w: number, h: number): string { if (!values.length) return ''; const step = values.length > 1 ? (w - 8) / (values.length - 1) : 0; return values.map((v, i) => { const x = 4 + i * step; const y = h - 4 - (v / 100) * (h - 8); return `${i === 0 ? 'M' : 'L'}${x},${y}`; }).join(' '); }
	return (
		<div className="container">
			<div className="toolbar" style={{ marginBottom: 16 }}>
				<h2>Dashboard</h2>
				<div style={{ display: 'flex', gap: 8 }}>
					<a href="/create"><button className="btn-primary">Generate Test</button></a>
					<a href="/history"><button>Previous Tests</button></a>
					<button onClick={() => { setToken(null); window.location.href = '/'; }}>Logout</button>
				</div>
			</div>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<div className="card">
				<h3 style={{ marginBottom: 12 }}>Recent Assessments</h3>
				<div className="grid-cards">
					{assessments.map(a => (
						<div key={a._id} className="card" style={{ padding: 16 }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<div style={{ fontWeight: 600 }}>{a.role}</div>
								<span className="badge">{a.durationMinutes} min</span>
							</div>
							<div className="muted truncate" style={{ fontSize: 13, marginTop: 6 }}>{a.techStack?.join(', ')} · {a.experienceLevel}</div>
							<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
								<button onClick={() => setConfirmId(a._id)}>Reassess</button>
							</div>
						</div>
					))}
				</div>
				{assessments.length === 0 && (
					<p className="muted">No assessments yet.</p>
				)}
			</div>

			<div className="card" style={{ marginTop: 12 }}>
				<div className="toolbar" style={{ marginBottom: 8 }}>
					<h3>Skill growth</h3>
					<div>
						<select value={selectedId || ''} onChange={e => setSelectedId(e.target.value)}>
							{assessments.map(a => <option key={a._id} value={a._id}>{a.role}</option>)}
						</select>
					</div>
				</div>
				{growthLoading && <p className="muted">Loading growth...</p>}
				{!growthLoading && growthSubs.length === 0 && <p className="muted">No submissions yet for this assessment.</p>}
				{!growthLoading && growthSubs.length > 0 && (
					<div className="grid-cards">
						{skillSeries.map(([skill, series]) => (
							<div key={skill} className="card" style={{ padding: 12 }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
									<span className="muted" style={{ fontSize: 13 }}>{skill}</span>
									<span className="badge">{(series as number[])[(series as number[]).length - 1]}%</span>
								</div>
								<svg width="100%" height="64" viewBox="0 0 260 64" preserveAspectRatio="none">
									<path d="M4,60 L256,60" stroke="#e5e7eb" strokeWidth="1" />
									<path d={linePath(series as number[], 260, 64)} stroke="#111827" strokeWidth="2" fill="none" />
								</svg>
							</div>
						))}
					</div>
				)}
			</div>

			{confirmId && (
				<div className="card elevate" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<div className="card" style={{ width: 420 }}>
						<h3>Give reassessment test?</h3>
						<p className="muted" style={{ marginTop: 6 }}>You can take the test again. Your new submission will appear in history.</p>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
							<button onClick={() => setConfirmId(null)}>Cancel</button>
							<a href={`/test/${confirmId}`}><button className="btn-primary">Yes, start</button></a>
						</div>
					</div>
				</div>
			)}
		</div>
	);
} 