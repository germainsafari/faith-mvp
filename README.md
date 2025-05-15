# Faith+ MVP

## Project Description

Faith+ is a comprehensive Christian web application designed to help believers strengthen their faith through daily practice, community engagement, and spiritual resources. The platform combines scripture study tools, community features, worship music, and interactive games to create a holistic faith development experience that can be accessed anywhere and anytime.

## Features

### Spotify Integration

The application includes integration with Spotify to provide worship music directly within the app:

- **Current Status**: Partially implemented, with known authentication issues being addressed
- **Connection Flow**: Users can connect their Spotify accounts via OAuth
- **Playlist Access**: Browse curated worship playlists and view track listings
- **Premium Features**: Premium Spotify users can play music directly in the app (in development)
- **Debugging Tools**: Diagnostic page to help troubleshoot connection issues

### Bible

The Bible feature provides access to scripture in multiple translations:

- **Bible Reading**: Read full chapters with verse numbering
- **Multiple Translations**: Switch between different Bible translations
- **Search**: Search for specific passages or keywords
- **Navigation**: Easy chapter and book navigation
- **Responsive Design**: Optimized for both desktop and mobile reading

### Scripture Q&A

This AI-powered feature allows users to ask questions about the Bible:

- **Question Input**: Type any Bible-related question
- **AI Responses**: Receive scripture-based answers generated with AI
- **Related Questions**: View suggested related questions
- **Scripture References**: All answers include relevant Bible verse references
- **User Feedback**: Provide feedback on answer quality

### Memory Game

An interactive game to help users memorize Bible verses:

- **Game Modes**: 
  - Fill in the Blanks: Complete verses by filling in missing words
  - Word Order: Arrange words in the correct order to form complete verses
  - Reference Match: Match Bible references with their corresponding verses
- **Scoring**: Track progress with a scoring system
- **Difficulty Levels**: Progress through increasingly challenging verses
- **Multiple Sessions**: Play through multiple verses in each session

### Community

A platform for believers to connect and discuss faith topics:

- **Discussion Groups**: Join topic-based groups
- **Posts and Comments**: Create posts and comment on others' content
- **Topics**: Browse discussions organized by spiritual topics
- **Interaction**: Like and reply to comments
- **View Counts**: See topic popularity through view metrics

### Events

Discover and participate in Christian events:

- **Event Listings**: Browse upcoming Christian events
- **Categories**: Filter events by type (conferences, prayer meetings, etc.)
- **Details**: View event details including time, location, and description
- **Responsive Design**: Access events information on any device

### Worship Music

Access worship music directly within the app:

- **Featured Playlists**: Browse curated worship music collections
- **My Playlists**: Access your personal playlists (requires Spotify connection)
- **Music Categories**: Browse by genre, mood, or occasion
- **Visual Design**: Album artwork and playlist imagery
- **Search**: Find specific artists or songs (in development)

### Saved Items

Save and organize content from across the app:

- **Bookmarking**: Save verses, reflections, and other content
- **Categories**: Organize saved items by type
- **Quick Access**: Easily return to saved content
- **Management**: Add notes and remove saved items

### Profile

Manage your account and preferences:

- **Account Management**: Update personal information
- **Preferences**: Set app preferences and notification settings
- **Activity History**: View past interactions
- **Connection Management**: Control third-party app connections

## Setup Instructions

### Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- [Bible API](https://bible-api.com/) (free, no key required)
- [API.Bible](https://scripture.api.bible/) (requires registration)
- A Supabase account for the database and authentication
- A Spotify Developer account for music integration
- A Google Maps API key for the church finder feature
- A Gemini API key for AI-powered features (optional)

### Installation

1. Clone the repository:
   ```bash
   - git clone https://github.com/your-username/faith-plus.git
   - cd faith-plus
   - run 'pnpm install' to install packages
   - run 'pnpm run dev' to start the development server

## Development Notes

- The app uses client-side components with the "use client" directive for interactive features
- API routes in the `/api` directory handle communication with the Gemini API
- The UI is built with a combination of custom components and shadcn/ui library components

## License

MIT