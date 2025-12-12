# @workspace/supabase-auth

Supabase authentication components built with shadcn/ui for React applications.

## Features

- 🔐 Email/Password authentication
- 🔑 Google OAuth support
- 💾 Session caching with localStorage
- 🎨 Beautiful UI components with shadcn/ui
- 🪝 React hooks for authentication state
- ⚙️ Configurable authentication providers

## Installation

This package is included when you create a new workspace with `despace create workspace`.

## Usage

### Basic Setup

```tsx
import { createClient } from '@supabase/supabase-js';
import { Login, Register, useAuth } from '@workspace/supabase-auth';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

function App() {
  return (
    <Login
      supabaseClient={supabase}
      config={{
        providers: {
          google: { enabled: true },
          email: { enabled: true }
        }
      }}
      onSuccess={(user) => console.log('Logged in:', user)}
    />
  );
}
```

### Using the useAuth Hook

```tsx
import { useAuth } from '@workspace/supabase-auth';

function MyComponent() {
  const {
    user,
    session,
    loading,
    error,
    signInWithEmail,
    signInWithGoogle,
    signOut
  } = useAuth(supabaseClient, {
    cache: { enabled: true },
    providers: {
      google: { enabled: true },
      email: { enabled: true }
    }
  });

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Welcome, {user.email}</div>;

  return <button onClick={() => signInWithGoogle()}>Sign in with Google</button>;
}
```

### Configuration Options

```tsx
interface AuthConfig {
  providers: {
    google?: {
      enabled: boolean;
      redirectUrl?: string;
    };
    email?: {
      enabled: boolean;
      requireEmailConfirmation?: boolean;
    };
  };
  cache?: {
    enabled: boolean;
    key?: string;
  };
  redirects?: {
    onSuccess?: string;
    onError?: string;
  };
}
```

## Components

### Login

Component for user login with email/password and OAuth providers.

```tsx
<Login
  supabaseClient={supabase}
  config={authConfig}
  onSuccess={(user) => handleSuccess(user)}
  onError={(error) => handleError(error)}
  showGoogleLogin={true}
/>
```

### Register

Component for user registration.

```tsx
<Register
  supabaseClient={supabase}
  config={authConfig}
  onSuccess={(user) => handleSuccess(user)}
  onError={(error) => handleError(error)}
  showGoogleLogin={true}
/>
```

## Styling

This package uses Tailwind CSS and shadcn/ui. Make sure your application has Tailwind CSS configured with the following CSS variables:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }
}
```

## License

MIT
