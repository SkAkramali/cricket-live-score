import { useState } from "react";
import "./css/signin.css"
const From = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const changeName= (e) => {
    setEmail(e.target.value);
    console.log(e.target.value);
  }

  const changePassword= (e) => {
    setPassword(e.target.value);
  }

  const handleSubmit = async(e) => {
    e.preventDefault();
    const result = await fetch('http://localhost:5000/aouth/signin/', {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email, password}) 
    }); 
    const data = await result.json();
    if(data.status == true) {
      console.log('you had done it man');
    } else {
      alert("password missmatched");
    }
    console.log(data);
  }

 return(
  <form onSubmit={handleSubmit} className="form">
    <h1>Signin</h1>
    <input type="text" placeholder="Email"  onInput={changeName} className="userDeatils"required/>
    <input type="password" placeholder="Password" onInput={changePassword} className="userDeatils" required/>
    <button type="submit">Submit</button>
  </form>
 )
}
const Sigin = () => {
 return(
   <From></From>
 )
}
export default Sigin;