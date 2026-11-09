# Game Back Office

Admin UI for the Game API (`FeedingFranzeeAPI`): every game's configuration (limits, enabled, launch URL,
RNG / payout tables, live crash timing, roulette limits), the Feeding Frenzy / Comet Rider evolution ladders,
change history, and back-office users.

React + Vite + TypeScript + Tailwind.

## Run

```
npm install
npm run dev        # http://localhost:5180, /api proxied to the API on http://localhost:5003
```

Sign in with a back-office account. The API creates the first Admin from `BackOffice:BootstrapAdmin`
when it has no accounts (see `Infrastructure/Persistence/BackOfficeUsers.sql` in the API).

## Build

```
VITE_API_BASE=https://your-api-host npm run build    # output in dist/
```

The API must allow this site's origin: add it to `AllowedOrigins` in the API's appsettings.

## Roles

| Role   | Can |
|--------|-----|
| Viewer | See every game, its settings and history |
| Editor | Also change games and evolution ladders, create games |
| Admin  | Also manage back-office users |
