import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 
import { authRegister } from '../services/api';

export default function Registo({ irParaLogin, irParaLanding }) {
  const [tipo, setTipo] = useState('EE'); 
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [aCarregar, setACarregar] = useState(false);

  useEffect(() => {
    document.title = "Criar Conta | Viva D'arte";
  }, []);
  
<<<<<<< HEAD:frontend/src/pages/Registo.jsx
  const lidarComRegisto = async (e) => {
    e.preventDefault();
    setErro('');
    setACarregar(true);

    try {
      const data = await authRegister({ nome, email, password, tipo });

      localStorage.setItem('token', data.token);
      localStorage.setItem('utilizador', JSON.stringify(data.utilizador));
      localStorage.setItem('tipoRegisto', tipo);

      alert("Conta criada com sucesso! Bem-vindo(a) à Viva D'arte.");
      irParaLanding();
    } catch (err) {
      setErro(err?.message || 'Não foi possível criar conta');
    } finally {
      setACarregar(false);
    }
=======
  const lidarComRegisto = (e) => {
    e.preventDefault(); 
    
    // Confirmação simples
    alert("Conta criada com sucesso!");
    
    // Redireciona logo para o Login
    irParaLogin();
>>>>>>> main:frontend/src/pages/Login-Registo/Registo.jsx
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
              <input
                type="text"
                placeholder="Insira o seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="input-container">
              <label>Email</label>
<<<<<<< HEAD:frontend/src/pages/Registo.jsx
              <input
                type="email"
                placeholder="Insira o seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
=======
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
>>>>>>> main:frontend/src/pages/Login-Registo/Registo.jsx
            </div>

            <div className="input-container">
              <label>Palavra-passe</label>
              <input
                type="password"
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {erro && (
              <div style={{ color: '#ff5d5d', marginTop: 10, fontSize: 14 }}>
                {erro}
              </div>
            )}

            <button type="submit" className="btn-login" disabled={aCarregar}>
              {aCarregar ? 'A registar...' : 'Registar'}
            </button>
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