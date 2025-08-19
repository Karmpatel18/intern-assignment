import { useState } from 'react';
import { api } from '../lib/api';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from '../components/ui/sidebar';
import { LayoutGrid, PlusCircle, History as HistoryIcon, TrendingUp, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setToken } from '../lib/api';

export default function CreateAssessmentPage() {
	const [role, setRole] = useState('Frontend Developer');
	const [techStack, setTechStack] = useState('react, node, mongodb');
	const [experienceLevel, setExperienceLevel] = useState('1-3 years');
	const [preferredTypes, setPreferredTypes] = useState<string[]>(['mcq', 'coding', 'scenario']);
	const [duration, setDuration] = useState(45);
	const [notes, setNotes] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function toggleType(t: string) {
		setPreferredTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true); setError(null);
		try {
			const payload = {
				role,
				techStack: techStack.split(',').map(s => s.trim()).filter(Boolean),
				experienceLevel,
				preferredQuestionTypes: preferredTypes,
				durationMinutes: duration,
				notes,
			};
			const { assessment } = await api.tests.generate(payload);
			window.location.href = `/test/${assessment._id}`;
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}

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
								<Link className="sidebar-item" to="/dashboard"><LayoutGrid size={18} /><span className="sidebar-text">Overview</span></Link>
								<Link className="sidebar-item" to="/create"><PlusCircle size={18} /><span className="sidebar-text">Generate Test</span></Link>
								<Link className="sidebar-item" to="/history"><HistoryIcon size={18} /><span className="sidebar-text">Previous Results</span></Link>
								<Link className="sidebar-item" to="/dashboard#growth"><TrendingUp size={18} /><span className="sidebar-text">Skill Growth</span></Link>
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
							<div className="card">
								<h2 style={{ marginBottom: 16 }}>Create Assessment</h2>
								<form className="stack" onSubmit={onSubmit}>
									<div className="stack">
										<label>Role</label>
										<input value={role} onChange={e => setRole(e.target.value)} required />
									</div>
									<div className="stack">
										<label>Tech Stack (comma separated)</label>
										<input value={techStack} onChange={e => setTechStack(e.target.value)} />
									</div>
									<div className="stack">
										<label>Experience Level</label>
										<input value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} required />
									</div>
									<div>
										<label>Preferred Question Types</label>
										<div className="flex flex-wrap items-center gap-2 mt-1">
											{['mcq', 'short', 'coding', 'scenario'].map(t => (
												<label key={t} className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-[color:var(--surface)] border-[color:var(--border)]">
													<input type="checkbox" className="peer sr-only" checked={preferredTypes.includes(t)} onChange={() => toggleType(t)} />
													<span className="inline-grid place-items-center h-4 w-4 rounded border border-[color:var(--border)] bg-[color:var(--card)] peer-checked:bg-[color:var(--primary)] peer-checked:border-[color:var(--primary)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[color:var(--ring)]"></span>
													<span className="text-sm text-neutral-800">{t}</span>
												</label>
											))}
										</div>
									</div>
									<div className="stack">
										<label>Duration (minutes)</label>
										<input type="number" min={10} max={180} value={duration} onChange={e => setDuration(parseInt(e.target.value || '0', 10))} required />
									</div>
									<div className="stack">
										<label>Natural Language Notes</label>
										<textarea placeholder="Enter notes here" className="placeholder:text-neurtal-400 " value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
									</div>
									<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
										<button className="btn-primary" disabled={loading}>{loading ? 'Generating...' : 'Generate Assessment'}</button>
									</div>
								</form>
								{error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
							</div>
						</div>
					</SidebarInset>
				</div>
			</SidebarProvider>
		</div>
	);
} 