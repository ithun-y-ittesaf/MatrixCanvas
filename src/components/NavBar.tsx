import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="flex items-center gap-6 px-6 h-14 border-b border-white/10 bg-[#111320]">
      <span className="text-blue-400 font-bold text-lg tracking-tight select-none">
        Matrix<span className="text-white">Canvas</span>
      </span>

      <div className="flex gap-1 ml-2">
        {[
          { to: '/',        label: 'Playground' },
          { to: '/learn',   label: 'Learn'       },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
