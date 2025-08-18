import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardPage from './pages/Dashboard';
import CreateAssessmentPage from './pages/CreateAssessment';
import TestPage from './pages/Test';
import ResultsPage from './pages/Results';
import HistoryPage from './pages/History';
import { RegisterPage, LoginPage } from './pages/Auth';

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

function Landing() {
	return (
		<div style={{ padding: 24 }}>
			<h1>AI Assess</h1>
			<p>Build AI-powered, role-based assessments.</p>
			<a href="/register">Register yourself</a> · <a href="/login">Login</a>
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
