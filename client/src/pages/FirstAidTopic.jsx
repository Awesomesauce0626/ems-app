import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firstAidTopics } from '../data/firstAidGuide';
import './FirstAid.css';

const FirstAidTopic = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = firstAidTopics.find(t => t.id === topicId);

  if (!topic) {
    return (
      <div className="first-aid-container">
        <header className="first-aid-header">
            <button onClick={() => navigate(-1)} className="back-button">← Back</button>
            <h1>Topic Not Found</h1>
        </header>
        <p className="not-found-message">The requested first-aid topic could not be found.</p>
      </div>
    );
  }

  return (
    <div className="first-aid-container">
      <header className="first-aid-header">
        <button onClick={() => navigate('/first-aid')} className="back-button">← Back to Guide</button>
        <h1>{topic.icon} {topic.title}</h1>
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
