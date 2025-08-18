const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

export function getToken(): string | null {
	return localStorage.getItem('token');
}

export function setToken(token: string | null) {
	if (token) localStorage.setItem('token', token);
	else localStorage.removeItem('token');
}

async function request(path: string, options: RequestInit = {}) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
	const token = getToken();
	if (token) headers['Authorization'] = `Bearer ${token}`;
	const res = await fetch(`${API_URL}${path}`, { ...options, headers });
	if (!res.ok) {
		let msg = `HTTP ${res.status}`;
		try { const j = await res.json(); msg = j.error || msg; } catch {}
		throw new Error(msg);
	}
	return res.json();
}

export const api = {
	auth: {
		register: (name: string, email: string, password: string) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
		login: (email: string, password: string) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
		me: () => request('/api/auth/me'),
	},
	tests: {
		generate: (payload: any) => request('/api/tests/generate', { method: 'POST', body: JSON.stringify(payload) }),
		list: () => request('/api/tests'),
		get: (id: string) => request(`/api/tests/${id}`),
	},
	submissions: {
		submit: (assessmentId: string, answers: any[]) => request(`/api/submissions/${assessmentId}`, { method: 'POST', body: JSON.stringify({ answers }) }),
		listByAssessment: (assessmentId: string) => request(`/api/submissions/assessment/${assessmentId}`),
		get: (id: string) => request(`/api/submissions/${id}`),
	},
}; 