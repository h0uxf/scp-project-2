import React from "react";

const FloatingShape = ({ className, delay = 0 }) => (
  <div
    className={`absolute opacity-20 animate-bounce ${className}`}
    style={{ animationDelay: `${delay}s`, animationDuration: "3s" }}
  />
);

const GlowingOrb = ({ size, color, position, delay = 0 }) => (
  <div
    className={`absolute ${position} ${size} ${color} rounded-full blur-xl opacity-30 animate-pulse`}
    style={{ animationDelay: `${delay}s` }}
  />
);

const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <GlowingOrb
        size="w-96 h-96"
        color="bg-blue-500"
        position="top-10 -left-48"
        delay={0}
      />
      <GlowingOrb
        size="w-64 h-64"
        color="bg-purple-500"
        position="top-1/3 right-10"
        delay={1}
      />
      <GlowingOrb
        size="w-80 h-80"
        color="bg-indigo-500"
        position="bottom-20 left-20"
        delay={2}
      />

      <FloatingShape
        className="w-4 h-4 bg-white rounded-full top-20 left-1/4"
        delay={0}
      />
      <FloatingShape
        className="w-6 h-6 bg-blue-300 rounded-full top-1/2 right-1/4"
        delay={1}
      />
      <FloatingShape
        className="w-3 h-3 bg-purple-300 rounded-full bottom-1/3 left-3/4"
        delay={2}
      />
    </div>
  );
};

export default BackgroundEffects;
