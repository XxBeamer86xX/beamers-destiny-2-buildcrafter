import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { refresh_token } = req.body as { refresh_token?: string }
  if (!refresh_token) {
    return res.status(400).json({ error: 'Missing refresh_token' })
  }

  const clientId = process.env.BUNGIE_CLIENT_ID
  const clientSecret = process.env.BUNGIE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server not configured' })
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const tokenResponse = await fetch('https://www.bungie.net/platform/app/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    })

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({ error: 'Token refresh failed' })
    }

    const tokens = await tokenResponse.json()
    return res.status(200).json(tokens)
  } catch (err) {
    console.error('Token refresh error:', err)
    return res.status(500).json({ error: 'Internal error during token refresh' })
  }
}
