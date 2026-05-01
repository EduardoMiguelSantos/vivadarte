import React, { useState } from 'react';
import Landing from './pages/LandingPage/Landing';
import Login from './pages/Login-Registo/Login';
import Registo from './pages/Login-Registo/Registo';

function App() {
  const [paginaAtual, setPaginaAtual] = useState('landing');

  return (
    <div className="App">
      
      {}
      {paginaAtual === 'landing' && (
        <Landing 
          irParaLogin={() => setPaginaAtual('login')} 
          irParaRegisto={() => setPaginaAtual('registo')} 
        />
      )}
      
      {paginaAtual === 'login' && (
        <Login 
          irParaRegisto={() => setPaginaAtual('registo')} 
          irParaLanding={() => setPaginaAtual('landing')} 
        />
      )}
      
      {paginaAtual === 'registo' && (
        <Registo 
          irParaLogin={() => setPaginaAtual('login')} 
          irParaLanding={() => setPaginaAtual('landing')} 
        />
      )}

    </div>
  );
}

export default App;