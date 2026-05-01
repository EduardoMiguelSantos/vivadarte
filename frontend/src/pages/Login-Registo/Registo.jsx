import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function Registo({ irParaLogin, irParaLanding }) {
  const [tipo, setTipo] = useState('EE'); 

  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    document.title = "Criar Conta | Viva D'arte";
  }, []);
  
  const lidarComRegisto = async (e) => {
    e.preventDefault(); 
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, password, tipo })
      });

      const resultado = await response.json();

      if (response.ok) {
        alert("Conta criada com sucesso! ✨");
        irParaLogin(); 
      } else {
        alert(resultado.error || "Não foi possível criar a conta.");
      }
    } catch (error) {
      alert("Erro ao ligar ao servidor!");
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
          <h1>Junta-te à nossa comunidade.</h1>
          <p>Dá o primeiro passo e cria a tua conta para gerir todo o teu percurso.</p>
        </div>
      </div>

      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>Criar Conta ✨</h2>
            <p>Preenche os teus dados abaixo</p>
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
              <input 
                type="email" 
                placeholder="exemplo@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-container">
              <label>Nº de Telefone</label>
              <div className="input-tel-wrapper">
                <span className="tel-prefix">
                  <img src="https://flagcdn.com/w20/pt.png" alt="PT" className="tel-flag" />
                  +351
                </span>
                <input 
                  type="tel" 
                  className="input-with-prefix"
                  placeholder="912 345 678" 
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  pattern="[0-9]{9}" 
                  required 
                />
              </div>
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

            <button type="submit" className="btn-login">Finalizar Registo</button>
          </form>

          <footer className="form-footer">
            <span>Já tens conta?</span>
            <a href="#" onClick={(e) => { e.preventDefault(); irParaLogin(); }}>
              Iniciar Sessão
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}