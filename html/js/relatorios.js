/* =====================================================
   DADOS DOS RELATÓRIOS
===================================================== */

let clientesCadastrados = [];

let tipoSelecaoCliente = null;

let clienteSelecionado = null;

/* =====================================================
   DADOS DO WHATSAPP
===================================================== */

let mensagensWhatsapp = [];

let destinatariosDisparo = [];

let filaDisparo = [];

let disparoEmAndamento = false;

let disparoPausado = false;

let disparoCancelado = false;

let indiceAtualDisparo = 0;

let janelaWhatsapp = null;

const VELOCIDADES_DISPARO = {
    lento: 15000,
    medio: 8000,
    rapido: 5000
};

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    inicializarRelatorios
);

async function inicializarRelatorios() {
    try {
        if (
            !window.API ||
            typeof window.API.requisicao !== "function"
        ) {
            throw new Error(
                "O serviço da API não foi carregado. Verifique js/services/api.js."
            );
        }

        registrarEventosDisparo();

        await Promise.all([
            carregarClientes(),
            carregarMensagensWhatsapp()
        ]);

    } catch (erro) {
        console.error(
            "Erro ao inicializar relatórios:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível inicializar a tela de relatórios."
        );
    }
}

/* =====================================================
   EVENTOS DA ÁREA DE DISPARO
===================================================== */

function registrarEventosDisparo() {
    const mensagemDisparo =
        document.getElementById(
            "mensagem-disparo"
        );

    const tratamentoDisparo =
        document.getElementById(
            "tratamento-disparo"
        );

    const velocidadeDisparo =
        document.getElementById(
            "velocidade-disparo"
        );

    const selecionarTodos =
        document.getElementById(
            "btn-selecionar-todos"
        );

    const desmarcarTodos =
        document.getElementById(
            "btn-desmarcar-todos"
        );

    const iniciarDisparo =
        document.getElementById(
            "btn-iniciar-disparo"
        );

    const pausarDisparo =
        document.getElementById(
            "btn-pausar-disparo"
        );

    const continuarDisparo =
        document.getElementById(
            "btn-continuar-disparo"
        );

    const cancelarDisparo =
        document.getElementById(
            "btn-cancelar-disparo"
        );

    if (mensagemDisparo) {
        mensagemDisparo.addEventListener(
            "change",
            atualizarPreviaDisparo
        );
    }

    if (tratamentoDisparo) {
        tratamentoDisparo.addEventListener(
            "change",
            atualizarPreviaDisparo
        );
    }

    if (velocidadeDisparo) {
        velocidadeDisparo.addEventListener(
            "change",
            atualizarResumoDestinatarios
        );
    }

    if (selecionarTodos) {
        selecionarTodos.addEventListener(
            "click",
            selecionarTodosDestinatarios
        );
    }

    if (desmarcarTodos) {
        desmarcarTodos.addEventListener(
            "click",
            desmarcarTodosDestinatarios
        );
    }

    if (iniciarDisparo) {
        iniciarDisparo.addEventListener(
            "click",
            prepararFilaDisparo
        );
    }

    if (pausarDisparo) {
        pausarDisparo.addEventListener(
            "click",
            pausarFilaDisparo
        );
    }

    if (continuarDisparo) {
        continuarDisparo.addEventListener(
            "click",
            continuarFilaDisparo
        );
    }

    if (cancelarDisparo) {
        cancelarDisparo.addEventListener(
            "click",
            cancelarFilaDisparo
        );
    }
}

/* =====================================================
   FUNÇÕES GERAIS
===================================================== */

function moeda(valor) {
    return Number(
        valor || 0
    ).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

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

function formatarData(
    dataTexto
) {
    if (!dataTexto) {
        return "-";
    }

    const dataBanco =
        String(dataTexto)
            .slice(0, 10);

    const partes =
        dataBanco.split("-");

    if (partes.length !== 3) {
        return String(
            dataTexto
        );
    }

    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}

function arredondarCentavos(
    valor
) {
    return (
        Math.round(
            Number(valor || 0) *
            100
        ) / 100
    );
}

function aguardar(
    milissegundos
) {
    return new Promise(
        function (resolve) {
            setTimeout(
                resolve,
                milissegundos
            );
        }
    );
}

function obterDataAtualBanco() {
    const hoje =
        new Date();

    const ano =
        hoje.getFullYear();

    const mes =
        String(
            hoje.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            hoje.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
}

function calcularDiasAtraso(
    vencimento
) {
    if (!vencimento) {
        return 0;
    }

    const hoje =
        new Date(
            obterDataAtualBanco() +
            "T00:00:00"
        );

    const dataVencimento =
        new Date(
            String(vencimento).slice(
                0,
                10
            ) +
            "T00:00:00"
        );

    if (
        Number.isNaN(
            dataVencimento.getTime()
        ) ||
        dataVencimento >= hoje
    ) {
        return 0;
    }

    return Math.floor(
        (
            hoje -
            dataVencimento
        ) /
        (
            1000 *
            60 *
            60 *
            24
        )
    );
}

/* =====================================================
   REQUISIÇÕES
===================================================== */

async function buscarJSON(
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

function validarDatas(
    inicio,
    fim
) {
    if (!inicio || !fim) {
        alert(
            "Informe a data inicial e a data final."
        );

        return false;
    }

    if (inicio > fim) {
        alert(
            "A data inicial não pode ser maior que a data final."
        );

        return false;
    }

    return true;
}

function mostrarCarregando() {
    document.getElementById(
        "area-relatorio"
    ).innerHTML = `
        <p class="carregando">
            Carregando relatório...
        </p>
    `;
}

function mostrarErro(
    erro
) {
    console.error(
        erro
    );

    document.getElementById(
        "area-relatorio"
    ).innerHTML = `
        <div class="mensagem-erro">
            ${escaparHTML(
                erro.message ||
                "Erro ao gerar relatório."
            )}
        </div>
    `;
}

/* =====================================================
   LIMPAR E OCULTAR A ÁREA DE DISPARO
===================================================== */

function ocultarAreaDisparo() {
    const area =
        document.getElementById(
            "area-disparo-whatsapp"
        );

    if (area) {
        area.hidden = true;
    }

    destinatariosDisparo = [];

    filaDisparo = [];

    disparoEmAndamento =
        false;

    disparoPausado =
        false;

    disparoCancelado =
        false;

    indiceAtualDisparo =
        0;

    const lista =
        document.getElementById(
            "lista-destinatarios"
        );

    if (lista) {
        lista.innerHTML = "";
    }

    const resultados =
        document.getElementById(
            "lista-resultados-disparo"
        );

    if (resultados) {
        resultados.innerHTML = "";
    }

    const painel =
        document.getElementById(
            "painel-progresso-disparo"
        );

    if (painel) {
        painel.hidden = true;
    }
}

/* =====================================================
   CARREGAR CLIENTES
===================================================== */

async function carregarClientes() {
    try {
        const dados =
            await buscarJSON(
                `/clientes`
            );

        clientesCadastrados =
            Array.isArray(dados)
                ? dados
                : (
                    dados &&
                    Array.isArray(dados.clientes)
                        ? dados.clientes
                        : (
                            dados &&
                            Array.isArray(dados.dados)
                                ? dados.dados
                                : []
                        )
                );

        clientesCadastrados.sort(
            function (a, b) {
                return String(
                    a.nome || ""
                ).localeCompare(
                    String(
                        b.nome || ""
                    ),
                    "pt-BR"
                );
            }
        );

        console.log(
            "Clientes carregados:",
            clientesCadastrados.length
        );

    } catch (erro) {
        console.error(
            "Erro ao carregar clientes:",
            erro
        );
    }
}

/* =====================================================
   CARREGAR MENSAGENS DO WHATSAPP
===================================================== */

async function carregarMensagensWhatsapp() {
    try {
        const dados =
            await buscarJSON(
                `/mensagens-whatsapp/ativas`
            );

        mensagensWhatsapp =
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

        preencherSelectMensagens();

    } catch (erro) {
        console.error(
            "Erro ao carregar mensagens:",
            erro
        );

        mensagensWhatsapp = [];

        preencherSelectMensagens();
    }
}

function preencherSelectMensagens() {
    const select =
        document.getElementById(
            "mensagem-disparo"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Selecione uma mensagem
        </option>
    `;

    mensagensWhatsapp.forEach(
        function (mensagem) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                mensagem.id;

            option.textContent =
                `${mensagem.ordem} - ${mensagem.titulo}`;

            select.appendChild(
                option
            );
        }
    );
}

/* =====================================================
   MODAL DE CLIENTES
===================================================== */

function abrirModalClientes(
    tipo
) {
    tipoSelecaoCliente =
        tipo;

    const modal =
        document.getElementById(
            "modal-clientes"
        );

    const pesquisa =
        document.getElementById(
            "pesquisa-cliente-modal"
        );

    if (!modal || !pesquisa) {
        return;
    }

    modal.hidden = false;

    modal.classList.add(
        "modal-aberto"
    );

    pesquisa.value = "";

    renderizarClientesModal(
        clientesCadastrados
    );

    pesquisa.focus();
}

function fecharModalClientes() {
    const modal =
        document.getElementById(
            "modal-clientes"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "modal-aberto"
    );

    modal.hidden = true;
}

function filtrarClientesModal() {
    const busca =
        document
            .getElementById(
                "pesquisa-cliente-modal"
            )
            .value
            .toLowerCase()
            .trim();

    const filtrados =
        clientesCadastrados.filter(
            function (cliente) {
                return (
                    String(
                        cliente.nome || ""
                    )
                        .toLowerCase()
                        .includes(busca) ||

                    String(
                        cliente.contato || ""
                    )
                        .toLowerCase()
                        .includes(busca) ||

                    String(
                        cliente.cpf || ""
                    )
                        .toLowerCase()
                        .includes(busca) ||

                    String(
                        cliente.cidade || ""
                    )
                        .toLowerCase()
                        .includes(busca)
                );
            }
        );

    renderizarClientesModal(
        filtrados
    );
}

function renderizarClientesModal(
    clientes
) {
    const lista =
        document.getElementById(
            "lista-clientes-modal"
        );

    lista.innerHTML = "";

    if (
        clientes.length === 0
    ) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum cliente encontrado.
            </p>
        `;

        return;
    }

    clientes.forEach(
        function (cliente) {
            const botao =
                document.createElement(
                    "button"
                );

            botao.type =
                "button";

            botao.className =
                "cliente-modal-item";

            botao.innerHTML = `
                <strong>
                    ${escaparHTML(
                        cliente.nome
                    )}
                </strong>

                <span>
                    WhatsApp:
                    ${escaparHTML(
                        cliente.contato ||
                        "Não informado"
                    )}
                </span>

                <span>
                    Cidade:
                    ${escaparHTML(
                        cliente.cidade ||
                        "Não informada"
                    )}
                </span>
            `;

            botao.addEventListener(
                "click",
                function () {
                    selecionarCliente(
                        cliente
                    );
                }
            );

            lista.appendChild(
                botao
            );
        }
    );
}

function selecionarCliente(
    cliente
) {
    clienteSelecionado =
        cliente;

    const campo =
        document.getElementById(
            "cliente-selecionado"
        );

    if (campo) {
        campo.value =
            cliente.nome;

        campo.dataset.clienteId =
            cliente.id;
    }

    fecharModalClientes();
}
/* =====================================================
   PRODUTOS MAIS VENDIDOS
===================================================== */

async function produtosMaisVendidos() {
    ocultarAreaDisparo();

    document.getElementById(
        "area-filtros"
    ).innerHTML = "";

    mostrarCarregando();

    try {
        const dados =
            await buscarJSON(
                `/relatorios/produtos-mais-vendidos`
            );

        let html = `
            <h3>Produtos mais vendidos</h3>
        `;

        if (
            dados.length === 0
        ) {
            html += `
                <p>
                    Nenhum produto vendido.
                </p>
            `;
        }

        dados.forEach(
            function (
                item,
                indice
            ) {
                html += `
                    <div class="relatorio-item">

                        <strong>
                            ${indice + 1}º
                            ${escaparHTML(
                                item.produto
                            )}
                        </strong>

                        <span>
                            Quantidade vendida:
                            ${item.quantidade}
                        </span>

                    </div>
                `;
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

    } catch (erro) {
        mostrarErro(erro);
    }
}

/* =====================================================
   CLIENTES QUE MAIS COMPRAM
===================================================== */

async function clientesMaisCompram() {
    ocultarAreaDisparo();

    document.getElementById(
        "area-filtros"
    ).innerHTML = "";

    mostrarCarregando();

    try {
        const dados =
            await buscarJSON(
                `/relatorios/clientes-mais-compram`
            );

        let html = `
            <h3>Clientes que mais compram</h3>
        `;

        if (
            dados.length === 0
        ) {
            html += `
                <p>
                    Nenhum cliente encontrado.
                </p>
            `;
        }

        dados.forEach(
            function (
                item,
                indice
            ) {
                html += `
                    <div class="relatorio-item">

                        <strong>
                            ${indice + 1}º
                            ${escaparHTML(
                                item.cliente
                            )}
                        </strong>

                        <span>
                            Total comprado:
                            ${moeda(
                                item.totalComprado
                            )}
                        </span>

                    </div>
                `;
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

    } catch (erro) {
        mostrarErro(erro);
    }
}

/* =====================================================
   PARCELAS EM ATRASO
===================================================== */

async function parcelasEmAtraso() {
    document.getElementById(
        "area-filtros"
    ).innerHTML = "";

    mostrarCarregando();

    try {
        const dados =
            await buscarJSON(
                `/relatorios/parcelas-atraso`
            );

        let html = `
            <h3>Parcelas em atraso</h3>
        `;

        if (
            dados.length === 0
        ) {
            html += `
                <p>
                    Nenhuma parcela em atraso encontrada.
                </p>
            `;
        }

        dados.forEach(
            function (item) {
                html += `
                    <div class="relatorio-item">

                        <strong>
                            ${escaparHTML(
                                item.cliente
                            )}
                        </strong>

                        <span>
                            Parcela:
                            ${item.parcela}
                        </span>

                        <span>
                            Vencimento:
                            ${formatarData(
                                item.vencimento
                            )}
                        </span>

                        <span>
                            Valor:
                            ${moeda(
                                item.valor
                            )}
                        </span>

                        <span>
                            Saldo:
                            ${moeda(
                                item.saldo !== undefined
                                    ? item.saldo
                                    : item.valor
                            )}
                        </span>

                        <span>
                            Status:
                            ${escaparHTML(
                                item.status
                            )}
                        </span>

                        <span>
                            Dias em atraso:
                            ${item.diasAtraso}
                        </span>

                    </div>
                `;
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

        prepararDestinatariosParcelas(
            dados.map(
                function (item) {
                    return {
                        cliente:
                            item.cliente,

                        numeroParcela:
                            item.parcela,

                        vencimento:
                            item.vencimento,

                        valorParcela:
                            Number(
                                item.valor || 0
                            ),

                        valorRecebido:
                            Number(
                                item.valorRecebido || 0
                            ),

                        saldo:
                            Number(
                                item.saldo !== undefined
                                    ? item.saldo
                                    : item.valor || 0
                            ),

                        status:
                            item.status,

                        diasAtraso:
                            Number(
                                item.diasAtraso || 0
                            )
                    };
                }
            )
        );

    } catch (erro) {
        ocultarAreaDisparo();

        mostrarErro(erro);
    }
}

/* =====================================================
   FILTRO DE PARCELAS ENTRE DATAS
===================================================== */

function abrirFiltroParcelasPeriodo() {
    ocultarAreaDisparo();

    clienteSelecionado = null;

    document.getElementById(
        "area-filtros"
    ).innerHTML = `
        <div class="filtro-box">

            <h3>Parcelas entre datas</h3>

            <div class="linha-filtros">

                <div>
                    <label>
                        Data inicial
                    </label>

                    <input
                        type="date"
                        id="parcelas-data-inicio"
                    >
                </div>

                <div>
                    <label>
                        Data final
                    </label>

                    <input
                        type="date"
                        id="parcelas-data-fim"
                    >
                </div>

                <div>
                    <label>
                        Situação
                    </label>

                    <select id="parcelas-status">

                        <option value="todas">
                            Todas
                        </option>

                        <option value="abertas">
                            Em aberto
                        </option>

                        <option value="pagas">
                            Pagas
                        </option>

                        <option value="vencidas">
                            Vencidas
                        </option>

                    </select>
                </div>

            </div>

            <button
                type="button"
                onclick="buscarParcelasPeriodo()"
            >
                Gerar relatório
            </button>

        </div>
    `;

    document.getElementById(
        "area-relatorio"
    ).innerHTML = "";
}

async function buscarParcelasPeriodo() {
    const inicio =
        document.getElementById(
            "parcelas-data-inicio"
        ).value;

    const fim =
        document.getElementById(
            "parcelas-data-fim"
        ).value;

    const status =
        document.getElementById(
            "parcelas-status"
        ).value;

    if (
        !validarDatas(
            inicio,
            fim
        )
    ) {
        return;
    }

    mostrarCarregando();

    try {
        const endereco =
            `/relatorios/parcelas-periodo` +
            `?inicio=${encodeURIComponent(
                inicio
            )}` +
            `&fim=${encodeURIComponent(
                fim
            )}` +
            `&status=${encodeURIComponent(
                status
            )}`;

        const dados =
            await buscarJSON(
                endereco
            );

        let html = `
            <h3>Parcelas entre datas</h3>

            <div class="resumo-relatorio">

                <div>
                    <span>Total das parcelas</span>

                    <strong>
                        ${moeda(
                            dados.totalParcelas
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total recebido</span>

                    <strong>
                        ${moeda(
                            dados.totalRecebido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Saldo em aberto</span>

                    <strong>
                        ${moeda(
                            dados.totalAberto
                        )}
                    </strong>
                </div>

                <div>
                    <span>Quantidade</span>

                    <strong>
                        ${dados.quantidadeParcelas}
                    </strong>
                </div>

            </div>
        `;

        if (
            dados.parcelas.length === 0
        ) {
            html += `
                <p>
                    Nenhuma parcela encontrada.
                </p>
            `;
        }

        dados.parcelas.forEach(
            function (parcela) {
                html += criarHTMLParcela(
                    parcela
                );
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

        prepararDestinatariosParcelas(
            dados.parcelas
        );

    } catch (erro) {
        ocultarAreaDisparo();

        mostrarErro(erro);
    }
}

/* =====================================================
   FILTRO DE PARCELAS POR CLIENTE
===================================================== */

function abrirFiltroParcelasCliente() {
    ocultarAreaDisparo();

    clienteSelecionado = null;

    document.getElementById(
        "area-filtros"
    ).innerHTML = `
        <div class="filtro-box">

            <h3>Parcelas por cliente</h3>

            <label>
                Cliente
            </label>

            <div class="linha-cliente">

                <input
                    type="text"
                    id="cliente-selecionado"
                    placeholder="Nenhum cliente selecionado"
                    readonly
                >

                <button
                    type="button"
                    onclick="abrirModalClientes('parcelas')"
                >
                    Buscar Cliente
                </button>

            </div>

            <label>
                Situação das parcelas
            </label>

            <select id="parcelas-cliente-status">

                <option value="todas">
                    Todas
                </option>

                <option value="abertas">
                    Em aberto
                </option>

                <option value="pagas">
                    Pagas
                </option>

                <option value="vencidas">
                    Vencidas
                </option>

            </select>

            <button
                type="button"
                onclick="buscarParcelasCliente()"
            >
                Gerar relatório
            </button>

        </div>
    `;

    document.getElementById(
        "area-relatorio"
    ).innerHTML = "";
}

async function buscarParcelasCliente() {
    if (!clienteSelecionado) {
        alert(
            "Selecione um cliente."
        );

        return;
    }

    const status =
        document.getElementById(
            "parcelas-cliente-status"
        ).value;

    mostrarCarregando();

    try {
        const endereco =
            `/relatorios/parcelas-cliente` +
            `?cliente=${encodeURIComponent(
                clienteSelecionado.nome
            )}` +
            `&status=${encodeURIComponent(
                status
            )}`;

        const dados =
            await buscarJSON(
                endereco
            );

        let html = `
            <h3>Parcelas por cliente</h3>

            <p>
                <strong>Cliente:</strong>
                ${escaparHTML(
                    dados.cliente
                )}
            </p>

            <div class="resumo-relatorio">

                <div>
                    <span>Total das parcelas</span>

                    <strong>
                        ${moeda(
                            dados.totalParcelas
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total recebido</span>

                    <strong>
                        ${moeda(
                            dados.totalRecebido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total em aberto</span>

                    <strong>
                        ${moeda(
                            dados.totalAberto
                        )}
                    </strong>
                </div>

                <div>
                    <span>Quantidade</span>

                    <strong>
                        ${dados.quantidadeParcelas || dados.parcelas.length}
                    </strong>
                </div>

            </div>
        `;

        if (
            dados.parcelas.length === 0
        ) {
            html += `
                <p>
                    Nenhuma parcela encontrada.
                </p>
            `;
        }

        dados.parcelas.forEach(
            function (parcela) {
                html += criarHTMLParcela(
                    parcela
                );
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

        prepararDestinatariosParcelas(
            dados.parcelas
        );

    } catch (erro) {
        ocultarAreaDisparo();

        mostrarErro(erro);
    }
}

/* =====================================================
   HTML DE UMA PARCELA
===================================================== */

function criarHTMLParcela(
    parcela
) {
    const valorParcela =
        Number(
            parcela.valorParcela || 0
        );

    const valorRecebido =
        Number(
            parcela.valorRecebido || 0
        );

    const saldo =
        parcela.saldo !== undefined
            ? Number(
                parcela.saldo || 0
            )
            : Math.max(
                0,
                valorParcela -
                valorRecebido
            );

    return `
        <div class="relatorio-item">

            <strong>
                ${escaparHTML(
                    parcela.cliente ||
                    ""
                )}
            </strong>

            <span>
                Parcela:
                ${parcela.numeroParcela}
            </span>

            <span>
                Vencimento:
                ${formatarData(
                    parcela.vencimento
                )}
            </span>

            <span>
                Valor:
                ${moeda(
                    valorParcela
                )}
            </span>

            <span>
                Recebido:
                ${moeda(
                    valorRecebido
                )}
            </span>

            <span>
                Saldo:
                ${moeda(
                    saldo
                )}
            </span>

            <span>
                Status:
                ${escaparHTML(
                    parcela.status
                )}
            </span>

        </div>
    `;
}

/* =====================================================
   PREPARAR DESTINATÁRIOS DAS PARCELAS
===================================================== */

function prepararDestinatariosParcelas(
    parcelas
) {
    if (
        !Array.isArray(parcelas) ||
        parcelas.length === 0
    ) {
        ocultarAreaDisparo();

        return;
    }

    const clientesAgrupados = {};

    parcelas.forEach(
        function (parcela) {
            const nomeCliente =
                String(
                    parcela.cliente || ""
                ).trim();

            if (!nomeCliente) {
                return;
            }

            const chave =
                nomeCliente
                    .toLowerCase();

            if (!clientesAgrupados[chave]) {
                clientesAgrupados[chave] = {
                    cliente:
                        nomeCliente,

                    parcelas: []
                };
            }

            clientesAgrupados[
                chave
            ].parcelas.push(
                parcela
            );
        }
    );

    destinatariosDisparo =
        Object.values(
            clientesAgrupados
        ).map(
            function (grupo) {
                const clienteCadastro =
                    localizarClienteCadastrado(
                        grupo.cliente
                    );

                const parcelasNormalizadas =
                    grupo.parcelas.map(
                        function (parcela) {
                            const valorParcela =
                                Number(
                                    parcela.valorParcela ||
                                    parcela.valor ||
                                    0
                                );

                            const valorRecebido =
                                Number(
                                    parcela.valorRecebido ||
                                    0
                                );

                            const saldo =
                                parcela.saldo !== undefined
                                    ? Number(
                                        parcela.saldo || 0
                                    )
                                    : Math.max(
                                        0,
                                        valorParcela -
                                        valorRecebido
                                    );

                            return {
                                numeroParcela:
                                    Number(
                                        parcela.numeroParcela !== undefined
                                            ? parcela.numeroParcela
                                            : parcela.parcela || 0
                                    ),

                                valorParcela:
                                    arredondarCentavos(
                                        valorParcela
                                    ),

                                valorRecebido:
                                    arredondarCentavos(
                                        valorRecebido
                                    ),

                                saldo:
                                    arredondarCentavos(
                                        saldo
                                    ),

                                vencimento:
                                    parcela.vencimento,

                                status:
                                    parcela.status,

                                diasAtraso:
                                    parcela.diasAtraso !== undefined
                                        ? Number(
                                            parcela.diasAtraso || 0
                                        )
                                        : calcularDiasAtraso(
                                            parcela.vencimento
                                        )
                            };
                        }
                    );

                const totalSaldo =
                    parcelasNormalizadas.reduce(
                        function (
                            soma,
                            parcela
                        ) {
                            return (
                                soma +
                                Number(
                                    parcela.saldo || 0
                                )
                            );
                        },
                        0
                    );

                return {
                    id:
                        clienteCadastro
                            ? clienteCadastro.id
                            : null,

                    nome:
                        grupo.cliente,

                    contatoOriginal:
                        clienteCadastro
                            ? clienteCadastro.contato || ""
                            : "",

                    contatoNormalizado:
                        normalizarTelefoneWhatsapp(
                            clienteCadastro
                                ? clienteCadastro.contato
                                : ""
                        ),

                    clienteEncontrado:
                        Boolean(
                            clienteCadastro
                        ),

                    selecionado:
                        true,

                    parcelas:
                        parcelasNormalizadas,

                    totalSaldo:
                        arredondarCentavos(
                            totalSaldo
                        ),

                    statusFila:
                        "aguardando",

                    mensagemResultado:
                        ""
                };
            }
        );

    exibirAreaDisparo();
}

/* =====================================================
   LOCALIZAR CLIENTE CADASTRADO
===================================================== */

function normalizarTextoBusca(
    texto
) {
    return String(
        texto || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

function localizarClienteCadastrado(
    nome
) {
    const nomeBusca =
        normalizarTextoBusca(
            nome
        );

    return (
        clientesCadastrados.find(
            function (cliente) {
                return (
                    normalizarTextoBusca(
                        cliente.nome
                    ) ===
                    nomeBusca
                );
            }
        ) ||
        null
    );
}

/* =====================================================
   NORMALIZAR TELEFONE PARA WHATSAPP
===================================================== */

function normalizarTelefoneWhatsapp(
    telefone
) {
    let numero =
        String(
            telefone || ""
        ).replace(
            /\D/g,
            ""
        );

    if (!numero) {
        return "";
    }

    /*
     * Remove zeros usados antes do DDD.
     */
    while (
        numero.startsWith("0")
    ) {
        numero =
            numero.slice(1);
    }

    /*
     * Se o número ainda não possui o código
     * do Brasil, adiciona 55.
     */
    if (
        numero.length === 10 ||
        numero.length === 11
    ) {
        numero =
            "55" +
            numero;
    }

    /*
     * Formato brasileiro esperado:
     *
     * 55 + DDD + número
     *
     * Total geralmente entre 12 e 13 dígitos.
     */
    if (
        numero.length < 12 ||
        numero.length > 13 ||
        !numero.startsWith("55")
    ) {
        return "";
    }

    return numero;
}

/* =====================================================
   EXIBIR A ÁREA DE DISPARO
===================================================== */

function exibirAreaDisparo() {
    const area =
        document.getElementById(
            "area-disparo-whatsapp"
        );

    if (!area) {
        return;
    }

    area.hidden = false;

    /*
     * Seleciona automaticamente a primeira
     * mensagem ativa quando existir.
     */
    const selectMensagem =
        document.getElementById(
            "mensagem-disparo"
        );

    if (
        selectMensagem &&
        !selectMensagem.value &&
        mensagensWhatsapp.length > 0
    ) {
        selectMensagem.value =
            mensagensWhatsapp[0].id;
    }

    renderizarDestinatarios();

    atualizarResumoDestinatarios();

    atualizarPreviaDisparo();

    area.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* =====================================================
   RENDERIZAR DESTINATÁRIOS
===================================================== */

function renderizarDestinatarios() {
    const lista =
        document.getElementById(
            "lista-destinatarios"
        );

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    if (
        destinatariosDisparo.length === 0
    ) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum cliente disponível para o disparo.
            </p>
        `;

        return;
    }

    destinatariosDisparo.forEach(
        function (
            destinatario,
            indice
        ) {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "destinatario-item";

            if (
                !destinatario.contatoNormalizado
            ) {
                item.classList.add(
                    "destinatario-sem-contato"
                );
            }

            item.innerHTML = `
                <label class="destinatario-selecao">

                    <input
                        type="checkbox"
                        data-indice="${indice}"
                        ${
                            destinatario.selecionado
                                ? "checked"
                                : ""
                        }
                    >

                    <span class="destinatario-dados">

                        <strong>
                            ${escaparHTML(
                                destinatario.nome
                            )}
                        </strong>

                        <small>
                            WhatsApp:
                            ${
                                destinatario.contatoOriginal
                                    ? escaparHTML(
                                        destinatario.contatoOriginal
                                    )
                                    : "Não cadastrado"
                            }
                        </small>

                        <small>
                            Parcelas:
                            ${destinatario.parcelas.length}
                            |
                            Saldo:
                            ${moeda(
                                destinatario.totalSaldo
                            )}
                        </small>

                        <small
                            class="${
                                destinatario.contatoNormalizado
                                    ? "status-contato-valido"
                                    : "status-contato-invalido"
                            }"
                        >
                            ${
                                destinatario.contatoNormalizado
                                    ? "Contato válido para WhatsApp"
                                    : "Sem WhatsApp válido"
                            }
                        </small>

                    </span>

                </label>
            `;

            const checkbox =
                item.querySelector(
                    'input[type="checkbox"]'
                );

            checkbox.addEventListener(
                "change",
                function () {
                    destinatariosDisparo[
                        indice
                    ].selecionado =
                        checkbox.checked;

                    atualizarResumoDestinatarios();

                    atualizarPreviaDisparo();
                }
            );

            lista.appendChild(
                item
            );
        }
    );
}
/* =====================================================
   SELECIONAR E DESMARCAR DESTINATÁRIOS
===================================================== */

function selecionarTodosDestinatarios() {
    destinatariosDisparo.forEach(
        function (destinatario) {
            destinatario.selecionado =
                true;
        }
    );

    renderizarDestinatarios();

    atualizarResumoDestinatarios();

    atualizarPreviaDisparo();
}

function desmarcarTodosDestinatarios() {
    destinatariosDisparo.forEach(
        function (destinatario) {
            destinatario.selecionado =
                false;
        }
    );

    renderizarDestinatarios();

    atualizarResumoDestinatarios();

    atualizarPreviaDisparo();
}

/* =====================================================
   RESUMO DOS DESTINATÁRIOS
===================================================== */

function obterDestinatariosSelecionados() {
    return destinatariosDisparo.filter(
        function (destinatario) {
            return destinatario.selecionado;
        }
    );
}

function obterIntervaloSelecionado() {
    const campo =
        document.getElementById(
            "velocidade-disparo"
        );

    const velocidade =
        campo
            ? campo.value
            : "medio";

    return (
        VELOCIDADES_DISPARO[
            velocidade
        ] ||
        VELOCIDADES_DISPARO.medio
    );
}

function formatarTempoEstimado(
    totalSegundos
) {
    const segundos =
        Math.max(
            0,
            Math.round(
                totalSegundos
            )
        );

    if (segundos < 60) {
        return (
            segundos +
            (
                segundos === 1
                    ? " segundo"
                    : " segundos"
            )
        );
    }

    const minutos =
        Math.floor(
            segundos / 60
        );

    const segundosRestantes =
        segundos % 60;

    if (
        segundosRestantes === 0
    ) {
        return (
            minutos +
            (
                minutos === 1
                    ? " minuto"
                    : " minutos"
            )
        );
    }

    return (
        minutos +
        (
            minutos === 1
                ? " minuto e "
                : " minutos e "
        ) +
        segundosRestantes +
        (
            segundosRestantes === 1
                ? " segundo"
                : " segundos"
        )
    );
}

function atualizarResumoDestinatarios() {
    const selecionados =
        obterDestinatariosSelecionados();

    const comWhatsapp =
        selecionados.filter(
            function (destinatario) {
                return Boolean(
                    destinatario.contatoNormalizado
                );
            }
        );

    const semWhatsapp =
        selecionados.filter(
            function (destinatario) {
                return !destinatario.contatoNormalizado;
            }
        );

    const intervalo =
        obterIntervaloSelecionado();

    const quantidadeComWhatsapp =
        comWhatsapp.length;

    const tempoEstimado =
        quantidadeComWhatsapp > 1
            ? (
                quantidadeComWhatsapp -
                1
            ) *
            (
                intervalo /
                1000
            )
            : 0;

    const campoSelecionados =
        document.getElementById(
            "total-selecionados"
        );

    const campoComWhatsapp =
        document.getElementById(
            "total-com-whatsapp"
        );

    const campoSemWhatsapp =
        document.getElementById(
            "total-sem-whatsapp"
        );

    const campoTempo =
        document.getElementById(
            "tempo-estimado"
        );

    if (campoSelecionados) {
        campoSelecionados.textContent =
            selecionados.length;
    }

    if (campoComWhatsapp) {
        campoComWhatsapp.textContent =
            comWhatsapp.length;
    }

    if (campoSemWhatsapp) {
        campoSemWhatsapp.textContent =
            semWhatsapp.length;
    }

    if (campoTempo) {
        campoTempo.textContent =
            formatarTempoEstimado(
                tempoEstimado
            );
    }
}

/* =====================================================
   TRATAMENTO DO NOME
===================================================== */

function obterPrimeiroNome(
    nome
) {
    const partes =
        String(
            nome || ""
        )
            .trim()
            .split(/\s+/);

    return (
        partes[0] ||
        ""
    );
}

function aplicarFormaTratamento(
    destinatario,
    forma
) {
    const nomeCompleto =
        destinatario.nome || "";

    if (
        forma ===
        "nome_completo"
    ) {
        return nomeCompleto;
    }

    if (
        forma ===
        "primeiro_nome"
    ) {
        return obterPrimeiroNome(
            nomeCompleto
        );
    }

    /*
     * O cadastro atual ainda não possui
     * um campo separado de nome fantasia.
     *
     * Por enquanto usamos o próprio nome
     * do cliente como alternativa.
     */
    if (
        forma ===
        "nome_fantasia_completo"
    ) {
        return nomeCompleto;
    }

    if (
        forma ===
        "primeiro_nome_fantasia"
    ) {
        return obterPrimeiroNome(
            nomeCompleto
        );
    }

    return obterPrimeiroNome(
        nomeCompleto
    );
}

function obterFormaTratamentoSelecionada(
    mensagem
) {
    const campo =
        document.getElementById(
            "tratamento-disparo"
        );

    const valorCampo =
        campo
            ? campo.value
            : "mensagem";

    if (
        valorCampo ===
        "mensagem"
    ) {
        return (
            mensagem.formaTratamento ||
            "primeiro_nome"
        );
    }

    return valorCampo;
}

/* =====================================================
   OBTER MENSAGEM SELECIONADA
===================================================== */

function obterMensagemSelecionada() {
    const campo =
        document.getElementById(
            "mensagem-disparo"
        );

    const id =
        Number(
            campo
                ? campo.value
                : 0
        );

    if (!id) {
        return null;
    }

    return (
        mensagensWhatsapp.find(
            function (mensagem) {
                return Number(
                    mensagem.id
                ) === id;
            }
        ) ||
        null
    );
}

/* =====================================================
   CONSOLIDAR DADOS DAS PARCELAS
===================================================== */

function ordenarParcelasPorVencimento(
    parcelas
) {
    return [
        ...parcelas
    ].sort(
        function (a, b) {
            return String(
                a.vencimento || ""
            ).localeCompare(
                String(
                    b.vencimento || ""
                )
            );
        }
    );
}

function obterParcelaPrincipal(
    destinatario
) {
    const parcelasOrdenadas =
        ordenarParcelasPorVencimento(
            destinatario.parcelas
        );

    return (
        parcelasOrdenadas[0] ||
        {
            numeroParcela: 0,
            valorParcela: 0,
            valorRecebido: 0,
            saldo: 0,
            vencimento: "",
            diasAtraso: 0
        }
    );
}

function gerarResumoParcelasTexto(
    destinatario
) {
    const parcelasOrdenadas =
        ordenarParcelasPorVencimento(
            destinatario.parcelas
        );

    if (
        parcelasOrdenadas.length === 0
    ) {
        return "";
    }

    return parcelasOrdenadas
        .map(
            function (parcela) {
                return (
                    "Parcela " +
                    parcela.numeroParcela +
                    " - " +
                    moeda(
                        parcela.saldo
                    ) +
                    " - vencimento " +
                    formatarData(
                        parcela.vencimento
                    )
                );
            }
        )
        .join("\n");
}

/* =====================================================
   GERAR TEXTO PERSONALIZADO
===================================================== */

function gerarMensagemDestinatario(
    mensagem,
    destinatario
) {
    const formaTratamento =
        obterFormaTratamentoSelecionada(
            mensagem
        );

    const nomeTratamento =
        aplicarFormaTratamento(
            destinatario,
            formaTratamento
        );

    const parcelaPrincipal =
        obterParcelaPrincipal(
            destinatario
        );

    const totalValorParcelas =
        destinatario.parcelas.reduce(
            function (
                soma,
                parcela
            ) {
                return (
                    soma +
                    Number(
                        parcela.valorParcela ||
                        0
                    )
                );
            },
            0
        );

    const totalRecebido =
        destinatario.parcelas.reduce(
            function (
                soma,
                parcela
            ) {
                return (
                    soma +
                    Number(
                        parcela.valorRecebido ||
                        0
                    )
                );
            },
            0
        );

    const maiorDiasAtraso =
        destinatario.parcelas.reduce(
            function (
                maior,
                parcela
            ) {
                return Math.max(
                    maior,
                    Number(
                        parcela.diasAtraso ||
                        0
                    )
                );
            },
            0
        );

    let texto =
        String(
            mensagem.texto || ""
        );

    texto = texto
        .replaceAll(
            "{{nome_completo}}",
            destinatario.nome
        )
        .replaceAll(
            "{{primeiro_nome}}",
            obterPrimeiroNome(
                destinatario.nome
            )
        )
        .replaceAll(
            "{{nome_fantasia}}",
            destinatario.nome
        )
        .replaceAll(
            "{{primeiro_nome_fantasia}}",
            obterPrimeiroNome(
                destinatario.nome
            )
        )
        .replaceAll(
            "{{nome_cliente}}",
            nomeTratamento
        )
        .replaceAll(
            "{{valor_parcela}}",
            moeda(
                parcelaPrincipal.valorParcela
            )
        )
        .replaceAll(
            "{{valor_recebido}}",
            moeda(
                totalRecebido
            )
        )
        .replaceAll(
            "{{saldo}}",
            moeda(
                destinatario.totalSaldo
            )
        )
        .replaceAll(
            "{{vencimento}}",
            formatarData(
                parcelaPrincipal.vencimento
            )
        )
        .replaceAll(
            "{{numero_parcela}}",
            String(
                parcelaPrincipal.numeroParcela
            )
        )
        .replaceAll(
            "{{dias_atraso}}",
            String(
                maiorDiasAtraso
            )
        )
        .replaceAll(
            "{{quantidade_parcelas}}",
            String(
                destinatario.parcelas.length
            )
        )
        .replaceAll(
            "{{total_parcelas}}",
            moeda(
                totalValorParcelas
            )
        )
        .replaceAll(
            "{{lista_parcelas}}",
            gerarResumoParcelasTexto(
                destinatario
            )
        );

    /*
     * Caso a mensagem não tenha uma variável
     * específica de nome, mas tenha sido configurada
     * com forma de tratamento, o nome continuará
     * disponível pelas variáveis acima.
     */

    return texto.trim();
}

/* =====================================================
   PRÉVIA DO DISPARO
===================================================== */

function atualizarPreviaDisparo() {
    const previa =
        document.getElementById(
            "previa-disparo"
        );

    if (!previa) {
        return;
    }

    const mensagem =
        obterMensagemSelecionada();

    if (!mensagem) {
        previa.textContent =
            "Selecione uma mensagem para visualizar a prévia.";

        return;
    }

    const selecionados =
        obterDestinatariosSelecionados();

    if (
        selecionados.length === 0
    ) {
        previa.textContent =
            "Selecione pelo menos um cliente para visualizar a prévia.";

        return;
    }

    const destinatarioExemplo =
        selecionados[0];

    previa.textContent =
        gerarMensagemDestinatario(
            mensagem,
            destinatarioExemplo
        );
}

/* =====================================================
   PREPARAR FILA DE DISPARO
===================================================== */

function prepararFilaDisparo() {
    if (disparoEmAndamento) {
        alert(
            "Já existe uma fila em andamento."
        );

        return;
    }

    const mensagem =
        obterMensagemSelecionada();

    if (!mensagem) {
        alert(
            "Selecione uma mensagem."
        );

        document
            .getElementById(
                "mensagem-disparo"
            )
            .focus();

        return;
    }

    const selecionados =
        obterDestinatariosSelecionados();

    if (
        selecionados.length === 0
    ) {
        alert(
            "Selecione pelo menos um cliente."
        );

        return;
    }

    const comWhatsapp =
        selecionados.filter(
            function (destinatario) {
                return Boolean(
                    destinatario.contatoNormalizado
                );
            }
        );

    const semWhatsapp =
        selecionados.filter(
            function (destinatario) {
                return !destinatario.contatoNormalizado;
            }
        );

    if (
        comWhatsapp.length === 0
    ) {
        alert(
            "Nenhum cliente selecionado possui um WhatsApp válido."
        );

        return;
    }

    const velocidade =
        document.getElementById(
            "velocidade-disparo"
        ).value;

    const intervalo =
        VELOCIDADES_DISPARO[
            velocidade
        ] ||
        VELOCIDADES_DISPARO.medio;

    const confirmar =
        confirm(
            "Iniciar a fila de mensagens?\n\n" +
            "Clientes selecionados: " +
            selecionados.length +
            "\n" +
            "Com WhatsApp válido: " +
            comWhatsapp.length +
            "\n" +
            "Sem WhatsApp válido: " +
            semWhatsapp.length +
            "\n" +
            "Intervalo: " +
            intervalo / 1000 +
            " segundos\n\n" +
            "O sistema abrirá o WhatsApp com a mensagem preenchida para cada cliente."
        );

    if (!confirmar) {
        return;
    }

    filaDisparo =
        selecionados.map(
            function (destinatario) {
                return {
                    ...destinatario,

                    textoMensagem:
                        gerarMensagemDestinatario(
                            mensagem,
                            destinatario
                        ),

                    statusFila:
                        destinatario.contatoNormalizado
                            ? "aguardando"
                            : "sem_contato",

                    mensagemResultado:
                        destinatario.contatoNormalizado
                            ? "Aguardando processamento."
                            : "Cliente sem WhatsApp válido cadastrado."
                };
            }
        );

    indiceAtualDisparo = 0;

    disparoEmAndamento =
        true;

    disparoPausado =
        false;

    disparoCancelado =
        false;

    configurarBotoesDuranteDisparo();

    inicializarPainelProgresso();

    processarFilaDisparo();
}

/* =====================================================
   CONFIGURAR BOTÕES DURANTE O DISPARO
===================================================== */

function configurarBotoesDuranteDisparo() {
    const iniciar =
        document.getElementById(
            "btn-iniciar-disparo"
        );

    const pausar =
        document.getElementById(
            "btn-pausar-disparo"
        );

    const continuar =
        document.getElementById(
            "btn-continuar-disparo"
        );

    const cancelar =
        document.getElementById(
            "btn-cancelar-disparo"
        );

    if (iniciar) {
        iniciar.disabled =
            true;
    }

    if (pausar) {
        pausar.hidden =
            false;
    }

    if (continuar) {
        continuar.hidden =
            true;
    }

    if (cancelar) {
        cancelar.hidden =
            false;
    }
}

function restaurarBotoesDisparo() {
    const iniciar =
        document.getElementById(
            "btn-iniciar-disparo"
        );

    const pausar =
        document.getElementById(
            "btn-pausar-disparo"
        );

    const continuar =
        document.getElementById(
            "btn-continuar-disparo"
        );

    const cancelar =
        document.getElementById(
            "btn-cancelar-disparo"
        );

    if (iniciar) {
        iniciar.disabled =
            false;
    }

    if (pausar) {
        pausar.hidden =
            true;
    }

    if (continuar) {
        continuar.hidden =
            true;
    }

    if (cancelar) {
        cancelar.hidden =
            true;
    }
}

/* =====================================================
   PAUSAR, CONTINUAR E CANCELAR
===================================================== */

function pausarFilaDisparo() {
    if (!disparoEmAndamento) {
        return;
    }

    disparoPausado =
        true;

    const pausar =
        document.getElementById(
            "btn-pausar-disparo"
        );

    const continuar =
        document.getElementById(
            "btn-continuar-disparo"
        );

    if (pausar) {
        pausar.hidden =
            true;
    }

    if (continuar) {
        continuar.hidden =
            false;
    }
}

function continuarFilaDisparo() {
    if (!disparoEmAndamento) {
        return;
    }

    disparoPausado =
        false;

    const pausar =
        document.getElementById(
            "btn-pausar-disparo"
        );

    const continuar =
        document.getElementById(
            "btn-continuar-disparo"
        );

    if (pausar) {
        pausar.hidden =
            false;
    }

    if (continuar) {
        continuar.hidden =
            true;
    }
}

function cancelarFilaDisparo() {
    if (!disparoEmAndamento) {
        return;
    }

    const confirmar =
        confirm(
            "Deseja cancelar a fila de mensagens?"
        );

    if (!confirmar) {
        return;
    }

    disparoCancelado =
        true;

    disparoPausado =
        false;

    filaDisparo.forEach(
        function (
            item,
            indice
        ) {
            if (
                indice >=
                indiceAtualDisparo &&
                item.statusFila ===
                "aguardando"
            ) {
                item.statusFila =
                    "cancelado";

                item.mensagemResultado =
                    "Envio cancelado pelo usuário.";
            }
        }
    );

    atualizarPainelProgresso();
}
/* =====================================================
   INICIALIZAR PAINEL DE PROGRESSO
===================================================== */

function inicializarPainelProgresso() {
    const painel =
        document.getElementById(
            "painel-progresso-disparo"
        );

    const listaResultados =
        document.getElementById(
            "lista-resultados-disparo"
        );

    const progresso =
        document.getElementById(
            "progresso-disparo"
        );

    if (painel) {
        painel.hidden = false;
    }

    if (listaResultados) {
        listaResultados.innerHTML = "";
    }

    if (progresso) {
        progresso.style.width = "0%";
    }

    atualizarPainelProgresso();
}

/* =====================================================
   PROCESSAR FILA DE DISPARO
===================================================== */

async function processarFilaDisparo() {
    const intervalo =
        obterIntervaloSelecionado();

    while (
        indiceAtualDisparo <
        filaDisparo.length
    ) {
        if (
            disparoCancelado
        ) {
            finalizarFilaDisparo(
                "cancelado"
            );

            return;
        }

        while (
            disparoPausado &&
            !disparoCancelado
        ) {
            await aguardar(
                500
            );
        }

        if (
            disparoCancelado
        ) {
            finalizarFilaDisparo(
                "cancelado"
            );

            return;
        }

        const item =
            filaDisparo[
                indiceAtualDisparo
            ];

        /*
         * Clientes sem número válido são
         * registrados, mas não abrem o WhatsApp.
         */
        if (
            !item.contatoNormalizado
        ) {
            item.statusFila =
                "sem_contato";

            item.mensagemResultado =
                "Cliente sem WhatsApp válido cadastrado.";

            indiceAtualDisparo++;

            atualizarPainelProgresso();

            continue;
        }

        item.statusFila =
            "processando";

        item.mensagemResultado =
            "Abrindo conversa no WhatsApp...";

        atualizarPainelProgresso();

        try {
            const resultado =
                abrirWhatsappDestinatario(
                    item
                );

            if (!resultado.sucesso) {
                throw new Error(
                    resultado.erro
                );
            }

            /*
             * Nesta etapa, o navegador apenas abre
             * o WhatsApp com a mensagem preenchida.
             *
             * O sistema não consegue confirmar se o
             * usuário realmente pressionou "Enviar".
             */
            item.statusFila =
                "aberto_whatsapp";

            item.mensagemResultado =
                "Conversa aberta no WhatsApp. Confirme manualmente o envio.";

        } catch (erro) {
            console.error(
                "Erro ao abrir WhatsApp:",
                erro
            );

            item.statusFila =
                "erro";

            item.mensagemResultado =
                erro.message ||
                "Não foi possível abrir o WhatsApp.";
        }

        indiceAtualDisparo++;

        atualizarPainelProgresso();

        const aindaExistemItens =
            indiceAtualDisparo <
            filaDisparo.length;

        if (
            aindaExistemItens &&
            !disparoCancelado
        ) {
            await aguardarComPausa(
                intervalo
            );
        }
    }

    finalizarFilaDisparo(
        "concluido"
    );
}

/* =====================================================
   AGUARDAR INTERVALO COM PAUSA E CANCELAMENTO
===================================================== */

async function aguardarComPausa(
    milissegundos
) {
    let tempoRestante =
        Number(
            milissegundos
        );

    const passo =
        250;

    while (
        tempoRestante > 0
    ) {
        if (
            disparoCancelado
        ) {
            return;
        }

        if (
            disparoPausado
        ) {
            await aguardar(
                passo
            );

            continue;
        }

        await aguardar(
            Math.min(
                passo,
                tempoRestante
            )
        );

        tempoRestante -=
            passo;
    }
}

/* =====================================================
   ABRIR WHATSAPP
===================================================== */

function abrirWhatsappDestinatario(
    destinatario
) {
    if (
        !destinatario.contatoNormalizado
    ) {
        return {
            sucesso: false,
            erro:
                "O cliente não possui um WhatsApp válido."
        };
    }

    if (
        !destinatario.textoMensagem
    ) {
        return {
            sucesso: false,
            erro:
                "A mensagem do cliente está vazia."
        };
    }

    const numero =
        destinatario.contatoNormalizado;

    const texto =
        encodeURIComponent(
            destinatario.textoMensagem
        );

    const endereco =
        `https://wa.me/${numero}?text=${texto}`;

    /*
     * Tenta reutilizar a mesma janela.
     *
     * Alguns navegadores podem bloquear várias
     * janelas automáticas. Nesse caso, o usuário
     * deverá permitir pop-ups para o endereço local.
     */
    janelaWhatsapp =
        window.open(
            endereco,
            "disparo_whatsapp"
        );

    if (
        !janelaWhatsapp
    ) {
        return {
            sucesso: false,

            erro:
                "O navegador bloqueou a abertura do WhatsApp. Permita pop-ups para esta página."
        };
    }

    try {
        janelaWhatsapp.focus();
    } catch (erro) {
        console.warn(
            "Não foi possível focar a janela do WhatsApp.",
            erro
        );
    }

    return {
        sucesso: true
    };
}

/* =====================================================
   ATUALIZAR PAINEL DE PROGRESSO
===================================================== */

function atualizarPainelProgresso() {
    const total =
        filaDisparo.length;

    const aguardando =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "aguardando"
                );
            }
        ).length;

    const processando =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "processando"
                );
            }
        ).length;

    const abertosWhatsapp =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "aberto_whatsapp"
                );
            }
        ).length;

    const erros =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "erro"
                );
            }
        ).length;

    const semContato =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "sem_contato"
                );
            }
        ).length;

    const cancelados =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "cancelado"
                );
            }
        ).length;

    const processados =
        abertosWhatsapp +
        erros +
        semContato +
        cancelados;

    const percentual =
        total > 0
            ? Math.round(
                (
                    processados /
                    total
                ) *
                100
            )
            : 0;

    const campoAguardando =
        document.getElementById(
            "progresso-aguardando"
        );

    const campoProcessados =
        document.getElementById(
            "progresso-processados"
        );

    const campoEnviados =
        document.getElementById(
            "progresso-enviados"
        );

    const campoErros =
        document.getElementById(
            "progresso-erros"
        );

    const campoSemContato =
        document.getElementById(
            "progresso-sem-contato"
        );

    const barra =
        document.getElementById(
            "progresso-disparo"
        );

    if (campoAguardando) {
        campoAguardando.textContent =
            aguardando +
            processando;
    }

    if (campoProcessados) {
        campoProcessados.textContent =
            processados;
    }

    if (campoEnviados) {
        /*
         * Nesta etapa significa conversa aberta.
         * A confirmação real de envio virá com a API.
         */
        campoEnviados.textContent =
            abertosWhatsapp;
    }

    if (campoErros) {
        campoErros.textContent =
            erros;
    }

    if (campoSemContato) {
        campoSemContato.textContent =
            semContato;
    }

    if (barra) {
        barra.style.width =
            percentual +
            "%";

        barra.textContent =
            percentual +
            "%";
    }

    renderizarResultadosDisparo();
}

/* =====================================================
   RENDERIZAR RESULTADOS DO DISPARO
===================================================== */

function renderizarResultadosDisparo() {
    const lista =
        document.getElementById(
            "lista-resultados-disparo"
        );

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    filaDisparo.forEach(
        function (
            item,
            indice
        ) {
            const elemento =
                document.createElement(
                    "div"
                );

            elemento.className =
                "resultado-disparo-item";

            elemento.classList.add(
                obterClasseStatusDisparo(
                    item.statusFila
                )
            );

            elemento.innerHTML = `
                <div class="resultado-disparo-numero">
                    ${indice + 1}
                </div>

                <div class="resultado-disparo-dados">

                    <strong>
                        ${escaparHTML(
                            item.nome
                        )}
                    </strong>

                    <span>
                        ${
                            item.contatoOriginal
                                ? escaparHTML(
                                    item.contatoOriginal
                                )
                                : "Contato não cadastrado"
                        }
                    </span>

                    <small>
                        ${escaparHTML(
                            item.mensagemResultado ||
                            nomeStatusDisparo(
                                item.statusFila
                            )
                        )}
                    </small>

                </div>

                <span class="resultado-disparo-status">
                    ${escaparHTML(
                        nomeStatusDisparo(
                            item.statusFila
                        )
                    )}
                </span>
            `;

            lista.appendChild(
                elemento
            );
        }
    );
}

function obterClasseStatusDisparo(
    status
) {
    const classes = {
        aguardando:
            "status-aguardando",

        processando:
            "status-processando",

        aberto_whatsapp:
            "status-enviado",

        erro:
            "status-erro",

        sem_contato:
            "status-sem-contato",

        cancelado:
            "status-cancelado"
    };

    return (
        classes[status] ||
        "status-aguardando"
    );
}

function nomeStatusDisparo(
    status
) {
    const nomes = {
        aguardando:
            "Aguardando",

        processando:
            "Processando",

        aberto_whatsapp:
            "WhatsApp aberto",

        erro:
            "Erro",

        sem_contato:
            "Sem contato",

        cancelado:
            "Cancelado"
    };

    return (
        nomes[status] ||
        status
    );
}

/* =====================================================
   FINALIZAR FILA
===================================================== */

function finalizarFilaDisparo(
    motivo
) {
    disparoEmAndamento =
        false;

    disparoPausado =
        false;

    restaurarBotoesDisparo();

    atualizarPainelProgresso();

    const abertos =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "aberto_whatsapp"
                );
            }
        ).length;

    const erros =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "erro"
                );
            }
        ).length;

    const semContato =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "sem_contato"
                );
            }
        ).length;

    const cancelados =
        filaDisparo.filter(
            function (item) {
                return (
                    item.statusFila ===
                    "cancelado"
                );
            }
        ).length;

    if (
        motivo ===
        "cancelado"
    ) {
        alert(
            "Fila cancelada.\n\n" +
            "WhatsApp aberto: " +
            abertos +
            "\n" +
            "Erros: " +
            erros +
            "\n" +
            "Sem contato: " +
            semContato +
            "\n" +
            "Cancelados: " +
            cancelados
        );

        return;
    }

    alert(
        "Fila concluída.\n\n" +
        "Conversas abertas no WhatsApp: " +
        abertos +
        "\n" +
        "Erros: " +
        erros +
        "\n" +
        "Clientes sem contato: " +
        semContato +
        "\n\n" +
        "Atenção: nesta etapa o sistema confirma somente que a conversa foi aberta. A confirmação real do envio será feita após a integração com a API oficial."
    );
}

/* =====================================================
   HISTÓRICO FINANCEIRO DO CLIENTE
===================================================== */

function abrirFiltroHistoricoCliente() {
    ocultarAreaDisparo();

    clienteSelecionado = null;

    document.getElementById(
        "area-filtros"
    ).innerHTML = `
        <div class="filtro-box">

            <h3>
                Histórico financeiro do cliente
            </h3>

            <label>
                Cliente
            </label>

            <div class="linha-cliente">

                <input
                    type="text"
                    id="cliente-selecionado"
                    placeholder="Nenhum cliente selecionado"
                    readonly
                >

                <button
                    type="button"
                    onclick="abrirModalClientes('historico')"
                >
                    Buscar Cliente
                </button>

            </div>

            <button
                type="button"
                onclick="buscarHistoricoCliente()"
            >
                Gerar relatório
            </button>

        </div>
    `;

    document.getElementById(
        "area-relatorio"
    ).innerHTML = "";
}

async function buscarHistoricoCliente() {
    if (!clienteSelecionado) {
        alert(
            "Selecione um cliente."
        );

        return;
    }

    mostrarCarregando();

    try {
        const endereco =
            `/relatorios/historico-cliente` +
            `?cliente=${encodeURIComponent(
                clienteSelecionado.nome
            )}`;

        const dados =
            await buscarJSON(
                endereco
            );

        let html = `
            <h3>
                Histórico financeiro do cliente
            </h3>

            <p>
                <strong>Cliente:</strong>
                ${escaparHTML(
                    dados.cliente
                )}
            </p>

            <div class="resumo-relatorio">

                <div>
                    <span>Total comprado</span>

                    <strong>
                        ${moeda(
                            dados.totalComprado
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total recebido</span>

                    <strong>
                        ${moeda(
                            dados.totalRecebido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total em aberto</span>

                    <strong>
                        ${moeda(
                            dados.totalAberto
                        )}
                    </strong>
                </div>

                <div>
                    <span>Quantidade de compras</span>

                    <strong>
                        ${dados.quantidadeCompras}
                    </strong>
                </div>

            </div>

            <h4>Vendas</h4>
        `;

        if (
            dados.vendas.length === 0
        ) {
            html += `
                <p>
                    Nenhuma venda encontrada.
                </p>
            `;
        }

        dados.vendas.forEach(
            function (venda) {
                html += `
                    <div class="relatorio-item">

                        <strong>
                            Venda #${venda.id}
                        </strong>

                        <span>
                            Data:
                            ${formatarData(
                                venda.createdAt
                            )}
                        </span>

                        <span>
                            Total:
                            ${moeda(
                                venda.totalFinal
                            )}
                        </span>

                        <span>
                            Pagamento:
                            ${escaparHTML(
                                venda.formaPagamento
                            )}
                            -
                            ${escaparHTML(
                                venda.tipoPagamento
                            )}
                        </span>

                    </div>
                `;
            }
        );

        html += `
            <h4>
                Parcelas e recebimentos
            </h4>
        `;

        if (
            dados.recebimentos.length === 0
        ) {
            html += `
                <p>
                    Nenhuma parcela encontrada.
                </p>
            `;
        }

        dados.recebimentos.forEach(
            function (parcela) {
                html += criarHTMLParcela(
                    parcela
                );
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

    } catch (erro) {
        mostrarErro(erro);
    }
}

/* =====================================================
   RESUMO FINANCEIRO
===================================================== */

async function resumoFinanceiro() {
    ocultarAreaDisparo();

    document.getElementById(
        "area-filtros"
    ).innerHTML = "";

    mostrarCarregando();

    try {
        const dados =
            await buscarJSON(
                `/relatorios/resumo-financeiro`
            );

        document.getElementById(
            "area-relatorio"
        ).innerHTML = `
            <h3>Resumo financeiro</h3>

            <div class="resumo-relatorio">

                <div>
                    <span>Total vendido</span>

                    <strong>
                        ${moeda(
                            dados.totalVendido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total recebido</span>

                    <strong>
                        ${moeda(
                            dados.totalRecebido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total em aberto</span>

                    <strong>
                        ${moeda(
                            dados.totalAberto
                        )}
                    </strong>
                </div>

                <div>
                    <span>Total vencido</span>

                    <strong>
                        ${moeda(
                            dados.totalVencido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Estoque em custo</span>

                    <strong>
                        ${moeda(
                            dados.estoqueCusto
                        )}
                    </strong>
                </div>

                <div>
                    <span>Estoque em venda</span>

                    <strong>
                        ${moeda(
                            dados.estoqueVenda
                        )}
                    </strong>
                </div>

            </div>
        `;

    } catch (erro) {
        mostrarErro(erro);
    }
}

/* =====================================================
   VENDAS ENTRE DATAS
===================================================== */

function abrirFiltroVendasPeriodo() {
    ocultarAreaDisparo();

    clienteSelecionado = null;

    document.getElementById(
        "area-filtros"
    ).innerHTML = `
        <div class="filtro-box">

            <h3>
                Vendas entre datas
            </h3>

            <div class="linha-filtros">

                <div>
                    <label>
                        Data inicial
                    </label>

                    <input
                        type="date"
                        id="vendas-data-inicio"
                    >
                </div>

                <div>
                    <label>
                        Data final
                    </label>

                    <input
                        type="date"
                        id="vendas-data-fim"
                    >
                </div>

            </div>

            <button
                type="button"
                onclick="buscarVendasPeriodo()"
            >
                Gerar relatório
            </button>

        </div>
    `;

    document.getElementById(
        "area-relatorio"
    ).innerHTML = "";
}

async function buscarVendasPeriodo() {
    const inicio =
        document.getElementById(
            "vendas-data-inicio"
        ).value;

    const fim =
        document.getElementById(
            "vendas-data-fim"
        ).value;

    if (
        !validarDatas(
            inicio,
            fim
        )
    ) {
        return;
    }

    mostrarCarregando();

    try {
        const endereco =
            `/relatorios/vendas-periodo` +
            `?inicio=${encodeURIComponent(
                inicio
            )}` +
            `&fim=${encodeURIComponent(
                fim
            )}`;

        const dados =
            await buscarJSON(
                endereco
            );

        mostrarRelatorioVendas(
            "Vendas entre datas",
            dados
        );

    } catch (erro) {
        mostrarErro(erro);
    }
}

/* =====================================================
   VENDAS POR CLIENTE ENTRE DATAS
===================================================== */

function abrirFiltroVendasClientePeriodo() {
    ocultarAreaDisparo();

    clienteSelecionado = null;

    document.getElementById(
        "area-filtros"
    ).innerHTML = `
        <div class="filtro-box">

            <h3>
                Vendas por cliente entre datas
            </h3>

            <label>
                Cliente
            </label>

            <div class="linha-cliente">

                <input
                    type="text"
                    id="cliente-selecionado"
                    placeholder="Nenhum cliente selecionado"
                    readonly
                >

                <button
                    type="button"
                    onclick="abrirModalClientes('vendas-cliente')"
                >
                    Buscar Cliente
                </button>

            </div>

            <div class="linha-filtros">

                <div>
                    <label>
                        Data inicial
                    </label>

                    <input
                        type="date"
                        id="vendas-cliente-inicio"
                    >
                </div>

                <div>
                    <label>
                        Data final
                    </label>

                    <input
                        type="date"
                        id="vendas-cliente-fim"
                    >
                </div>

            </div>

            <button
                type="button"
                onclick="buscarVendasClientePeriodo()"
            >
                Gerar relatório
            </button>

        </div>
    `;

    document.getElementById(
        "area-relatorio"
    ).innerHTML = "";
}

async function buscarVendasClientePeriodo() {
    if (!clienteSelecionado) {
        alert(
            "Selecione um cliente."
        );

        return;
    }

    const inicio =
        document.getElementById(
            "vendas-cliente-inicio"
        ).value;

    const fim =
        document.getElementById(
            "vendas-cliente-fim"
        ).value;

    if (
        !validarDatas(
            inicio,
            fim
        )
    ) {
        return;
    }

    mostrarCarregando();

    try {
        const endereco =
            `/relatorios/vendas-cliente-periodo` +
            `?cliente=${encodeURIComponent(
                clienteSelecionado.nome
            )}` +
            `&inicio=${encodeURIComponent(
                inicio
            )}` +
            `&fim=${encodeURIComponent(
                fim
            )}`;

        const dados =
            await buscarJSON(
                endereco
            );

        mostrarRelatorioVendas(
            "Vendas por cliente entre datas",
            dados
        );

    } catch (erro) {
        mostrarErro(erro);
    }
}

function mostrarRelatorioVendas(
    titulo,
    dados
) {
    let html = `
        <h3>
            ${escaparHTML(
                titulo
            )}
        </h3>

        ${
            dados.cliente
                ? `
                    <p>
                        <strong>Cliente:</strong>
                        ${escaparHTML(
                            dados.cliente
                        )}
                    </p>
                `
                : ""
        }

        <div class="resumo-relatorio">

            <div>
                <span>Total vendido</span>

                <strong>
                    ${moeda(
                        dados.totalVendas
                    )}
                </strong>
            </div>

            <div>
                <span>Quantidade de vendas</span>

                <strong>
                    ${dados.quantidadeVendas}
                </strong>
            </div>

            <div>
                <span>Ticket médio</span>

                <strong>
                    ${moeda(
                        dados.ticketMedio
                    )}
                </strong>
            </div>

        </div>
    `;

    if (
        dados.vendas.length === 0
    ) {
        html += `
            <p>
                Nenhuma venda encontrada.
            </p>
        `;
    }

    dados.vendas.forEach(
        function (venda) {
            html += `
                <div class="relatorio-item">

                    <strong>
                        Venda #${venda.id}
                    </strong>

                    <span>
                        Cliente:
                        ${escaparHTML(
                            venda.cliente
                        )}
                    </span>

                    <span>
                        Total:
                        ${moeda(
                            venda.totalFinal
                        )}
                    </span>

                    <span>
                        Pagamento:
                        ${escaparHTML(
                            venda.formaPagamento
                        )}
                        -
                        ${escaparHTML(
                            venda.tipoPagamento
                        )}
                    </span>

                    <span>
                        Data:
                        ${formatarData(
                            venda.createdAt
                        )}
                    </span>

                </div>
            `;
        }
    );

    document.getElementById(
        "area-relatorio"
    ).innerHTML =
        html;
}

/* =====================================================
   RECEBIMENTOS ENTRE DATAS
===================================================== */

function abrirFiltroRecebimentosPeriodo() {
    ocultarAreaDisparo();

    document.getElementById(
        "area-filtros"
    ).innerHTML = `
        <div class="filtro-box">

            <h3>
                Recebimentos entre datas
            </h3>

            <div class="linha-filtros">

                <div>
                    <label>
                        Data inicial
                    </label>

                    <input
                        type="date"
                        id="recebimentos-inicio"
                    >
                </div>

                <div>
                    <label>
                        Data final
                    </label>

                    <input
                        type="date"
                        id="recebimentos-fim"
                    >
                </div>

            </div>

            <button
                type="button"
                onclick="buscarRecebimentosPeriodo()"
            >
                Gerar relatório
            </button>

        </div>
    `;

    document.getElementById(
        "area-relatorio"
    ).innerHTML = "";
}

async function buscarRecebimentosPeriodo() {
    const inicio =
        document.getElementById(
            "recebimentos-inicio"
        ).value;

    const fim =
        document.getElementById(
            "recebimentos-fim"
        ).value;

    if (
        !validarDatas(
            inicio,
            fim
        )
    ) {
        return;
    }

    mostrarCarregando();

    try {
        const endereco =
            `/relatorios/recebimentos-periodo` +
            `?inicio=${encodeURIComponent(
                inicio
            )}` +
            `&fim=${encodeURIComponent(
                fim
            )}`;

        const dados =
            await buscarJSON(
                endereco
            );

        let html = `
            <h3>
                Recebimentos entre datas
            </h3>

            <div class="resumo-relatorio">

                <div>
                    <span>Total recebido</span>

                    <strong>
                        ${moeda(
                            dados.totalRecebido
                        )}
                    </strong>
                </div>

                <div>
                    <span>Quantidade</span>

                    <strong>
                        ${dados.quantidadeRecebimentos}
                    </strong>
                </div>

            </div>
        `;

        if (
            dados.recebimentos.length === 0
        ) {
            html += `
                <p>
                    Nenhum recebimento encontrado.
                </p>
            `;
        }

        dados.recebimentos.forEach(
            function (item) {
                html += `
                    <div class="relatorio-item">

                        <strong>
                            ${escaparHTML(
                                item.cliente
                            )}
                        </strong>

                        <span>
                            Parcela:
                            ${item.numeroParcela}
                        </span>

                        <span>
                            Valor recebido:
                            ${moeda(
                                item.valorRecebido
                            )}
                        </span>

                        <span>
                            Data:
                            ${formatarData(
                                item.dataRecebimento
                            )}
                        </span>

                    </div>
                `;
            }
        );

        document.getElementById(
            "area-relatorio"
        ).innerHTML =
            html;

    } catch (erro) {
        mostrarErro(erro);
    }
}

/* =====================================================
   SALVAR PDF
===================================================== */

function salvarPDF() {
    const area =
        document.getElementById(
            "area-relatorio"
        );

    if (
        !area ||
        !area.innerText.trim() ||
        area.querySelector(
            ".mensagem-inicial"
        )
    ) {
        alert(
            "Gere um relatório antes de salvar."
        );

        return;
    }

    if (
        typeof html2pdf !==
        "function"
    ) {
        alert(
            "Não foi possível carregar o gerador de PDF."
        );

        return;
    }

    html2pdf()
        .set({
            margin:
                10,

            filename:
                "relatorio-meu-negocio-hinode.pdf",

            image: {
                type:
                    "jpeg",

                quality:
                    0.98
            },

            html2canvas: {
                scale:
                    2
            },

            jsPDF: {
                unit:
                    "mm",

                format:
                    "a4",

                orientation:
                    "portrait"
            }
        })
        .from(
            area
        )
        .save();
}

/* =====================================================
   COMPARTILHAR RELATÓRIO
===================================================== */

async function compartilharRelatorio() {
    const area =
        document.getElementById(
            "area-relatorio"
        );

    if (
        !area ||
        !area.innerText.trim() ||
        area.querySelector(
            ".mensagem-inicial"
        )
    ) {
        alert(
            "Gere um relatório antes de compartilhar."
        );

        return;
    }

    const texto =
        area.innerText;

    try {
        if (
            navigator.share
        ) {
            await navigator.share({
                title:
                    "Relatório Meu Negócio Hinode",

                text:
                    texto
            });

            return;
        }

        if (
            navigator.clipboard
        ) {
            await navigator.clipboard.writeText(
                texto
            );

            alert(
                "Relatório copiado para a área de transferência."
            );

            return;
        }

        throw new Error(
            "O navegador não permite compartilhamento ou cópia automática."
        );

    } catch (erro) {
        if (
            erro.name ===
            "AbortError"
        ) {
            return;
        }

        console.error(
            "Erro ao compartilhar relatório:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível compartilhar o relatório."
        );
    }
}

/* =====================================================
   FECHAR MODAL AO CLICAR FORA
===================================================== */

document.addEventListener(
    "click",
    function (evento) {
        const modal =
            document.getElementById(
                "modal-clientes"
            );

        if (
            modal &&
            !modal.hidden &&
            evento.target === modal
        ) {
            fecharModalClientes();
        }
    }
);

/* =====================================================
   FECHAR MODAL COM ESC
===================================================== */

document.addEventListener(
    "keydown",
    function (evento) {
        if (
            evento.key ===
            "Escape"
        ) {
            fecharModalClientes();
        }
    }
);

/* =====================================================
   TESTE DE CARREGAMENTO
===================================================== */

console.log(
    "relatorios.js carregado completamente."
);