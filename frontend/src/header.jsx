import "./css/header.css"
import { NavLink } from "react-router-dom";
// const SigninButton = () =>{
  
// }
export const Header = () => {
    return (
        <header className="App-header">
            <p className="logo">Live Score</p>
            <div className="navContainer">
              <NavLink to="/signin" className="navigation">Signin</NavLink>
              <NavLink to="/signup" className="navigation">Signup</NavLink>
            </div>
        </header>
    );
}