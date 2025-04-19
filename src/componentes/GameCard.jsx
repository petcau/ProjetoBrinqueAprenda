// src/components/Card.jsx
import React from 'react';

const GameCard = ({ image, altText }) => {
    return (
        <button className="card">
            <img src={image} alt={altText} className="card-image" />
        </button>
    );
};

export default GameCard;