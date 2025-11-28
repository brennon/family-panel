# Deployment Guide - Vercel

This guide walks through deploying Family Panel to Vercel with automatic CI/CD.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works)
- GitHub repository access
- Supabase project set up (see fp-6 for database setup)

## Initial Deployment

### 1. Connect GitHub Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository (`brennon/family-panel`)
4. Vercel will auto-detect Next.js settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 2. Configure Environment Variables

Before deploying, add environment variables in Vercel:

**Required for Production:**
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://family-panel.vercel.app`)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (Server-side only)

**How to add:**
1. In Vercel project settings, go to "Environment Variables"
2. Add each variable for:
   - **Production**: Required
   - **Preview**: Optional (can use same as production or separate project)
   - **Development**: Not needed (use `.env.local` instead)

### 3. Deploy

Click "Deploy" and Vercel will:
1. Clone your repository
2. Install dependencies
3. Run type checking and build
4. Deploy to a production URL

## Automatic Deployments (CI/CD)

Once connected, Vercel automatically:

### Production Deployments
- **Trigger**: Push to `main` branch
- **URL**: Your production domain (e.g., `https://family-panel.vercel.app`)
- **Process**: Full build and deploy

### Preview Deployments
- **Trigger**: Push to any other branch or open PR
- **URL**: Unique preview URL (e.g., `https://family-panel-git-feature-xyz.vercel.app`)
- **Process**: Full build with isolated environment
- **Comments**: Vercel bot comments on PRs with preview link

## Local Development Environment Variables

Create a `.env.local` file (never commit this):

```bash
# Copy from .env.example
cp .env.example .env.local
```

Then fill in your actual values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Database Migrations

**IMPORTANT**: Supabase database migrations are **NOT automatically applied** by Vercel or GitHub Actions.

### When to Apply Migrations

Migrations must be manually applied to the Supabase database **BEFORE** deploying code that depends on schema changes:

1. **Before merging PRs with migrations**: Apply migrations to production Supabase before merging
2. **For preview environments**: Apply to preview database (if using separate Supabase project)
3. **For development**: Apply to your development Supabase project

### How to Apply Migrations

**Option 1: Supabase SQL Editor (Recommended)**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to SQL Editor
3. Run migration files from `supabase/migrations/` in order
4. Verify migrations applied successfully

**Option 2: Supabase CLI**
```bash
# Install CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Migration Workflow for PRs

When a PR includes new migrations:

1. **PR Author**: Note in PR description that migrations are required
2. **Reviewer**: Apply migrations to production database BEFORE merging
3. **After applying**: Verify migration success in Supabase dashboard
4. **Then merge**: Deploy application code via Vercel

**Example PR description:**
```markdown
## Database Migrations Required

This PR includes new migrations in `supabase/migrations/`:
- `003_add_notifications_table.sql`

**Action Required Before Merge:**
1. Apply migration to production Supabase via SQL Editor
2. Verify migration applied successfully
3. Then merge this PR
```

### Migration Files Location

All migrations are stored in: `supabase/migrations/`

See `supabase/README.md` for detailed migration documentation.

## Deployment Checklist

Before your first deployment:

- [ ] Supabase project created with database schema (fp-6)
- [ ] Initial migrations applied to Supabase (see above)
- [ ] Environment variables added to Vercel
- [ ] Repository connected to Vercel
- [ ] Initial deployment successful
- [ ] Production URL accessible
- [ ] SSL/HTTPS enabled (automatic with Vercel)
- [ ] Preview deployments working for branches

## Verifying Deployment

After deployment:

1. **Check Build Logs**: Vercel dashboard shows detailed build logs
2. **Test Production URL**: Visit your production URL
3. **Verify Environment Variables**: Check that app can connect to Supabase
4. **Test Preview Deployments**: Create a test branch and push to verify preview works

## Custom Domain (Optional)

To use a custom domain:

1. Go to Vercel project settings > "Domains"
2. Add your domain
3. Update DNS records as instructed by Vercel
4. Update `NEXT_PUBLIC_APP_URL` environment variable to your custom domain

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `npm run build` works locally

### Environment Variables Not Working
- Ensure variables prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Variables without `NEXT_PUBLIC_` are only available server-side

### Preview Deployments Not Showing
- Check GitHub integration in Vercel settings
- Ensure Vercel bot has access to your repository
- Check "Git" settings in project to enable preview deployments

## Running Tests Before Deploy (Future)

When tests are set up (fp-30, fp-tz8):

1. Add a `.github/workflows/test.yml` file for GitHub Actions
2. Run tests on PR before allowing merge
3. Vercel will wait for GitHub checks to pass before deploying previews

## Monitoring

Vercel provides:
- **Analytics**: Track performance and usage
- **Logs**: Real-time function logs
- **Error Tracking**: Automatic error reporting (or integrate Sentry)

Access these in the Vercel dashboard for your project.
