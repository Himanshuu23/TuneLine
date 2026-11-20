# Tuneline - Content Creator Music Queue Platform

A real-time music queue platform for content creators where viewers can queue songs, vote, and pay for priority placement.

## Features

- **Real-time Music Queue**: Users can add YouTube songs to a queue
- **Payment Priority**: Pay to push songs higher in the queue (strongest priority)
- **Voting System**: Users can vote to push songs up in the queue
- **Live Chat**: Real-time chat functionality in rooms
- **YouTube Integration**: Fetches video details, thumbnails, and metadata
- **Smooth Animations**: Queue items animate when moving up/down
- **Scalable Architecture**: Redis pub/sub for horizontal scaling
- **Load Balancing**: Nginx load balancer for WebSocket servers

## Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Go with WebSocket support
- **Database/Cache**: Redis for queue management and pub/sub
- **Load Balancer**: Nginx for WebSocket load balancing
- **Containerization**: Docker Compose for easy deployment

## Project Structure

```
tuneline/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # React components
│   │   │   ├── hooks/      # Custom hooks
│   │   │   └── types/      # TypeScript types
│   │   └── ...
│   └── Dockerfile
├── server/                 # Go backend
│   ├── cmd/
│   │   └── server/         # Main entry point
│   ├── internal/
│   │   ├── handlers/       # WebSocket handlers
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── pubsub/         # Redis pub/sub
│   └── Dockerfile
├── nginx.conf              # Nginx load balancer config
└── docker-compose.yml      # Docker Compose setup
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- YouTube API Key (optional, has fallback)

### Environment Variables

Secrets are never committed. Copy the examples and fill in real values locally:

- **Docker Compose** reads `.env` in the repo root (`cp .env.example .env`).
- **`npm run dev`** reads `client/.env.local` (`cp client/.env.example client/.env.local`). Next.js does not load the root `.env`.

```env
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_WS_URL=ws://localhost/ws
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

`YOUTUBE_API_KEY` is required. The server will not call YouTube without it.

Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

### Running the Application

1. **Start all services**:
   ```bash
   docker-compose up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - WebSocket: ws://localhost:11011/ws

### Development

#### Frontend Development

```bash
cd client
npm install
npm run dev
```

#### Backend Development

```bash
cd server
go mod download
go run cmd/server/main.go
```

## How It Works

### Queue Priority Algorithm

Songs are prioritized using: `score = money * 1e6 + votes`

This ensures:
- **Money has highest priority**: Each dollar = 1,000,000 votes
- **Votes matter**: Users can vote to push songs up
- **FIFO for ties**: Timestamp breaks ties when money and votes are equal

### Room Management

1. **Admin creates a room**: Generates a unique 6-character room code
2. **Users join room**: Enter room code to join
3. **Queue songs**: Add YouTube URLs to the queue
4. **Vote or pay**: Push songs higher with votes or payments
5. **Real-time updates**: All users see queue changes instantly

### Scaling

- **Multiple WebSocket servers**: Run multiple server instances
- **Redis pub/sub**: Ensures all instances stay synchronized
- **Nginx load balancing**: Distributes WebSocket connections across servers

## API Endpoints

### WebSocket Messages

#### Client → Server

- `make-room`: Create a new room
- `join-room`: Join an existing room
- `add-music`: Add a song to the queue
- `vote-song`: Vote for a song
- `remove-song`: Remove a song from queue
- `get-songs`: Get current queue
- `chat-message`: Send a chat message
- `start-song`: Mark a song as playing
- `end-song`: End current song and play next

#### Server → Client

- `add-music`: Song added to queue
- `vote-updated`: Vote count changed
- `song-started`: Song started playing
- `next-song`: Next song in queue started
- `queue-empty`: Queue is empty
- `chat-message`: New chat message
- `room-details`: Room information
