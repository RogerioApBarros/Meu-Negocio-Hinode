document.addEventListener(
    "DOMContentLoaded",
    iniciarProtecaoPagina
);

async function iniciarProtecaoPagina() {
    const statusSessao =
        document.getElementById(
            "statusSessao"
        );

    if (
        !window.API ||
        !window.Auth
    ) {
        console.error(
            "Os serviços API ou Auth não foram carregados."
        );

        if (statusSessao) {
            statusSessao.textContent =
                "Erro ao carregar a autenticação.";
        }

        return;
    }

    try {
        const usuario =
            await window.Auth.protegerPagina();

        if (!usuario) {
            return;
        }

        exibirDadosUsuario(usuario);

        aplicarPermissoes(usuario.perfil);

        configurarBotaoSair();

        if (statusSessao) {
            statusSessao.textContent =
                "Acesso autorizado";
        }
    } catch (erro) {
        console.error(
            "Erro ao proteger a página:",
            erro
        );

        window.Auth.logout();
    }
}

function exibirDadosUsuario(usuario) {
    const nomeUsuario =
        document.getElementById(
            "nomeUsuario"
        );

    const perfilUsuario =
        document.getElementById(
            "perfilUsuario"
        );

    if (nomeUsuario) {
        nomeUsuario.textContent =
            usuario.nome || "Usuário";
    }

    if (perfilUsuario) {
        perfilUsuario.textContent =
            formatarPerfil(
                usuario.perfil
            );
    }
}

function formatarPerfil(perfil) {
    const perfis = {
        admin: "Administrador",
        vendedor: "Vendedor",
        financeiro: "Financeiro"
    };

    return perfis[perfil] || perfil;
}

function configurarBotaoSair() {
    const botaoSair =
        document.getElementById(
            "btnSair"
        );

    if (!botaoSair) {
        return;
    }

    botaoSair.addEventListener(
        "click",
        function () {
            const confirmarSaida =
                confirm(
                    "Deseja realmente sair do sistema?"
                );

            if (!confirmarSaida) {
                return;
            }

            window.Auth.logout();
        }
    );
}

function aplicarPermissoes(perfilUsuario) {
    const itensComPermissao =
        document.querySelectorAll(
            "[data-perfis]"
        );

    itensComPermissao.forEach(
        function (item) {
            const perfisPermitidos =
                item.dataset.perfis
                    .split(",")
                    .map(
                        function (perfil) {
                            return perfil.trim();
                        }
                    );

            const possuiPermissao =
                perfisPermitidos.includes(
                    perfilUsuario
                );

            if (!possuiPermissao) {
                item.style.display = "none";
            }
        }
    );
}