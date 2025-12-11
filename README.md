<div align="center">

# BloodLink 💉

### _Connecting donors with recipients, saving lives one drop at a time_

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-000000?logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## 📖 Overview

**BloodLink** is a comprehensive blood donation management system built with the MERN stack. It streamlines the process of connecting blood donors with recipients through intelligent matching, real-time communication, and a gamified donation tracking system.

### 🎯 Core Mission

- **Connect** donors with recipients instantly
- **Save** lives through efficient blood matching
- **Engage** communities with gamification
- **Track** donations with transparency

---

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 👤 For Donors

- 🔍 Smart donor search with location filters
- 🎫 Digital donation card with QR codes
- 🏆 Leaderboard & achievement system
- 🔔 Real-time urgent request alerts
- 📊 Complete donation history

</td>
<td width="33%" valign="top">

### 🩸 For Recipients

- 📝 Blood request management
- 🎯 Automated donor matching
- 💬 Direct chat with donors
- 📈 Request tracking & analytics
- ⚡ Urgency level indicators

</td>
<td width="33%" valign="top">

### 🛡️ For Administrators

- 📊 Comprehensive dashboard
- 👥 User account management
- 📅 Blood camp event organization
- ⭐ Review moderation
- 📉 System-wide analytics

</td>
</tr>
</table>

### 🌟 General Features

✅ Dark/Light mode with seamless switching
✅ Fully responsive design (Mobile, Tablet, Desktop)
✅ Educational blog & resources
✅ Event calendar for blood camps
✅ Review & rating system
✅ Real-time chat powered by Socket.io
✅ Secure JWT authentication

---

## 🛠️ Tech Stack

### **Frontend**

```
React 18          │ Modern UI library with hooks
Vite              │ Lightning-fast build tool
TailwindCSS v4    │ Utility-first CSS framework
Framer Motion     │ Smooth animations
Radix UI          │ Accessible components
Socket.io Client  │ Real-time communication
React Router v6   │ Client-side routing
Axios             │ HTTP client
```

### **Backend**

```
Node.js           │ JavaScript runtime
Express.js        │ Web application framework
MongoDB           │ NoSQL database
Mongoose          │ MongoDB ODM
Socket.io         │ Real-time engine
JWT               │ Authentication tokens
Bcrypt            │ Password hashing
Helmet            │ Security headers
QRCode            │ QR generation
```

### **DevOps & Testing**

```
Jest              │ Testing framework
Supertest         │ API testing
ESLint            │ Code quality
Nodemon           │ Development server
Git               │ Version control
```

---

## 📋 Prerequisites

Ensure you have the following installed:

| Tool    | Version   | Download                                |
| ------- | --------- | --------------------------------------- |
| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org/)       |
| npm     | >= 9.0.0  | Bundled with Node.js                    |
| MongoDB | >= 6.0.0  | [mongodb.com](https://www.mongodb.com/) |
| Git     | Latest    | [git-scm.com](https://git-scm.com/)     |

---

## 🚀 Installation

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/geekrover/Blood-link.git
cd Blood-link
```

### **Step 2: Environment Configuration**

Copy the example environment file:

```bash
cp .env.example server/.env
```

Edit `server/.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/bloodlink
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### **Step 3: Install Dependencies**

**Backend:**

```bash
cd server
npm install
```

**Frontend:**

```bash
cd client
npm install
```

### **Step 4: Seed Database (Optional)**

```bash
cd server
npm run seed
```

### **Step 5: Launch Application**

**Development Mode:**

Terminal 1 - Start Backend:

```bash
cd server
npm run dev
```

Terminal 2 - Start Frontend:

```bash
cd client
npm run dev
```

**Production Mode:**

```bash
# Build frontend
cd client
npm run build

# Start backend
cd server
npm start
```

### **Access the Application**

- 🌐 Frontend: `http://localhost:3000`
- ⚙️ Backend API: `http://localhost:5000`

---

## 📁 Project Structure

```
bloodlink/
│
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ui/            # Base UI components (Button, Card, etc.)
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DonorSearch.jsx
│   │   │   └── ...
│   │   ├── services/          # API & Socket services
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # Context providers (Auth, Theme)
│   │   ├── lib/               # Utility functions
│   │   └── index.jsx          # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Node.js Backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middlewares/       # Express middlewares
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── socket/            # Socket.io handlers
│   │   ├── utils/             # Helper functions
│   │   ├── tests/             # Test suites
│   │   └── index.js           # Server entry point
│   └── package.json
│
├── .env.example               # Environment variables template
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### **Authentication Endpoints**

```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # User login
GET    /api/auth/profile           # Get current user profile
PUT    /api/auth/profile           # Update user profile
```

### **Donor Endpoints**

```http
GET    /api/donors                 # Search donors
GET    /api/donors/:id             # Get donor details
PUT    /api/donors/:id/availability # Update availability status
```

### **Blood Request Endpoints**

```http
GET    /api/requests               # Get all requests
POST   /api/requests               # Create new request
GET    /api/requests/:id           # Get request details
PUT    /api/requests/:id           # Update request
DELETE /api/requests/:id           # Delete request
```

### **Notification Endpoints**

```http
GET    /api/notifications          # Get user notifications
PUT    /api/notifications/:id/read # Mark notification as read
DELETE /api/notifications/:id      # Delete notification
```

### **Leaderboard Endpoints**

```http
GET    /api/leaderboard            # Get leaderboard rankings
GET    /api/leaderboard/user/:id   # Get user ranking
```

### **Event Endpoints**

```http
GET    /api/events                 # Get all events
POST   /api/events                 # Create event (Admin only)
GET    /api/events/:id             # Get event details
PUT    /api/events/:id             # Update event (Admin only)
DELETE /api/events/:id             # Delete event (Admin only)
```

### **Chat Endpoints**

```http
GET    /api/chats                  # Get user's chats
GET    /api/chats/:id              # Get chat messages
POST   /api/chats/:id/messages     # Send message
```

> **Note:** For complete API documentation with request/response examples, see `API_DOCS.md` (if available)

---

## 🧪 Testing

Run the test suite:

```bash
cd server

# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 🎨 Key Features Breakdown

### 🔄 Real-time Communication

- Instant messaging between donors and recipients
- Live notifications for urgent blood requests
- Socket.io integration for bidirectional communication
- Online/offline status indicators

### 🧠 Intelligent Matching Algorithm

- **Location-based search** with configurable radius (default: 50km)
- **Blood type compatibility** checking (ABO and Rh factor)
- **Availability filtering** based on donor status
- **Donation frequency validation** (90-day cooldown period)
- **Emergency priority** matching for urgent requests

### 🏆 Gamification System

- Points-based leaderboard (100 points per donation)
- Bonus points for urgent requests (+50)
- Achievement badges and milestones
- Community recognition for top contributors
- Monthly and all-time rankings

### 🔒 Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing using bcrypt (10 rounds)
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for secure HTTP headers
- Input validation and sanitization
- CORS protection

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### **How to Contribute**

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### **Contribution Guidelines**

- ✅ Follow existing code style and conventions
- ✅ Write meaningful commit messages
- ✅ Add tests for new features
- ✅ Update documentation as needed
- ✅ Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**BloodLink Development Team**
_CSE470 Software Engineering Project_

### Project Contributors

- Lead Developers
- UI/UX Designers
- Backend Engineers
- QA Engineers

---

## 🙏 Acknowledgments

Special thanks to:

- **React Team** - For the amazing UI library and documentation
- **MongoDB** - For robust database solutions
- **Socket.io** - For real-time capabilities
- **TailwindCSS** - For beautiful and efficient styling
- **Open Source Community** - For invaluable tools and resources

---

## 📬 Contact & Support

### Get in Touch

- 📧 Email: maherulhassan1@gmail.com
- 🐛 Report Issues: [GitHub Issues](https://github.com/geekrover/Blood-link/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/geekrover/Blood-link/discussions)
- 🔗 Project Link: [https://github.com/yourusername/bloodlink](https://github.com/geekrover/Blood-link)

---

<div align="center">

### **Made with ❤️ by the BloodLink Team**

_Saving lives, one connection at a time._

**⭐ Star this repo if you find it helpful!**

</div>
