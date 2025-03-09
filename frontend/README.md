# Smart Solve - Academic Solutions Platform

Smart Solve is a university-centric platform that connects students with experts for academic problem-solving through real-time interactions.

## Features

- **Authentication System**
  - Secure login/signup system
  - Role-based access control (Student, Tutor, Admin)
  - Protected routes and authenticated sessions

- **Interactive Homepage**
  - 3D animated brain visualization
  - Feature highlights and statistics
  - Engaging call-to-action sections

- **Question Management**
  - Ask and browse academic questions
  - Tag-based categorization
  - Status tracking (Open, In Progress, Resolved)
  - Advanced search and filtering

- **Real-time Chat**
  - Instant messaging between students and tutors
  - Message history and chat persistence
  - Real-time notifications
  - Typing indicators and read receipts

- **User Profiles**
  - Detailed user information
  - Activity history
  - Performance statistics
  - Rating system

## Tech Stack

- **Frontend**
  - React 18 with TypeScript
  - Vite for build tooling
  - React Router for navigation
  - Zustand for state management
  - Three.js with React Three Fiber for 3D graphics
  - Tailwind CSS for styling
  - Lucide React for icons

## Getting Started

1. **Prerequisites**
   - Node.js 18+
   - npm or yarn

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/your-username/smart-solve.git

   # Install dependencies
   cd smart-solve
   npm install

   # Start development server
   npm run dev
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=your_api_url
   ```

## Project Structure

```
smart-solve/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
└── package.json         # Project dependencies
```

## Development

- **Code Style**
  - ESLint for code linting
  - Prettier for code formatting
  - TypeScript for type safety

- **State Management**
  - Zustand stores for global state
  - React hooks for local state
  - TypeScript interfaces for type definitions

## Building for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.