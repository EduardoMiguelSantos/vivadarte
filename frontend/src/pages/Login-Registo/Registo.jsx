import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function Registo({ irParaLogin, irParaLanding }) {
  const [tipo, setTipo] = useState('EE'); 

  useEffect(() => {
    document.title = "Criar Conta | Viva D'arte";
  }, []);
  
  const lidarComRegisto = (e) => {
    e.preventDefault(); 
    
    // Confirmação simples
    alert("Conta criada com sucesso!");
    
    // Redireciona logo para o Login
    irParaLogin();
  };

  return (
    <div className="login-container">
      
      <button className="voltar-landing" onClick={irParaLanding} aria-label="Voltar">
        <span className="seta-voltar">&#8592;</span>
      </button>

      <div className="left-side">
        <div className="overlay-content">
          <div className="logo-viva">VIVA D'ARTE</div>
          <h1>Junta-te à nossa família.</h1>
          <p>Dá o primeiro passo e cria a tua conta para gerir todo o teu percurso na dança.</p>
        </div>
      </div>

      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>Criar Conta ✨</h2>
            <p>Preenche os dados para começares</p>
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

          <form onSubmit={lidarComRegisto}>
            <div className="input-container">
              <label>Nome Completo</label>
              <input type="text" placeholder="Insira o seu nome" required />
            </div>

            <div className="input-container">
              <label>Email</label>
              <input type="email" placeholder="exemplo@email.com" required />
            </div>

            <div className="input-container">
               <label>Nº de Telefone</label>
               <div className="input-tel-wrapper">
              <span className="tel-prefix">
              <img 
                src="https://flagcdn.com/w20/pt.png" 
                alt="PT" 
                className="tel-flag" 
              />
               +351
              </span>
                <input 
                  type="tel" 
                  className="input-with-prefix"
                  placeholder="912 345 678" 
                  pattern="[0-9]{9}" 
                  required 
                />
              </div>
            </div>

            <div className="input-container">
              <label>Palavra-passe</label>
              <input type="password" placeholder="Crie uma senha forte" required />
            </div>

            <button type="submit" className="btn-login">Registar</button>
          </form>

          <footer className="form-footer">
            <span>Já tens uma conta?</span>
            <a href="#" onClick={(e) => { e.preventDefault(); irParaLogin(); }}>
              Iniciar Sessão
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}