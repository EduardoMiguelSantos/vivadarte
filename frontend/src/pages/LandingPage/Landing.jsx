import React, { useEffect } from 'react';
import './Landing.css';
import logoVivaDarte from "../../assets/logo.png";

export default function Landing({ irParaLogin, irParaRegisto }) {
  
  useEffect(() => {
    document.title = "Viva D'arte | Escola de Dança";
  }, []);

  return (
    <div className="landing-main-container">
      
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">
          {}
          <img src={logoVivaDarte} alt="Logo Viva D'arte" className="nav-logo-img" />
          <div className="nav-logo-text">
            <span className="title">VIVA D'ARTE</span>
            <span className="subtitle">Escola de Dança</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#" className="active">Início</a>
          <a href="#">📅 Agendar Aulas</a>
          <a href="#">👕 Figurinos</a>
          <a href="#">🔄 Empréstimos</a>
        </div>

        <button className="btn-nav-entrar" onClick={irParaLogin}>
          Entrar &#8594;
        </button>
      </nav>

      {/* HERO SECTION */}
      <main className="hero-section">
        <div className="hero-badge">
          ✨ Desperte a arte que existe em si
        </div>
        
        <h1 className="hero-main-title">Bem-vindo à Viva D'arte</h1>
        <p className="hero-main-subtitle">Escola de dança</p>

        {/* CARTÃO DE ESTATÍSTICAS */}
        <div className="stats-glass-card">
          <div className="card-icon-circle">⭐</div>
          
          <h2>Descubra o Mundo da Dança</h2>
          <p className="card-sub-text">A arte em cada movimento.</p>

          <div className="card-divider"></div>

          <div className="stats-grid">
            <div className="stat-box">
              <h3>200+</h3>
              <p>Alunos</p>
            </div>
            <div className="stat-box">
              <h3>10</h3>
              <p>Anos</p>
            </div>
            <div className="stat-box">
              <h3>10+</h3>
              <p>Prémios</p>
            </div>
          </div>
          
          <button className="btn-card-registo" onClick={irParaRegisto}>
            Começar Agora
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer-dark">
        <div className="footer-container">
          <div className="footer-column">
            <h4>Contacto</h4>
            <p>📍 Morada da Escola, Portugal</p>
            <p>📞 +351 000 000 000</p>
          </div>
          <div className="footer-column">
            <h4>Links Rápidos</h4>
            <a href="#">Sobre Nós</a>
            <a href="#">Professores</a>
          </div>
          <div className="footer-column">
            <h4>Redes Sociais</h4>
            <div className="footer-socials">📸 📘 ▶️</div>
          </div>
        </div>
      </footer>
    </div>
  );
}