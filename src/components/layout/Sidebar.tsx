import { NavLink } from 'react-router-dom'
import { User, Archive, BookMarked, Settings, Upload } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { to: '/', icon: User, label: 'Character', end: true },
  { to: '/vault', icon: Archive, label: 'Vault' },
  { to: '/loadouts', icon: BookMarked, label: 'Loadouts' },
  { to: '/import', icon: Upload, label: 'DIM Import' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <nav className="w-14 md:w-48 bg-destiny-surface border-r border-destiny-border flex flex-col py-3 flex-shrink-0">
      {NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-md text-sm font-medium transition-all',
              isActive
                ? 'bg-legendary/15 text-white border border-legendary/20'
                : 'text-gray-400 hover:text-white hover:bg-destiny-hover'
            )
          }
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="hidden md:block">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
