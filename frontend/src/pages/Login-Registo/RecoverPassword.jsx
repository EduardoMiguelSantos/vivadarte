import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function RecoverPassword({ irParaLogin, irParaLanding }) {
  // Etapa 1: Telefone | Etapa 2: Código Visual | Etapa 3: Nova Password
  const [etapa, setEtapa] = useState(1); 
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaPassword, setNovaPassword] = useState('');

  useEffect(() => {
    document.title = "Recuperar Password | Viva D'arte";
  }, []);

  // ETAPA 1: Validar Telefone na BD
  const lidarComTelefone = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/auth/verificar-telefone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone })
      });

      if (response.ok) {
        setEtapa(2); // Avança para a aba do código
      } else {
        const resultado = await response.json();
        alert(resultado.error || "n incorreto");
      }
    } catch (error) {
      alert("Erro ao ligar ao servidor.");
    }
  };

  // ETAPA 2: Apenas visual (avança com qualquer código)
  const lidarComCodigo = (e) => {
    e.preventDefault();
    setEtapa(3); // Avança para a nova password
  };

  // ETAPA 3: Alteração Final
  const confirmarAlteracao = async (e) => {
    e.preventDefault();

    // Validação de segurança
    const regexEspecial = /[!@#$%^&*(),.?":{}|<>]/;
    if (novaPassword.length < 8 || !regexEspecial.test(novaPassword)) {
        alert("A password deve ter pelo menos 8 caracteres e um símbolo especial.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                telefone: telefone, // O número que o utilizador digitou na Etapa 1
                novaPassword: novaPassword 
            })
        });

        if (response.ok) {
            alert("Password alterada com Sucesso!");
            irParaLogin(); // Volta para o ecrã de login
        } else {
            const erro = await response.json();
            alert(erro.error || "Erro ao atualizar a base de dados.");
        }
    } catch (error) {
        alert("Erro de rede ao tentar ligar ao servidor.");
    }
  };

  return (
    <div className="login-container">
      <button className="voltar-landing" onClick={irParaLanding}>
        <span className="seta-voltar">&#8592;</span>
      </button>

      <div className="left-side">
        <div className="overlay-content">
          <div className="logo-viva">VIVA D'ARTE</div>
          <h1>Recuperar Acesso.</h1>
          <p>Validamos o teu contacto e voltas logo à dança.</p>
        </div>
      </div>

      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>
              {etapa === 1 && "Recuperar Password 🔑"}
              {etapa === 2 && "Verificação SMS 📱"}
              {etapa === 3 && "Nova Password ✨"}
            </h2>
          </header>

          {/* FORMULÁRIO DINÂMICO */}
          {etapa === 1 && (
            <form onSubmit={lidarComTelefone}>
              <div className="input-container">
                <label>Nº de Telefone</label>
                <div className="input-tel-wrapper">
                  <span className="tel-prefix">
                    <img src="https://flagcdn.com/w20/pt.png" alt="PT" className="tel-flag" /> +351
                  </span>
                  <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} pattern="[0-9]{9}" required />
                </div>
              </div>
              <button type="submit" className="btn-login">Verificar Número</button>
            </form>
          )}

          {etapa === 2 && (
            <form onSubmit={lidarComCodigo}>
              <div className="input-container">
                <label>Código enviado para +351 {telefone}</label>
                <input type="text" placeholder="Ex: 123456" value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
              </div>
              <button type="submit" className="btn-login">Validar Código</button>
            </form>
          )}

          {etapa === 3 && (
            <form onSubmit={confirmarAlteracao}>
              <div className="input-container">
                <label>Nova Palavra-passe</label>
                <input type="password" placeholder="Mínimo 8 caracteres + símbolo" value={novaPassword} onChange={(e) => setNovaPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-login">Alterar Password</button>
            </form>
          )}

          <footer className="form-footer">
            <a href="#" onClick={(e) => { e.preventDefault(); irParaLogin(); }}>Voltar ao Login</a>
          </footer>
        </div>
      </div>
    </div>
  );
}