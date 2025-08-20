To view the working prototype - please take a look at the url

# Discovery Financial AI Assistant

A comprehensive React-based financial analysis application that provides AI-powered insights for personal finance management. Built with South African users in mind, featuring bank statement analysis, debt optimization, investment planning, and Discovery Vitality integration.

## 🌟 Features

### Core Functionality
- **AI-Powered Bank Statement Analysis** - Upload CSV/PDF statements for automatic transaction categorization
- **Real-time Financial Insights** - Get personalized recommendations based on your spending patterns
- **Debt Optimization** - Advanced debt payoff strategies (avalanche vs snowball methods)
- **Investment Planning** - Risk-based portfolio recommendations with South African context
- **Smart Budget Management** - Automated expense tracking and optimization suggestions
- **Discovery Vitality Integration** - Earn points for healthy financial behaviors

### Advanced Features
- **Gemini AI Chatbot** - Conversational financial advisor with context-aware responses
- **Enhanced Statistical Analysis** - Protected category detection using SA household spending patterns
- **Debt/Investment Split Optimization** - AI-recommended allocation strategies
- **Interactive Data Visualization** - Professional charts and expense breakdowns
- **Mobile-First Design** - Optimized phone interface with native app feel

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern functional components with hooks
- **Tailwind CSS** - Utility-first styling with custom Discovery branding
- **Recharts** - Professional data visualization components
- **Lucide React** - Comprehensive icon library

### AI & Analytics
- **Google Gemini API** - Advanced conversational AI for financial advice
- **Custom Financial Analysis Engine** - Backend API for transaction processing
- **Statistical Modeling** - South African household spending pattern analysis

### Key Libraries
- **React Router** - Navigation and routing
- **Chart.js/Recharts** - Data visualization
- **Date-fns** - Date manipulation
- **Lodash** - Utility functions

## 🚀 Getting Started

### Prerequisites
```bash
Node.js 16+ 
npm or yarn
Gemini API key (for AI chatbot)
```

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Navigate to project directory
cd discovery-financial-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Configuration
Create a `.env` file with:
```env
VITE_API_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_TIMEOUT_MS=20000
VITE_DEBUG_API=false
```

### Running the Application
```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📱 Application Structure

### Main Components

#### `App.jsx`
Central application state management with authentication, file upload handling, and comprehensive financial data orchestration.

#### `TabNavigation.jsx`
Mobile-optimized navigation with custom icons:
- 📊 **Dashboard** - Financial overview and quick actions
- 📈 **Analysis** - Detailed spending breakdown and AI insights
- 💳 **Debt** - Debt optimization and payoff strategies
- 📈 **Investment** - Portfolio recommendations and projections
- 💰 **Budget** - Expense tracking and goal setting
- ✅ **Vitality** - Health and financial wellness integration

#### `ChatBot.jsx`
Advanced AI financial advisor featuring:
- Context-aware responses based on user's financial data
- Comprehensive analysis integration (budget, debt, investments)
- South African financial context and recommendations
- Real-time conversation with financial insights

#### `Analysis.jsx`
Sophisticated financial analysis dashboard with:
- Interactive expense categorization charts
- AI-powered optimization recommendations
- Debt payment detection and strategy suggestions
- Custom debt/investment split allocation tools

### API Integration (`api.js`)
Robust API client with:
- Timeout handling and error management
- File upload support (CSV/PDF)
- Comprehensive financial analysis endpoints
- Debt and investment strategy calculations

## 🎯 Key Features Deep Dive

### AI-Powered Analysis
- **Enhanced Statistical Modeling** - Uses South African household spending patterns
- **Protected Category Detection** - Automatically identifies essential vs discretionary spending
- **Personalized Recommendations** - Context-aware suggestions based on user profile

### Debt Optimization
- **Multiple Payoff Strategies** - Avalanche vs Snowball method comparison
- **Interest Savings Calculation** - Precise financial impact projections
- **Custom Debt Upload** - Support for detailed debt portfolio analysis

### Investment Planning
- **Risk-Based Portfolios** - Conservative, Moderate, Aggressive strategies
- **South African Context** - Local investment products and tax considerations
- **Long-term Projections** - 10, 20, 30-year growth scenarios

### Discovery Vitality Integration
- **Points System** - Reward healthy financial behaviors
- **Status Tracking** - Gold, Silver, Bronze membership benefits
- **Wellness Integration** - Connect financial and physical health

## 🔐 Security & Authentication

- Demo authentication system (extendable for production)
- Secure API communication with timeout handling
- Client-side data protection and privacy considerations

## 🌍 South African Context

The application is specifically designed for South African users with:
- **Local Currency** - All amounts in South African Rand (ZAR)
- **Banking Integration** - Support for major SA banks (Discovery, Standard Bank, FNB, ABSA, Nedbank, Capitec)
- **Local Merchants** - Recognition of SA retailers and service providers
- **Tax Considerations** - TFSA limits, retirement annuity benefits
- **Transport Context** - Taxi, Uber, Bolt, Gautrain integration

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── analysis/          # Financial analysis components
│   ├── auth/             # Authentication screens
│   ├── budget/           # Budget management
│   ├── dashboard/        # Main dashboard
│   ├── debt/             # Debt optimization
│   ├── investment/       # Investment planning
│   ├── layout/           # Navigation and layout
│   ├── shared/           # Reusable components
│   ├── ui/              # UI primitives
│   └── vitality/        # Vitality integration
├── utils/
│   └── api.js           # API client
├── styles/
│   └── globals.css      # Global styles
└── App.jsx              # Main application
```

### Custom Styling
The application uses a custom Discovery-themed color palette:
- **Discovery Gold** - Primary brand color
- **Discovery Blue** - Secondary brand color
- **Professional Gradients** - Modern UI aesthetics

### Component Architecture
- **Functional Components** - Modern React with hooks
- **State Management** - Local state with Context API where needed
- **Responsive Design** - Mobile-first approach with Tailwind
- **Modular Structure** - Reusable components and clear separation of concerns

## 📊 Data Flow

1. **Bank Statement Upload** → AI processing and categorization
2. **Analysis Generation** → Spending insights and recommendations
3. **Strategy Planning** → Debt/investment optimization
4. **Ongoing Monitoring** → Budget tracking and goal progress

## 🤖 AI Integration

The Gemini AI chatbot provides:
- **Contextual Financial Advice** - Based on real user data
- **South African Expertise** - Local financial product knowledge
- **Actionable Recommendations** - Specific, implementable suggestions
- **Conversation Memory** - Maintains context across interactions

### AI Features
- Real-time analysis of uploaded financial data
- Personalized recommendations based on spending patterns
- South African financial context awareness
- Multi-turn conversation capabilities
- Error handling and fallback responses

## 📱 Mobile Experience

### Phone Frame Design
- **Native App Feel** - Custom phone frame simulation
- **Touch Optimized** - Gesture-friendly interface
- **Status Bar** - Realistic mobile status indicators
- **Tab Navigation** - Bottom navigation for easy thumb access

### Responsive Features
- Optimized for 375px width (iPhone standard)
- Touch-friendly button sizes
- Smooth animations and transitions
- Efficient loading states

## 🚀 Deployment

### Production Considerations
- **Static Hosting** - Vercel, Netlify compatible
- **Environment Variables** - Secure API key management
- **Build Optimization** - Code splitting and lazy loading
- **Performance** - Optimized bundle sizes

### Backend Requirements
- Financial analysis API server
- File upload handling (CSV/PDF)
- Debt and investment calculation services
- User authentication system (for production)

## 📊 Sample Data & Testing

### Demo Profiles
The application includes sample financial profiles:
- **Min Wage Earner** - Basic income scenarios
- **Single Parent** - Family financial planning
- **Pensioner** - Retirement income management
- **Informal Trader** - Variable income handling
- **Security Guard** - Regular employment patterns

### Demo Credentials
For testing purposes:
- **ID:** demo123
- **Password:** password123

## 🧪 Testing Strategy

### File Upload Testing
- CSV bank statements from major SA banks
- PDF statement parsing and extraction
- Error handling for invalid formats
- Large file processing capabilities

### AI Response Testing
- Context-aware financial advice
- South African specific recommendations
- Edge case handling and fallbacks
- Performance under load

## 🔮 Future Enhancements

### Planned Features
- **Real Banking API Integration** - Live account connectivity
- **Advanced Investment Tracking** - Portfolio performance monitoring
- **Automated Bill Optimization** - Smart payment scheduling
- **Enhanced Vitality Rewards** - Deeper health integration
- **Multi-Currency Support** - International user base

### Technical Improvements
- **Offline Capabilities** - Progressive Web App features
- **Real-time Notifications** - Push notification system
- **Advanced Analytics** - Machine learning insights
- **API Rate Limiting** - Enhanced performance management

## 🛠️ Development Setup

### IDE Configuration
Recommended VS Code extensions:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint

### Code Quality
- ESLint configuration for React best practices
- Prettier for consistent code formatting
- Husky for pre-commit hooks
- Conventional commits for clear history

## 📈 Performance Optimization

### Bundle Optimization
- Code splitting by route
- Lazy loading of heavy components
- Tree shaking for unused code
- Optimized image assets

### Runtime Performance
- Memoization of expensive calculations
- Efficient re-renders with React.memo
- Optimized API calls with caching
- Smooth animations with CSS transforms

## 🔒 Security Considerations

### Data Protection
- Client-side data encryption where applicable
- Secure API communication (HTTPS)
- Input validation and sanitization
- XSS protection measures

### Privacy
- No persistent storage of sensitive data
- GDPR compliance considerations
- User consent for data processing
- Clear privacy policy implementation

## 📚 Documentation

### API Documentation
- Comprehensive endpoint documentation
- Request/response examples
- Error code explanations
- Rate limiting guidelines

### Component Documentation
- Props interface definitions
- Usage examples for each component
- Styling customization guides
- Integration patterns

## 🤝 Contributing

### Development Guidelines
- Follow React best practices
- Use TypeScript for type safety (future enhancement)
- Write comprehensive tests
- Document new features

### Code Review Process
- Pull request templates
- Code quality checks
- Security review requirements
- Performance impact assessment

## 📄 License

This project is proprietary software developed for Discovery Health.

## 📞 Support

For technical issues or questions:
- Internal development team contact
- Documentation wiki
- Issue tracking system
- Regular development meetings

---

**Built with ❤️ for South African financial wellness**

*Empowering users to make informed financial decisions through AI-powered insights and comprehensive analysis tools.*
