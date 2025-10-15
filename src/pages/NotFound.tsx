import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { handleError, ErrorFactory, logError } from "../lib/error-handling";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    const notFoundError = ErrorFactory.validation(
      `404 Error: User attempted to access non-existent route: ${location.pathname}`,
      'Page non trouvée'
    );
    
    logError(notFoundError, {
      component: 'NotFound',
      operation: 'routeAccess'
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
