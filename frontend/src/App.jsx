import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import BoardPage from './pages/BoardPage.jsx';
import Loader from './components/layout/Loader.jsx';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// A helper component to access AuthContext after it has been provided.
const AppContent = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return <Loader fullScreen={true} />;
  }

  return (
    <AppProvider>
      {isAuthenticated ? <BoardPage /> : <AuthPage />}
    </AppProvider>
  );
};

export default App;