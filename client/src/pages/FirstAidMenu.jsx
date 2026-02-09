import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firstAidTopics } from '../data/firstAidGuide';
import './FirstAid.css';

const FirstAidMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="first-aid-container">
      <header className="first-aid-header">
        <button onClick={() => navigate(-1)} className="back-button">← Back</button>
        <h1>First-Aid Guide</h1>
      </header>
      <div className="first-aid-menu">
        {firstAidTopics.map(topic => (
          <Link to={`/first-aid/${topic.id}`} key={topic.id} className="menu-item">
            <div className="menu-item-icon">{topic.icon}</div>
            <div className="menu-item-title">{topic.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FirstAidMenu;
