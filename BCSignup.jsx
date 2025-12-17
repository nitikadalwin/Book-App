import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from "./Firebase";

import "./style.css";

function BCAppSignUp() {
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await setDoc(doc(firestore, "users", user.uid), {
        name,
        roles: { user: true },
        permissions: { read: true, write: true },
      });
      setName("");
      setEmail("");
      setPassword("");
      alert("Account created! Please Sign In");
      navigate("/signin");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="form-container">
      <h2>Sign Up for Discussion</h2>
      <hr />
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSignup}>
        <label>Full Name:</label>
        <input
          placeholder="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br />
        <br />
        <label>Email:</label>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br />
        <br />
        <label>Password:</label>
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br />
        <br />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default BCAppSignUp;
