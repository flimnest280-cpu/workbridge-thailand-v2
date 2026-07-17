# WorkBridge Thailand Coding Guidelines

## Critical Branding Rules
1. **Never remove, replace, regenerate, resize, or overwrite the logo files (`/src/assets/logo.jpg`, `/src/assets/logo.png`) during future UI updates.** These are the official, locked brand assets.
2. Ensure the WorkBridge Thailand logo is kept fully visible and visually cohesive across:
   - Splash Screen
   - Login Screen
   - Register Screen
   - Home Dashboard Screen
   - Header Navigation Bar
   - Sliding Drawer / Navigation Bar
   - User Profile Screen
   - Admin Dashboard overview panel
   - Employer Dashboard overview panel
   - Browser favicon (`/index.html`)
   - PWA icons (`/manifest.json`)
3. **If any logo asset is missing**, they must automatically restore from the server-side automatic self-healing routine configured in `server.ts`.
4. Do not alter the logo designs, color schemes, or brand style guides.
