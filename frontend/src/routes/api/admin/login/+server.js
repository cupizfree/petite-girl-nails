import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
  try {
    const { username, password } = await request.json();

    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Server-side authentication: reads from secure private environment variables or server defaults
    // Note: private environment variables are never exposed to browser or client bundles!
    const expectedUser = (env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const expectedPass = (env.ADMIN_PASSWORD || 'salsabila2026').trim();

    const isValidUser = cleanUser === expectedUser;
    const isValidPass = cleanPass === expectedPass || cleanPass === `:${expectedPass}`;

    if (isValidUser && isValidPass) {
      const sessionToken = `pgn_auth_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      return json({
        success: true,
        token: sessionToken,
        message: 'Login admin berhasil'
      });
    }

    return json({
      success: false,
      error: 'Username atau password tidak sesuai. Akses ditolak.'
    }, { status: 401 });
  } catch (err) {
    return json({
      success: false,
      error: 'Format request login tidak valid.'
    }, { status: 400 });
  }
}
