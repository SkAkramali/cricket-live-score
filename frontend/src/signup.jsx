import { useState } from "react";
import "./css/signin.css"
const From = () => {
  const [userName, setName]= useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const changeName= (e) => {
    setName(e.target.value);
    console.log(e.target.value);
  }

  const changePassword= (e) => {
    setPassword(e.target.value);
  }

  const changeEmail = (e) => {
    setEmail(e.target.value);
    console.log(e.target.value);  
  }

  const handleSubmit = async(e) => {
    e.preventDefault();
    const result = await fetch('http://localhost:5000/aouth/signup/', {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({userName, email, password}) 
    }); 
    const data = await result.json();
    console.log(data);
  }

 return(
  <form onSubmit={handleSubmit} className="form">
    <h1>SignUP</h1>
    <input type="text" placeholder="Name" className="userDeatils" onInput={changeName} required/>
    <input type="text" placeholder="Email"  onInput={changeEmail} className="userDeatils"required/>
    <input type="password" placeholder="Password" onInput={changePassword} className="userDeatils" required/>
    <button type="submit">Submit</button>
  </form>
 )
}
const SignUp = () => {
 return(
   <From></From>
 )
}
export default SignUp;