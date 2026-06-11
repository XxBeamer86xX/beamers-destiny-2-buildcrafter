import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { bungieApi } from '../lib/bungie-api'
import type { UserMembership } from '../types/bungie'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  membershipId: string | null
  memberships: UserMembership[]
  selectedMembership: UserMembership | null
  displayName: string | null
  profilePicture: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  setTokens: (access: string, refresh: string, expiresIn: number, membershipId: string) => void
  setMemberships: (memberships: UserMembership[], primary?: string) => void
  setDisplayName: (name: string, picture?: string) => void
  selectMembership: (membership: UserMembership) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  isTokenExpired: () => boolean
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  membershipId: null,
  memberships: [],
  selectedMembership: null,
  displayName: null,
  profilePicture: null,
  isLoading: false,
  error: null,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTokens: (access, refresh, expiresIn, membershipId) => {
        bungieApi.setAccessToken(access)
        set({
          accessToken: access,
          refreshToken: refresh,
          expiresAt: Date.now() + expiresIn * 1000 - 60_000, // 1-min buffer
          membershipId,
          error: null,
        })
      },

      setMemberships: (memberships, primaryId) => {
        const primary = primaryId
          ? memberships.find(m => m.membershipId === primaryId)
          : memberships[0]
        set({ memberships, selectedMembership: primary ?? memberships[0] ?? null })
      },

      setDisplayName: (name, picture) =>
        set({ displayName: name, profilePicture: picture ?? null }),

      selectMembership: (membership) =>
        set({ selectedMembership: membership }),

      logout: () => {
        bungieApi.setAccessToken(null)
        set(initialState)
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      isTokenExpired: () => {
        const { expiresAt } = get()
        if (!expiresAt) return true
        return Date.now() >= expiresAt
      },
    }),
    {
      name: 'd2-auth',
      partialize: (state: AuthState & AuthActions) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        membershipId: state.membershipId,
        memberships: state.memberships,
        selectedMembership: state.selectedMembership,
        displayName: state.displayName,
        profilePicture: state.profilePicture,
      }),
    }
  )
)
