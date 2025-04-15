# MyVetStudy Deployment Guide

This document explains how to deploy the MyVetStudy application to production environments using Render.com for the backend and Netlify for the frontend.

## Backend Deployment (Render.com)

### 1. PostgreSQL Database Setup

1. Log in to your [Render.com](https://render.com) account
2. Navigate to the Dashboard and click "New +"
3. Select "PostgreSQL" from the dropdown menu
4. Fill in the following details:
   - Name: `myvetstudydb` (or your preferred name)
   - Database: `myvetstudydb`
   - User: Leave as default
   - Region: Choose the region closest to your target users
   - PostgreSQL Version: 14 (or latest)
   - Instance Type: Start with "Starter" ($7/month) or higher based on needs
5. Click "Create Database"
6. **Important:** Copy and save all the database connection information:
   - Internal Database URL (for use within Render)
   - External Database URL (for external connections)
   - Password

### 2. Backend Web Service Setup

1. In your Render dashboard, click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - Name: `myvetstudyapi` (or your preferred name)
   - Environment: `Node`
   - Region: Same as your PostgreSQL database
   - Branch: `main` (or your production branch)
   - Root Directory: (leave blank)
   - Build Command: `cd server && npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `cd server && node dist/main.js`
   - Instance Type: "Starter" ($7/month) or higher based on needs

4. Add the following environment variables:
   - `DATABASE_URL`: Paste the Internal Database URL from your PostgreSQL database
   - `JWT_SECRET`: Create a strong, random secret (use a password generator)
   - `JWT_EXPIRES_IN`: `1d` (or your preferred token expiration time)
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default port)
   - `CLIENT_URL`: Your Netlify app URL (e.g., `https://myvetstudy.netlify.app`)

5. Click "Create Web Service"

## Frontend Deployment (Netlify)

### 1. Connect Your Repository to Netlify

1. Log in to your [Netlify](https://netlify.com) account
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - Base directory: `client`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist` (Vite's default build output directory)

### 2. Configure Environment Variables

In your Netlify site's "Site settings" → "Environment variables", add:
   - `VITE_API_URL`: Your Render.com backend URL (e.g., `https://myvetstudyapi.onrender.com/api/v1`)

### 3. Manual Deployment (Alternative)

If you prefer to deploy manually or via CI/CD:
1. Navigate to your project root
2. Run: `cd client && npm run build && netlify deploy --prod --dir=dist`

## Common Issues and Troubleshooting

### Render Deployment Issues

1. **Database connection failures**:
   - Ensure your `DATABASE_URL` environment variable matches the internal connection URL provided by Render
   - Verify database is active and not paused due to inactivity
   - Check that database migrations have been applied with `npx prisma migrate deploy`

2. **Application crashes on startup**:
   - Check Render logs for specific error messages
   - Ensure the start command uses the correct entry point: `node dist/main.js`
   - Verify that environment variables are set correctly

### Netlify Deployment Issues

1. **Build failures**:
   - Check that the base directory is set to `client`
   - Verify that all dependencies are resolved correctly
   - Look for TypeScript or ESLint errors that might be blocking the build

2. **API Connection Issues**:
   - Ensure `VITE_API_URL` points to the correct API endpoint with the correct prefix (`/api/v1`)
   - Check CORS settings in the backend to allow requests from your Netlify domain

## Project Scripts (from root)

For ease of development and deployment, you can use these npm scripts from the project root:

- `npm run install:all`: Install dependencies for client, server, and root
- `npm run dev:client`: Start the development server for the client
- `npm run dev:server`: Start the development server for the backend
- `npm run build:client`: Build the client for production
- `npm run build:server`: Build the server for production
- `npm run deploy:client`: Build and deploy the client to Netlify
- `npm run prisma:migrate`: Run database migrations locally
- `npm run prisma:deploy`: Deploy database migrations to production
- `npm run prisma:generate`: Generate Prisma client

## Monitoring & Maintenance

- Monitor logs in Render dashboard for backend issues
- Use Netlify analytics for frontend monitoring
- Set up uptime monitoring through Render or a third-party service
- Regularly update dependencies to address security vulnerabilities

## Post-Deployment Tasks

1. **Verify CORS Settings**: Ensure that your backend CORS configuration (in `server/src/index.ts`) includes your actual Netlify domain
2. **Test Authentication**: Verify the login/register functionality works across the deployed frontend and backend
3. **Setup Database Backups**: Configure automatic backups for your PostgreSQL database in Render
4. **Monitoring**: Set up monitoring and alerts to track application health
5. **SSL Certificate**: Ensure both Render and Netlify have HTTPS enabled (this should be automatic)

## Scaling Considerations

- **Database**: Upgrade your PostgreSQL plan as your data grows
- **Backend**: Increase computing resources or add multiple instances as traffic increases
- **Frontend**: Netlify automatically scales with traffic
- **CDN**: Netlify provides a global CDN for optimal performance 