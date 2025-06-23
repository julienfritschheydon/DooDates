import { useParams, useNavigate } from 'react-router-dom';
import { VotingInterface } from '@/components/voting/VotingInterface';

const Vote = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();

  if (!pollId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">URL invalide</h2>
          <p className="text-gray-600 mb-4">L'identifiant du sondage est manquant.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <VotingInterface 
      pollId={pollId} 
      onBack={() => navigate('/')} 
    />
  );
};

export default Vote; 