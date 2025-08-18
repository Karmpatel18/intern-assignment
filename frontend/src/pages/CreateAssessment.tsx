import { useState } from 'react';
import { api } from '../lib/api';

export default function CreateAssessmentPage() {
	const [role, setRole] = useState('Frontend Developer');
	const [techStack, setTechStack] = useState('react, node, mongodb');
	const [experienceLevel, setExperienceLevel] = useState('1-3 years');
	const [preferredTypes, setPreferredTypes] = useState<string[]>(['mcq', 'coding', 'scenario']);
	const [duration, setDuration] = useState(45);
	const [notes, setNotes] = useState('make it heavy on problem solving and include at least one system design question');
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
		<div style={{ padding: 24 }}>
			<h2>Create Assessment</h2>
			<form onSubmit={onSubmit}>
				<label>Role<br /><input value={role} onChange={e => setRole(e.target.value)} required /></label>
				<br />
				<label>Tech Stack (comma separated)<br /><input value={techStack} onChange={e => setTechStack(e.target.value)} /></label>
				<br />
				<label>Experience Level<br /><input value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} required /></label>
				<br />
				<label>Preferred Question Types</label>
				<div>
					{['mcq', 'short', 'coding', 'scenario'].map(t => (
						<label key={t} style={{ marginRight: 12 }}>
							<input type="checkbox" checked={preferredTypes.includes(t)} onChange={() => toggleType(t)} /> {t}
						</label>
					))}
				</div>
				<label>Duration (minutes)<br /><input type="number" min={10} max={180} value={duration} onChange={e => setDuration(parseInt(e.target.value || '0', 10))} required /></label>
				<br />
				<label>Natural Language Notes<br /><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} cols={60} /></label>
				<br />
				<button disabled={loading}>{loading ? 'Generating...' : 'Generate Assessment'}</button>
			</form>
			{error && <p style={{ color: 'red' }}>{error}</p>}
		</div>
	);
} 