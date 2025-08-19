import React, { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode, ElementType } from 'react'

type SidebarContextValue = {
	collapsed: boolean
	setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(false)
	const value = useMemo(() => ({ collapsed, setCollapsed }), [collapsed])
	return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

function useSidebar() {
	const ctx = useContext(SidebarContext)
	if (!ctx) throw new Error('Sidebar components must be used within <SidebarProvider>')
	return ctx
}

export function Sidebar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
	const { collapsed } = useSidebar()
	return (
		<aside
			className={`sidebar ${collapsed ? 'collapsed' : ''} h-full border-r ${className}`}
			style={{ width: collapsed ? 72 : 280, minWidth: collapsed ? 72 : 280, background: 'var(--sidebar)', borderColor: 'var(--sidebar-border)' }}
		>
			<div className="h-full flex flex-col">
				{children}
			</div>
		</aside>
	)
}

export function SidebarHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
	return (
		<div className={`sidebar-header flex items-center justify-between px-3 py-2 border-b ${className}`} style={{ borderColor: 'var(--sidebar-border)' }}>
			<div className="sidebar-text">{children}</div>
		</div>
	)
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
	return <div className="flex-1 overflow-auto p-2">{children}</div>
}

export function SidebarFooter({ children }: { children: React.ReactNode }) {
	return <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>{children}</div>
}

export function SidebarTrigger({ children }: { children?: React.ReactNode }) {
	// Make sidebar non-collapsible by disabling trigger action
	const { collapsed } = useSidebar()
	return <button className="btn-ghost" aria-label="Sidebar" disabled>{children ?? (collapsed ? '⟩' : '⟨')}</button>
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
	return <div className="flex-1 h-full overflow-auto">{children}</div>
}

export function SidebarItem({ active, onClick, children, icon: Icon }: { active?: boolean; onClick?: () => void; children: ReactNode; icon?: ElementType }) {
	return (
		<a onClick={onClick} className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer ${active ? 'text-white' : ''}`} style={{ background: active ? 'var(--sidebar-primary)' : 'transparent', color: active ? 'var(--sidebar-primary-foreground)' : 'var(--sidebar-foreground)' }}>
			{Icon ? <Icon size={18} /> : <span className="w-6 h-6 rounded bg-[color:var(--sidebar-accent)]/50" />}
			<span className="sidebar-text">{children}</span>
		</a>
	)
}


