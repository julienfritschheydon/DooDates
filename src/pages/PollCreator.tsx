import React from 'react';
import PollCreatorComponent from '@/components/PollCreator';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const PollCreator = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 flex w-full max-w-7xl mx-auto">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-0 max-w-4xl">
        <PollCreatorComponent 
          onBack={() => navigate('/')}
        />
      </div>
    </div>
  );
};

export default PollCreator; 