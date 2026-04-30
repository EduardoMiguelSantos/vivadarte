document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const erroDiv = document.getElementById('erro');
    const btn = document.getElementById('btnLogin');

    erroDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'A entrar...';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('utilizador', JSON.stringify(data.utilizador));
            window.location.href = data.redirecionar;
        } else {
            erroDiv.style.display = 'block';
            erroDiv.textContent = data.error;
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    } catch (err) {
        erroDiv.style.display = 'block';
        erroDiv.textContent = 'Erro de ligação ao servidor';
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
});