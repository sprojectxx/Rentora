# Rentora

Rentora is a comprehensive, production-ready student accommodation platform. It connects college students seeking nearby housing with property owners looking to rent their property. The application is completely powered by a React frontend and a heavily secured **Supabase** backend, and is designed to be easily wrapped into a native mobile app using **Capacitor**.

## 🚀 How It Works & Architecture

Rentora uses a robust modern architecture to guarantee lightning-fast loading, atomic data consistency, and strict security.

### Tech Stack
- **Frontend Core**: React 18 + Vite
- **Styling**: TailwindCSS & shadcn/ui components
- **State Management & Caching**: `@tanstack/react-query`
- **Backend Services**: Supabase (PostgreSQL Database, Auth, Storage, Realtime)
- **Mobile Ready**: Capacitor (Android/iOS integration)

### 🔐 Authentication & Security Flow
Rentora employs a dual-layer security model to ensure maximum safety for users and data:

1. **Frontend Role-Based Access Control (RBAC)**: 
   - The app experience is divided into three scopes: **Student**, **Owner**, and **Admin**.
   - `<RoleGate>` and `<ProtectedRoute>` components physically block unauthorized users from accessing or rendering protected routes (like the Admin Panel or Owner Dashboard).
   - OTP Validation strictly enforces 8-digit codes as required by Supabase.
   - Graceful session expiration handling prevents the React tree from crashing if a user logs out mid-request.

2. **Backend Row Level Security (RLS)**:
   - The frontend UI restrictions are backed by strict **Supabase RLS Policies**.
   - Users can only `UPDATE` their own profile data, but a specialized **PostgreSQL Database Trigger** (`ensure_role_protection`) prevents any user from illegally elevating their own `role` to Admin.
   - Property insertion, modification, and deletion are strictly tied to `auth.uid() = owner_id`.

### 🔑 Key Functionality
1. **Property Management**:
   - Owners can list properties, specifying distances from colleges, deposit fees, rules, and room types strictly synced to database Enums (e.g., `shared_2`, `dormitory`).
   - Pseudo-transactional workflows ensure that if a property's rules fail to save, the entire property creation is rolled back, preventing "phantom" listings.
2. **Live Direct Messaging**:
   - Users can reach out directly to property owners to request tours or discuss leasing terms.
   - Powered by **Supabase Realtime**, the app listens to PostgreSQL database triggers (`public:messages`), instantly updating the chat interface across devices.
3. **Platform Moderation**:
   - App-level administrators can moderate listings via the Admin Panel, seamlessly invalidating global caches (`queryClient.invalidateQueries`) to reflect property verifications or deletions instantly across all active users.
4. **Location & Distance Tracking**:
   - Automatically calculates straight-line distances using latitude/longitude data stored safely on the backend, extracting coordinates seamlessly from Google Maps URLs.

---

## 💻 Local Setup Instructions

Rentora is a NodeJS project using Vite. The primary dependencies are listed in `package.json`. 

### Prerequisites:
1. Node.js (v18.0 or newer)
2. A configured Supabase project with Auth, Storage, and Realtime enabled.

### 1. Installation
Run the following command to download all dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create an `.env` file at the root of the project to authenticate with your backend.

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Start the Development Server
```bash
npm run dev
```
Open your browser at the Local URL (usually `http://localhost:5173`) to view and interact with Rentora!

---

## 📱 Mobile Conversion (Capacitor)
Rentora is designed to be shipped as a native mobile app.

1. Build the production web assets: `npm run build`
2. Sync the assets to Capacitor: `npx cap sync android`
3. The app is ready to compile in Android Studio, leveraging native capabilities like `@capacitor/geolocation` and hardware back-button support via `@capacitor/app`.
