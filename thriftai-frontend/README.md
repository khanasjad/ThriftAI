# ThriftAI React Frontend

This is the React.js frontend for ThriftAI, migrated from Thymeleaf templates while maintaining the same UI design and functionality.

## Features

- ✅ Same UI design as the original Thymeleaf index page
- ✅ User authentication (login/signup for buyers and sellers)
- ✅ AI-powered search with Claude-style interface
- ✅ Visual search by image upload
- ✅ Advanced filters and recommendations
- ✅ Price insights and trending items
- ✅ Bootstrap styling with custom ThriftAI theme
- ✅ Font Awesome icons
- ✅ Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Spring Boot backend running on port 8080

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The React app will run on http://localhost:3000 and proxy API calls to the Spring Boot backend on http://localhost:8080.

## Project Structure

```
src/
├── components/
│   ├── HomePage.tsx          # Main page component
│   ├── Navigation.tsx        # Navigation bar
│   ├── HeroSection.tsx       # Main search interface
│   ├── DynamicContent.tsx    # Advanced features content
│   ├── LoginModal.tsx        # Login modal
│   ├── SignupModal.tsx       # Signup modal
│   └── Footer.tsx            # Footer component
├── App.tsx                   # Root component
├── App.css                   # Global styles
└── index.tsx                 # Entry point
```

## API Integration

The React frontend integrates with these Spring Boot REST endpoints:

- `GET /auth/api/status` - Check authentication status
- `POST /auth/api/login` - User login
- `POST /auth/api/logout` - User logout
- `POST /auth/api/signup/buyer` - Buyer registration
- `POST /auth/api/signup/seller` - Seller registration
- `POST /buyers/api/chat-search` - AI-powered search
- `POST /api/visual-search/upload` - Visual search by image
- `GET /buyers/api/recommendations` - Get recommendations
- `GET /buyers/api/advanced-search` - Advanced search with filters

## Development

To run the project in development mode:

1. Start the Spring Boot backend on port 8080
2. Start the React frontend: `npm start`
3. Open http://localhost:3000

The page will reload when you make edits, and any lint errors will appear in the console.

## Building for Production

```bash
npm run build
```

This builds the app for production to the `build` folder. The build is minified and optimized for best performance.

## Migration Status

✅ **Completed Features:**
- Index page UI exactly matching Thymeleaf template
- User authentication (login/signup)
- AI search interface with Claude-style design
- Visual search functionality
- Advanced filters and recommendations
- Modal forms with validation
- Responsive design and animations
- API integration with Spring Boot backend

🔄 **Future Enhancements:**
- Additional pages (search results, product details, etc.)
- Real-time notifications
- Advanced user profiles
- Shopping cart integration

---

## Original Create React App Documentation

### Available Scripts

In the project directory, you can run:

#### `npm start`
Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm test`
Launches the test runner in the interactive watch mode.

#### `npm run build`
Builds the app for production to the `build` folder.
