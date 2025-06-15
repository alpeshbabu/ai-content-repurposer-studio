# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the AI Content Repurposer Studio.

## Prerequisites

- Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "AI Content Repurposer")
5. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "AI Content Repurposer Studio"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Save and continue

### 4. Configure OAuth Client

1. After consent screen setup, create OAuth client ID:
   - Application type: "Web application"
   - Name: "AI Content Repurposer Web Client"
   
2. Add Authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`
   
3. Click "Create"

### 5. Copy Credentials

After creating the OAuth client, you'll see:
- **Client ID**: Something like `123456789012-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: A long string of characters

### 6. Update Environment Variables

1. Open your `.env` file
2. Replace the placeholder values:

```env
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### 7. Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/signin`

3. Click "Continue with Google"

4. You should be redirected to Google's OAuth consent screen

5. After authorizing, you should be redirected back to your dashboard

## Troubleshooting

### Common Issues

1. **"Error 400: redirect_uri_mismatch"**
   - Make sure the redirect URI in Google Cloud Console exactly matches your app's URL
   - Include the full path: `/api/auth/callback/google`

2. **"Access blocked: This app's request is invalid"**
   - Ensure you've properly configured the OAuth consent screen
   - Check that all required fields are filled

3. **Google button doesn't appear**
   - Verify that both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
   - Restart your development server after updating `.env`

## Production Deployment

When deploying to production:

1. Add your production domain to Authorized redirect URIs in Google Cloud Console
2. Update your production environment variables with the Google OAuth credentials
3. Ensure `NEXTAUTH_URL` is set to your production URL

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for all sensitive credentials
- Regularly rotate your Client Secret if compromised
- Consider implementing additional security measures like domain restrictions in Google Cloud Console