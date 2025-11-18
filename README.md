This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment variables

The following variables are used by the global search feature:

| Variable | Default | Description |
| --- | --- | --- |
| `MEILISEARCH_HOST` | `http://localhost:7700` | URL of the Meilisearch instance. |
| `MEILISEARCH_PUBLIC_KEY` | `""` | Public/search key used for querying. |
| `MEILISEARCH_MASTER_KEY` | `""` | Required for auto-discovering indexes via `/indexes`. |

Create a `.env.local` file to override the defaults:

```bash
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_PUBLIC_KEY=96fd72b1aa923921186cd66e6a56d4dfc7ffd532de70c9e34a42a119a9d6bfc8
# MEILISEARCH_INDEXES=news-article,page,event
```

## Search page

Visit `/search` to query every indexed document. The page uses the `/api/search` route, which proxies queries to Meilisearch and aggregates results across indexes. You can embed the shared `SearchInput` component (`app/components/common/Search.tsx`) anywhere to provide inline search fields.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
