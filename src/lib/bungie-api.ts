import axios, { type AxiosInstance } from 'axios'
import type {
  BungieResponse,
  BungieTokenResponse,
  GetMembershipsResponse,
  DestinyProfileResponse,
  DestinyManifest,
} from '../types/bungie'

const BUNGIE_ROOT = 'https://www.bungie.net'
const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string
const CLIENT_ID = import.meta.env.VITE_BUNGIE_CLIENT_ID as string

// All components we want from the profile endpoint
const PROFILE_COMPONENTS = [
  100, // Profiles
  102, // ProfileInventories (vault)
  200, // Characters
  201, // CharacterInventories
  205, // CharacterEquipment
  300, // ItemInstances
  302, // ItemPerks
  304, // ItemStats
  305, // ItemSockets
  308, // ItemPlugStates
  309, // ItemPlugObjectives
  310, // ItemReusablePlugs
].join(',')

class BungieApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${BUNGIE_ROOT}/Platform`,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
    })
  }

  setAccessToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common['Authorization']
    }
  }

  getOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
    })
    return `${BUNGIE_ROOT}/en/OAuth/Authorize?${params}`
  }

  async exchangeCode(code: string): Promise<BungieTokenResponse> {
    // Goes through our Vercel API route to keep client_secret server-side
    const resp = await axios.post('/api/auth/callback', { code })
    return resp.data
  }

  async refreshToken(refresh_token: string): Promise<BungieTokenResponse> {
    const resp = await axios.post('/api/auth/refresh', { refresh_token })
    return resp.data
  }

  async getMemberships(): Promise<GetMembershipsResponse> {
    const resp = await this.client.get<BungieResponse<GetMembershipsResponse>>(
      '/User/GetMembershipsForCurrentUser/'
    )
    if (resp.data.ErrorCode !== 1) throw new Error(resp.data.Message)
    return resp.data.Response
  }

  async getProfile(membershipType: number, membershipId: string): Promise<DestinyProfileResponse> {
    const resp = await this.client.get<BungieResponse<DestinyProfileResponse>>(
      `/Destiny2/${membershipType}/Profile/${membershipId}/`,
      { params: { components: PROFILE_COMPONENTS } }
    )
    if (resp.data.ErrorCode !== 1) throw new Error(resp.data.Message)
    return resp.data.Response
  }

  async getManifest(): Promise<DestinyManifest> {
    const resp = await this.client.get<BungieResponse<DestinyManifest>>('/Destiny2/Manifest/')
    if (resp.data.ErrorCode !== 1) throw new Error(resp.data.Message)
    return resp.data.Response
  }

  async transferItem(params: {
    itemReferenceHash: number
    stackSize: number
    transferToVault: boolean
    itemId: string
    characterId: string
    membershipType: number
  }): Promise<void> {
    const resp = await this.client.post<BungieResponse<number>>(
      '/Destiny2/Actions/Items/TransferItem/',
      params
    )
    if (resp.data.ErrorCode !== 1) throw new Error(resp.data.Message)
  }

  async equipItem(params: {
    itemId: string
    characterId: string
    membershipType: number
  }): Promise<void> {
    const resp = await this.client.post<BungieResponse<number>>(
      '/Destiny2/Actions/Items/EquipItem/',
      params
    )
    if (resp.data.ErrorCode !== 1) throw new Error(resp.data.Message)
  }

  async equipItems(params: {
    itemIds: string[]
    characterId: string
    membershipType: number
  }): Promise<void> {
    const resp = await this.client.post<BungieResponse<unknown>>(
      '/Destiny2/Actions/Items/EquipItems/',
      params
    )
    if (resp.data.ErrorCode !== 1) throw new Error(resp.data.Message)
  }

  // Fetch raw manifest table JSON from Bungie CDN
  async fetchManifestTable<T>(path: string): Promise<Record<string, T>> {
    const resp = await axios.get<Record<string, T>>(`${BUNGIE_ROOT}${path}`)
    return resp.data
  }
}

export const bungieApi = new BungieApiClient()
export { BUNGIE_ROOT }
