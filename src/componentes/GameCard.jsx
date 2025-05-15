// src/components/Card.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const GameCard = ({ image, altText, route }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(`${route}`);
    };
    return (
        <button onClick={handleClick} className="card">
            <img src="C:\Users\uneb\Desktop\Nova pasta\ProjetoBrinqueAprenda\src\assets\card-jornada-bicho.png" alt={altText}  className="card-image" />
        </button>
    );
};

export default GameCard;