document.getElementById('formRegistar').addEventListener('submit', async (e) => {
    e.preventDefault();

    const mensagemDiv = document.getElementById('mensagem');
    const btn = document.getElementById('btnRegistar');

    const dados = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        password: document.getElementById('password').value,
        perfil: document.getElementById('perfil').value
    };

    mensagemDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'A enviar...';

    try {
        const res = await fetch('/api/auth/pedido-registo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const data = await res.json();

        mensagemDiv.style.display = 'block';

        if (res.ok) {
            mensagemDiv.className = 'alerta alerta-sucesso';
            mensagemDiv.textContent = data.message;
            document.getElementById('formRegistar').reset();
        } else {
            mensagemDiv.className = 'alerta alerta-erro';
            mensagemDiv.textContent = data.error;
            btn.disabled = false;
            btn.textContent = 'Enviar Pedido';
        }
    } catch (err) {
        mensagemDiv.style.display = 'block';
        mensagemDiv.className = 'alerta alerta-erro';
        mensagemDiv.textContent = 'Erro de ligação ao servidor';
        btn.disabled = false;
        btn.textContent = 'Enviar Pedido';
    }
});