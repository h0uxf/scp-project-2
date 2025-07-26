import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
// import ScanPage from "./pages/ScanPage";
import QuizPage from "./pages/QuizPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FaceFilterPage from "./pages/FaceFilterPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import RewardsPage from "./pages/RewardsPage";
import AdminQRScanner from "./pages/AdminQRScanner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/scan" element={<ScanPage />} /> */}
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/face-filter' element={<FaceFilterPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path='/rewards' element={<RewardsPage />} />
        <Route path='/admin/rewards/scan' element={<AdminQRScanner />} />
      </Routes>
    </Router>
  );
}

export default App;
