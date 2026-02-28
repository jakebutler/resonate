# Resonate

A publishing schedule manager for [Corvo Labs](https://corvolabs.com). Manage LinkedIn posts and blog content with AI-assisted writing.

## Features

- **Publishing Calendar**: Monthly view with color-coded post chips, filtering by channel
- **Blog Post Editor**: Markdown editor with preview, image uploads, GitHub PR publishing
- **LinkedIn Post Editor**: Character counter, repost support, cross-promotion linking
- **AI Writing Assistant**: Multi-turn chat with Corvo Cortex for LinkedIn post drafting
- **Onboarding Setup**: Channel toggles and publishing frequency configuration

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Convex |
| Auth | Clerk |
| LLM | Corvo Cortex |
| Styling | Tailwind CSS v4 |

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account
- Clerk account
- GitHub personal access token (for blog publishing)

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

### Initialize Convex

```bash
npx convex dev
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
resonate/
├── app/
│   ├── layout.tsx         # Root layout with Clerk + Convex providers
│   ├── page.tsx           # Dashboard (calendar)
│   ├── setup/page.tsx     # Onboarding
│   └── api/
│       ├── llm/route.ts   # Corvo Cortex proxy (streaming)
│       └── publish/route.ts # GitHub PR creation
├── components/
│   ├── AIAssistant/       # Chat UI for LinkedIn drafting
│   ├── BlogPostEditor/    # Markdown editor slide-over
│   ├── Calendar/          # Monthly publishing grid
│   ├── CreatePostModal/   # Type picker modal
│   ├── LinkedInPostEditor/# Text editor slide-over
│   ├── SetupPage/         # Channel configuration
│   └── ui/                # Shared primitives
├── convex/
│   ├── schema.ts          # Data models
│   ├── posts.ts           # CRUD operations
│   └── settings.ts        # User preferences
└── lib/
    ├── cortex.ts          # Corvo Cortex client
    └── github.ts          # GitHub API helpers
```

## Color Palette

| Name | Hex |
|------|-----|
| Ink Black | `#001524` |
| Stormy Teal | `#15616d` |
| Papaya Whip | `#ffecd1` |
| Vivid Tangerine | `#ff7d00` |
| Brandy | `#78290f` |

## Deployment

1. Push to GitHub
2. Connect to Vercel or your preferred hosting
3. Set environment variables in your deployment platform
4. Deploy

## License

MIT
