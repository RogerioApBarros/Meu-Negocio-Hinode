/* =====================================================
   CONFIGURAÇÃO DA API
===================================================== */

/*
 * Endereço do backend durante o desenvolvimento.
 */
const URL_BACKEND_LOCAL = "http://localhost:3000";

/*
 * Endereço do backend em produção.
 */
const URL_BACKEND_PRODUCAO =
    "https://meu-negocio-hinode-production.up.railway.app";

/*
 * Detecta automaticamente se está rodando localmente
 * ou em produção.
 */
function obterBaseURL() {

    const host = window.location.hostname;

    if (
        host === "localhost" ||
        host === "127.0.0.1"
    ) {
        return URL_BACKEND_LOCAL;
    }

    return URL_BACKEND_PRODUCAO;
}

const CONFIGURACAO_API = {
    baseURL: obterBaseURL()
};

/* =====================================================
   TOKEN
===================================================== */

function obterToken() {

    return localStorage.getItem("token");

}

/* =====================================================
   CABEÇALHOS
===================================================== */

function criarCabecalhos(
    cabecalhosExtras = {}
) {

    const cabecalhos = {

        "Content-Type": "application/json",

        ...cabecalhosExtras

    };

    const token = obterToken();

    if (token) {

        cabecalhos.Authorization = `Bearer ${token}`;

    }

    return cabecalhos;

}

/* =====================================================
   ENCERRAR SESSÃO
===================================================== */

function encerrarSessao() {

    localStorage.removeItem("token");

    localStorage.removeItem("usuario");

    if (
        !window.location.pathname.includes("loguin.html")
    ) {

        window.location.href = "loguin.html";

    }

}

/* =====================================================
   REQUISIÇÃO
===================================================== */

async function requisicaoAPI(
    caminho,
    opcoes = {}
) {

    const configuracao = {

        method: opcoes.method || "GET",

        headers: criarCabecalhos(
            opcoes.headers || {}
        )

    };

    if (opcoes.body !== undefined) {

        configuracao.body =

            typeof opcoes.body === "string"

                ? opcoes.body

                : JSON.stringify(opcoes.body);

    }

    let resposta;

    try {

        resposta = await fetch(

            CONFIGURACAO_API.baseURL + caminho,

            configuracao

        );

    }

    catch (erro) {

        console.error(erro);

        throw new Error(

            "Não foi possível conectar ao servidor."

        );

    }

    let dados = {};

    const tipo = resposta.headers.get(
        "content-type"
    );

    if (

        tipo &&

        tipo.includes("application/json")

    ) {

        dados = await resposta.json();

    }

    else {

        dados = {

            mensagem: await resposta.text()

        };

    }

    if (!resposta.ok) {

        if (

            resposta.status === 401 &&

            caminho !== "/usuarios/login"

        ) {

            encerrarSessao();

        }

        throw new Error(

            dados.mensagem ||

            dados.erro ||

            "Erro ao comunicar com o servidor."

        );

    }

    return dados;

}

/* =====================================================
   DOWNLOAD DE ARQUIVOS
===================================================== */

async function downloadArquivo(
    caminho
) {

    const resposta = await fetch(

        CONFIGURACAO_API.baseURL + caminho,

        {

            headers: criarCabecalhos()

        }

    );

    if (!resposta.ok) {

        throw new Error(

            "Erro ao baixar arquivo."

        );

    }

    return await resposta.blob();

}

/* =====================================================
   TESTAR CONEXÃO
===================================================== */

async function testarServidor() {

    try {

        const resposta = await fetch(

            CONFIGURACAO_API.baseURL + "/status"

        );

        return resposta.ok;

    }

    catch {

        return false;

    }

}

/* =====================================================
   OBJETO GLOBAL
===================================================== */

window.API = {

    baseURL: CONFIGURACAO_API.baseURL,

    requisicao: requisicaoAPI,

    obterToken,

    encerrarSessao,

    downloadArquivo,

    testarServidor

};

console.log(
    "API carregada:",
    CONFIGURACAO_API.baseURL
);