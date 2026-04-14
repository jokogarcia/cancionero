# cancionero
PWA for creating, viewing and sharing song chords with lyrics

## Setup

### Firebase

This app uses [Firebase](https://firebase.google.com/) for authentication and data storage.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Firestore Database** in the Firebase console.
3. Enable **Google** as a sign-in provider under **Authentication → Sign-in method**.
4. Copy `.env.example` to `.env.local` and fill in your Firebase project credentials (found under **Project Settings → Your apps**).

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

