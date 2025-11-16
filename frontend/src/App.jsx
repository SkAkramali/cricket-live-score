// App.js
import './App.css'
import Sigin from "./sigin";
import { Header } from './header';
import { LandingPage } from './landingPage';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Dashboard } from './dashboard';
import SignUp from './signup';
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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<Sigin onLoginSuccess={() => setIsSignedIn(true)} />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
      <Header />
      {isSignedIn ? (<LandingPage />) : (<Dashboard></Dashboard>)}
    </>
  );
}

export default App;
