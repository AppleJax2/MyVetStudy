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
   - Start Command: `node server/dist/index.js`
   - Instance Type: "Starter" ($7/month) or higher based on needs

4. Add the following environment variables:
   - `DATABASE_URL`: Paste the Internal Database URL from your PostgreSQL database
   - `JWT_SECRET`: Create a strong, random secret (use a password generator)
   - `JWT_EXPIRES_IN`: `1d` (or your preferred token expiration time)
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default port)
   - `CLIENT_URL`: Your Netlify app URL (e.g., `https://myvetstudyapp.netlify.app`)

5. Click "Create Web Service"

## Frontend Deployment (Netlify)

### 1. Connect Your Repository to Netlify

1. Log in to your [Netlify](https://netlify.com) account
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - Base directory: `client` (since your frontend is in the client folder)
   - Build command: `npm install && npm run build`
   - Publish directory: `client/dist` (Vite's default build output directory)

### 2. Configure Environment Variables

In your Netlify site's "Site settings" → "Environment variables", add:
   - `VITE_API_URL`: Your Render.com backend URL (e.g., `https://myvetstudyapi.onrender.com/api`)

### 3. Trigger Deployment

1. Click "Deploy site" to start the deployment
2. Netlify will provide a random subdomain (e.g., `random-name-123.netlify.app`)
3. [Optional] Configure a custom domain under "Domain settings"

## Post-Deployment Tasks

1. **Verify CORS Settings**: Ensure that your backend CORS configuration (in `server/src/index.ts`) includes your actual Netlify domain
2. **Test Authentication**: Verify the login/register functionality works across the deployed frontend and backend
3. **Setup Database Backups**: Configure automatic backups for your PostgreSQL database in Render
4. **Monitoring**: Set up monitoring and alerts to track application health
5. **SSL Certificate**: Ensure both Render and Netlify have HTTPS enabled (this should be automatic)

## Troubleshooting

### Common Backend Issues
- **Database Migrations Failing**: Run the migrations manually with `npx prisma migrate deploy`
- **CORS Errors**: Check that your backend CORS configuration includes your Netlify domain
- **Environment Variables**: Verify all required variables are correctly set in Render

### Common Frontend Issues
- **API Connection Errors**: Check that `VITE_API_URL` points to the correct Render.com backend URL
- **Build Failures**: Check Netlify build logs for detailed error information
- **White Screen**: Verify that the PWA manifest is correctly configured and icons are present

## Scaling Considerations

- **Database**: Upgrade your PostgreSQL plan as your data grows
- **Backend**: Increase computing resources or add multiple instances as traffic increases
- **Frontend**: Netlify automatically scales with traffic
- **CDN**: Netlify provides a global CDN for optimal performance 