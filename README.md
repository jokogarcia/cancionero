# coda
PWA for creating, viewing and sharing song chords with lyrics

## Setup

### Firebase

This app uses [Firebase](https://firebase.google.com/) for authentication and data storage.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Firestore Database** in the Firebase console.
3. Enable **Google** as a sign-in provider under **Authentication → Sign-in method**.
4. Copy `.env.example` to `.env.local` and fill in your Firebase project credentials (found under **Project Settings → Your apps**).

### Firestore rules

Firestore security rules are versioned in `firestore.rules` and referenced by `firebase.json`.

Deploy them with Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

