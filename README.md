# Faith+ MVP

A Christian habit-forming app with temptation interception, daily verses, and church finder functionality.

## Features

1. **Temptation Interceptor**: Enter a struggle or temptation and receive Scripture-based encouragement
2. **Daily Verse**: Get a new inspiring Bible verse with reflection each day
3. **Church Finder**: Find churches near your location using Google Maps

## Technical Implementation

This app is built with:

- Next.js App Router for the frontend and API routes
- Google's Gemini API for LLM integration
- Google Maps API for the church finder feature
- Free Bible API for verse retrieval

## Setup Instructions for v0 Environment

### 1. Gemini API Integration

The app uses Google's Gemini API for generating Scripture-based encouragement and reflections. The API key is already configured in the app:

\`\`\`
GEMINI_API_KEY=AIzaSyBWZhwhmkkR5bUaQyMOaujhQHyDYMna7uQ
\`\`\`

### 2. Google Maps API Key

To use the Church Finder feature, you need to obtain a Google Maps API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create an API key with appropriate restrictions
5. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `app/api/config.ts` with your actual API key

### 3. Bible Verses

The app uses a combination of popular verses and the Gemini API to generate reflections. No additional API key is required for the basic functionality.

For a production version, you might want to integrate with a more comprehensive Bible API such as:
- [Bible API](https://bible-api.com/) (free, no key required)
- [API.Bible](https://scripture.api.bible/) (requires registration)

## Using the App

1. **Temptation Interceptor**:
   - Enter a temptation or struggle in the input field
   - Click "Get Encouragement" to receive a Scripture-based response
   - View the verse, reflection, application, and prayer
   - Provide feedback and share your thoughts

2. **Daily Verse**:
   - View the daily verse and reflection
   - Click "New Verse" to get a different verse
   - Copy or save verses you find meaningful

3. **Church Finder**:
   - Allow location access for better results
   - Or enter a ZIP code/city name to search
   - View nearby churches on the map
   - Click on a church for more details

## Development Notes

- The app uses client-side components with the "use client" directive for interactive features
- API routes in the `/api` directory handle communication with the Gemini API
- The UI is built with a combination of custom components and shadcn/ui library components

## License

MIT
