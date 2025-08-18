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
		<div style={{ padding: 24 }}>
			<h2>Register</h2>
			<form onSubmit={onSubmit}>
				<input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
				<br />
				<input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
				<br />
				<input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
				<br />
				<button disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
			</form>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<p>Have an account? <a href="/login">Login</a></p>
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
		<div style={{ padding: 24 }}>
			<h2>Login</h2>
			<form onSubmit={onSubmit}>
				<input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
				<br />
				<input placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
				<br />
				<button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
			</form>
			{error && <p style={{ color: 'red' }}>{error}</p>}
			<p>No account? <a href="/register">Register</a></p>
		</div>
	);
} 