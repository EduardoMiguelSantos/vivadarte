import React, { useEffect } from 'react';
import './Landing.css';

export default function Landing({ irParaLogin, irParaRegisto }) {
  
  useEffect(() => {
    document.title = "Viva D'arte | Escola de Dança";
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">VIVA D'ARTE</h1>
        <p className="landing-subtitle">A arte em cada movimento.</p>
        
        <div className="landing-buttons">
          <button className="btn-primary" onClick={irParaLogin}>
            Iniciar Sessão
          </button>
          <button className="btn-secondary" onClick={irParaRegisto}>
            Criar Conta
          </button>
        </div>
      </div>
    </div>
  );
}