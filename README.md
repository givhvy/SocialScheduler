# Social Scheduler

A season-based social media scheduling system built with Next.js and Firebase.

## Features

- **12 Seasons × 40 Days × 84 Channels** = 40,320 scheduled entries
- Real-time progress tracking
- Firebase Firestore integration
- Click to mark channels as completed/pending
- Season navigation
- Countdown timer to next season

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Get your Firebase config from Project Settings
4. Create `.env.local` file and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

- `/app` - Next.js app directory
- `/lib` - Firebase configuration and services
- `/app/components` - React components
- `/app/hooks` - Custom React hooks
- `/app/utils` - Utility functions

## Technologies

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Firebase Firestore

## License

MIT
