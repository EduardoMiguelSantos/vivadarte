import React, { useState, useEffect } from 'react';
import './LoginRegisto.css'; 

export default function RecoverPassword({ irParaLogin, irParaLanding }) {
  const [etapa, setEtapa] = useState(1); 
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaPassword, setNovaPassword] = useState('');

  useEffect(() => {
    document.title = "Recuperar Password | Viva D'arte";
  }, []);

  // Função para formatar o telefone como 999 999 999
  const formatarTelefone = (valor) => {
    // Remove tudo o que não é dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara 999 999 999
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1 $2')
      .replace(/(\d{3})(\d)/, '$1 $2')
      .substring(0, 11); // Limita o tamanho visual
  };

  const handleTelefoneChange = (e) => {
    const valorFormatado = formatarTelefone(e.target.value);
    setTelefone(valorFormatado);
  };

  // ETAPA 1: Validar Telefone na BD
  const lidarComTelefone = async (e) => {
    e.preventDefault();
    
    // Limpa os espaços antes de enviar para a BD
    const telefoneLimpo = telefone.replace(/\s/g, '');

    try {
      const response = await fetch(`http://localhost:3000/api/auth/verificar-telefone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneLimpo })
      });

      if (response.ok) {
        setEtapa(2);
      } else {
        const resultado = await response.json();
        alert(resultado.error || "Número incorreto");
      }
    } catch (error) {
      alert("Erro ao ligar ao servidor.");
    }
  };

  // ETAPA 2: Apenas visual
  const lidarComCodigo = (e) => {
    e.preventDefault();
    setEtapa(3);
  };

  // ETAPA 3: Alteração Final
  const confirmarAlteracao = async (e) => {
    e.preventDefault();

    const regexEspecial = /[!@#$%^&*(),.?":{}|<>]/;
    if (novaPassword.length < 8 || !regexEspecial.test(novaPassword)) {
        alert("A password deve ter pelo menos 8 caracteres e um símbolo especial.");
        return;
    }

    try {
        const telefoneLimpo = telefone.replace(/\s/g, '');

        const response = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                telefone: telefoneLimpo, 
                novaPassword: novaPassword 
            })
        });

        if (response.ok) {
            alert("Password alterada com Sucesso!");
            irParaLogin();
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

          {etapa === 1 && (
            <form onSubmit={lidarComTelefone}>
              <div className="input-container">
                <label>Nº de Telefone</label>
                <div className="input-tel-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="tel-prefix" style={{ marginRight: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <img src="https://flagcdn.com/w20/pt.png" alt="PT" className="tel-flag" /> 
                    +351
                  </span>
                  <input 
                    type="tel" 
                    value={telefone} 
                    onChange={handleTelefoneChange} 
                    placeholder="912 345 678"
                    required 
                  />
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