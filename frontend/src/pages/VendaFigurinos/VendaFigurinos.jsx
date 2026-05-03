import React, { useState, useEffect } from 'react';
import './VendaFigurinos.css';
import logoImg from '../../assets/logo.png'; 

export default function VendaFigurinos({ irParaLanding }) {
  const [utilizador, setUtilizador] = useState(null);
  const [figurinos, setFigurinos] = useState([]);
  
  // Controlo de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [figurinoSelecionado, setFigurinoSelecionado] = useState(null);

  // Formulário de Nova Venda
  const [novaVenda, setNovaVenda] = useState({
    PECA_nome: '', 
    preco: '',
    condicao: 'Novo',
    metodos_pagamento: ['MBWay'], 
    fotos: [] 
  });

  // Formulário de Edição
  const [figurinoEmEdicao, setFigurinoEmEdicao] = useState(null);

  // Estado do formulário de Compra
  const [metodoPagamentoCompra, setMetodoPagamentoCompra] = useState('MBWay');

  // Estado para controlar o índice da imagem visível em cada card
  const [indicesImagens, setIndicesImagens] = useState({});

  useEffect(() => {
    const userGuardado = localStorage.getItem('viva_user');
    if (userGuardado) {
      setUtilizador(JSON.parse(userGuardado));
    }
    setFigurinos([]);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('viva_user');
    setUtilizador(null);
    if(irParaLanding) irParaLanding(); 
    window.location.reload();
  };

  /* --- NAVEGAÇÃO DE IMAGENS --- */
  const proximaImagem = (e, id_venda, totalFotos) => {
    e.stopPropagation();
    setIndicesImagens(prev => ({
      ...prev,
      [id_venda]: ((prev[id_venda] || 0) + 1) % totalFotos
    }));
  };

  const imagemAnterior = (e, id_venda, totalFotos) => {
    e.stopPropagation();
    setIndicesImagens(prev => ({
      ...prev,
      [id_venda]: ((prev[id_venda] || 0) - 1 + totalFotos) % totalFotos
    }));
  };

  /* --- UPLOAD DE FOTOS --- */
  const handleFotosUpload = (e) => {
    const files = Array.from(e.target.files);
    const novasFotosUrls = files.map(file => URL.createObjectURL(file));
    setNovaVenda(prev => ({ ...prev, fotos: [...prev.fotos, ...novasFotosUrls] }));
  };

  const removerFoto = (indexParaRemover) => {
    setNovaVenda(prev => ({ ...prev, fotos: prev.fotos.filter((_, index) => index !== indexParaRemover) }));
  };

  const handleCheckboxPagamento = (metodo) => {
    setNovaVenda(prev => {
      const jaSelecionado = prev.metodos_pagamento.includes(metodo);
      return jaSelecionado 
        ? { ...prev, metodos_pagamento: prev.metodos_pagamento.filter(m => m !== metodo) }
        : { ...prev, metodos_pagamento: [...prev.metodos_pagamento, metodo] };
    });
  };

  const handleSubmeterVenda = (e) => {
    e.preventDefault();
    if (novaVenda.metodos_pagamento.length === 0) {
      alert("Por favor, seleciona pelo menos um método de pagamento.");
      return;
    }

    const novoFigurino = {
      id_venda: Math.random(), 
      preco: parseFloat(novaVenda.preco),
      estado: 'Disponível',
      condicao: novaVenda.condicao,
      PECA_nome: novaVenda.PECA_nome,
      UTILIZADOR_nome: utilizador?.nome || 'Utilizador',
      fotos: novaVenda.fotos.length > 0 ? novaVenda.fotos : ['https://images.unsplash.com/photo-1547152382-1611bc086830?q=80&w=400'],
      metodos_pagamento: novaVenda.metodos_pagamento
    };

    setFigurinos([novoFigurino, ...figurinos]);
    setNovaVenda({ PECA_nome: '', preco: '', condicao: 'Novo', metodos_pagamento: ['MBWay'], fotos: [] });
    alert('Figurino colocado à venda com sucesso!');
    setIsModalOpen(false);
  };

  const handleApagar = (id_venda) => {
    if(window.confirm('Tens a certeza que queres apagar este figurino?')) {
      setFigurinos(figurinos.filter(fig => fig.id_venda !== id_venda));
    }
  };

  const abrirEdicao = (figurino) => {
    setFigurinoEmEdicao({ ...figurino });
    setIsEditModalOpen(true);
  };

  const handleGuardarEdicao = (e) => {
    e.preventDefault();
    setFigurinos(figurinos.map(fig => fig.id_venda === figurinoEmEdicao.id_venda ? figurinoEmEdicao : fig));
    alert('Alterações guardadas com sucesso!');
    setIsEditModalOpen(false);
  };

  const handleComprar = (figurino) => {
    setFigurinoSelecionado(figurino);
    if (figurino.metodos_pagamento && figurino.metodos_pagamento.length > 0) {
      setMetodoPagamentoCompra(figurino.metodos_pagamento[0]);
    }
    setIsCompraModalOpen(true);
  };

  const confirmarCompra = (e) => {
    e.preventDefault();
    setFigurinos(figurinos.map(fig => fig.id_venda === figurinoSelecionado.id_venda ? { ...fig, estado: 'Vendido' } : fig));
    alert(`Compra de ${figurinoSelecionado.PECA_nome} confirmada!`);
    setIsCompraModalOpen(false);
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="nav-brand">
          <img src={logoImg} alt="Logo" className="nav-logo-img" />
          <span>VIVA D'ARTE</span>
        </div>
        <ul className="nav-menu">
          <li><a href="#" onClick={(e) => { e.preventDefault(); if(irParaLanding) irParaLanding(); }}>Início</a></li>
          <li className="nav-separator">|</li>
          <li><a href="#" className="special-link">Agendar Coaching</a></li>
          <li><a href="#" className="special-link">Empréstimos de peças</a></li>
          <li><a href="#" className="special-link" style={{ color: 'var(--accent-gold)' }}>Venda de figurinos</a></li>
        </ul>
        <div className="nav-actions">
          {utilizador && (
            <div className="user-profile">
              <span className="welcome-text">Olá, <strong>{utilizador.nome}</strong></span>
              <button className="btn-logout" onClick={handleLogout}>Sair</button>
            </div>
          )}
        </div>
      </nav>

      <div className="vendas-container">
        <div className="vendas-header">
          <div>
            <h1>Mercado de Figurinos</h1>
            <p>Compra e vende figurinos usados dentro da comunidade Viva D'arte.</p>
          </div>
          {utilizador && (
            <button className="btn-dark btn-publicar" onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}>
              + Colocar à Venda
            </button>
          )}
        </div>

        <div className="figurinos-grid">
          {figurinos.map((fig) => {
            const idxImg = indicesImagens[fig.id_venda] || 0;
            const totalFotos = fig.fotos.length;

            return (
              <div className={`figurino-card ${fig.estado === 'Vendido' ? 'vendido' : ''}`} key={fig.id_venda}>
                
                <div className="figurino-img" style={{ backgroundImage: `url(${fig.fotos[idxImg]})` }}>
                  <span className={`badge-estado ${fig.estado === 'Vendido' ? 'bg-red' : 'bg-green'}`}>
                    {fig.estado}
                  </span>

                  {/* Botões de Navegação das Fotos */}
                  {totalFotos > 1 && (
                    <>
                      <button className="img-nav-btn left" onClick={(e) => imagemAnterior(e, fig.id_venda, totalFotos)}>‹</button>
                      <button className="img-nav-btn right" onClick={(e) => proximaImagem(e, fig.id_venda, totalFotos)}>›</button>
                      <div className="img-dots">
                        {fig.fotos.map((_, i) => (
                          <span key={i} className={`dot ${i === idxImg ? 'active' : ''}`}></span>
                        ))}
                      </div>
                    </>
                  )}

                  {utilizador?.nome === fig.UTILIZADOR_nome && (
                    <div className="acoes-dono">
                      <button className="btn-icon edit" title="Editar" onClick={() => abrirEdicao(fig)}>✎</button>
                      <button className="btn-icon delete" title="Apagar" onClick={() => handleApagar(fig.id_venda)}>🗑️</button>
                    </div>
                  )}
                </div>

                <div className="figurino-info">
                  <h3>{fig.PECA_nome}</h3>
                  <span className="badge-condicao">{fig.condicao}</span>
                  <p className="vendedor">Por: {fig.UTILIZADOR_nome}</p>
                  
                  <div className="metodos-pagamento-tags">
                    {fig.metodos_pagamento?.map(m => <span key={m} className="tag-pagamento">{m}</span>)}
                  </div>

                  <div className="figurino-footer">
                    <span className="preco">{Number(fig.preco).toFixed(2)} €</span>
                    {fig.estado === 'Disponível' && utilizador?.nome !== fig.UTILIZADOR_nome && (
                      <button className="btn-outline btn-sm" onClick={() => handleComprar(fig)} disabled={!utilizador}>
                        Comprar
                      </button>
                    )}
                    {utilizador?.nome === fig.UTILIZADOR_nome && (
                      <span className="texto-teu-item">O teu item</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {figurinos.length === 0 && (
             <div className="empty-state">
               <p>Não há figurinos à venda de momento.</p>
             </div>
          )}
        </div>
      </div>

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
              <li><a href="#" onClick={(e) => { e.preventDefault(); if(irParaLanding) irParaLanding(); }}>Página Inicial</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Redes Sociais</h3>
            <div className="social-icons-only">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" className="social-svg" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" className="social-svg" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-line"></div>
          <p>&copy; 2026 Viva D'arte. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* --- MODAIS IGUAIS AOS ANTERIORES --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content form-venda">
            <h2>Vender Figurino</h2>
            <form onSubmit={handleSubmeterVenda}>
              <div className="form-group">
                <label>Nome da Peça</label>
                <input type="text" value={novaVenda.PECA_nome} onChange={(e) => setNovaVenda({...novaVenda, PECA_nome: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preço (€)</label>
                  <input type="number" step="0.01" value={novaVenda.preco} onChange={(e) => setNovaVenda({...novaVenda, preco: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Condição</label>
                  <select value={novaVenda.condicao} onChange={(e) => setNovaVenda({...novaVenda, condicao: e.target.value})}>
                    <option value="Novo">Novo</option>
                    <option value="Usado - Como Novo">Usado - Como Novo</option>
                    <option value="Usado - Bom estado">Usado - Bom estado</option>
                    <option value="Usado - Marcas de uso">Usado - Marcas de uso</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Métodos de Pagamento</label>
                <div className="checkbox-group">
                  {['MBWay', 'Transferência', 'Numerário'].map(metodo => (
                    <label className="checkbox-label" key={metodo}>
                      <input type="checkbox" checked={novaVenda.metodos_pagamento.includes(metodo)} onChange={() => handleCheckboxPagamento(metodo)} />
                      {metodo}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Fotos (Máx 4)</label>
                <div className="fotos-preview-container">
                  {novaVenda.fotos.map((fotoUrl, index) => (
                    <div className="foto-preview-box" key={index}>
                      <img src={fotoUrl} alt="Preview" />
                      <button type="button" className="btn-remover-foto" onClick={() => removerFoto(index)}>X</button>
                    </div>
                  ))}
                </div>
                {novaVenda.fotos.length < 4 && (
                  <label className="btn-upload-foto">
                    <span>+ Adicionar Foto</span>
                    <input type="file" accept="image/*" multiple onChange={handleFotosUpload} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR --- */}
      {isEditModalOpen && figurinoEmEdicao && (
        <div className="modal-overlay">
          <div className="modal-content form-venda">
            <h2>Editar Figurino</h2>
            <form onSubmit={handleGuardarEdicao}>
              <div className="form-group">
                <label>Nome da Peça</label>
                <input type="text" value={figurinoEmEdicao.PECA_nome} onChange={(e) => setFigurinoEmEdicao({...figurinoEmEdicao, PECA_nome: e.target.value})} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preço (€)</label>
                  <input type="number" step="0.01" value={figurinoEmEdicao.preco} onChange={(e) => setFigurinoEmEdicao({...figurinoEmEdicao, preco: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select value={figurinoEmEdicao.estado} onChange={(e) => setFigurinoEmEdicao({...figurinoEmEdicao, estado: e.target.value})}>
                    <option value="Disponível">Disponível</option>
                    <option value="Vendido">Vendido</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark">Guardar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL COMPRA --- */}
      {isCompraModalOpen && figurinoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Compra</h2>
            <div className="resumo-compra">
              <p><strong>Item:</strong> {figurinoSelecionado.PECA_nome}</p>
              <p><strong>Total:</strong> {Number(figurinoSelecionado.preco).toFixed(2)} €</p>
            </div>
            <form onSubmit={confirmarCompra}>
              <div className="form-group">
                <label>Pagamento</label>
                <select value={metodoPagamentoCompra} onChange={(e) => setMetodoPagamentoCompra(e.target.value)}>
                  {figurinoSelecionado.metodos_pagamento?.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => setIsCompraModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}