# Veritas AI

AI quality scoring for DTC clothing brands: 27 factors, 5 pillars, a 0–100 score per product.

```bash
npm install
cp .env.local.example .env.local         # set DATABASE_URL, ANTHROPIC_API_KEY, NEXTAUTH_SECRET
npx prisma db push
npx tsx src/scripts/seed-demo-data.ts    # demo data
npm run dev                              # http://localhost:3000
```

**Full documentation:** [DOCUMENTATION.md](DOCUMENTATION.md) covers setup, API reference, the scoring system, agents, data model, pilot program, deployment, known issues and project history.
