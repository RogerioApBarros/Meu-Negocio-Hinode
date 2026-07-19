const CHAVE_TOKEN = "token";
const CHAVE_USUARIO = "usuario";

/**
 * Salva o token e os dados do usuário.
 */
function salvarSessao(token, usuario = null) {
    if (!token) {
        throw new Error(
            "O servidor não retornou um token de autenticação."
        );
    }

    localStorage.setItem(
        CHAVE_TOKEN,
        token
    );

    if (usuario) {
        localStorage.setItem(
            CHAVE_USUARIO,
            JSON.stringify(usuario)
        );
    }
}

/**
 * Retorna o token salvo.
 */
function obterTokenSessao() {
    return localStorage.getItem(
        CHAVE_TOKEN
    );
}

/**
 * Retorna os dados do usuário salvo.
 */
function obterUsuarioSessao() {
    const usuarioSalvo =
        localStorage.getItem(
            CHAVE_USUARIO
        );

    if (!usuarioSalvo) {
        return null;
    }

    try {
        return JSON.parse(
            usuarioSalvo
        );
    } catch (erro) {
        localStorage.removeItem(
            CHAVE_USUARIO
        );

        return null;
    }
}

/**
 * Verifica se existe token.
 */
function usuarioEstaAutenticado() {
    return Boolean(
        obterTokenSessao()
    );
}

/**
 * Busca o perfil atualizado no backend.
 */
async function carregarPerfilUsuario() {
    const resposta =
        await window.API.requisicao(
            "/usuarios/perfil"
        );

    const usuario =
        resposta.usuario ||
        resposta;

    localStorage.setItem(
        CHAVE_USUARIO,
        JSON.stringify(usuario)
    );

    return usuario;
}

/**
 * Impede acesso a páginas protegidas.
 */
async function protegerPagina() {
    if (!usuarioEstaAutenticado()) {
        redirecionarParaLogin();
        return null;
    }

    try {
        return await carregarPerfilUsuario();
    } catch (erro) {
        encerrarSessao();
        return null;
    }
}

/**
 * Apaga os dados da sessão.
 */
function limparSessao() {
    localStorage.removeItem(
        CHAVE_TOKEN
    );

    localStorage.removeItem(
        CHAVE_USUARIO
    );
}

/**
 * Redireciona para a tela de login.
 */
function redirecionarParaLogin() {
    window.location.href =
        "loguin.html";
}

/**
 * Finaliza a sessão.
 */
function encerrarSessao() {
    limparSessao();
    redirecionarParaLogin();
}

/**
 * Impede o usuário autenticado de voltar à tela de login.
 */
function impedirAcessoAoLogin() {
    if (usuarioEstaAutenticado()) {
        window.location.href =
            "index.html";
    }
}

window.Auth = {
    salvarSessao,
    obterToken: obterTokenSessao,
    obterUsuario: obterUsuarioSessao,
    estaAutenticado: usuarioEstaAutenticado,
    carregarPerfil: carregarPerfilUsuario,
    protegerPagina,
    limparSessao,
    logout: encerrarSessao,
    impedirAcessoAoLogin
};