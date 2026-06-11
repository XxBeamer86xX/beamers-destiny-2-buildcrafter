import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    BUNGIE_CLIENT_ID: !!process.env.BUNGIE_CLIENT_ID,
    BUNGIE_CLIENT_SECRET: !!process.env.BUNGIE_CLIENT_SECRET,
    VITE_REDIRECT_URL: !!process.env.VITE_REDIRECT_URL,
    VITE_BUNGIE_API_KEY: !!process.env.VITE_BUNGIE_API_KEY,
    VITE_BUNGIE_CLIENT_ID: !!process.env.VITE_BUNGIE_CLIENT_ID,
  })
}
