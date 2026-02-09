import React from 'react';
import { Link } from 'react-router-dom';
import { firstAidTopics } from '../data/firstAidGuide';
import './FirstAid.css';

const FirstAidMenu = () => {
  return (
    <div className="first-aid-container">
      {/* --- UX ENHANCEMENT: Universal Home Button --- */}
      <header className="universal-header">
        <Link to="/" className="header-logo-link">
            <img src="/prc-logo.png" alt="PRC Logo" />
            <span>First-Aid Guide</span>
        </Link>
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
