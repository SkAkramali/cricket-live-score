// App.js
import './App.css'
import Sigin from "./sigin";
import { Header } from './header';
import { LandingPage } from './landingPage';
import { useEffect, useState } from 'react';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/aouth/issignined/');
        const data = await response.json();
        setIsSignedIn(data.islogined);
      } catch (error) {
        console.error("Error fetching login status:", error);
        setIsSignedIn(false);
      }
    };

    fetchData();
  }, []);

  if (isSignedIn === null) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      {isSignedIn ? (
        <LandingPage />
      ) : (
        <Sigin onLoginSuccess={() => setIsSignedIn(true)} />
      )}
    </>
  );
}

export default App;
