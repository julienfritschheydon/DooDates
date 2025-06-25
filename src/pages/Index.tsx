import React from 'react';
import TopNav from '../components/TopNav';
import ChatInterface from '../components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <div className="w-full max-w-4xl mx-auto">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
