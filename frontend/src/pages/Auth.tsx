import { useState } from 'react';
import { api, setToken } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export function RegisterPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true); setError(null);
		try {
			const { token } = await api.auth.register(form.name, form.email, form.password);
			setToken(token);
			window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: token }));
			navigate('/dashboard', { replace: true });
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}
	return (
		<div className="container">
			<div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
				<h2 style={{ marginBottom: 12 }}>Register</h2>
				<form className="stack" onSubmit={onSubmit}>
					<input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
					<input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
					<input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
					<button className="btn-primary" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
				</form>
				{error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
				<p className="muted" style={{ marginTop: 12 }}>Have an account? <a href="/login">Login</a></p>
			</div>
		</div>
	);
}

export function LoginPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true); setError(null);
		try {
			const { token } = await api.auth.login(form.email, form.password);
			setToken(token);
			window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: token }));
			navigate('/dashboard', { replace: true });
		} catch (e: any) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	}
	return (
		<div className="container">
			<div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
				<h2 style={{ marginBottom: 12 }}>Login</h2>
				<form className="stack" onSubmit={onSubmit}>
					<input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
					<input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
					<button className="btn-primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
				</form>
				{error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
				<p className="muted" style={{ marginTop: 12 }}>No account? <a href="/register">Register</a></p>
			</div>
		</div>
	);
} 