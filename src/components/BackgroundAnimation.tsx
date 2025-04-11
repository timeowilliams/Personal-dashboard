// components/BackgroundAnimation.jsx
import React from "react";

const BackgroundAnimation = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-400/10 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-purple-400/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-1/4 h-1/4 bg-pink-400/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
    </div>
  );
};

export default BackgroundAnimation;