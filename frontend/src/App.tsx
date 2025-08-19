import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import DashboardPage from './pages/Dashboard';
import CreateAssessmentPage from './pages/CreateAssessment';
import TestPage from './pages/Test';
import ResultsPage from './pages/Results';
import HistoryPage from './pages/History';
import { RegisterPage, LoginPage } from './pages/Auth';
import { TiUser } from "react-icons/ti";

function useAuth() {
	const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
	useEffect(() => {
		function onStorage(e: StorageEvent) {
			if (e.key === 'token') setToken(e.newValue);
		}
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);
	return { token };
}

function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
	const [open, setOpen] = useState<boolean>(defaultOpen);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const max = open && panelRef.current ? panelRef.current.scrollHeight : 0;
	return (
		<div className="accordion-item">
			<button
				className="accordion-header"
				aria-expanded={open}
				aria-controls={`section-${title}`}
				onClick={() => setOpen(v => !v)}
			>
				<span>{title}</span>
				<svg className={`chevron ${open ? 'rotate' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
				</svg>
			</button>
			<div id={`section-${title}`} className="accordion-panel" style={{ maxHeight: max }}>
				<div ref={panelRef} className="accordion-content">{children}</div>
			</div>
		</div>
	);
}

function Landing() {
	const { token } = useAuth();
	return (
		<div>
			<div className="container-wide">
				<div className="navbar">
					<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
						<div style={{ width: 10, height: 10, borderRadius: 999, background: '#111827' }} />
						<b className="text-lg">MindGauge</b>
					</div>
					<div className="nav-links ">
						<a href="#features" className="muted">Features</a>
						<a href="#how" className="muted">How it works</a>
						<a href="#footer" className="muted">Contact</a>
						{token ? (
							<a href="/dashboard" aria-label="Profile">
								<span className="avatar"><TiUser size={22} /></span>
							</a>
						) : (
							<>
								<a href="/login"><button className="btn-ghost">Login</button></a>
								<a href="/register"><button className="btn-primary">Get Started</button></a>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="container" style={{ paddingTop: 32 }}>
				
					<img src="/main.jpg" alt="AI Assess Logo" className="py-4 mb-8 rounded-3xl h-96 w-full object-cover object-top" />
					<h1 className="fade-in font-semibold " style={{ fontSize: 40, letterSpacing: -0.5 }}>Assess skills with clarity, not guesswork.</h1>
					<p className="muted fade-in-delayed " style={{ maxWidth: 680 }}>Create role-based assessments powered by AI. Evaluate coding, problem-solving, and real-world scenarios with a clean, focused test experience.</p>
					<div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
						<a href="/register"><button className="btn-primary">Create your first test</button></a>
						<a href="/login"><button>View dashboard</button></a>
					</div>
				
			</div>

			<div id="features" className="container" style={{ marginTop: 24 }}>
				<div className="accordion">
					<AccordionItem title="AI-generated assessments" defaultOpen>
						Generate tailored questions for MCQs, coding, and scenarios based on role, stack, and experience.
					</AccordionItem>
					<AccordionItem title="Single-question focus">
						A calm, two-pane layout reduces cognitive load: question on the left, answer tools on the right.
					</AccordionItem>
					<AccordionItem title="Actionable reports">
						Rich results with strengths, weaknesses, recommendations, and clickable learning resources.
					</AccordionItem>
				</div>
			</div>

			<div id="how" className="container" style={{ marginTop: 16 }}>
				<div className="grid-2">
					<div className="card">
						<h3>1. Create</h3>
						<p className="muted">Define role, stack, duration, and preferences.</p>
					</div>
					<div className="card">
						<h3>2. Share</h3>
						<p className="muted">Invite candidates securely.</p>
					</div>
					<div className="card">
						<h3>3. Evaluate</h3>
						<p className="muted">Review submissions with AI summaries and skill breakdown.</p>
					</div>
					<div className="card">
						<h3>4. Improve</h3>
						<p className="muted">Use suggested resources to guide upskilling.</p>
					</div>
				</div>
			</div>

			<div id="footer" className="container-wide footer">
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div className="muted">© {new Date().getFullYear()} MindGauge</div>
					<div className="nav-links">
						<a href="#features" className="muted">Features</a>
						<a href="#how" className="muted">How it works</a>
						<a href="/login" className="muted">Login</a>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function App() {
	const { token } = useAuth();
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" replace />} />
				<Route path="/create" element={token ? <CreateAssessmentPage /> : <Navigate to="/login" replace />} />
				<Route path="/test/:id" element={token ? <TestPage /> : <Navigate to="/login" replace />} />
				<Route path="/results/:submissionId" element={token ? <ResultsPage /> : <Navigate to="/login" replace />} />
				<Route path="/history" element={token ? <HistoryPage /> : <Navigate to="/login" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
