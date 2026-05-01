import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function Login({ irParaRegisto, irParaLanding }) {
  // Estado para o tipo de utilizador (EE por defeito, como no Registo)
  const [tipo, setTipo] = useState('EE'); 
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
        // Enviamos o tipo escolhido para o backend validar
        body: JSON.stringify({ email, password, tipo })
      });

      const resultado = await response.json();

      if (response.ok) {
        alert(`Bem-vindo de volta!`);
        localStorage.setItem('viva_user', JSON.stringify(resultado.user));
        irParaLanding(); 
      } else {
        // Mensagem genérica de erro conforme combinado
        alert(resultado.error || "Dados de acesso incorretos.");
      }
    } catch (error) {
      alert("Não foi possível ligar ao servidor.");
    }
  };

  return (
    <div className="login-container">
      {/* Lado Esquerdo - Branding */}
      <div className="left-side">
        <div className="overlay-content">
          <div className="logo-viva">VIVA D'ARTE</div>
          <h1>Bem-vindo de volta.</h1>
          <p>Entra na tua conta para acompanhar a tua evolução na dança.</p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>Iniciar Sessão ✨</h2>
            <p>Escolha o seu perfil de acesso</p>
          </header>

          {/* Toggle de Perfil (Igual ao do Registo) */}
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
                placeholder="o-teu@email.com" 
                required 
              />
            </div>

            <div className="input-container">
              <label>Palavra-passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="A tua senha" 
                required 
              />
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