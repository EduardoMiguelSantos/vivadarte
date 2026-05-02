import React, { useState, useEffect } from 'react';
import './VendaFigurinos.css';
import logoImg from '../../assets/logo.png'; // Importar o logo!

export default function VendaFigurinos({ irParaLanding }) {
  const [utilizador, setUtilizador] = useState(null);
  const [figurinos, setFigurinos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [figurinoSelecionado, setFigurinoSelecionado] = useState(null);

  const [novaVenda, setNovaVenda] = useState({
    PECAid_peca: '', 
    preco: '',
  });
  const [metodoPagamento, setMetodoPagamento] = useState('MBWay');

  useEffect(() => {
    const userGuardado = localStorage.getItem('viva_user');
    if (userGuardado) {
      setUtilizador(JSON.parse(userGuardado));
    }
    
    // Simulação dos dados (depois ligas à tua API real)
    setFigurinos([
      { id_venda: 1, preco: 45.00, estado: 'Disponível', PECA_nome: 'Tutu Lago dos Cisnes', UTILIZADOR_nome: 'Ana Silva', foto: 'https://images.unsplash.com/photo-1516477287602-466d713c75eb?q=80&w=400' },
      { id_venda: 2, preco: 20.00, estado: 'Disponível', PECA_nome: 'Sapatilhas Meia Ponta', UTILIZADOR_nome: 'Carlos Mendes', foto: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=400' },
      { id_venda: 3, preco: 60.00, estado: 'Vendido', PECA_nome: 'Fato Hip Hop Urban', UTILIZADOR_nome: 'Maria João', foto: 'https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?q=80&w=400' },
    ]);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('viva_user');
    setUtilizador(null);
    irParaLanding(); // Volta à página inicial ao sair
    window.location.reload();
  };

  const handleAbrirVenda = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleSubmeterVenda = (e) => {
    e.preventDefault();
    alert('Figurino colocado à venda com sucesso!');
    setIsModalOpen(false);
  };

  const handleComprar = (figurino) => {
    setFigurinoSelecionado(figurino);
    setIsCompraModalOpen(true);
  };

  const confirmarCompra = (e) => {
    e.preventDefault();
    alert(`Compra de ${figurinoSelecionado.PECA_nome} confirmada via ${metodoPagamento}!`);
    setIsCompraModalOpen(false);
  };

  return (
    <div className="page-wrapper">
      {/* --- NAVBAR DO PORTAL --- */}
      <nav className="navbar">
        <div className="nav-brand">
          <img src={logoImg} alt="Logo" className="nav-logo-img" />
          <span>VIVA D'ARTE</span>
        </div>
        
        <ul className="nav-menu">
          <li>
            {/* Volta à página inicial */}
            <a href="#" onClick={(e) => { e.preventDefault(); irParaLanding(); }}>Início</a>
          </li>

          <li className="nav-separator">|</li>
          {utilizador?.perfil === 'Professor' ? (
            <>
              <li><a href="#" className="special-link">Coaching Agendados</a></li>
              <li><a href="#" className="special-link">Empréstimos de peças</a></li>
              <li><a href="#" className="special-link" style={{ color: 'var(--accent-gold)' }}>Venda de figurinos</a></li>
            </>
          ) : (
            <>
              <li><a href="#" className="special-link">Agendar Coaching</a></li>
              <li><a href="#" className="special-link">Empréstimos de peças</a></li>
              <li><a href="#" className="special-link" style={{ color: 'var(--accent-gold)' }}>Venda de figurinos</a></li>
            </>
          )}
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

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <div className="vendas-container">
        <div className="vendas-header">
          <div>
            <h1>Mercado de Figurinos</h1>
            <p>Compra e vende figurinos usados dentro da comunidade Viva D'arte.</p>
          </div>
          {utilizador && (
            <button className="btn-dark" onClick={handleAbrirVenda}>
              + Colocar à Venda
            </button>
          )}
        </div>

        <div className="figurinos-grid">
          {figurinos.map((fig) => (
            <div className={`figurino-card ${fig.estado === 'Vendido' ? 'vendido' : ''}`} key={fig.id_venda}>
              <div className="figurino-img" style={{ backgroundImage: `url(${fig.foto})` }}>
                <span className={`badge-estado ${fig.estado === 'Vendido' ? 'bg-red' : 'bg-green'}`}>
                  {fig.estado}
                </span>
              </div>
              <div className="figurino-info">
                <h3>{fig.PECA_nome}</h3>
                <p className="vendedor">Vendedor: {fig.UTILIZADOR_nome}</p>
                <div className="figurino-footer">
                  <span className="preco">{fig.preco.toFixed(2)} €</span>
                  {fig.estado === 'Disponível' && (
                    <button 
                      className="btn-outline" 
                      onClick={() => handleComprar(fig)}
                      disabled={!utilizador}
                      title={!utilizador ? "Inicia sessão para comprar" : ""}
                    >
                      Comprar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- FOOTER COMPACTO --- */}
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
              <li><a href="#" onClick={(e) => { e.preventDefault(); irParaLanding(); }}>Página Inicial</a></li>
              <li><a href="#">Coaching</a></li>
              <li><a href="#">Empréstimos</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Redes Sociais</h3>
            <div className="social-icons-only">
              {/* INSTAGRAM */}
              <a 
                href="https://www.instagram.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" className="social-svg" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              
              {/* FACEBOOK */}
              <a 
                href="https://www.facebook.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" className="social-svg" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-line"></div>
          <p>&copy; 2026 Viva D'arte. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* --- MODAIS MANTIDOS ABAIXO --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Vender Figurino</h2>
            <form onSubmit={handleSubmeterVenda}>
              <div className="form-group">
                <label>ID da Peça (O teu inventário)</label>
                <input type="text" value={novaVenda.PECAid_peca} onChange={(e) => setNovaVenda({...novaVenda, PECAid_peca: e.target.value})} required placeholder="Ex: 15" />
              </div>
              <div className="form-group">
                <label>Preço (€)</label>
                <input type="number" step="0.01" value={novaVenda.preco} onChange={(e) => setNovaVenda({...novaVenda, preco: e.target.value})} required placeholder="Ex: 25.00" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark">Publicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCompraModalOpen && figurinoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Compra</h2>
            <div className="resumo-compra">
              <p><strong>Item:</strong> {figurinoSelecionado.PECA_nome}</p>
              <p><strong>Total:</strong> {figurinoSelecionado.preco.toFixed(2)} €</p>
            </div>
            <form onSubmit={confirmarCompra}>
              <div className="form-group">
                <label>Método de Pagamento</label>
                <select value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)}>
                  <option value="MBWay">MBWay</option>
                  <option value="Transferencia">Transferência Bancária</option>
                  <option value="Numerario">Numerário (Na secretaria)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => setIsCompraModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-dark">Confirmar Compra</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}