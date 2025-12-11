# Todo App - Frontend

Next.js frontend for the Todo Web Application.

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.0
- **Components**: Shadcn/ui + Aceternity UI
- **State Management**: Zustand 5.0+
- **HTTP Client**: Axios 1.7+
- **Animations**: Framer Motion 11+
- **Forms**: React Hook Form + Zod

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Browser**:
   Visit http://localhost:3000

## Project Structure

```
frontend/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages
│   ├── dashboard/       # Dashboard page
│   └── layout.tsx       # Root layout
├── src/
│   ├── components/      # React components
│   │   ├── auth/       # Auth-related components
│   │   ├── tasks/      # Task-related components
│   │   └── layout/     # Layout components
│   ├── lib/            # Utility functions
│   │   └── api/        # API client
│   └── stores/         # Zustand stores
├── __tests__/          # Test suites
└── public/             # Static assets
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Building

```bash
# Build for production
npm run build

# Start production server
npm start
```

## See Also

- [Main README](../README.md)
- [API Specification](../specs/api/)
- [CLAUDE.md](./CLAUDE.md) - Frontend-specific agent rules
