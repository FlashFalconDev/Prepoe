# CLAUDE.md

用中文回答我
每次都用審視的目光, 仔細看我輸入的潛在問題,你要指出我的問題,並給出明顯在我思考框架之外的建議
如果你覺得我說得太離譜,你就罵回來,幫我瞬間清醒

顏色要調用colors.ts
API使用都要優先使用 api.ts 
所有提示要先使用 useToast.ts
如果要補充也是建立在裡面

固定port 3008 提供你測試 如果有人占用 就釋放

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Prepoe Business Web** - a React + TypeScript + Vite web application providing multi-tenant business services including:
- AI-powered customer service assistants with RAG (Retrieval-Augmented Generation)
- Digital business card management with QR code sharing
- Content creation tools (articles, audio, video generation)
- Chat platform integration (LINE, Facebook, etc.)
- Event management and participant tracking
- Rich menu editor for LINE bots

The application serves three distinct user types with separate route hierarchies:
- **Provider** (`/provider/*`): Service providers who create and manage business services
- **Client** (`/client/*`): End users consuming services (formerly `/user/*`)
- **Business** (`/business/*`): Commercial customers with account management needs

## Development Commands

### Build and Development
```bash
# Development server (uses development API endpoints)
npm run dev

# Development server with production API endpoints
npm run dev:prod

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Preview production build locally
npm preview

# Type checking and linting
npm run lint
```

### Running the Development Server
The dev server runs on port 3000 and automatically opens in browser.

## Environment Configuration

### Required Environment Variables
Create a `.env` file in the project root:

```env
# API Configuration (automatically set based on MODE)
# development: https://host.flashfalcon.info
# production: https://www.flashfalcon.info

# Third-party OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_LINE_CLIENT_ID=your_line_channel_id
VITE_FACEBOOK_APP_ID=your_facebook_app_id
VITE_APPLE_CLIENT_ID=your_apple_client_id

# Application Configuration
VITE_APP_NAME=FlashFalcon
VITE_APP_URL=https://your-domain.com
```

**Important Notes:**
- All Vite environment variables must be prefixed with `VITE_`
- After changing `.env`, restart the dev server
- Never commit `.env` files (already in `.gitignore`)
- Multiple environment files are supported (`.env.local`, `.env.development`, `.env.production`)
- See `ENV_SETUP.md` for detailed setup instructions

## Architecture and Key Concepts

### Application Structure

```
src/
├── config/
│   └── api.ts              # Centralized API configuration with CSRF handling
├── contexts/
│   ├── AuthContext.tsx     # Authentication state with feature flags
│   └── BusinessCardContext.tsx  # Business card data management
├── pages/
│   ├── business/           # Business customer pages (analytics, accounts)
│   ├── user/               # Client-facing pages (mentors, chat, events)
│   ├── Login.tsx           # Login with third-party OAuth
│   └── HomePage.tsx        # Dynamic homepage based on user type
├── components/
│   ├── Layout.tsx          # Main layout wrapper
│   ├── ProtectedRoute.tsx  # Route authentication guard
│   ├── FeatureGate.tsx     # Feature flag-based access control
│   └── keys/               # Key management components
├── services/
│   ├── thirdPartyAuth.ts   # OAuth integration (Google, LINE, Facebook, Apple)
│   ├── chatPlatform.ts     # Chat platform abstractions
│   ├── fileUpload.ts       # File upload with blob URL handling
│   └── usageTracking.ts    # Usage metrics tracking
└── hooks/
    ├── useToast.ts         # Toast notification system
    └── useConfirm.ts       # Confirmation dialog hook
```

### API Configuration (`src/config/api.ts`)

**Critical Architecture Component** - This file handles all API communication with:

1. **Dynamic Environment Switching:**
   - Development: `https://host.flashfalcon.info`
   - Production: `https://www.flashfalcon.info`
   - Uses `import.meta.env.MODE` to determine environment

2. **CSRF Token Management:**
   - Automatically fetches and includes CSRF tokens in all mutating requests (POST/PUT/DELETE/PATCH)
   - Auto-retry mechanism on 403 CSRF errors
   - Multiple cookie name format support (csrftoken, csrf_token, CSRF-Token)
   - Pre-fetches token on app initialization in `main.tsx`

3. **Credentials Handling:**
   - All requests use `withCredentials: true` to include cookies
   - Essential for session-based authentication

4. **API Endpoint Organization:**
   - All endpoints centralized in `API_ENDPOINTS` object
   - Categorized by feature: auth, business cards, articles, AI assistants, chat platforms, events, etc.
   - Dynamic endpoints use factory functions: `(id: number) => string`

5. **URL Generation Utilities:**
   - `createChatUrl(code)`: Generate chat session URLs
   - `createCardUrl(slug)`: Generate business card URLs
   - `createEventJoinUrl(sku)`: Generate event registration URLs

### Authentication System

**Multi-layered authentication** implemented through `AuthContext`:

1. **Session Management:**
   - User data stored in localStorage for persistence
   - Automatic authentication check on app load via `getProtectedData()` API call
   - Backend returns user info + feature flags in session data

2. **Feature Flags:**
   - Controls access to features based on user's subscription/permissions
   - Flags include: `ai_assistant_count`, `namecard_enabled`, `chat_platform_count`, `tokens`, etc.
   - Loaded from `session_info.session_data.feature_flag` in API responses
   - Used by `FeatureGate` component to conditionally render features

3. **Third-Party OAuth:**
   - Supports Google, LINE, Facebook, Apple Sign-In
   - State parameter for CSRF protection
   - Callback handling at `/auth/callback/:provider`
   - See `THIRD_PARTY_AUTH_SETUP.md` for provider configuration

4. **Protected Routes:**
   - `ProtectedRoute` component wraps authenticated sections
   - Redirects to `/login` if not authenticated
   - Shows loading state during auth check

### Route Architecture

The application uses a **multi-tenant route structure** with three primary namespaces:

```typescript
// Provider Routes - Service providers managing their services
/provider/*
  - /cloud-business-card      # Business card editor
  - /business-card/edit/:tab  # Card settings tabs
  - /assistants/*             # AI assistant management
  - /creator/*                # Content creation tools
  - /ai-service               # AI customer service config
  - /customer-service         # Live chat interface
  - /settings                 # Provider settings
  - /activity-settings        # Event configuration
  - /private-domain           # Domain management

// Client Routes - End users consuming services
/client/*
  - /mentors                  # Browse service providers
  - /provider/:slug           # Provider detail page
  - /chat/:sessionId?         # Chat with assistants
  - /event                    # Event listings
  - /event/join/:sku          # Event registration
  - /articles                 # Article feed
  - /profile                  # User profile

// Business Routes - Commercial customers
/business/*
  - /                         # Overview dashboard
  - /visitors                 # Visitor analytics
  - /accounts                 # Account management
  - /usage                    # Usage statistics

// Public Routes (no auth required)
/login                        # Login page
/auth/callback/:provider      # OAuth callbacks
/card/:slug                   # Public business card view
```

### Business Card System

**Core Feature** - Digital business card with customization:

1. **Data Management:**
   - `BusinessCardContext` provides centralized data access
   - Prevents duplicate API calls with `hasLoadedRef` flag
   - Supports drag-and-drop link reordering with `react-beautiful-dnd`

2. **Card Components:**
   - **Profile**: Name, bio, avatar, contact info with visibility toggles
   - **Tags**: Customizable tags with order and visibility control
   - **Links**: External links with custom icons and full-width option
   - **Social Media**: Platform links with icon style options (fill/outline)
   - **Appearance**: Extensive color customization for all UI elements

3. **Sharing Features:**
   - QR code generation for easy sharing
   - Public URL: `/card/:slug`
   - Share tracking: view count, LINE share count
   - Share image generation (`share_pp`)

4. **File Upload Handling:**
   - Blob URL to File conversion in `services/fileUpload.ts`
   - Supports profile pictures and link icons
   - FormData-based multipart upload

### AI Assistant System (RAG)

**Advanced Feature** - AI customer service with document knowledge base:

1. **Assistant Configuration:**
   - Multiple assistants per provider (limited by `ai_assistant_count` feature flag)
   - Configurable model, temperature, system prompt
   - Document upload for RAG (Retrieval-Augmented Generation)

2. **Document Management:**
   - Upload various formats: PDF, DOCX, TXT, Markdown
   - Vector store creation for semantic search
   - Documents associated with specific assistants

3. **Conversation System:**
   - Session-based chat interface
   - Message history persistence
   - Context-aware responses using RAG

4. **Chat Platform Integration:**
   - Embed assistants in LINE, Facebook Messenger
   - Generate unique chat codes for external access
   - Manager intervention capability for human takeover

### Content Creation Tools

**Multi-format content generation** under `/provider/creator/*`:

1. **Article Creation:**
   - Rich text editor with markdown support
   - Media upload (images, videos)
   - Tag management
   - Reading conditions: free, VIP, or paid access with time restrictions
   - Draft and published status

2. **Video Generation:**
   - Text-to-video with AI models
   - Image-to-video conversion
   - Multiple model options
   - Generation history tracking

3. **Audio Generation:**
   - Voice cloning from uploaded audio
   - Text-to-speech with custom voices
   - Multiple voice model options

### Event Management System

**Ticketing and registration** for events:

1. **Event Structure:**
   - `EventModule`: Reusable event templates/configurations
   - `EventItem`: Specific event instances
   - `EventModuleAssignment`: Links modules to events
   - `EventParticipant`: Participant registration data

2. **Registration Flow:**
   - Public registration URL: `/client/event/join/:sku`
   - QR code for easy check-in
   - Participant binding code for verification
   - Check-in tracking

3. **Order Management:**
   - Order details tracking
   - Payment integration (via SKU)
   - Participant-order relationships

### LINE Bot Integration

**Rich Menu Editor** for LINE bots:

1. **Rich Menu Management:**
   - Visual area editor for touch regions
   - Action configuration (message, URI, postback)
   - Template library for quick setup
   - Image upload for menu background

2. **Deployment:**
   - Deploy to LINE Bot API
   - Set as default menu for all users
   - Update areas without recreating menu

## Styling and UI

### Tailwind CSS Configuration
- Custom color palette:
  - `primary.*`: Purple shades (default brand)
  - `ai.*`: Orange shades (AI-related features)
  - `gradient.*`: Pre-configured gradients
- Custom slider utilities for range inputs
- Inter font as primary typeface
- Responsive design with mobile-first approach

### Toast Notification System
- Global toast provider in `ToastContainer.tsx`
- `useToast()` hook for showing success/error messages
- Auto-dismiss with configurable duration
- Positioned at top-right of viewport

### Icons
- Primary: `lucide-react` for modern icons
- Secondary: Remix Icon via CDN in `index.html`

## Performance Optimizations

### Code Splitting
Implemented in `vite.config.ts` with manual chunks:
- `react-vendor`: React core libraries
- `react-router`: Routing library
- `lucide-icons`: Icon library
- `utils`: Axios, QRCode utilities
- Feature-specific chunks: chat, video, business card, AI service pages

### Lazy Loading
Large components lazy-loaded in `App.tsx`:
- All page components except core (Login, HomePage, BusinessCardView)
- `React.lazy()` with `Suspense` fallback
- Loading spinner during component load

### Data Fetching
- Business card data cached in context to prevent duplicate API calls
- `useCallback` and `useRef` for preventing unnecessary re-renders
- Feature flags loaded once per session

## Common Patterns and Conventions

### API Calls
```typescript
// Always use the centralized api instance from config/api.ts
import { api, API_ENDPOINTS } from '../config/api';

// GET request
const response = await api.get(API_ENDPOINTS.ARTICLES);

// POST request with data
const response = await api.post(API_ENDPOINTS.LOGIN, { username, password });

// Dynamic endpoint
const response = await api.get(API_ENDPOINTS.ARTICLE_DETAIL(articleId));

// FormData upload
const formData = new FormData();
formData.append('file', file);
const response = await api.post(API_ENDPOINTS.UPLOAD_MEDIA, formData);
```

### Feature Flag Checking
```typescript
// In component
import { useAuth } from '../contexts/AuthContext';

const { featureFlag } = useAuth();
const canCreateAssistant = (featureFlag?.ai_assistant_count || 0) > 0;

// With FeatureGate component
<FeatureGate feature="namecard_enabled" requirePositive={false}>
  <CloudBusinessCard />
</FeatureGate>
```

### Toast Notifications
```typescript
import { useToast } from '../hooks/useToast';

const { showSuccess, showError } = useToast();

// Show success
showSuccess('保存成功');

// Show error
showError('保存失敗，請稍後再試');
```

### Confirmation Dialogs
```typescript
import { useConfirm } from '../hooks/useConfirm';

const confirm = useConfirm();

const handleDelete = async () => {
  const confirmed = await confirm({
    title: '確認刪除',
    message: '確定要刪除此項目嗎？此操作無法復原。',
  });

  if (confirmed) {
    // Proceed with deletion
  }
};
```

## Testing and Debugging

### CSRF Token Issues
If you encounter 403 CSRF errors:
1. Check browser cookies for `csrftoken` or similar
2. Verify `withCredentials: true` in API calls
3. Check backend CORS configuration allows credentials
4. Try manually refreshing: `refreshCSRFToken()` from `config/api.ts`
5. Look for detailed logs in browser console (debug logs enabled)

### Authentication Issues
1. Check localStorage for `user` object
2. Verify `/api/protected/` endpoint returns 200
3. Check feature_flag in response: `session_info.session_data.feature_flag`
4. Clear localStorage and re-login if data is stale

### Build Issues
1. Run `npm run lint` to check for TypeScript/ESLint errors
2. Check Vite config for chunk size warnings
3. Ensure all environment variables are prefixed with `VITE_`
4. Verify all dynamic imports are valid

## Important Files to Check

When working on specific features, refer to these key files:

- **Authentication**: `src/contexts/AuthContext.tsx`, `src/pages/Login.tsx`
- **API Integration**: `src/config/api.ts` (start here for all API work)
- **Business Cards**: `src/contexts/BusinessCardContext.tsx`, `src/pages/CloudBusinessCard.tsx`
- **AI Assistants**: `src/pages/AIServiceManagement.tsx`, `src/pages/AIAssistantForm.tsx`
- **Chat Platform**: `src/services/chatPlatform.ts`, `src/pages/Chat.tsx`
- **Events**: `src/pages/ActivitySettings.tsx`, `src/pages/user/EventJoin.tsx`
- **Content Creation**: `src/pages/Article.tsx`, `src/pages/VideoCreation.tsx`, `src/pages/Audio.tsx`
- **Routing**: `src/App.tsx` (all route definitions)
- **Build Config**: `vite.config.ts`, `tailwind.config.js`

## Additional Documentation

- `ENV_SETUP.md`: Detailed environment variable configuration
- `LOGIN_SETUP.md`: Authentication system implementation details
- `THIRD_PARTY_AUTH_SETUP.md`: OAuth provider setup for Google, LINE, Facebook, Apple
- `src/components/README.md`: Component library documentation
- `src/services/README.md`: Service layer documentation
