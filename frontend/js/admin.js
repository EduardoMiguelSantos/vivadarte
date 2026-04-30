const token = localStorage.getItem('token');
const utilizador = JSON.parse(localStorage.getItem('utilizador') || '{}');

// Verifica se está autenticado
if (!token) window.location.href = '/';

// Mostra nome
document.getElementById('nomeUtilizador').textContent = utilizador.nome || '';

// Logout
function logout() {
    localStorage.clear();
    window.location.href = '/';
}

// Carrega pendentes
async function carregarPendentes() {
    try {
        const res = await fetch('/api/admin/pendentes', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();
        const tbody = document.getElementById('tabelaPendentes');
        document.getElementById('totalPendentes').textContent = data.length;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="vazio">Sem pedidos pendentes</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>${u.telefone || '-'}</td>
                <td><span class="badge badge-${u.perfil.toLowerCase()}">${u.perfil}</span></td>
                <td>${new Date(u.data_criacao).toLocaleDateString('pt-PT')}</td>
                <td>
                    <button class="btn btn-success" onclick="aprovar(${u.id_utilizador})">✓ Aprovar</button>
                    &nbsp;
                    <button class="btn btn-danger" onclick="rejeitar(${u.id_utilizador})">✗ Rejeitar</button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
    }
}

// Carrega utilizadores ativos
async function carregarUtilizadores() {
    try {
        const res = await fetch('/api/admin/utilizadores', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) return;

        const data = await res.json();
        const tbody = document.getElementById('tabelaUtilizadores');
        document.getElementById('totalUtilizadores').textContent = data.length;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="vazio">Sem utilizadores</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(u => `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td><span class="badge badge-${u.perfil.toLowerCase()}">${u.perfil}</span></td>
                <td>${new Date(u.data_criacao).toLocaleDateString('pt-PT')}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error(err);
    }
}

// Aprovar utilizador
async function aprovar(id) {
    if (!confirm('Aprovar este utilizador?')) return;

    const res = await fetch(`/api/admin/aprovar/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
        alert('Utilizador aprovado!');
        carregarPendentes();
        carregarUtilizadores();
    }
}

// Rejeitar utilizador
async function rejeitar(id) {
    if (!confirm('Rejeitar e eliminar este pedido?')) return;

    const res = await fetch(`/api/admin/rejeitar/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
    });

    if (res.ok) {
        alert('Pedido rejeitado!');
        carregarPendentes();
    }
}

// Inicializa
carregarPendentes();
carregarUtilizadores();