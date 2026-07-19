document.addEventListener(
    "DOMContentLoaded",
    iniciarTelaLogin
);

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

function iniciarTelaLogin() {
    if (
        !window.API ||
        !window.Auth
    ) {
        console.error(
            "Os serviços API ou Auth não foram carregados."
        );

        mostrarMensagem(
            "Erro ao carregar os recursos do sistema.",
            "erro"
        );

        return;
    }

    window.Auth.impedirAcessoAoLogin();

    const formulario =
        document.getElementById(
            "formLogin"
        );

    const campoUsuario =
        document.getElementById(
            "usuario"
        );

    if (formulario) {
        formulario.addEventListener(
            "submit",
            realizarLogin
        );
    }

    if (campoUsuario) {
        campoUsuario.focus();
    }
}

/* =====================================================
   LOGIN
===================================================== */

async function realizarLogin(evento) {
    evento.preventDefault();

    const campoUsuario =
        document.getElementById(
            "usuario"
        );

    const campoSenha =
        document.getElementById(
            "senha"
        );

    if (
        !campoUsuario ||
        !campoSenha
    ) {
        mostrarMensagem(
            "Não foi possível localizar os campos de login.",
            "erro"
        );

        return;
    }

    const login =
        campoUsuario.value
            .trim()
            .toLowerCase();

    const senha =
        campoSenha.value;

    limparMensagem();

    if (!login) {
        mostrarMensagem(
            "Digite o seu usuário.",
            "erro"
        );

        campoUsuario.focus();

        return;
    }

    if (!senha) {
        mostrarMensagem(
            "Digite a sua senha.",
            "erro"
        );

        campoSenha.focus();

        return;
    }

    alterarEstadoBotao(true);

    try {
        const resposta =
            await window.API.requisicao(
                "/usuarios/login",
                {
                    method: "POST",

                    body: {
                        login,
                        senha
                    }
                }
            );

        const token =
            resposta.token;

        const usuario =
            resposta.usuario || null;

        if (!token) {
            throw new Error(
                "O servidor não retornou o token de acesso."
            );
        }

        window.Auth.salvarSessao(
            token,
            usuario
        );

        mostrarMensagem(
            "Login realizado com sucesso.",
            "sucesso"
        );

        window.location.href =
            "index.html";
    } catch (erro) {
        console.error(
            "Erro ao realizar login:",
            erro
        );

        mostrarMensagem(
            erro.message ||
            "Não foi possível realizar o login.",
            "erro"
        );

        campoSenha.value = "";

        campoSenha.focus();
    } finally {
        alterarEstadoBotao(false);
    }
}

/* =====================================================
   BOTÃO
===================================================== */

function alterarEstadoBotao(
    carregando
) {
    const botao =
        document.getElementById(
            "btnEntrar"
        );

    if (!botao) {
        return;
    }

    botao.disabled =
        carregando;

    botao.textContent =
        carregando
            ? "Entrando..."
            : "Entrar";
}

/* =====================================================
   MENSAGENS
===================================================== */

function mostrarMensagem(
    texto,
    tipo
) {
    const elementoMensagem =
        document.getElementById(
            "mensagemLogin"
        );

    if (!elementoMensagem) {
        alert(texto);
        return;
    }

    elementoMensagem.textContent =
        texto;

    elementoMensagem.className =
        tipo === "sucesso"
            ? "mensagem-sucesso"
            : "mensagem-erro";
}

function limparMensagem() {
    const elementoMensagem =
        document.getElementById(
            "mensagemLogin"
        );

    if (!elementoMensagem) {
        return;
    }

    elementoMensagem.textContent = "";
    elementoMensagem.className = "";
}