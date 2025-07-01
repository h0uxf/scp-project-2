import React, { useState, useEffect } from "react";
import { Menu, X, Crown, Play, HelpCircle, Home, GraduationCap, Star, Trophy, Medal } from "lucide-react";

const top3 = [
  { name: "Alice", points: 120 },
  { name: "Bob", points: 110 },
  { name: "Charlie", points: 100 },
];

const FloatingShape = ({ className, delay = 0 }) => (
  <div 
    className={`absolute opacity-20 animate-bounce ${className}`}
    style={{ animationDelay: `${delay}s`, animationDuration: '3s' }}
  />
);

const GlowingOrb = ({ size, color, position, delay = 0 }) => (
  <div 
    className={`absolute ${position} ${size} ${color} rounded-full blur-xl opacity-30 animate-pulse`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const LandingPage = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setNavOpen(!navOpen);

  const handleNavClick = (targetId) => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    setNavOpen(false);
  };

  const handleButtonClick = (action) => {
    // In a real app, this would navigate to different pages
    alert(`This would navigate to the ${action} page!`);
  };

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen scroll-smooth relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <GlowingOrb size="w-96 h-96" color="bg-blue-500" position="top-10 -left-48" delay={0} />
        <GlowingOrb size="w-64 h-64" color="bg-purple-500" position="top-1/3 right-10" delay={1} />
        <GlowingOrb size="w-80 h-80" color="bg-indigo-500" position="bottom-20 left-20" delay={2} />
        
        <FloatingShape className="w-4 h-4 bg-white rounded-full top-20 left-1/4" delay={0} />
        <FloatingShape className="w-6 h-6 bg-blue-300 rounded-full top-1/2 right-1/4" delay={1} />
        <FloatingShape className="w-3 h-3 bg-purple-300 rounded-full bottom-1/3 left-3/4" delay={2} />
      </div>

      {/* NavBar */}
      <nav 
        className={`bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-lg border-b border-white/20 px-4 sm:px-6 py-4 sticky top-0 z-20 transition-all duration-300 ${
          scrollY > 50 ? 'bg-gradient-to-r from-blue-600/40 via-purple-600/40 to-pink-600/40 shadow-2xl' : ''
        }`}
      >
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
          
          {/* Desktop Navigation - Expanded Horizontally */}
          <div className="hidden lg:flex items-center space-x-2">
            {[
              { href: "home", icon: Home, text: "Home", color: "from-blue-500 to-cyan-500" },
              { href: "about", icon: GraduationCap, text: "About", color: "from-purple-500 to-pink-500" },
              { href: "scan", icon: Play, text: "Scan", color: "from-green-500 to-emerald-500" },
              { href: "quiz", icon: HelpCircle, text: "Quiz", color: "from-yellow-500 to-orange-500" },
              { href: "leaderboard", icon: Crown, text: "Leaderboard", color: "from-pink-500 to-rose-500" }
            ].map(({ href, icon: Icon, text, color }) => (
              <button 
                key={href}
                onClick={() => handleNavClick(href)}
                className={`group relative bg-gradient-to-r ${color} text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="group-hover:rotate-12 transition-transform duration-300" />
                  {text}
                </span>
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
              {[
                { href: "home", icon: Home, text: "Home", color: "from-blue-500 to-cyan-500" },
                { href: "about", icon: GraduationCap, text: "About", color: "from-purple-500 to-pink-500" },
                { href: "scan", icon: Play, text: "Scan", color: "from-green-500 to-emerald-500" },
                { href: "quiz", icon: HelpCircle, text: "Quiz", color: "from-yellow-500 to-orange-500" },
                { href: "leaderboard", icon: Crown, text: "Leaderboard", color: "from-pink-500 to-rose-500" }
              ].map(({ href, icon: Icon, text, color }) => (
                <button 
                  key={href}
                  onClick={() => handleNavClick(href)}
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

      {/* Hero Section */}
      <section id="home" className="py-24 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-fadeInUp">
            Welcome to Singapore Poly
          </h2>
          <p className="text-gray-300 text-xl sm:text-2xl mb-8 leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Discover the future of computing through immersive AR experiences
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <button 
              onClick={() => handleButtonClick('scan')}
              className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                <Play className="group-hover:rotate-12 transition-transform" />
                Start Scanning
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            <button 
              onClick={() => handleButtonClick('about')}
              className="group bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2 font-semibold">
                <GraduationCap className="group-hover:rotate-12 transition-transform" />
                Learn More
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white">
            About <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SP & SoC</span>
          </h2>
          <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-6">
              The School of Computing (SoC) at SP offers cutting-edge diploma courses and flexible pathways to shape your future in technology.
            </p>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
              Explore SoC through our revolutionary AR game — scan markers, complete challenges, and earn real rewards while discovering your passion for computing!
            </p>
          </div>
        </div>
      </section>

      {/* Scan Section */}
      <section id="scan" className="py-20 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white">
            Start Your <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Exploration</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <Play className="text-6xl text-green-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-2xl font-semibold text-white mb-4">AR Scanning</h3>
              <p className="text-gray-300 mb-6">
                Use your device camera to discover hidden content and interactive experiences throughout the School of Computing.
              </p>
              <button 
                onClick={() => handleButtonClick('scan')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Begin Scanning
              </button>
            </div>
            <div className="space-y-4">
              {[
                { feature: 'Discover Hidden Content', color: 'from-blue-500 to-purple-500' },
                { feature: 'Interactive Experiences', color: 'from-purple-500 to-pink-500' },
                { feature: 'Real-time Rewards', color: 'from-pink-500 to-rose-500' }
              ].map(({ feature, color }, i) => (
                <div key={i} className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/15 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-r ${color} rounded-full flex items-center justify-center`}>
                      <Star className="text-white text-sm" />
                    </div>
                    <span className="text-white font-medium">{feature}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz" className="py-20 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-8 text-white">
            Test Your <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Knowledge</span>
          </h2>
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <HelpCircle className="text-6xl text-yellow-400 mx-auto mb-6 animate-bounce" />
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Challenge yourself with our interactive computing quiz. Test your knowledge, learn new concepts, and compete with fellow students!
            </p>
            <button 
              onClick={() => handleButtonClick('quiz')}
              className="group bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="group-hover:rotate-12 transition-transform" />
                Take the Quiz
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="py-20 px-4 sm:px-8 text-center relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold mb-12 text-white">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Leaderboard</span>
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            {top3.map((user, index) => {
              const icons = [Trophy, Medal, Star];
              const Icon = icons[index];
              const colors = [
                'from-yellow-400 to-orange-400',
                'from-gray-300 to-gray-400', 
                'from-orange-400 to-red-400'
              ];
              
              return (
                <div
                  key={index}
                  className={`bg-gradient-to-r ${colors[index]} p-0.5 rounded-2xl transform hover:scale-105 transition-all duration-300`}
                >
                  <div className="bg-black/80 backdrop-blur-lg p-6 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${colors[index]} rounded-full flex items-center justify-center`}>
                        <Icon className="text-white text-xl" />
                      </div>
                      <div className="text-left">
                        <span className="text-white font-bold text-xl">#{index + 1}</span>
                        <p className="text-gray-300 font-medium">{user.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`bg-gradient-to-r ${colors[index]} bg-clip-text text-transparent font-bold text-2xl`}>
                        {user.points}
                      </span>
                      <p className="text-gray-400 text-sm">points</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button 
            onClick={() => handleButtonClick('leaderboard')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            <span className="flex items-center gap-2">
              <Crown className="animate-pulse" />
              View Full Leaderboard
            </span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-8 border-t border-white/20 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-bold">S</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              TimeSOC
            </h3>
          </div>
          <p className="text-gray-400 mb-6">
            Exploring the future of computing education through immersive AR experiences.
          </p>
          <div className="flex justify-center space-x-6 text-gray-400">
            <span>© 2024 Singapore Polytechnic</span>
            <span>School of Computing</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;