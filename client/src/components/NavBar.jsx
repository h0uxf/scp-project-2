import React, { useState } from "react";
import { Menu, X, Crown, Play, GraduationCap, Home, Puzzle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

const NavBar = () => {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const { handleLogout, currentUser } = useAuth();

  const toggleMenu = () => setNavOpen(!navOpen);

  const navItems = [
    {
      icon: Home,
      text: "Home",
      color: "from-blue-500 to-cyan-500",
      action: () => navigate("/"),
    },
    {
      icon: GraduationCap,
      text: "About",
      color: "from-purple-500 to-pink-500",
      action: () =>  navigate('/learn-more'),
    },

    {
      icon: Play,
      text: "Scan",
      color: "from-green-500 to-emerald-500",
      action: () => navigate("/scan"),
    },
    {
      icon: Crown,
      text: "Leaderboard",
      color: "from-pink-500 to-rose-500",
      action: () => navigate("/leaderboard"),
    },
    ...(currentUser
      ? [
          {
            icon: X,
            text: "Logout",
            color: "from-red-500 to-rose-500",
            action: handleLogout,
          },
        ]
      : []),
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-lg border-b border-white/20 px-4 sm:px-6 py-4 sticky top-0 z-20 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">SP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            EXPLORING SP GAME
          </h1>
        </div>

        {/* Desktop Navigation Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          {navItems.map(({ icon: Icon, text, color, action }, index) => (
            <button
              key={`desktop-${text}-${index}`}
              onClick={() => {
                action();
                setNavOpen(false);
              }}
              className={`group bg-gradient-to-r ${color} text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium flex items-center gap-2`}
            >
              <Icon className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
              {text}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="lg:hidden relative bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {navOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {navOpen && (
        <div className="lg:hidden mt-4 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 backdrop-blur-lg rounded-2xl border border-white/20 p-4 animate-fadeIn">
          <div className="space-y-2">
            {navItems.map(({ icon: Icon, text, color, action }, index) => (
              <button
                key={`mobile-${text}-${index}`}
                onClick={() => {
                  action();
                  setNavOpen(false);
                }}
                className={`w-full group bg-gradient-to-r ${color} text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium`}
              >
                <span className="flex items-center gap-3 justify-center">
                  <Icon className="group-hover:rotate-12 transition-transform duration-300" />
                  {text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
