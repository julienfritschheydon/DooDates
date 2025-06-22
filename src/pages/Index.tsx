import React from 'react';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex w-full max-w-7xl mx-auto">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 max-w-4xl">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Index;
