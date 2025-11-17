import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/signin.css";

const Form = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1️⃣ SEND LOGIN REQUEST
      const result = await fetch("http://localhost:5000/aouth/signin", {
        method: "POST",
        credentials: "include",     // needed for cookie-session
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await result.json();

      if (data.status === true) {
        console.log("Login success");

        // 2️⃣ CALL GET API TO CONFIRM SESSION
        const check = await fetch("http://localhost:5000/aouth/issignined", {
          method: "GET",
          credentials: "include",   // send cookies!
        });

        const checkData = await check.json();

        console.log(checkData);

        // 3️⃣ If session is valid → Navigate
        if (checkData.signed === true) {
          navigate("/dashboard");
        } else {
          alert("User not signed in (session invalid)");
        }

      } else {
        alert("Incorrect email or password");
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h1>Signin</h1>

      <input
        type="text"
        placeholder="Email"
        onInput={(e) => setEmail(e.target.value)}
        className="userDeatils"
        required
      />

      <input
        type="password"
        placeholder="Password"
        onInput={(e) => setPassword(e.target.value)}
        className="userDeatils"
        required
      />

      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;
