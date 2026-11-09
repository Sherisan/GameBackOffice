import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Badge } from './ui';

const NAV = 'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors';

export function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-ink-800 bg-ink-900">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-sm font-bold text-white">GB</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Game Back Office</div>
            <div className="text-[11px] text-ink-400">Game configuration</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <NavLink to="/games" className={({ isActive }) => `${NAV} ${isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-300 hover:bg-ink-850 hover:text-ink-100'}`}>
            <Icon d="M4 6h16M4 12h16M4 18h10" />
            Games
          </NavLink>
          <NavLink to="/promotions" className={({ isActive }) => `${NAV} ${isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-300 hover:bg-ink-850 hover:text-ink-100'}`}>
            <Icon d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            Promotions
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => `${NAV} ${isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-300 hover:bg-ink-850 hover:text-ink-100'}`}>
              <Icon d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 19v-1a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" />
              Users
            </NavLink>
          )}
        </nav>

        <div className="border-t border-ink-800 p-3">
          <NavLink
            to="/account"
            className={({ isActive }) => `flex flex-col items-start gap-1 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? 'bg-ink-800' : 'hover:bg-ink-850'}`}
          >
            <span className="font-medium text-ink-100">{user?.displayName}</span>
            <span className="flex items-center gap-2 text-xs text-ink-400">
              {user?.username} <Badge tone={user?.role === 'Admin' ? 'violet' : user?.role === 'Editor' ? 'blue' : 'neutral'}>{user?.role}</Badge>
            </span>
          </NavLink>
          <button type="button" onClick={logout} className={`${NAV} mt-1 w-full text-ink-400 hover:bg-ink-850 hover:text-ink-100`}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-7">
        <Outlet />
      </main>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
