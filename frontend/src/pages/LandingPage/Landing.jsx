import React, { useState, useEffect } from 'react';
import './Landing.css';
import logoImg from '../../assets/logo.png';
import instagramIcon from '../../assets/instagram.png';
import facebookIcon from '../../assets/facebook.png';

export default function Landing({ irParaLogin, irParaRegisto }) {
  const [utilizador, setUtilizador] = useState(null);

  useEffect(() => {
    const userGuardado = localStorage.getItem('viva_user');
    if (userGuardado) setUtilizador(JSON.parse(userGuardado));
    document.title = "Viva D'arte | Escola de Dança";
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('viva_user');
    setUtilizador(null);
    window.location.reload();
  };

  return (
    <div className="landing-container">
      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="nav-brand">
          <img src={logoImg} alt="Logo" className="nav-logo-img" />
          <span>VIVA D'ARTE</span>
        </div>
        
        {/* ORDEM CORRIGIDA AQUI */}
        <ul className="nav-menu">
        <li><a href="#inicio" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); document.documentElement.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Início</a></li>
        <li><a href="#sobre">Sobre Nós</a></li>
        <li><a href="#modalidades">Modalidades</a></li>
        <li><a href="#professores">Professores</a></li>
        
        {/* Links Privados (Só aparecem após Iniciar Sessão) */}
        {utilizador && (
          <>
            <li className="nav-separator">|</li>
            <li><a href="#agendar" className="special-link">Agendar</a></li>
            <li><a href="#figurinos" className="special-link">Figurinos</a></li>
            <li><a href="#emprestimos" className="special-link">Empréstimos</a></li> {/* <--- NOVA LINHA AQUI */}
          </>
        )}
      </ul>

        <div className="nav-actions">
          {utilizador ? (
            <div className="user-profile">
              <span className="welcome-text">Olá, <strong>{utilizador.nome}</strong></span>
              <button className="btn-logout" onClick={handleLogout}>Sair</button>
            </div>
          ) : (
            <>
              <button className="btn-text" onClick={irParaLogin}>Iniciar Sessão</button>
              <button className="btn-dark" onClick={irParaRegisto}>Criar Conta</button>
            </>
          )}
        </div>
      </nav>

      {/* 1. INÍCIO (HERO) */}
      <header id="inicio" className="hero">
        <div className="hero-content">
          <h1>A Arte de Dançar <br/> <span className="text-highlight">Começa Aqui.</span></h1>
          <p>Explora o teu talento na escola de dança mais vibrante. Acompanha o teu percurso de forma simples.</p>
          {!utilizador && <button className="btn-hero" onClick={irParaRegisto}>Começar Agora ✨</button>}
        </div>
      </header>

      {/* 2. SOBRE NÓS */}
      <section id="sobre" className="section-container">
        <div className="sobre-layout">
          <h2>A Nossa Escola</h2>
          <div className="sobre-texto">
            <p>
              A <strong>Viva D'arte</strong> nasceu do sonho de criar um espaço onde a dança é celebrada em todas as suas formas. 
              Mais do que uma escola, somos uma comunidade dedicada ao crescimento artístico e pessoal. 
              Com instalações modernas e um ambiente acolhedor, preparamos os nossos alunos para brilharem no palco e na vida.
            </p>
          </div>
        </div>
      </section>

      {/* 3. MODALIDADES (Estilo Retangular) */}
      <section id="modalidades" className="section-container bg-light">
        <div className="section-header">
          <h2>Modalidades</h2>
          <p>Descobre o estilo que faz o teu coração vibrar.</p>
        </div>
        <div className="list-vertical">
          <div className="horizontal-card">
            <div className="card-left">
              <div className="mod-icon">🩰</div>
            </div>
            <div className="card-right">
              <h3>Ballet Clássico</h3>
              <span className="subtitle">Técnica e Elegância</span>
              <p>A base de todas as danças, focada na postura, flexibilidade e disciplina artística para alunos de todas as idades.</p>
            </div>
          </div>
          <div className="horizontal-card">
            <div className="card-left">
              <div className="mod-icon">👟</div>
            </div>
            <div className="card-right">
              <h3>Hip Hop</h3>
              <span className="subtitle">Ritmo e Atitude</span>
              <p>Explora a cultura urbana através de coreografias dinâmicas, focadas em groove, coordenação e muita energia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROFESSORES (Estilo Retangular) */}
      <section id="professores" className="section-container">
        <div className="section-header">
          <h2>Os Nossos Professores</h2>
        </div>
        <div className="list-vertical">
          <div className="horizontal-card">
            <div className="card-left">
               <div className="prof-avatar" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1547152382-1611bc086830?q=80&w=200')" }}></div>
            </div>
            <div className="card-right">
              <h3>Ana Silva</h3>
              <span className="subtitle">Ballet Clássico</span>
              <p>Formada pelo Conservatório Real, a Ana traz 10 anos de experiência internacional para as nossas salas, focando-se na precisão técnica e no bem-estar dos alunos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER (Estrutura restaurada, apenas imagens nas redes) --- */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-column">
            <h3>Contacto</h3>
            <ul className="footer-info">
              <li><span>📍</span> Rua das Artes, nº 123, Lisboa</li>
              <li><span>📞</span> +351 912 345 678</li>
              <li><span>✉️</span> geral@vivadarte.pt</li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Links Rápidos</h3>
            <ul className="footer-links">
              <li><a href="#sobre">Sobre Nós</a></li>
              <li><a href="#professores">Os Nossos Professores</a></li>
              <li><a href="#modalidades">Modalidades</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Redes Sociais</h3>
            {/* Apenas as imagens, sem texto */}
            <div className="social-icons-only">
              <a href="#"><img src={instagramIcon} alt="Instagram" /></a>
              <a href="#"><img src={facebookIcon} alt="Facebook" /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-line"></div>
          <p>&copy; 2026 Viva D'arte. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}