This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Fredoka](https://fonts.google.com/specimen/Fredoka) and [Rubik](https://fonts.google.com/specimen/Rubik) fonts from Google Fonts.

## Pre-commit hooks

The repo uses [pre-commit](https://pre-commit.com/) to run checks before each commit. The config lives in the **project root** (`.pre-commit-config.yaml`) and currently runs [Gitleaks](https://github.com/gitleaks/gitleaks) to scan for secrets.

**If you want to use it:**

1. Install the pre-commit dependency (from the **repo root**, not the frontend folder):

   ```bash
   cd ..   # if you're in frontend/
   pip install -r requirements-dev.txt
   ```

   Or install pre-commit directly:

   ```bash
   pip install pre-commit
   ```

2. Install the git hooks (from the repo root):

   ```bash
   pre-commit install
   ```

3. After that, every `git commit` will run the hooks automatically. To run them once without committing:

   ```bash
   pre-commit run --all-files
   ```

The first run may take a minute while pre-commit downloads the Gitleaks environment; later runs are fast.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
