import "./css/header.css"
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// const SigninButton = () =>{
  
// }
const Popup = ({handlePopup})=> {
    const navigate = useNavigate();
    const handleLogout = () => {
        // JWT logout is handled client-side by removing tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Force page reload to reset auth state
        window.location.href = '/';
    }
    return(
        <div className="popupContainer">
        <div className="popup">
            <p>Are you sure you want to log out?</p>
            <div className="popupButtons">
              <button className="logout" onClick={handleLogout}>LogOut</button>
              <button onClick={handlePopup}  className="cancelLogout">Cancel</button>
            </div>
        </div>
        </div>
    );
}
export const Header = ({isSignedIn}) => {
    const[popupVisible, setPopupVisible] = useState(false);
    const handlePopup = () => { 
        setPopupVisible(!popupVisible);
    }
    return (
        <header className="App-header">
            <p className="logo">Live Score</p>
            <div className="navContainer">
              {isSignedIn ? (
                <>
                  <NavLink to="/dashboard" className="navigation" style={{ marginRight: '15px', color: 'white', textDecoration: 'none' }}>Dashboard</NavLink>
                  <NavLink to="/tournaments" className="navigation" style={{ marginRight: '15px', color: 'white', textDecoration: 'none' }}>Tournaments</NavLink>
                  <NavLink to="/teams" className="navigation" style={{ marginRight: '15px', color: 'white', textDecoration: 'none' }}>Teams & Players</NavLink>
                  <NavLink to="/live-scoring" className="navigation" style={{ marginRight: '15px', color: 'white', textDecoration: 'none' }}>Live Scoring</NavLink>
                  <NavLink to="/scoreboard" className="navigation" style={{ marginRight: '15px', color: 'white', textDecoration: 'none' }}>Scoreboard</NavLink>
                  <p onClick={handlePopup} style={{ cursor: 'pointer', margin: 0 }}><img className="profile" src="./profile.png" alt="Profile" style={{ width: '30px', height: '30px', borderRadius: '50%' }} /></p>
                </>
              ) : (
                <>
                  <NavLink to="/signin" className="navigation">Signin</NavLink>
                  <NavLink to="/signup" className="navigation">Signup</NavLink>
                </>
              )}
            </div>
            {popupVisible?<Popup handlePopup={handlePopup}/>:null}
        </header>
    );
}