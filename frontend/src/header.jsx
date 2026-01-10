import "./css/header.css"
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// const SigninButton = () =>{
  
// }
const Popup = ({handlePopup})=> {
    const navigate = useNavigate();
    const handleLogout = async () => {
        const res = await fetch("http://localhost:5000/aouth/logout");
        if(res.ok){
            console.log(res);
            navigate("/");
        } else{
            console.log("logouted");
        }
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
              {isSignedIn?null:<NavLink to="/signin" className="navigation">Signin</NavLink>}
              {isSignedIn?null:<NavLink to="/signup" className="navigation">Signup</NavLink>}
              {isSignedIn?<p onClick={handlePopup}><img  className="profile" src="./profile.png" /></p>:null}   
            </div>
            {popupVisible?<Popup handlePopup={handlePopup}/>:null}
        </header>
    );
}