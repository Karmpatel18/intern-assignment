import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset, SidebarItem } from '../components/ui/sidebar';
import { api, setToken } from '../lib/api';
import { LayoutGrid, History as HistoryIcon, TrendingUp, PlusCircle, LogOut } from 'lucide-react';

type ViewKey = 'overview' | 'history' | 'growth' | 'account';

export default function DashboardPage() {
	const [assessments, setAssessments] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [growthLoading, setGrowthLoading] = useState(false);
	const [growthSubs, setGrowthSubs] = useState<any[]>([]);
    const [view, setView] = useState<ViewKey>('overview');
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyMap, setHistoryMap] = useState<Record<string, any[]>>({});
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
    useEffect(() => {
        if (view !== 'history' || assessments.length === 0) return;
        setHistoryLoading(true);
        Promise.all(assessments.map(async (a) => {
            try { const d = await api.submissions.listByAssessment(a._id); return [a._id, d.submissions || []] as const; }
            catch { return [a._id, []] as const; }
        })).then(entries => {
            const map: Record<string, any[]> = {};
            entries.forEach(([id, subs]) => { map[id] = subs; });
            setHistoryMap(map);
        }).finally(() => setHistoryLoading(false));
    }, [view, assessments]);
	
	return (
		<div className="dash-root">
			<SidebarProvider>
				<div className="dash-layout p-3">
					<Sidebar>
						<SidebarHeader>
							<b>Dashboard</b>
							
						</SidebarHeader>
						<SidebarContent>
							<div className="sidebar-items">
								<SidebarItem icon={LayoutGrid} active={view === 'overview'} onClick={() => setView('overview')}>Overview</SidebarItem>
								<SidebarItem icon={HistoryIcon} active={view === 'history'} onClick={() => setView('history')}>Previous Results</SidebarItem>
								<Link className="sidebar-item" to="/create"><PlusCircle size={18} /><span className="sidebar-text">Generate Test</span></Link>
							</div>
						</SidebarContent>
						<SidebarFooter>
							<a className="sidebar-item" onClick={() => { setToken(null); window.location.href = '/'; }}>
								<LogOut size={18} />
								<span className="sidebar-text">Logout</span>
							</a>
						</SidebarFooter>
					</Sidebar>

					<SidebarInset>
						<div className="content-area">
					{error && <p style={{ color: 'red' }}>{error}</p>}
					{view === 'overview' && (
						<div className="stack">
							<div className="card">
								<h3 style={{ marginBottom: 12 }}>Recent Assessments</h3>
								<div className="grid-cards">
									{assessments.map(a => (
										<div key={a._id} className="card" style={{ padding: 16 }}>
											<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
												<div style={{ fontWeight: 600 }}>{a.role}</div>
												<span className="badge">{a.durationMinutes} min</span>
											</div>
											<div className="truncate" style={{ fontSize: 13, marginTop: 6 }}>{a.techStack?.join(', ')} · {a.experienceLevel}</div>
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
						</div>
					)}

					{view === 'history' && (
						<div className="card">
							<h3>Previous Tests</h3>
							{historyLoading && <p className="muted">Loading results...</p>}
							<div className="stack">
								{assessments.map(a => {
									const subs = historyMap[a._id] || [];
									return (
										<div key={a._id} className="card" style={{ padding: 12 }}>
											<div style={{ fontWeight: 600 }}>{a.role}</div>
											<div className="truncate" style={{ fontSize: 12, marginBottom: 8 }}>{a.techStack?.join(', ')} · {a.experienceLevel}</div>
											<div className="stack">
												{subs.map((s: any) => (
													<div key={s._id} className="option" style={{ justifyContent: 'space-between' }}>
														<div style={{ fontSize: 13 }}>
															<span><b>{Math.round((s.overallScore || 0) * 100) || '—'}%</b></span>
															<span className="muted"> · {new Date(s.createdAt || s.created_at || 0).toLocaleString()}</span>
														</div>
														<div>
															<Link to={`/results/${s._id}`}><button>View</button></Link>
														</div>
													</div>
												))}
												{subs.length === 0 && <p className="muted">No submissions yet.</p>}
											</div>
										</div>
								);
								})}
								{assessments.length === 0 && <p className="muted">No tests found.</p>}
							</div>
						</div>
					)}

					
				</div>
			</SidebarInset>
			</div>
		</SidebarProvider>

			{confirmId && (
				<div className="card elevate" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					<div className="card" style={{ width: 420 }}>
						<h3>Give reassessment test?</h3>
						<p className="muted" style={{ marginTop: 6 }}>You can take the test again. Your new submission will appear in history.</p>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
							<button onClick={() => setConfirmId(null)}>Cancel</button>
							<Link to={`/test/${confirmId}`}><button className="btn-primary">Yes, start</button></Link>
						</div>
					</div>
				</div>
			)}
		</div>
	);
} 