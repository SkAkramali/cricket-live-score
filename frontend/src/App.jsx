import './App.css'
import Sigin from "./sigin";
import { Header } from './header';
import { LandingPage } from './landingPage';
import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Dashboard } from './dashboard';
import SignUp from './signup';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(null);

  useEffect(() => {
    const checkLogin = async () => {
      const res = await fetch("http://localhost:5000/aouth/issignined", {
        credentials: "include"
      });
      const data = await res.json();
      setIsSignedIn(data.islogined);
    };

    checkLogin();
  }, []);

  if (isSignedIn === null) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Header is ALWAYS visible */}
      <Header />

      {/* Routes below header */}
      <Routes>

        {/* NOT LOGGED IN ROUTES */}
        {!isSignedIn && (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<Sigin onLoginSuccess={() => setIsSignedIn(true)} />} />
            <Route path="/signup" element={<SignUp />} />
            {/* Redirect dashboard to signin */}
            <Route path="/dashboard" element={<Navigate to="/signin" />} />
          </>
        )}

        {/* LOGGED IN ROUTES */}
        {isSignedIn && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Prevent user from seeing signin again */}
            <Route path="/signin" element={<Navigate to="/" />} />
            <Route path="/signup" element={<Navigate to="/" />} />
          </>
        )}

      </Routes>
    </>
  );
}

export default App;

