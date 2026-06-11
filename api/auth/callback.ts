import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code } = req.body as { code?: string }
  if (!code) {
    return res.status(400).json({ error: 'Missing code' })
  }

  const clientId = process.env.BUNGIE_CLIENT_ID
  const clientSecret = process.env.BUNGIE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Server not configured',
      missing: [...(!clientId ? ['BUNGIE_CLIENT_ID'] : []), ...(!clientSecret ? ['BUNGIE_CLIENT_SECRET'] : [])],
    })
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
        grant_type: 'authorization_code',
        code,
      }),
    })

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text()
      return res.status(tokenResponse.status).json({ error: 'Token exchange failed', detail: body })
    }

    const tokens = await tokenResponse.json()
    return res.status(200).json(tokens)
  } catch (err) {
    console.error('OAuth callback error:', err)
    return res.status(500).json({ error: 'Internal error during token exchange' })
  }
}
