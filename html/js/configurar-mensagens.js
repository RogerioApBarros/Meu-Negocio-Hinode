let mensagensCadastradas = [];

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    inicializarPagina
);

async function inicializarPagina() {
    try {
        if (
            !window.API ||
            typeof window.API.requisicao !== "function"
        ) {
            throw new Error(
                "O serviço da API não foi carregado. Verifique js/services/api.js."
            );
        }

        registrarEventos();

        limparFormulario();

        atualizarPrevia();

        await carregarMensagens();

    } catch (erro) {
        console.error(
            "Erro ao inicializar a página:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível inicializar a página."
        );
    }
}

function registrarEventos() {
    document
        .getElementById(
            "btn-nova-mensagem"
        )
        .addEventListener(
            "click",
            iniciarNovaMensagem
        );

    document
        .getElementById(
            "btn-salvar"
        )
        .addEventListener(
            "click",
            salvarMensagem
        );

    document
        .getElementById(
            "btn-cancelar"
        )
        .addEventListener(
            "click",
            cancelarEdicao
        );

    document
        .getElementById(
            "texto"
        )
        .addEventListener(
            "input",
            function () {
                atualizarContador();

                atualizarPrevia();
            }
        );

    document
        .getElementById(
            "forma-tratamento"
        )
        .addEventListener(
            "change",
            atualizarPrevia
        );

    document
        .querySelectorAll(
            ".botao-variavel"
        )
        .forEach(
            function (botao) {
                botao.addEventListener(
                    "click",
                    function () {
                        inserirVariavel(
                            botao.dataset.variavel
                        );
                    }
                );
            }
        );
}

/* =====================================================
   FUNÇÕES GERAIS
===================================================== */

function escaparHTML(texto) {
    return String(
        texto || ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function requisicaoJSON(
    endereco,
    opcoes = {}
) {
    if (
        !window.API ||
        typeof window.API.requisicao !== "function"
    ) {
        throw new Error(
            "O serviço da API não foi carregado."
        );
    }

    return await window.API.requisicao(
        endereco,
        opcoes
    );
}

function nomeFormaTratamento(
    valor
) {
    const nomes = {
        nome_completo:
            "Nome completo",

        primeiro_nome:
            "Primeiro nome",

        nome_fantasia_completo:
            "Nome fantasia completo",

        primeiro_nome_fantasia:
            "Primeiro nome fantasia"
    };

    return (
        nomes[valor] ||
        valor
    );
}

/* =====================================================
   LISTAR MENSAGENS
===================================================== */

async function carregarMensagens() {
    const lista =
        document.getElementById(
            "lista-mensagens"
        );

    lista.innerHTML = `
        <p class="carregando">
            Carregando mensagens...
        </p>
    `;

    try {
        const dados =
            await requisicaoJSON(
                "/mensagens-whatsapp"
            );

        mensagensCadastradas =
            Array.isArray(dados)
                ? dados
                : (
                    dados &&
                    Array.isArray(dados.mensagens)
                        ? dados.mensagens
                        : (
                            dados &&
                            Array.isArray(dados.dados)
                                ? dados.dados
                                : []
                        )
                );

        renderizarMensagens();

    } catch (erro) {
        console.error(
            "Erro ao carregar mensagens:",
            erro
        );

        lista.innerHTML = `
            <div class="mensagem-erro">
                ${escaparHTML(
                    erro.message
                )}
            </div>
        `;
    }
}

function renderizarMensagens() {
    const lista =
        document.getElementById(
            "lista-mensagens"
        );

    document.getElementById(
        "total-mensagens"
    ).textContent =
        mensagensCadastradas.length +
        " mensagem(ns)";

    lista.innerHTML = "";

    if (
        mensagensCadastradas.length === 0
    ) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhuma mensagem cadastrada.
            </p>
        `;

        return;
    }

    mensagensCadastradas.forEach(
        function (mensagem) {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "mensagem-card";

            card.innerHTML = `
                <div class="mensagem-ordem">
                    ${mensagem.ordem}
                </div>

                <div class="mensagem-dados">

                    <h4>
                        ${escaparHTML(
                            mensagem.titulo
                        )}
                    </h4>

                    <p>
                        ${escaparHTML(
                            mensagem.texto
                        )}
                    </p>

                    <div class="mensagem-meta">

                        <span class="etiqueta">
                            ${escaparHTML(
                                nomeFormaTratamento(
                                    mensagem.formaTratamento
                                )
                            )}
                        </span>

                        <span
                            class="etiqueta ${
                                mensagem.ativa
                                    ? "etiqueta-ativa"
                                    : "etiqueta-inativa"
                            }"
                        >
                            ${
                                mensagem.ativa
                                    ? "Ativa"
                                    : "Inativa"
                            }
                        </span>

                    </div>

                </div>

                <div class="mensagem-acoes">

                    <button
                        type="button"
                        class="botao-editar"
                    >
                        Editar
                    </button>

                    <button
                        type="button"
                        class="botao-status"
                    >
                        ${
                            mensagem.ativa
                                ? "Desativar"
                                : "Ativar"
                        }
                    </button>

                    <button
                        type="button"
                        class="botao-excluir"
                    >
                        Excluir
                    </button>

                </div>
            `;

            const botoes =
                card.querySelectorAll(
                    "button"
                );

            botoes[0].addEventListener(
                "click",
                function () {
                    editarMensagem(
                        mensagem.id
                    );
                }
            );

            botoes[1].addEventListener(
                "click",
                function () {
                    alterarStatusMensagem(
                        mensagem
                    );
                }
            );

            botoes[2].addEventListener(
                "click",
                function () {
                    excluirMensagem(
                        mensagem
                    );
                }
            );

            lista.appendChild(
                card
            );
        }
    );
}

/* =====================================================
   FORMULÁRIO
===================================================== */

function obterDadosFormulario() {
    return {
        titulo:
            document
                .getElementById(
                    "titulo"
                )
                .value
                .trim(),

        texto:
            document
                .getElementById(
                    "texto"
                )
                .value
                .trim(),

        formaTratamento:
            document.getElementById(
                "forma-tratamento"
            ).value,

        ordem:
            Number(
                document.getElementById(
                    "ordem"
                ).value
            ),

        ativa:
            document.getElementById(
                "ativa"
            ).checked
    };
}

function validarFormulario(
    dados
) {
    if (!dados.titulo) {
        alert(
            "Informe o título da mensagem."
        );

        document
            .getElementById(
                "titulo"
            )
            .focus();

        return false;
    }

    if (!dados.texto) {
        alert(
            "Informe o texto da mensagem."
        );

        document
            .getElementById(
                "texto"
            )
            .focus();

        return false;
    }

    if (
        !Number.isInteger(
            dados.ordem
        ) ||
        dados.ordem <= 0
    ) {
        alert(
            "Informe uma ordem válida."
        );

        document
            .getElementById(
                "ordem"
            )
            .focus();

        return false;
    }

    return true;
}

async function salvarMensagem() {
    const dados =
        obterDadosFormulario();

    if (!validarFormulario(dados)) {
        return;
    }

    const id =
        Number(
            document.getElementById(
                "mensagem-id"
            ).value
        );

    const botao =
        document.getElementById(
            "btn-salvar"
        );

    botao.disabled = true;

    botao.textContent =
        id
            ? "Salvando alterações..."
            : "Cadastrando...";

    try {
        let endereco =
            `/mensagens-whatsapp`;

        let metodo =
            "POST";

        if (id) {
            endereco +=
                `/${id}`;

            metodo =
                "PUT";
        }

        const resposta =
            await requisicaoJSON(
                endereco,
                {
                    method:
                        metodo,

                    body: dados
                }
            );

        alert(
            resposta.mensagem
        );

        limparFormulario();

        await carregarMensagens();

    } catch (erro) {
        console.error(
            "Erro ao salvar mensagem:",
            erro
        );

        alert(
            erro.message
        );

    } finally {
        botao.disabled = false;

        botao.textContent =
            "Salvar mensagem";
    }
}

function editarMensagem(id) {
    const mensagem =
        mensagensCadastradas.find(
            function (item) {
                return Number(
                    item.id
                ) === Number(id);
            }
        );

    if (!mensagem) {
        alert(
            "Mensagem não encontrada."
        );

        return;
    }

    document.getElementById(
        "mensagem-id"
    ).value =
        mensagem.id;

    document.getElementById(
        "titulo"
    ).value =
        mensagem.titulo;

    document.getElementById(
        "texto"
    ).value =
        mensagem.texto;

    document.getElementById(
        "forma-tratamento"
    ).value =
        mensagem.formaTratamento;

    document.getElementById(
        "ordem"
    ).value =
        mensagem.ordem;

    document.getElementById(
        "ativa"
    ).checked =
        Boolean(
            mensagem.ativa
        );

    document.getElementById(
        "titulo-formulario"
    ).textContent =
        "Editar mensagem";

    document.getElementById(
        "btn-salvar"
    ).textContent =
        "Salvar alterações";

    document.getElementById(
        "btn-cancelar"
    ).hidden =
        false;

    atualizarContador();

    atualizarPrevia();

    document.getElementById(
        "area-formulario"
    ).scrollIntoView({
        behavior: "smooth"
    });
}

function limparFormulario() {
    document.getElementById(
        "mensagem-id"
    ).value = "";

    document.getElementById(
        "titulo"
    ).value = "";

    document.getElementById(
        "texto"
    ).value = "";

    document.getElementById(
        "forma-tratamento"
    ).value =
        "primeiro_nome";

    document.getElementById(
        "ordem"
    ).value =
        calcularProximaOrdem();

    document.getElementById(
        "ativa"
    ).checked =
        true;

    document.getElementById(
        "titulo-formulario"
    ).textContent =
        "Cadastrar mensagem";

    document.getElementById(
        "btn-salvar"
    ).textContent =
        "Salvar mensagem";

    document.getElementById(
        "btn-cancelar"
    ).hidden =
        true;

    atualizarContador();

    atualizarPrevia();
}

function iniciarNovaMensagem() {
    limparFormulario();

    document.getElementById(
        "area-formulario"
    ).scrollIntoView({
        behavior: "smooth"
    });

    document.getElementById(
        "titulo"
    ).focus();
}

function cancelarEdicao() {
    limparFormulario();
}

function calcularProximaOrdem() {
    if (
        mensagensCadastradas.length === 0
    ) {
        return 1;
    }

    const maiorOrdem =
        Math.max(
            ...mensagensCadastradas.map(
                function (mensagem) {
                    return Number(
                        mensagem.ordem || 0
                    );
                }
            )
        );

    return maiorOrdem + 1;
}

/* =====================================================
   VARIÁVEIS E PRÉVIA
===================================================== */

function inserirVariavel(
    variavel
) {
    const campo =
        document.getElementById(
            "texto"
        );

    const inicio =
        campo.selectionStart;

    const fim =
        campo.selectionEnd;

    const textoAtual =
        campo.value;

    campo.value =
        textoAtual.slice(
            0,
            inicio
        ) +
        variavel +
        textoAtual.slice(
            fim
        );

    const novaPosicao =
        inicio +
        variavel.length;

    campo.focus();

    campo.setSelectionRange(
        novaPosicao,
        novaPosicao
    );

    atualizarContador();

    atualizarPrevia();
}

function atualizarContador() {
    const texto =
        document.getElementById(
            "texto"
        ).value;

    document.getElementById(
        "contador-texto"
    ).textContent =
        texto.length;
}

function gerarTextoExemplo(
    texto
) {
    return String(
        texto || ""
    )
        .replaceAll(
            "{{nome_completo}}",
            "Rogério Aparecido de Barros"
        )
        .replaceAll(
            "{{primeiro_nome}}",
            "Rogério"
        )
        .replaceAll(
            "{{nome_fantasia}}",
            "Rogério Barros"
        )
        .replaceAll(
            "{{primeiro_nome_fantasia}}",
            "Rogério"
        )
        .replaceAll(
            "{{valor_parcela}}",
            "R$ 120,00"
        )
        .replaceAll(
            "{{valor_recebido}}",
            "R$ 0,00"
        )
        .replaceAll(
            "{{saldo}}",
            "R$ 120,00"
        )
        .replaceAll(
            "{{vencimento}}",
            "20/07/2026"
        )
        .replaceAll(
            "{{numero_parcela}}",
            "2"
        )
        .replaceAll(
            "{{dias_atraso}}",
            "5"
        );
}

function atualizarPrevia() {
    const texto =
        document.getElementById(
            "texto"
        ).value;

    const previa =
        document.getElementById(
            "previa-mensagem"
        );

    if (!texto.trim()) {
        previa.textContent =
            "Digite uma mensagem para visualizar a prévia.";

        return;
    }

    previa.textContent =
        gerarTextoExemplo(
            texto
        );
}

/* =====================================================
   STATUS E EXCLUSÃO
===================================================== */

async function alterarStatusMensagem(
    mensagem
) {
    const novoStatus =
        !mensagem.ativa;

    const confirmar =
        confirm(
            novoStatus
                ? `Deseja ativar a mensagem "${mensagem.titulo}"?`
                : `Deseja desativar a mensagem "${mensagem.titulo}"?`
        );

    if (!confirmar) {
        return;
    }

    try {
        const resposta =
            await requisicaoJSON(
                `/mensagens-whatsapp/${mensagem.id}/status`,
                {
                    method:
                        "PATCH",

                    body: {
                        ativa:
                            novoStatus
                    }
                }
            );

        alert(
            resposta.mensagem
        );

        await carregarMensagens();

    } catch (erro) {
        alert(
            erro.message
        );
    }
}

async function excluirMensagem(
    mensagem
) {
    const confirmar =
        confirm(
            `Deseja realmente excluir a mensagem "${mensagem.titulo}"?`
        );

    if (!confirmar) {
        return;
    }

    try {
        const resposta =
            await requisicaoJSON(
                `/mensagens-whatsapp/${mensagem.id}`,
                {
                    method:
                        "DELETE"
                }
            );

        alert(
            resposta.mensagem
        );

        limparFormulario();

        await carregarMensagens();

    } catch (erro) {
        alert(
            erro.message
        );
    }
}