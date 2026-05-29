# Photo Sharing Server - Lab 2

## Setup

1. Copy `.env.example` to `.env`.
2. Paste your MongoDB Atlas connection string into `DB_URL`.
3. Install dependencies:

```bash
npm install
```

4. Load the starter photo app data into MongoDB:

```bash
npm run load-db
```

5. Start the backend:

```bash
npm start
```

The server runs on `http://localhost:8081` by default.

## Required Lab 2 API

- `GET /test/info`
- `GET /user/list`
- `GET /user/:id`
- `GET /photosOfUser/:id`

## Extra helper APIs

- `GET /user/listWithCounts`
- `GET /commentsOfUser/:id`
