SOFTDOCK
AI-Driven Software Issue Resolution Platform
Project Specification & Build Guide  |  Kybernode  |  2025

# 1. Project Overview
SoftDock is a dedicated AI-powered platform built to solve software-related issues faster and more accurately than general-purpose AI tools. It maintains curated, tool-specific knowledge bases, ingests documentation and GitHub issues, and provides streaming, context-aware answers — eliminating the hours wasted reading scattered docs for a single method or error fix.

Built by Kybernode as a portfolio project demonstrating AI automation and web application development capabilities.

# 2. Problem Statement
Developers routinely lose significant time on a pattern that repeats across every project:
Encounter an error or unknown method in a framework or third-party library
Search across multiple documentation sites, GitHub issues, and Stack Overflow threads
Read through irrelevant content before finding the actual solution
Paste fragments into a general AI that lacks the full context of the tool
Repeat this cycle multiple times for what is often a 3-line fix

A general AI model — even a powerful one like Claude Opus or GPT-4 — underperforms on niche tool-specific problems because it lacks curated, up-to-date context. A dedicated system with pre-loaded, structured knowledge for specific tools resolves this gap entirely.

# 3. Solution — What SoftDock Does
## 3.1 Core Capabilities
Dedicated knowledge bases per tool/framework (e.g., n8n, Openclaw, Stripe API, Django REST Framework)
Upload documentation, GitHub issue threads, changelogs, and Stack Overflow answers directly into a project's context
Streaming AI responses so users see answers token-by-token, not after a 10-second wait
Issue history and resolution memory — learns from previously solved problems within a workspace
BYOK (Bring Your Own Key) model — users connect their Anthropic or OpenAI API key
Workspace isolation — separate environments per project or client

## 3.2 What Makes It Different from ChatGPT or Claude.ai

# 4. Tech Stack
## 4.1 Backend — Django

## 4.2 Frontend — Next.js / React

## 4.3 Infrastructure

# 5. System Architecture
## 5.1 Request Flow
User query → Next.js frontend → Django REST API (auth check) → Celery task (if doc processing) → Anthropic SDK with curated context → Django Channels WebSocket → streaming tokens back to browser.

## 5.2 Subdomain Deployment
softdock.kybernode.com

Nginx on the Contabo server routes by Host header:
Requests to /api/* → Django (port 8000 via Gunicorn/Uvicorn)
Requests to /* → Next.js (port 3000)
WebSocket connections → Django Channels via /ws/* path
SSL handled by Cloudflare proxy — no Certbot required

## 5.3 Project Directory Structure
softdock/
├── backend/                     # Django project root
│   ├── core/                    # settings, urls, asgi, wsgi
│   ├── accounts/                # custom user model, auth views
│   ├── workspaces/              # workspace CRUD, member management
│   ├── issues/                  # issue intake, AI processing, history
│   ├── knowledge/               # document upload, context storage
│   ├── billing/                 # Paddle webhook handler, subscription
│   ├── streaming/               # Django Channels consumers
│   └── requirements.txt
├── frontend/                    # Next.js project root
│   ├── app/
│   │   ├── (auth)/              # login, register, onboarding
│   │   ├── dashboard/           # main issue chat interface
│   │   ├── knowledge-base/      # document manager per workspace
│   │   ├── history/             # resolved issue archive
│   │   └── settings/            # API key (BYOK), billing, profile
│   ├── components/              # reusable UI components
│   ├── lib/                     # axios instance, zustand stores
│   └── package.json
└── nginx/
└── softdock.conf            # Nginx site config

# 6. Database Schema
## 6.1 Core Models
User
id (UUID)
email (unique)
full_name
anthropic_api_key (encrypted)
openai_api_key (encrypted)
created_at, updated_at

Workspace
id (UUID)
name (e.g. 'Openclaw Project')
owner → FK User
slug (unique URL identifier)
created_at

KnowledgeDocument
id (UUID)
workspace → FK Workspace
title
source_type (choices: upload | github_issue | url | manual)
raw_content (TextField)
processed_content (TextField — cleaned, chunked text)
is_active (Boolean — toggle in/out of context)
created_at

Issue
id (UUID)
workspace → FK Workspace
user → FK User
title (auto-generated from first message)
status (choices: open | resolved | archived)
created_at, resolved_at

Message
id (UUID)
issue → FK Issue
role (choices: user | assistant)
content (TextField)
tokens_used (Integer)
created_at

# 7. API Endpoints
## 7.1 Authentication — /api/auth/

## 7.2 Workspaces — /api/workspaces/

## 7.3 Knowledge Base — /api/workspaces/{slug}/knowledge/

## 7.4 Issues — /api/workspaces/{slug}/issues/

## 7.5 WebSocket — Streaming
ws://softdock.kybernode.com/ws/issues/{issue_id}/
Django Channels consumer handles WebSocket connection. When a message is posted via REST, the Channels consumer streams Claude's response token by token back to the connected frontend client.

# 8. UI/UX Design System
## 8.1 Brand Colors
SoftDock inherits the Kybernode brand palette. The interface is dark-first with blue accents — professional, focused, and developer-friendly.


## 8.2 Typography
Font Family: Inter (UI), Fira Code (code blocks)
Page title: 24px / 700 weight / White
Section heading: 18px / 600 weight / White
Body text: 14px / 400 weight / #A0AEC0
Code: 13px / 400 weight / Fira Code / #A6E3A1 on #1E1E2E

## 8.3 Layout Structure
Global Shell
Left Sidebar (240px fixed): Kybernode logo, workspace switcher, navigation links, user avatar + settings link
Top Bar (56px): Active workspace name, search bar, API key status indicator
Main Content Area: Fluid width, scrollable

Dashboard — Main Issue Chat
Left panel (300px): Issue list sorted by recent activity. Each item shows title, status badge, timestamp
Right panel (fluid): Chat thread view with streaming AI messages. User messages right-aligned in blue. AI messages left-aligned in surface card with subtle blue left border
Bottom input bar (fixed): Multi-line textarea, send button, model selector, context toggle button

Knowledge Base Page
Grid of document cards — each shows source type icon, title, character count, active/inactive toggle
Upload zone at top — drag and drop or paste raw text
GitHub issue URL import field

Settings Page
API Keys section: Anthropic key field + OpenAI key field — masked input, test connection button
Billing section: Current plan, Paddle payment portal link
Workspace section: Rename, delete workspace

## 8.4 Component Patterns
Buttons: Primary = solid blue (#1A6BCC). Secondary = outlined blue. Destructive = red (#EF4444)
Inputs: Dark background (#1C1C28), blue focus ring (2px #1A6BCC), rounded-lg
Status badges: Open = blue dot, Resolved = green dot, Archived = gray dot
AI streaming cursor: blinking blue bar ▍ appears at end of in-progress response
Toast notifications: Bottom-right, dark surface, colored left border by type (blue=info, green=success, red=error)

# 9. Feature Specifications
## 9.1 BYOK (Bring Your Own Key) System
Users enter their Anthropic or OpenAI API key in Settings. The key is encrypted at rest using Django's Fernet symmetric encryption before database storage. When an AI call is made, the key is decrypted in memory, used for the request, and never logged or exposed in API responses.

## 9.2 Document Ingestion Pipeline
User uploads file or pastes raw text, or provides a GitHub issue URL
Celery task picks up the job asynchronously
Content is cleaned (remove HTML, normalize whitespace), chunked into 2000-character segments
Chunks stored in KnowledgeDocument.processed_content as JSON array
When an issue is submitted, relevant chunks are selected and injected as system context before the user message

## 9.3 Streaming Response
User submits message via REST POST to /api/.../messages/
Backend creates the user Message record, then opens a stream from Anthropic SDK
Django Channels consumer sends each token chunk through the WebSocket
Frontend Vercel AI SDK receives chunks and appends to the chat UI in real time
On stream completion, full response is saved as assistant Message record

## 9.4 Issue Resolution Memory
When a user marks an issue as resolved, the full thread (including the working solution) is flagged and stored as a high-value knowledge artifact. Future issues in the same workspace can reference these resolved threads as additional context — creating a compounding knowledge base.

# 10. Environment Variables
## 10.1 Backend (.env)
SECRET_KEY=your_django_secret_key
DEBUG=False
ALLOWED_HOSTS=softdock.kybernode.com
DATABASE_URL=postgres://softdock_user:password@localhost/softdock_db
REDIS_URL=redis://localhost:6379/0
ENCRYPTION_KEY=your_fernet_key_here
PADDLE_VENDOR_ID=your_paddle_id
PADDLE_API_KEY=your_paddle_key
PADDLE_WEBHOOK_SECRET=your_webhook_secret

## 10.2 Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://softdock.kybernode.com/api
NEXT_PUBLIC_WS_URL=wss://softdock.kybernode.com/ws

# 11. Nginx Configuration
server {
listen 80;
server_name softdock.kybernode.com;

# WebSocket — Django Channels
location /ws/ {
proxy_pass http://127.0.0.1:8000;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
}

# REST API — Django
location /api/ {
proxy_pass http://127.0.0.1:8000;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
}

# Frontend — Next.js
location / {
proxy_pass http://127.0.0.1:3000;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
}
}

# 12. Build & Launch Plan

# 13. Instructions for AI Agents (Claude Opus / Cursor)
If you are an AI model reading this document to assist with development, follow these principles:

Always use the Anthropic Python SDK directly — do not use LangChain unless multi-step agent chains are explicitly required
All AI calls must use the user's stored API key retrieved from the database, never a hardcoded key
Django models should use UUID primary keys (import uuid, use models.UUIDField(default=uuid.uuid4))
All API views must be protected with IsAuthenticated permission class unless explicitly public
Frontend components should follow the dark theme — background #0A0A0F, surface #13131A, primary blue #1A6BCC
Streaming must be handled via Django Channels WebSocket consumers — never use polling
Encryption of API keys uses cryptography.fernet — never store plaintext keys
All database queries involving user data must filter by workspace and confirm the requesting user is a member
Frontend state for the active issue and messages lives in Zustand — do not use React Context for this
Celery tasks must have retry logic with exponential backoff for document ingestion

When in doubt about any implementation detail not covered here, refer to the official Django, DRF, Next.js, and Anthropic SDK documentation.

SoftDock is a Kybernode project. kybernode.com
| Feature | General AI | SoftDock |
| --- | --- | --- |
| Context | Generic training data | Your specific docs loaded |
| Tool knowledge | May be outdated | You control the source |
| Issue memory | None | Saves resolved issues |
| Streaming | Yes (ChatGPT) | Yes, built-in |
| API cost | Subscription | BYOK — user pays own API |

| Layer | Technology | Purpose |
| --- | --- | --- |
| API Framework | Django + Django REST Framework | REST endpoints, auth, admin panel |
| AI Integration | Anthropic Python SDK | Direct Claude API calls with streaming |
| Async Tasks | Celery + Redis | Doc ingestion, background processing |
| Database | PostgreSQL (local) | All persistent data storage |
| Authentication | Django Allauth + JWT | Email/social login, token auth |
| Realtime | Django Channels (WebSocket) | Streaming AI tokens to frontend |
| ASGI Server | Uvicorn + Gunicorn | Production server with WebSocket support |

| Layer | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js 14 (App Router) | SSR, routing, API routes |
| Styling | Tailwind CSS | Utility-first, fast UI development |
| UI Components | shadcn/ui | Production-quality free components |
| State Management | Zustand | Lightweight global state |
| AI Streaming | Vercel AI SDK | Clean token-by-token stream rendering |
| Forms | React Hook Form + Zod | Form handling and validation |
| HTTP Client | Axios | API calls to Django backend |

| Layer | Tool | Cost |
| --- | --- | --- |
| Server | Contabo VPS (existing) | Already paid |
| Reverse Proxy | Nginx | Free |
| DNS + SSL | Cloudflare Free Plan | Free |
| Database | PostgreSQL on same server | Free |
| Process Manager | PM2 | Free |
| Redis | Upstash Free Tier | Free (10k requests/day) |
| Payments | Paddle (MoR) | 5% per transaction only |
| Payouts | Payoneer | Free account |

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /register/ | Create account with email + password |
| POST | /login/ | Returns JWT access + refresh tokens |
| POST | /token/refresh/ | Refresh expired access token |
| GET/PUT | /me/ | Get or update current user profile + API keys |

| Method | Endpoint | Description |
| --- | --- | --- |
| GET/POST | / | List all or create workspace |
| GET/PUT/DELETE | /{slug}/ | Retrieve, update, or delete workspace |

| Method | Endpoint | Description |
| --- | --- | --- |
| GET/POST | / | List docs or upload new doc (file or raw text) |
| DELETE | /{id}/ | Remove document from knowledge base |
| PATCH | /{id}/toggle/ | Enable or disable doc from active context |

| Method | Endpoint | Description |
| --- | --- | --- |
| GET/POST | / | List issues or create new issue thread |
| GET | /{id}/ | Get full issue with all messages |
| PATCH | /{id}/resolve/ | Mark issue as resolved |
| POST | /{id}/messages/ | Send new user message → triggers AI response |

| Token | Hex Value | Usage |
| --- | --- | --- |
| primary | #1A6BCC | Buttons, links, active states, borders |
| primary-dark | #0D3B6E | Sidebar, header, section backgrounds |
| background | #0A0A0F | Main app background (near black) |
| surface | #13131A | Cards, panels, chat bubbles |
| surface-2 | #1C1C28 | Hover states, input backgrounds |
| text-primary | #FFFFFF | Main headings and body copy |
| text-secondary | #A0AEC0 | Subtext, timestamps, metadata |
| accent-glow | #1A6BCC33 | Glow effects, active item highlights |

| Phase | Milestone | Deliverable |
| --- | --- | --- |
| 1 | Foundation | Django project setup, auth, PostgreSQL, Nginx on Contabo |
| 2 | Core AI Loop | BYOK key storage, basic issue chat with Anthropic SDK streaming |
| 3 | Knowledge Base | Document upload, ingestion pipeline, context injection |
| 4 | Frontend Polish | Full Next.js UI per design system, WebSocket streaming UI |
| 5 | Billing | Paddle integration, subscription gating, Payoneer payout setup |
| 6 | Launch | Pre-sell founding memberships on IndieHackers + LinkedIn |
