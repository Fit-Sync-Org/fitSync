import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="nav-toggle" onClick={() => setOpen(o => !o)}>
        ☰
      </button>
      <nav className={`sidebar ${open ? 'open' : ''}`}>
        <ul>
          <li><Link to="/dashboard">Home</Link></li>
          <li><Link to="/log-meal">Log Meal</Link></li>
          <li><Link to="/log-workout">Log Workout</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/ai-history">AI History</Link></li>
        </ul>
      </nav>
    </>
  );
}
