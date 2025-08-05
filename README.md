# Introduction / Description
This repository is utilised in fulfilment of the requirements of Secure Coding (Project) module, Project 2.
In today’s digital age, schools are increasingly leveraging technology to engage with prospective
students, parents, and the broader community. To enhance the school’s visibility and create an
immersive experience for users, we propose the development of an interactive gamified application that
utilizes web Augmented Reality (AR). This project is to design and develop an interactive augmented
reality (AR) game application that promotes School of Computing (SoC) by showcasing its facilities,
culture, and values. The application will provide users with an engaging, gamified experience, allowing
them to explore the school environment virtually and interactively.

## Prerequisites
Before running the tests, ensure that the following dependencies are installed:
- Node.js
- npm (Node Package Manager)

Installing dependencies for server
- Navigate to the back-end folder
- Execute the command 'npm install' in the terminal to install necessary packages before running the program.

Installing dependencies for client 
- Navigate to the back-end folder
- Execute the command 'npm install' in the terminal to install necessary packages before running the program.

### Folder Structure 
SC-PROJECT-2
- client 
  -- public 
    -- favicon.ico
    -- logo192.png
    -- logo512.png 
    -- manifest.json
    -- robots.txt
  -- src 
    -- components
      -- ARViewer.jsx 
      -- AuthProvider.jsx
      -- BackgroundEffects.jsx
      -- CrosswordGrid.jsx
      -- Footer.jsx
      -- LearnMoreRedirect.jsx
      -- NavBar.jsx
      -- PuzzleBuilder.jsx 
    -- hooks 
      -- useApi.js
    -- pages 
      -- ActivitiesPage.jsx
      -- AdminDashboard.jsx
      -- AdminQRScanner.jsx 
      -- CrosswordAdminPage.jsx
      -- CrosswordListPage.jsx
      -- CrosswordPage.jsx
      -- FaceFilterPage.jsx
      -- LandingPage.jsx
      -- LeaderboardPage.jsx
      -- LoginPage.jsx
      -- ManageUsersPage.jsx
      -- QuizPage.jsx
      -- RegisterPage.jsx
      -- RewardsPage.jsx
      -- ScanPage.jsx
 - App.css
 - App.jsx
 - App.test.js 
 - index.css
 - index.jsx 
 - .dccache 
 - .gitignore
 - package-lock.json
 - package.json
 - postcss.config.js 
 - README.md 
 - report.html 
- server
 -- logs 
   -- app.log
   -- errors.log
 -- prisma 
   -- migrations 
   -- schema_backup.prisma
   -- schema.prisma 
 -- src 
   -- configs 
     -- initData.js 
   -- controllers 
     -- activityController.js
     -- adminController.js 
     -- crosswordController.js 
     -- leaderboardController.js 
     -- locationController.js 
     -- quizController.js 
     -- rewardController.js 
     -- userController.js 
   -- middlewares 
     -- bcryptMiddleware.js 
     -- errorHandler.js 
     -- jwtMiddleware.js 
     -- notFound.js 
     -- roleMiddleware.js 
     -- sanitizers.js 
     -- validators.js 
   -- models 
     -- activityModel.js
     -- adminModel.js 
     -- crosswordModel.js 
     -- leaderboardModel.js 
     -- locationModel.js
     -- quizModel.js
     -- rewardModel.js
     -- userModel.js 
   -- routes 
     -- activityRoutes.js 
     -- adminRoutes.js 
     -- authRoutes.js 
     -- crosswordRoutes.js 
     -- imageRoutes.js 
     -- leaderboardRoutes.js 
     -- locationRoutes.js 
     -- mainRoutes.js 
     -- quizRoutes.js 
     -- rewardRoutes.js 
   -- uploads
   -- utils
     -- AppError.js 
     -- catchAsync.js 
   -- app.js 
   -- logger.js 
 - .dccache 
 - index.js 
 - package-lock.json 
 - package.json 
 - report.html 
- .dccache 
- .gitignore 
- package-lock.json
- package.json 
- README.md 
- report.html 

## Instructions
1. Adjust the user and password settings in the .env file to match PostgreSQL workbench configurations.         
    - Template: 
        
2. Navigate to back-end folder 
    - Execute 'npx prisma generate' to generate the Prisma client
    - Execute 'npx prisma migrate reset' to remove all data from the database
    - Execute 'npm run init_data' to initialize the SQL database with a fresh set of data, free from any CRUD operations.
    - Execute 'npm run dev' to start the server, enabling verification of various endpoints in POSTMAN.
3. Navigate to front-end folder 
    - Execute 'npm run dev' to start the start the client, enabling display of endpoints on web application.

## Functionalities 
### Back-End 
1. User Authentication
    - Register and log in users with hashed passwords using JWT for secure sessions.
    - Role-based access control (e.g., admin vs user privileges).
2. Crossword Puzzle
    - Users can submit their answers for the crossword puzzles
    - CRUD operations for crossword puzzle, only for admin users
3. Diploma Personality Quiz 
    - Users can take the quiz and submit their answers to find the diploma most suited for them, and earn points
    - CRUD operations for personality quiz feature, only for admin users
4. Leaderboard
    - Log user progress in terms of points
5. Image Upload
    - Users can upload images to be saved in the uploads folder in the backend 
6. User Management 
    - Admin users can view all users with backend search, filtering and pagiation 
    - Updating of user role and deletion of users
7. Activity Management 
    - Full CRUD access for admin to manage activities

### Front-End
1. All Access Pages 
    - Login/register pages with token handling for session management. 
    - View leaderboard without being logged in 
    - Access the face filter page to capture memories 
2. Protected Pages 
    - Superadmin-only view to manage users and activities.
    - Admin-only view to manage activities. 
3. Responsive UI
    - Works across various devices with optimized layout for mobile and desktop.

### AR Functionalities 
1. NPC Feature
    - Users can navigate to the 8th Wall app after clicking 'Learn More' to view
    - NPC will mention the history of SoC and the details of the web application 
2. Scanning AR Targets 
    - Users can scan AR targets defined at different locations to navigate to new activities

### Secure Coding Implementations
1. User Input Validation
    - Implemented using express-validator to ensure all incoming data is properly sanitized and validated, reducing the risk of injection attacks.
2. Secure HTTP Headers
    - Utilized helmet middleware to set various HTTP headers that protect the app from well-known web vulnerabilities (e.g., XSS, clickjacking).
3. Output Encoding and Validation
    - Used xss library and manual encoding where necessary to sanitize outgoing content, especially in responses that reflect user input (prevents cross-site scripting).
4. Password Hashing
    - Employed bcrypt for hashing passwords securely before storing them in the database, preventing exposure of plaintext credentials.
5. Authentication and Authorization
    - Implemented jsonwebtoken (JWT) for secure token-based authentication.
    - Role-based access control ensures protected routes are restricted to authorized users only.
6. Environment Configuration
    - Stored sensitive data (e.g., DB credentials, JWT secrets) in a .env file to avoid hardcoding secrets into the codebase.
7. SQL Injection Protections
    - Used parameterized queries via the pg library to prevent SQL injection attacks.
    All database queries use Prisma ORM to protect against SQLi attacks.
8. Error Handling and Logging
    - Centralized error handling for consistent responses and easier debugging.
    - Avoided exposing stack traces and sensitive error information to the client in production mode.
9. Cross-Site Request Forgery (CSRF) Protections
    - Implemented using the csurf middleware to generate CSRF tokens for sensitive POST requests. 
    - Tokens are validated server-side to prevent malicious cross-site requests. 
10. Rate Limiting 
    - Used express-rate-limit to prevent brute-force attacks and API abuse by limiting the number of requests per IP
    - Configured with custom messages and retry-after headers to inform clients of cooldown durations
