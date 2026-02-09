import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firstAidTopics } from '../data/firstAidGuide';
import './FirstAid.css';

const FirstAidTopic = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = firstAidTopics.find(t => t.id === topicId);

  if (!topic) {
    return (
      <div className="first-aid-container">
        <header className="universal-header">
          <Link to="/" className="header-logo-link">
              <img src="/prc-logo.png" alt="PRC Logo" />
              <span>First-Aid Guide</span>
          </Link>
        </header>
        <p className="not-found-message">The requested first-aid topic could not be found.</p>
      </div>
    );
  }

  return (
    <div className="first-aid-container">
      <header className="universal-header">
        <Link to="/" className="header-logo-link">
            <img src="/prc-logo.png" alt="PRC Logo" />
            <span>{topic.title}</span>
        </Link>
        <button onClick={() => navigate('/first-aid')} className="back-button">← Back to Guide</button>
      </header>
      <div className="steps-container">
        <div className="disclaimer">
            <strong>Disclaimer:</strong> This is a basic guide only. Always call for an ambulance in a serious medical emergency.
        </div>
        <ul className="steps-list">
          {topic.steps.map((step, index) => (
            <li key={index} className="step-item">
              <div className="step-number">{index + 1}</div>
              <div className="step-instruction">{step.instruction}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FirstAidTopic;
