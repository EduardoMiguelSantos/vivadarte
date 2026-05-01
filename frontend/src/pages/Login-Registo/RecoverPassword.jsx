import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function RecoverPassword({ irParaLogin, irParaLanding }) {
  const [etapa, setEtapa] = useState(1); // 1: Pedir Telefone, 2: Inserir Código e Nova Pass
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaPassword, setNovaPassword] = useState('');

  useEffect(() => {
    document.title = "Recuperar Password | Viva D'arte";
  }, []);

  const enviarCodigo = (e) => {
    e.preventDefault();
    // Simulação de envio
    console.log("A enviar código para:", telefone);
    setEtapa(2);
  };

  const confirmarAlteracao = (e) => {
    e.preventDefault();
    alert("Palavra-passe alterada com sucesso!");
    irParaLogin();
  };

  return (
    <div className="login-container">
      {/* Botão de Voltar para a Landing Page */}
      <button className="voltar-landing" onClick={irParaLanding} aria-label="Voltar">
        <span className="seta-voltar">&#8592;</span>
      </button>

      <div className="left-side">
        <div className="overlay-content">
          <div className="logo-viva">VIVA D'ARTE</div>
          <h1>Recuperar Acesso.</h1>
          <p>Não te preocupes, acontece aos melhores. Vamos ajudar-te a voltar à pista de dança.</p>
        </div>
      </div>

      <div className="right-side">
        <div className="form-box">
          <header className="form-header">
            <h2>{etapa === 1 ? "Recuperar Password 🔑" : "Nova Password ✨"}</h2>
            <p>{etapa === 1 ? "Insira o seu telefone para receber o código" : "Insira o código recebido e a nova senha"}</p>
          </header>

          {etapa === 1 ? (
            <form onSubmit={enviarCodigo}>
              <div className="input-container">
                <label>Nº de Telefone</label>
                <div className="input-tel-wrapper">
                  <span className="tel-prefix">
                    {/* Bandeira de Portugal adicionada aqui */}
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
              <button type="submit" className="btn-login">Enviar Código</button>
            </form>
          ) : (
            <form onSubmit={confirmarAlteracao}>
              <div className="input-container">
                <label>Código de Verificação</label>
                <input 
                  type="text" 
                  placeholder="000000"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  required 
                />
              </div>
              <div className="input-container">
                <label>Nova Palavra-passe</label>
                <input 
                  type="password" 
                  placeholder="Mínimo 8 caracteres + 1 símbolo especial"
                  value={novaPassword}
                  onChange={(e) => setNovaPassword(e.target.value)}
                  required 
                />
              </div>
              <button type="submit" className="btn-login">Alterar Palavra-passe</button>
            </form>
          )}

          <footer className="form-footer">
            <a href="#" onClick={(e) => { e.preventDefault(); irParaLogin(); }}>
              Voltar ao Login
            </a>
          </footer>
        </div>
      </div>
    </div>
  );
}