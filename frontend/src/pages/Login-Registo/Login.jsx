import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function Login({ irParaRegisto, irParaLanding }) {
  const [tipo, setTipo] = useState('EE'); 

  useEffect(() => {
    document.title = "Iniciar Sessão | Viva D'arte";
  }, []);

  const lidarComLogin = (e) => {
  e.preventDefault(); 

  alert("Login efetuado com sucesso!");

  irParaLanding(); 
  };
  
  return (
    <div className="login-container">
      
      {}
      <button className="voltar-landing" onClick={irParaLanding} aria-label="Voltar">
        <span className="seta-voltar">&#8592;</span>
      </button>

      <div className="left-side">
        <div className="overlay-content">
          <div className="logo-viva">VIVA D'ARTE</div>
          <h1>Arte em cada movimento.</h1>
          <p>Faça login para aceder à sua área de aluno ou professor.</p>
        </div>
      </div>

      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>Olá! 👋</h2>
            <p>Seja bem-vindo à nossa escola</p>
          </header>

          <div className="user-toggle">
            <button 
              className={tipo === 'EE' ? 'active' : ''} 
              onClick={() => setTipo('EE')}
            >
              Enc. Educação
            </button>
            <button 
              className={tipo === 'PROF' ? 'active' : ''} 
              onClick={() => setTipo('PROF')}
            >
              Professor
            </button>
          </div>

          <form onSubmit={lidarComLogin}>
            <div className="input-container">
              <label>Utilizador / Email</label>
              <input type="text" placeholder="Insira o seu email" />
            </div>

            <div className="input-container">
              <label>Palavra-passe</label>
              <input type="password" placeholder="••••••••" />
              <a href="#" className="forgot-text">Esqueceu-se da senha?</a>
            </div>

            <button type="submit" className="btn-login">Entrar</button>
          </form>

          <footer className="form-footer">
            <span>Ainda não tem conta?</span>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault(); 
                irParaRegisto();    
              }}
            >
              Criar Conta
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}