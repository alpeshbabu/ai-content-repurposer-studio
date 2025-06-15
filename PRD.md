# Product Requirements Document (PRD)

## Product Name
**AI Content Repurposer Studio**

---

## Purpose

Enable content creators, marketers, and agencies to quickly and intelligently repurpose a single piece of content (blog, article, video transcript, etc.) into multiple formats tailored for various platforms (social media, email, newsletters, etc.) using AI, while maintaining their unique brand voice and maximizing reach.

---

## Target Users

- Content creators (bloggers, YouTubers, podcasters)
- Social media managers
- Marketing teams and agencies
- Small businesses and startups
- Developers (via API access, future)

---

## Core Features

### 1. **Authentication & User Management**
- Users sign up/sign in via Google (NextAuth/Auth.js).
- User data and content are securely stored and isolated.

### 2. **Content Input**
- Users can type keyword or add text and AI will help them writing professional level blog, message or article.
- Users can create a new content item by:
  - Pasting text (blog, article, transcript, etc.)
  - Entering a title and selecting a content type (blog, article, video transcript, etc.)

### 3. **AI Repurposing**
- Users submit content to be repurposed.
- The system uses Anthropic Claude (or similar LLM) to generate multiple versions for different platforms (Twitter, LinkedIn, Instagram, Facebook, Email, Newsletter, Thread, etc.).
- The AI prompt incorporates the user's saved brand voice and preferred platforms.

### 4. **Brand Voice Training**
- Users can describe and save their brand voice (e.g., "friendly, witty, professional").
- Users can select preferred platforms for repurposing.
- Brand voice and preferences are used in all AI repurposing prompts.

### 5. **Content Management Dashboard**
- Users see a dashboard of all their content and repurposed versions.
- Each content item displays:
  - Title, type, original content
  - All repurposed versions (by platform)
- Option to create new content.

### 6. **Settings**
- Users can update their brand voice and preferred platforms at any time.

### 7. **Notifications**
- Users receive toast notifications for success/failure of actions (content repurposing, saving settings, etc.).

---

## Future/Planned Features

### 8. **Analytics Dashboard**
- Track usage: number of repurposings, most used platforms, engagement metrics (future).
- Visual charts and stats.

### 9. **Scheduling Integration**
- Allow users to schedule and post repurposed content directly to connected social accounts (Twitter, LinkedIn, etc.).
- OAuth integration with social APIs.

### 10. **Monetization**
- Freemium: Limited free repurposings per month.
- Pro/Agency plans: Unlimited or higher limits, team features, white-label.
- Stripe integration for payments.

### 11. **API Access**
- Developers can use an API to programmatically repurpose content.

---

## Technical Requirements

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL
- **Authentication:** NextAuth (Auth.js) with Google OAuth
- **AI Integration:** Anthropic Claude, Groq (or similar LLM)
- **Notifications:** react-hot-toast, Sonnar
- **State Management:** React state/hooks, Zustand (optional for future)
- **Deployment:** Vercel or similar
- **UI Components:** Shadcn
- **Icons:** Lucide-react
- **Validation** Zod

---

## User Flows

### 1. **Sign Up / Sign In**
- User visits app, clicks "Sign in with Google."
- Authenticated and redirected to dashboard.

### 2. **Create & Repurpose Content**
- User clicks "New Content."
- Fills in title, selects type, pastes content.
- Submits form; AI generates repurposed content for selected platforms.
- Repurposed content is displayed and saved.

### 3. **View Dashboard**
- User sees a list of all content and repurposed versions.
- Can view, copy, or use content.

### 4. **Edit Brand Voice / Preferences**
- User visits Settings.
- Updates brand voice and preferred platforms.
- Changes are saved and used in future repurposing.

---

## Non-Functional Requirements

- **Security:** User data is isolated and protected.
- **Performance:** Repurposing should complete in <10 seconds.
- **Scalability:** Support for thousands of users and content items.
- **Accessibility:** WCAG 2.1 AA compliance.
- **Responsiveness:** Fully responsive UI for desktop and mobile.

---

## Success Metrics

- Time saved per user (vs. manual repurposing)
- Number of repurposed content pieces generated
- User retention and engagement
- Conversion to paid plans (future)
- Uptime and reliability

---

## Open Questions / Next Steps

- Which additional social platforms should be prioritized?
- What analytics are most valuable to users?
- What integrations (Zapier, Buffer, etc.) are most requested?
- How should team/agency features be structured?

---

## Appendix

- **Sample Prompts:** Prompts for each platform, incorporating brand voice.
- **Wireframes:** (To be designed, if needed)
- **API Docs:** (For future developer access) 