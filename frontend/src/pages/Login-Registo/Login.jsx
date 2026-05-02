import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function Login({ irParaRegisto, irParaLanding, irParaRecuperar }) {
  const [tipo, setTipo] = useState('EE'); // 'EE' ou 'PROF'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.title = "Iniciar Sessão | Viva D'arte";
  }, []);

  const lidarComLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tipo })
      });

      const resultado = await response.json();

      if (response.ok) {
        localStorage.setItem('viva_user', JSON.stringify(resultado.user));
        alert(`Bem-vindo de volta !`);
        irParaLanding(); 
      } else {
        alert(resultado.error || "Dados de acesso incorretos.");
      }
    } catch (error) {
      alert("Erro ao ligar ao servidor.");
    }
  };

  return (
    <div className="login-container">
      <button className="voltar-landing" onClick={irParaLanding} aria-label="Voltar">
        <span className="seta-voltar">&#8592;</span>
      </button>

      <div className="left-side">
        <div className="overlay-content">
          <div className="logo-viva">VIVA D'ARTE</div>
          <h1>Bem-vindo de volta.</h1>
          <p>Entra na tua conta para acompanhar o percurso na dança.</p>
        </div>
      </div>

      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>Iniciar Sessão ✨</h2>
            <p>Selecione o seu perfil</p>
          </header>

          <div className="user-toggle">
            <button 
              type="button"
              className={tipo === 'EE' ? 'active' : ''} 
              onClick={() => setTipo('EE')}
            >
              Enc. Educação
            </button>
            <button 
              type="button"
              className={tipo === 'PROF' ? 'active' : ''} 
              onClick={() => setTipo('PROF')}
            >
              Professor
            </button>
          </div>

          <form onSubmit={lidarComLogin}>
            <div className="input-container">
              <label>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com" 
                required 
              />
            </div>

            <div className="input-container">
              <label>Palavra-passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="A sua senha" 
                required 
              />
              {/* Link de Recuperação adicionado aqui */}
              <div className="forgot-password-link">
                <a href="#" onClick={(e) => { e.preventDefault(); irParaRecuperar(); }}>
                  Esqueceu-se da palavra-passe?
                </a>
              </div>
            </div>

            <button type="submit" className="btn-login">Entrar</button>
          </form>

          <footer className="form-footer">
            <span>Ainda não tens conta?</span>
            <a href="#" onClick={(e) => { e.preventDefault(); irParaRegisto(); }}>
              Criar Conta
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}