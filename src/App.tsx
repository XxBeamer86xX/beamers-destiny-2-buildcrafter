import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import { bungieApi } from './lib/bungie-api'

import { LoginPage } from './components/auth/LoginPage'
import { OAuthCallback } from './components/auth/OAuthCallback'
import { Layout } from './components/layout/Layout'
import { CharacterPage } from './components/character/CharacterPage'
import { VaultPage } from './components/vault/VaultPage'
import { LoadoutsPage } from './components/loadout/LoadoutsPage'
import { SettingsPage } from './components/settings/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { accessToken, isTokenExpired, refreshToken: storedRefreshToken, setTokens, logout } = useAuthStore()

  // Restore token to axios instance on app load
  useEffect(() => {
    if (accessToken) {
      if (isTokenExpired() && storedRefreshToken) {
        // Try to refresh
        bungieApi.refreshToken(storedRefreshToken)
          .then(t => setTokens(t.access_token, t.refresh_token, t.expires_in, t.membership_id))
          .catch(() => logout())
      } else if (!isTokenExpired()) {
        bungieApi.setAccessToken(accessToken)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<CharacterPage />} />
        <Route path="vault" element={<VaultPage />} />
        <Route path="loadouts" element={<LoadoutsPage />} />
        <Route path="import" element={<LoadoutsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
