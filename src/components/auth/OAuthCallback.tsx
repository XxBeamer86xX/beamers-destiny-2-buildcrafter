import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { bungieApi } from '../../lib/bungie-api'
import { useAuthStore } from '../../store/authStore'
import { BUNGIE_ROOT } from '../../lib/bungie-api'

export function OAuthCallback() {
  const navigate = useNavigate()
  const { setTokens, setMemberships, setDisplayName, setError } = useAuthStore()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      setError(`Bungie auth error: ${error}`)
      navigate('/login')
      return
    }

    if (!code) {
      setError('No authorization code received')
      navigate('/login')
      return
    }

    ;(async () => {
      try {
        const tokens = await bungieApi.exchangeCode(code)
        setTokens(
          tokens.access_token,
          tokens.refresh_token,
          tokens.expires_in,
          tokens.membership_id
        )

        // Fetch memberships
        const membershipsData = await bungieApi.getMemberships()
        setMemberships(membershipsData.destinyMemberships, membershipsData.primaryMembershipId)

        const user = membershipsData.bungieNetUser
        setDisplayName(
          user.displayName,
          user.profilePicturePath ? `${BUNGIE_ROOT}${user.profilePicturePath}` : undefined
        )

        navigate('/', { replace: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Authentication failed'
        setError(msg)
        navigate('/login', { replace: true })
      }
    })()
  }, [navigate, setTokens, setMemberships, setDisplayName, setError])

  return (
    <div className="min-h-screen bg-destiny-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-legendary animate-spin" />
        <p className="text-gray-400">Signing in with Bungie…</p>
      </div>
    </div>
  )
}
