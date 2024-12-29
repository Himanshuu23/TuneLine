const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/'
)

export async function POST(request: Request) {
    const { email } = await request.json();

   try {
    const res = await oauth2client.userinfo.get()
   }
}