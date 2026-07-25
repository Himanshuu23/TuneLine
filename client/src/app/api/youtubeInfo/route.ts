import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

const oauth2client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/'
);

export async function POST() {
    try {
        const res = await oauth2client.userinfo.get();
        return Response.json({ success: true, data: res.data });
    } catch {
        return Response.json({ success: false, error: 'Failed to get user info' }, { status: 500 });
    }
}