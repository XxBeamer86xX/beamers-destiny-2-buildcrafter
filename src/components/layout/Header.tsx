import { useNavigate } from 'react-router-dom'
import { LogOut, RefreshCw, Shield } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAppStore } from '../../store/appStore'
import { useProfile } from '../../hooks/useProfile'
import { BUNGIE_ROOT } from '../../lib/bungie-api'
import { CLASS_TYPE_MAP, CLASS_NAMES } from '../../types/destiny'
import clsx from 'clsx'

export function Header() {
  const navigate = useNavigate()
  const { logout, displayName, profilePicture } = useAuthStore()
  const { selectedCharacterId, setSelectedCharacter } = useAppStore()
  const { data: profile, refetch, isFetching } = useProfile()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-14 bg-destiny-surface border-b border-destiny-border flex items-center px-4 gap-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Shield className="w-5 h-5 text-legendary" />
        <span className="font-bold text-white tracking-wide text-sm hidden sm:block">D2 Loadouts</span>
      </div>

      {/* Character selector */}
      {profile?.characters && profile.characters.length > 0 && (
        <div className="flex items-center gap-2">
          {profile.characters.map(char => {
            const cls = CLASS_TYPE_MAP[char.classType]
            const isSelected = char.characterId === selectedCharacterId
            return (
              <button
                key={char.characterId}
                onClick={() => setSelectedCharacter(char.characterId)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-legendary/20 border border-legendary/40 text-white'
                    : 'bg-destiny-card border border-destiny-border text-gray-400 hover:text-white hover:border-destiny-hover'
                )}
              >
                {char.emblemPath && (
                  <img
                    src={`${BUNGIE_ROOT}${char.emblemPath}`}
                    alt=""
                    className="w-5 h-5 rounded-sm"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <span>{CLASS_NAMES[cls]}</span>
                <span className="text-gray-500">·</span>
                <span className={isSelected ? 'text-exotic' : 'text-gray-500'}>{char.light}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="flex-1" />

      {/* Refresh */}
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        title="Refresh character data"
        className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-destiny-card transition-colors disabled:opacity-50"
      >
        <RefreshCw className={clsx('w-4 h-4', isFetching && 'animate-spin')} />
      </button>

      {/* User */}
      <div className="flex items-center gap-2">
        {profilePicture ? (
          <img src={profilePicture} alt="" className="w-7 h-7 rounded-full border border-destiny-border" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-destiny-card border border-destiny-border flex items-center justify-center">
            <span className="text-xs text-gray-400">{displayName?.[0]?.toUpperCase()}</span>
          </div>
        )}
        <span className="text-sm text-gray-300 hidden md:block">{displayName}</span>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-destiny-card transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  )
}
