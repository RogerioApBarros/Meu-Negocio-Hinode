document.addEventListener(
    "DOMContentLoaded",
    iniciarPaginaClientes
);

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

async function iniciarPaginaClientes() {
    if (
        !window.API ||
        !window.Auth
    ) {
        console.error(
            "Os serviços API ou Auth não foram carregados."
        );

        alert(
            "Erro ao carregar os recursos do sistema."
        );

        return;
    }

    const usuario =
        await window.Auth.protegerPagina();

    if (!usuario) {
        return;
    }

    aplicarPermissoesUsuario(usuario);

    const campoNome =
        document.getElementById("nome");

    if (campoNome) {
        campoNome.focus();
    }
}

/* =====================================================
   CADASTRO DE CLIENTE
===================================================== */

async function cadastrarCliente() {
    if (
        !window.API ||
        !window.Auth
    ) {
        alert(
            "Os recursos de autenticação não foram carregados."
        );

        return;
    }

    const cliente = obterDadosFormulario();

    if (!cliente.nome) {
        alert(
            "Preencha o nome do cliente."
        );

        document
            .getElementById("nome")
            ?.focus();

        return;
    }

    alterarEstadoBotaoCadastro(true);

    try {
        const resposta =
            await window.API.requisicao(
                "/clientes",
                {
                    method: "POST",
                    body: cliente
                }
            );

        alert(
            resposta.mensagem ||
            "Cliente cadastrado com sucesso!"
        );

        limparCampos();
    } catch (erro) {
        console.error(
            "Erro ao cadastrar cliente:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível cadastrar o cliente."
        );
    } finally {
        alterarEstadoBotaoCadastro(false);
    }
}

/* =====================================================
   DADOS DO FORMULÁRIO
===================================================== */

function obterDadosFormulario() {
    return {
        nome: obterValorCampo("nome"),
        contato: obterValorCampo("contato"),
        rg: obterValorCampo("rg"),
        cpf: obterValorCampo("cpf"),

        nascimento:
            document.getElementById(
                "data-nascimento"
            )?.value || null,

        rua: obterValorCampo("rua"),
        numero: obterValorCampo("numero"),
        bairro: obterValorCampo("bairro"),
        cidade: obterValorCampo("cidade"),
        referencia:
            obterValorCampo("referencia"),

        indicacao:
            obterValorCampo("indicacao")
    };
}

function obterValorCampo(idCampo) {
    const campo =
        document.getElementById(idCampo);

    if (!campo) {
        return "";
    }

    return String(
        campo.value || ""
    ).trim();
}

/* =====================================================
   LIMPEZA DOS CAMPOS
===================================================== */

function limparCampos() {
    const idsCampos = [
        "nome",
        "contato",
        "rg",
        "cpf",
        "data-nascimento",
        "rua",
        "numero",
        "bairro",
        "cidade",
        "referencia",
        "indicacao"
    ];

    idsCampos.forEach(
        function (idCampo) {
            const campo =
                document.getElementById(
                    idCampo
                );

            if (campo) {
                campo.value = "";
            }
        }
    );

    document
        .getElementById("nome")
        ?.focus();
}

/* =====================================================
   BOTÃO DE CADASTRO
===================================================== */

function alterarEstadoBotaoCadastro(
    carregando
) {
    const botao =
        document.getElementById(
            "btnCadastrarCliente"
        ) ||
        document.querySelector(
            ".botao-cadastrar"
        ) ||
        document.querySelector(
            "button[onclick='cadastrarCliente()']"
        );

    if (!botao) {
        return;
    }

    botao.disabled =
        carregando;

    botao.textContent =
        carregando
            ? "Cadastrando..."
            : "Cadastrar";
}

/* =====================================================
   PERMISSÕES DA PÁGINA
===================================================== */

function aplicarPermissoesUsuario(
    usuario
) {
    const perfil =
        usuario.perfil;

    const podeCadastrar =
        perfil === "admin" ||
        perfil === "vendedor";

    if (!podeCadastrar) {
        bloquearFormularioCadastro();
    }
}

function bloquearFormularioCadastro() {
    const campos =
        document.querySelectorAll(
            "input, select, textarea"
        );

    campos.forEach(
        function (campo) {
            campo.disabled = true;
        }
    );

    const botao =
        document.getElementById(
            "btnCadastrarCliente"
        ) ||
        document.querySelector(
            ".botao-cadastrar"
        ) ||
        document.querySelector(
            "button[onclick='cadastrarCliente()']"
        );

    if (botao) {
        botao.disabled = true;
        botao.textContent =
            "Cadastro não permitido";
    }
}

/* =====================================================
   DISPONIBILIZAÇÃO GLOBAL
===================================================== */

window.cadastrarCliente =
    cadastrarCliente;

window.limparCampos =
    limparCampos;