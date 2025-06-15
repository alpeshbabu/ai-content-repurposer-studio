# AI Content Repurposer Studio

A powerful platform that uses AI to automatically repurpose content into multiple formats for different social media platforms.

## Features

- Content Input: Paste URL, upload file, or enter text
- AI Analysis: Extract key points and tone
- Multi-format Generation: Generate 5-10 different content pieces
- Brand Voice Training: Learn user's writing style
- Platform Integration: Connect to social platforms
- Analytics Dashboard: Track performance
- AI-powered content repurposing for multiple platforms
- Subscription tiers with different limits and features
- User authentication and team management
- Usage tracking and billing
- Support ticket system for customer assistance

## Support System

The application includes a comprehensive support ticket system that allows users to:

- Create support tickets with different categories and priority levels
- Track ticket status (open, in-progress, resolved, closed)
- Communicate with support staff through ticket replies
- View their ticket history and status updates

Support categories include:
- Account issues
- Subscription management
- Billing questions
- Content-related problems
- Technical support
- Other inquiries

Administrators can manage tickets through an admin interface, respond to users, and update ticket statuses.

## Tech Stack

- Next.js 15
- TypeScript
- TailwindCSS
- Prisma with PostgreSQL
- NextAuth (Auth.js) Authentication (Google OAuth)
- Anthropic Claude AI

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-content-repurposer-studio.git
cd ai-content-repurposer-studio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="postgresql://..."
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret"
ANTHROPIC_API_KEY=""
```

- To get Google OAuth credentials, go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create OAuth 2.0 credentials.
- Set `NEXTAUTH_SECRET` to a random string (you can generate one with `openssl rand -base64 32`).

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
- `/src/components` - Reusable React components
- `/prisma` - Database schema and migrations
- `/public` - Static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
