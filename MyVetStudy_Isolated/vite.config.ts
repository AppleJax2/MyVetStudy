import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'
import { imagetools } from 'vite-imagetools'

// Create an instance of the BackgroundSyncPlugin
const bgSyncPlugin = new BackgroundSyncPlugin('api-post-queue', {
  maxRetentionTime: 24 * 60 // Retry for max 24 hours
})

// Register a route for POST requests to the API to use NetworkOnly with Background Sync
// Note: This setup needs to be inside the generated service worker, 
//       so we configure vite-plugin-pwa to inject this.
//       The actual workbox configuration below handles this injection.

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    imagetools(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically update the service worker when new content is available
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'], // Cache necessary assets and added maskable icon placeholder
      manifest: {
        name: 'MyVetStudy',
        short_name: 'VetStudy',
        description: 'Veterinary Study Management Platform',
        theme_color: '#3498db', // Updated theme color to match spinner blue
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait', // Added orientation lock
        icons: [
          {
            src: 'icon-192x192.png', // Path relative to public directory
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png', // Path relative to public directory
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon.png', // Maskable icon
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        // Added screenshots placeholder
        screenshots: [
          {
            src: 'screenshot-desktop-1.png', // Replace with actual screenshot path (in public/)
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop View'
          },
          {
            src: 'screenshot-mobile-1.png', // Replace with actual screenshot path (in public/)
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Mobile View'
          }
          // Add more screenshots as needed
        ]
      },
      // Add Workbox configuration for runtime caching
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Inject background sync registration into the generated service worker
        importScripts: [], // Keep empty, custom logic goes via additionalManifestEntries or runtimeCaching
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: 'NetworkFirst' as const,
            method: 'GET', // Apply NetworkFirst only to GET requests
            options: {
              cacheName: 'api-get-cache', // Separate cache for GET requests
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^\/api\/.*/, // Match API routes
            handler: 'NetworkOnly' as const, // Use NetworkOnly for non-GET (POST, PUT, DELETE)
            method: 'POST', // Apply specifically to POST requests
            options: {
              plugins: [ // Add the background sync plugin
                new BackgroundSyncPlugin('api-post-queue', {
                  maxRetentionTime: 24 * 60 // Retry for max 24 hours
                })
              ]
            }
          },
          {
            urlPattern: /^\/api\/.*/, // Match API routes for PUT/DELETE
            handler: 'NetworkOnly' as const,
            method: 'PUT', // Also consider for PUT
            options: {
              plugins: [
                new BackgroundSyncPlugin('api-put-delete-queue', { // Separate queue if needed
                  maxRetentionTime: 24 * 60
                })
              ]
            }
          },
          {
            urlPattern: /^\/api\/.*/, // Match API routes for PUT/DELETE
            handler: 'NetworkOnly' as const,
            method: 'DELETE', // Also consider for DELETE
            options: {
              plugins: [
                new BackgroundSyncPlugin('api-put-delete-queue', { // Separate queue if needed
                  maxRetentionTime: 24 * 60
                })
              ]
            }
          },
          {
            // Optional: Cache other external resources like fonts, etc.
            // Example: Cache Google Fonts using StaleWhileRevalidate
            urlPattern: /^https?:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate' as const,
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https?:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // Cache fonts for a year
                maxEntries: 30,
              },
            },
          },
        ],
      },
    })
  ],
})
