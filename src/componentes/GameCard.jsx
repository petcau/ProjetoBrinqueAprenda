// src/components/Card.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ image, altText, route, imageClassName = '' }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`${route}`);
    };
    return (
        <button onClick={handleClick} className="card">
            <img src={image} alt={altText} className={`card-image ${imageClassName}`.trim()} />
        </button>
    );
};

export default GameCard;
