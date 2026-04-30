const token = localStorage.getItem('token');
const utilizador = JSON.parse(localStorage.getItem('utilizador') || '{}');

if (!token) window.location.href = '/';

document.getElementById('nomeUtilizador').textContent = utilizador.nome || '';

function logout() {
    localStorage.clear();
    window.location.href = '/';
}