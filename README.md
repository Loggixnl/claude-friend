# Claud Friend - Confessional Video Chat Platform

A production-ready MVP for an online "confessional" video chat platform. Users connect as either Talkers (seeking to share) or Listeners (offering support), with a unique visual filter that provides anonymity while maintaining human connection.

## Features

- **Two User Roles**: Talker (seeks to talk) and Listener (offers support)
- **Confessional Video Filter**: Canvas-based effect with blur, pixelation, vignette, and grille overlay
- **Real-time Presence**: See active listeners with their ratings and language
- **Smart Sorting**: Favorites first, then by status, rating, and alphabetically
- **Call Request Flow**: 30-second ring timer with accept/deny/timeout handling
- **Listener Deny Limits**: Maximum 3 denies per session with warnings
- **Activation Delay**: 30-second countdown to prevent rapid on/off toggling
- **Rating System**: Talkers rate listeners after calls (1-5 stars)
- **Misconduct Reporting**: Report system with auto-ban after 5 reports
- **Favorites**: Talkers can favorite listeners for easy access
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Postgres, Auth, Realtime)
- **WebRTC**: Native RTCPeerConnection with STUN/TURN support
- **Hosting**: Vercel (frontend + API routes)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/Claud_friend.git
cd Claud_friend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from Project Settings > API
3. Create a `.env.local` file:

```bash
cp .env.example .env.local
```

4. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Database Migrations

Option A: Using Supabase CLI (recommended for local development):

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db push
```

Option B: Run SQL directly in Supabase Dashboard:

1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/20240101000000_initial_schema.sql`
3. Run the query

### 5. Configure Auth Redirect URLs

In your Supabase dashboard, go to Authentication > URL Configuration and add:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

For production, add your Vercel URL:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Running Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

## Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Add environment variables in Project Settings > Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
3. Deploy!

### 3. Update Supabase Auth URLs

After deployment, update your Supabase Auth redirect URLs to include your Vercel domain.

## Optional: TURN Server

For better NAT traversal, you can configure a TURN server:

```env
NEXT_PUBLIC_TURN_URL=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=username
NEXT_PUBLIC_TURN_PASSWORD=password
```

Free TURN server options:
- [Twilio TURN](https://www.twilio.com/docs/stun-turn)
- [Xirsys](https://xirsys.com/)
- Self-hosted with [coturn](https://github.com/coturn/coturn)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (protected)/       # Protected pages (dashboard, call)
│   ├── auth/              # Auth callback
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   └── report-abuse/      # Report abuse info
├── components/
│   ├── call/              # Call-related components
│   │   ├── call-room.tsx          # Main call UI
│   │   ├── confessional-video.tsx # Video filter
│   │   ├── call-controls.tsx      # Call control buttons
│   │   ├── rating-dialog.tsx      # Post-call rating
│   │   └── report-dialog.tsx      # Misconduct reporting
│   ├── dashboard/         # Dashboard components
│   │   ├── talker-dashboard.tsx   # Talker view
│   │   ├── listener-dashboard.tsx # Listener view
│   │   ├── listener-card.tsx      # Listener list item
│   │   └── ...
│   └── ui/                # shadcn/ui components
├── hooks/
│   ├── use-toast.ts       # Toast notifications
│   └── use-webrtc.ts      # WebRTC hook
├── lib/
│   ├── database.types.ts  # Supabase types
│   ├── sorting.ts         # Listener sorting logic
│   ├── supabase/          # Supabase clients
│   ├── types.ts           # TypeScript types
│   ├── utils.ts           # Utility functions
│   └── validations.ts     # Zod schemas
└── __tests__/             # Test files
```

## Database Schema

- **profiles**: User profiles (linked to auth.users)
- **listener_presence**: Listener status and session state
- **favorites**: Talker-Listener favorites
- **call_requests**: Call request lifecycle
- **call_sessions**: Active/completed calls
- **ratings**: Listener ratings
- **misconduct_reports**: User reports

## Known Limitations

1. **TURN Server**: Not configured by default. For production with users behind strict NATs, configure a TURN server.
2. **Email Verification**: Uses Supabase's built-in email. Configure SMTP for production.
3. **Rate Limiting**: Basic in-memory limiting. Use Upstash Redis for production.
4. **Confessional Filter**: Performance may vary on older mobile devices.

## Security Features

- Row-Level Security (RLS) on all tables
- Server-side validation with Zod
- Authenticated WebRTC signaling
- Peer-to-peer video (not stored on server)
- Auto-ban after 5 misconduct reports

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
