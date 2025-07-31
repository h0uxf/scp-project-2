// Create this as: src/pages/LearnMoreRedirect.jsx

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import BackgroundEffects from '../components/BackgroundEffects';

const LearnMoreRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Get parameters from localhost URL
    const existingParams = Object.fromEntries(searchParams);
    
    // Add tracking parameters
    const params = new URLSearchParams({
      ...existingParams, // Include params from localhost URL
      source: 'localhost5173',
      referrer: 'timesoc_landing',
      timestamp: Date.now(),
      campaign: 'sp_ar_demo',
      from_route: 'learn_more_redirect',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
      page_load_time: Date.now()
    });

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to external 8th Wall site
          window.location.href = `https://singaporepoly.8thwall.app/manipulate-model/?${params.toString()}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  const handleRedirectNow = () => {
    const existingParams = Object.fromEntries(searchParams);
    const params = new URLSearchParams({
      ...existingParams,
      source: 'localhost5173',
      referrer: 'timesoc_landing',
      timestamp: Date.now(),
      campaign: 'sp_ar_demo',
      from_route: 'learn_more_redirect',
      immediate_redirect: 'true'
    });
    
    window.location.href = `https://singaporepoly.8thwall.app/manipulate-model/?${params.toString()}`;
  };

  return (
    <div className="font-sans bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen relative overflow-hidden flex items-center justify-center">
      <BackgroundEffects />
      
      <div className="text-center bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-md mx-4 shadow-2xl">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="text-white text-4xl animate-pulse" />
        </div>
        
        {/* Title */}
        <h2 className="text-white text-3xl font-bold mb-4">
          Launching AR Experience
        </h2>
        
        {/* Description */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          You will be redirected to the Singapore Poly AR demo experience in{' '}
          <span className="text-emerald-400 font-bold text-2xl">{countdown}</span> seconds...
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          ></div>
        </div>
        
        {/* URL Preview */}
        <div className="bg-black/40 rounded-lg p-3 mb-6 text-xs">
          <p className="text-gray-400 mb-1">Redirecting to:</p>
          <p className="text-emerald-400 break-all">
            singaporepoly.8thwall.app/manipulate-model/
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={handleRedirectNow}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform font-semibold shadow-lg"
          >
            Go Now
          </button>
          <button 
            onClick={handleGoBack}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-full hover:scale-105 transition-transform font-semibold shadow-lg flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="text-sm" />
            Go Back
          </button>
        </div>
        
        {/* Additional Info */}
        <p className="text-gray-500 text-xs mt-4">
          Via localhost:5173/learn-more
        </p>
      </div>
    </div>
  );
};

export default LearnMoreRedirect;