# TEA Cipher Suite

TEA Cipher Suite is an educational web app for exploring the Tiny Encryption
Algorithm (TEA). It combines a round-by-round encryption playground with
Google-authenticated chat rooms that store TEA-encrypted messages in Firebase.

> **Educational use only:** TEA is an older block cipher and this project is a
> learning/demo implementation, not a production-ready secure messaging system.
> Do not use it to protect sensitive information.

## Features

- Encrypt plaintext and decrypt hexadecimal ciphertext with a 128-bit key.
- Inspect TEA's 32 rounds, intermediate values, output, and execution time.
- Generate random keys in the playground.
- Sign in with Google through Firebase Authentication.
- Create chat rooms, share a 32-character hexadecimal room key, and join rooms
  using that key.
- Send and receive messages in real time; messages are encrypted by the API and
  stored in Firestore as ciphertext.

## Project structure

```text
TEACyberSuite/
├── tea-frontend/   # Next.js app
└── tea-backend/    # FastAPI API and TEA implementation
```

## Requirements

- Node.js 20 or later and npm
- Python 3.10 or later
- A Firebase project with Authentication and Cloud Firestore enabled

## Configure Firebase

1. In the Firebase console, create or select a project and register a web app.
2. Enable **Google** under **Authentication → Sign-in method** and add
   `localhost` under **Authentication → Settings → Authorized domains**.
3. Create a Cloud Firestore database. Configure its security rules to allow only
   the authenticated access your app requires.
4. Copy the Firebase web app settings into `tea-frontend/.env.local`:

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

   The `NEXT_PUBLIC_API_URL` setting is optional for local development; the
   frontend defaults to `http://localhost:8000`.

5. Create a Firebase service account key for the backend, save the JSON file
   somewhere private, and set `FIREBASE_ADMIN_KEY_PATH` to its path. For example,
   if the file is `tea-backend/serviceAccountKey.json`, set the variable to
   `serviceAccountKey.json` when running the backend from `tea-backend`.

   **Never commit the service account key or other credentials.**

## Run locally

Start the backend in one terminal:

```powershell
cd tea-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:FIREBASE_ADMIN_KEY_PATH = "serviceAccountKey.json"
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

On macOS or Linux, activate the virtual environment with
`source .venv/bin/activate` and set the service-account path with
`export FIREBASE_ADMIN_KEY_PATH=serviceAccountKey.json`.

Then start the frontend in another terminal:

```powershell
cd tea-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The FastAPI service is
available at [http://localhost:8000](http://localhost:8000), with interactive
API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

## App routes

| Route | Description |
| --- | --- |
| `/` | Project introduction and links to the app |
| `/auth` | Google sign-in |
| `/dashboard` | TEA encryption/decryption playground |
| `/chat` | Create or join encrypted chat rooms |
| `/chat/[roomId]` | Unlock a room and view/send messages |

## Useful commands

Run these from `tea-frontend`:

```bash
npm run dev    # Start the development server
npm run lint   # Run ESLint
npm run build  # Create a production build
npm run start  # Serve the production build
```

## API endpoints used by the app

- `POST /encrypt/encrypt` — encrypt plaintext with TEA.
- `POST /encrypt/decrypt` — decrypt hexadecimal TEA ciphertext.
- `POST /chat/rooms` — create a room (requires a Firebase ID token).
- `POST /chat/rooms/join` — join a room using the hash of its key (requires a
  Firebase ID token).
- `POST /chat/rooms/{room_id}/messages` — save a message ciphertext (requires a
  Firebase ID token).

The chat interface also reads room and message documents directly from
Firestore, so Firebase Authentication and Firestore must both be configured.
