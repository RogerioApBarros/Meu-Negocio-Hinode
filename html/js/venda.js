let clientesCadastrados = [];
let produtosCadastrados = [];
let itensVenda = [];

let totalVenda = 0;
let totalFinal = 0;
let valorRecebidoEntrada = 0;
let saldoParcelar = 0;

let modoParcelamento = "quantidade";

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

        configurarDataMinimaVencimento();

        mostrarCamposPagamento();

        calcularTotais();

        await Promise.all([
            carregarClientes(),
            carregarProdutos()
        ]);

        console.log(
            "Tela de vendas inicializada corretamente."
        );

    } catch (erro) {
        console.error(
            "Erro ao inicializar a tela de vendas:",
            erro
        );

        alert(
            "A tela de vendas não pôde ser inicializada.\n\n" +
            erro.message
        );
    }
}

function registrarEventos() {
    const elementosObrigatorios = [
        "btn-buscar-cliente",
        "btn-buscar-produto",
        "fechar-modal-clientes",
        "fechar-modal-produtos",
        "pesquisa-cliente",
        "pesquisa-produto",
        "btn-adicionar-produto",
        "desconto",
        "tipo-desconto",
        "valor-recebido",
        "forma-pagamento",
        "tipo-prazo",
        "dia-pagamento",
        "dia-vale",
        "primeiro-vencimento",
        "valor-parcela",
        "quantidade-parcelas",
        "btn-registrar-venda",
        "modal-clientes",
        "modal-produtos"
    ];

    elementosObrigatorios.forEach(
        function (id) {
            const elemento =
                document.getElementById(id);

            if (!elemento) {
                throw new Error(
                    "Elemento não encontrado no HTML: #" +
                    id
                );
            }
        }
    );

    document
        .getElementById(
            "btn-buscar-cliente"
        )
        .addEventListener(
            "click",
            abrirModalClientes
        );

    document
        .getElementById(
            "btn-buscar-produto"
        )
        .addEventListener(
            "click",
            abrirModalProdutos
        );

    document
        .getElementById(
            "fechar-modal-clientes"
        )
        .addEventListener(
            "click",
            fecharModalClientes
        );

    document
        .getElementById(
            "fechar-modal-produtos"
        )
        .addEventListener(
            "click",
            fecharModalProdutos
        );

    document
        .getElementById(
            "pesquisa-cliente"
        )
        .addEventListener(
            "input",
            filtrarClientesModal
        );

    document
        .getElementById(
            "pesquisa-produto"
        )
        .addEventListener(
            "input",
            filtrarProdutosModal
        );

    document
        .getElementById(
            "btn-adicionar-produto"
        )
        .addEventListener(
            "click",
            adicionarProdutoVenda
        );

    document
        .getElementById(
            "desconto"
        )
        .addEventListener(
            "input",
            calcularTotais
        );

    document
        .getElementById(
            "tipo-desconto"
        )
        .addEventListener(
            "change",
            calcularTotais
        );

    document
        .getElementById(
            "valor-recebido"
        )
        .addEventListener(
            "input",
            calcularSaldoParcelar
        );

    document
        .getElementById(
            "forma-pagamento"
        )
        .addEventListener(
            "change",
            mostrarCamposPagamento
        );

    document
        .getElementById(
            "tipo-prazo"
        )
        .addEventListener(
            "change",
            alterarTipoPrazo
        );

    document
        .getElementById(
            "dia-pagamento"
        )
        .addEventListener(
            "input",
            atualizarResumoParcelamento
        );

    document
        .getElementById(
            "dia-vale"
        )
        .addEventListener(
            "input",
            atualizarResumoParcelamento
        );

    /*
     * Enquanto a data estiver sendo digitada,
     * o sistema não apresenta alerta.
     *
     * A data será validada somente ao clicar
     * no botão Registrar Venda.
     */
    document
        .getElementById(
            "primeiro-vencimento"
        )
        .addEventListener(
            "input",
            atualizarResumoParcelamento
        );

    document
        .getElementById(
            "valor-parcela"
        )
        .addEventListener(
            "input",
            calcularPorValorParcela
        );

    document
        .getElementById(
            "quantidade-parcelas"
        )
        .addEventListener(
            "input",
            calcularPorQuantidade
        );

    document
        .getElementById(
            "btn-registrar-venda"
        )
        .addEventListener(
            "click",
            registrarVenda
        );

    document
        .getElementById(
            "modal-clientes"
        )
        .addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target.id ===
                    "modal-clientes"
                ) {
                    fecharModalClientes();
                }
            }
        );

    document
        .getElementById(
            "modal-produtos"
        )
        .addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target.id ===
                    "modal-produtos"
                ) {
                    fecharModalProdutos();
                }
            }
        );

    document.addEventListener(
        "keydown",
        function (evento) {
            if (evento.key !== "Escape") {
                return;
            }

            fecharModalClientes();
            fecharModalProdutos();
        }
    );
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

function arredondarCentavos(valor) {
    return (
        Math.round(
            Number(valor || 0) * 100
        ) / 100
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

/* =====================================================
   FUNÇÕES DE DATA
===================================================== */

function formatarDataBanco(data) {
    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            data.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${ano}-${mes}-${dia}`;
}

function obterDataAtualTexto() {
    return formatarDataBanco(
        new Date()
    );
}

function configurarDataMinimaVencimento() {
    const campoData =
        document.getElementById(
            "primeiro-vencimento"
        );

    if (!campoData) {
        return;
    }

    campoData.min =
        obterDataAtualTexto();
}

function dataCompleta(dataTexto) {
    return /^\d{4}-\d{2}-\d{2}$/.test(
        String(
            dataTexto || ""
        )
    );
}

function criarDataLocal(dataTexto) {
    if (!dataCompleta(dataTexto)) {
        return null;
    }

    const partes =
        dataTexto
            .split("-")
            .map(Number);

    const ano =
        partes[0];

    const mes =
        partes[1];

    const dia =
        partes[2];

    const data =
        new Date(
            ano,
            mes - 1,
            dia
        );

    if (
        data.getFullYear() !== ano ||
        data.getMonth() !== mes - 1 ||
        data.getDate() !== dia
    ) {
        return null;
    }

    return data;
}

function formatarDataBrasileira(
    dataTexto
) {
    if (!dataCompleta(dataTexto)) {
        return dataTexto || "";
    }

    const partes =
        dataTexto.split("-");

    const ano =
        partes[0];

    const mes =
        partes[1];

    const dia =
        partes[2];

    return `${dia}/${mes}/${ano}`;
}

function validarPrimeiroVencimento() {
    const campoData =
        document.getElementById(
            "primeiro-vencimento"
        );

    const dataInformada =
        campoData.value;

    if (!dataInformada) {
        alert(
            "Informe a data da primeira parcela."
        );

        campoData.focus();

        return false;
    }

    if (!dataCompleta(dataInformada)) {
        alert(
            "Preencha completamente a data da primeira parcela."
        );

        campoData.focus();

        return false;
    }

    const dataConvertida =
        criarDataLocal(
            dataInformada
        );

    if (!dataConvertida) {
        alert(
            "Informe uma data válida."
        );

        campoData.focus();

        return false;
    }

    const hoje =
        obterDataAtualTexto();

    if (dataInformada < hoje) {
        alert(
            "A data da primeira parcela não pode ser anterior à data atual."
        );

        campoData.focus();

        return false;
    }

    return true;
}

function ultimoDiaDoMes(
    ano,
    mes
) {
    return new Date(
        ano,
        mes + 1,
        0
    ).getDate();
}

function criarDataComDia(
    ano,
    mes,
    diaDesejado
) {
    const ultimoDia =
        ultimoDiaDoMes(
            ano,
            mes
        );

    const diaValido =
        Math.min(
            Number(
                diaDesejado
            ),
            ultimoDia
        );

    return new Date(
        ano,
        mes,
        diaValido
    );
}

/* =====================================================
   RESPOSTAS DO BACKEND
===================================================== */

async function lerRespostaJSON(
    resposta
) {
    const tipo =
        resposta.headers.get(
            "content-type"
        ) || "";

    if (
        !tipo.includes(
            "application/json"
        )
    ) {
        const texto =
            await resposta.text();

        throw new Error(
            texto ||
            "O servidor respondeu com formato inválido. HTTP " +
            resposta.status
        );
    }

    return resposta.json();
}

/* =====================================================
   CARREGAR CLIENTES
===================================================== */

async function carregarClientes() {
    try {
        const dados = await window.API.requisicao("/clientes");

        clientesCadastrados = Array.isArray(dados) ? dados : [];

        clientesCadastrados.sort(function (a, b) {
            return String(a.nome || "").localeCompare(
                String(b.nome || ""),
                "pt-BR"
            );
        });

        console.log("Clientes carregados:", clientesCadastrados.length);

    } catch (erro) {
        console.error("Erro ao carregar clientes:", erro);
        clientesCadastrados = [];

        alert(
            "Não foi possível carregar os clientes.\n\n" +
            (erro.message || "Erro ao consultar o servidor.")
        );
    }
}

/* =====================================================
   CARREGAR PRODUTOS
===================================================== */

async function carregarProdutos() {
    try {
        const dados = await window.API.requisicao("/produtos");

        produtosCadastrados = Array.isArray(dados) ? dados : [];

        produtosCadastrados.sort(function (a, b) {
            return String(a.nomeProduto || "").localeCompare(
                String(b.nomeProduto || ""),
                "pt-BR"
            );
        });

        console.log("Produtos carregados:", produtosCadastrados.length);

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        produtosCadastrados = [];

        alert(
            "Não foi possível carregar os produtos.\n\n" +
            (erro.message || "Erro ao consultar o servidor.")
        );
    }
}

/* =====================================================
   MODAL DE CLIENTES
===================================================== */

function abrirModalClientes() {
    const modal =
        document.getElementById(
            "modal-clientes"
        );

    const pesquisa =
        document.getElementById(
            "pesquisa-cliente"
        );

    if (!modal || !pesquisa) {
        alert(
            "Erro: o modal de clientes não foi encontrado no HTML."
        );

        return;
    }

    modal.hidden = false;

    /*
     * Esta classe garante que o modal fique visível
     * com o CSS atual.
     */
    modal.classList.add(
        "modal-aberto"
    );

    pesquisa.value = "";

    mostrarClientesModal(
        clientesCadastrados
    );

    setTimeout(
        function () {
            pesquisa.focus();
        },
        50
    );
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
                "pesquisa-cliente"
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
                        cliente.cidade || ""
                    )
                        .toLowerCase()
                        .includes(busca) ||

                    String(
                        cliente.cpf || ""
                    )
                        .toLowerCase()
                        .includes(busca)
                );
            }
        );

    mostrarClientesModal(
        filtrados
    );
}

function mostrarClientesModal(
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
            <div class="mensagem-modal">
                Nenhum cliente encontrado.
            </div>
        `;

        return;
    }

    clientes.forEach(
        function (cliente) {
            const item =
                document.createElement(
                    "button"
                );

            item.type =
                "button";

            item.className =
                "item-modal";

            item.innerHTML = `
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

            item.addEventListener(
                "click",
                function () {
                    selecionarCliente(
                        cliente
                    );
                }
            );

            lista.appendChild(
                item
            );
        }
    );
}

function selecionarCliente(
    cliente
) {
    const campoCliente =
        document.getElementById(
            "cliente"
        );

    campoCliente.value =
        cliente.nome;

    campoCliente.dataset.clienteId =
        cliente.id;

    fecharModalClientes();
}
/* =====================================================
   MODAL DE PRODUTOS
===================================================== */

function abrirModalProdutos() {
    const modal =
        document.getElementById(
            "modal-produtos"
        );

    const pesquisa =
        document.getElementById(
            "pesquisa-produto"
        );

    if (!modal || !pesquisa) {
        alert(
            "Erro: o modal de produtos não foi encontrado no HTML."
        );

        return;
    }

    modal.hidden = false;

    /*
     * Esta classe garante que o modal fique visível
     * com o CSS atual.
     */
    modal.classList.add(
        "modal-aberto"
    );

    pesquisa.value = "";

    mostrarProdutosModal(
        produtosCadastrados
    );

    setTimeout(
        function () {
            pesquisa.focus();
        },
        50
    );
}

function fecharModalProdutos() {
    const modal =
        document.getElementById(
            "modal-produtos"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "modal-aberto"
    );

    modal.hidden = true;
}

function filtrarProdutosModal() {
    const busca =
        document
            .getElementById(
                "pesquisa-produto"
            )
            .value
            .toLowerCase()
            .trim();

    const filtrados =
        produtosCadastrados.filter(
            function (produto) {
                return (
                    String(
                        produto.nomeProduto ||
                        ""
                    )
                        .toLowerCase()
                        .includes(busca) ||

                    String(
                        produto.marca ||
                        ""
                    )
                        .toLowerCase()
                        .includes(busca)
                );
            }
        );

    mostrarProdutosModal(
        filtrados
    );
}

function mostrarProdutosModal(
    produtos
) {
    const lista =
        document.getElementById(
            "lista-produtos-modal"
        );

    lista.innerHTML = "";

    if (
        produtos.length === 0
    ) {
        lista.innerHTML = `
            <div class="mensagem-modal">
                Nenhum produto encontrado.
            </div>
        `;

        return;
    }

    produtos.forEach(
        function (produto) {
            const item =
                document.createElement(
                    "button"
                );

            item.type =
                "button";

            item.className =
                "item-modal";

            item.innerHTML = `
                <strong>
                    ${escaparHTML(
                        produto.nomeProduto
                    )}
                </strong>

                <span>
                    Marca:
                    ${escaparHTML(
                        produto.marca ||
                        "Não informada"
                    )}
                </span>

                <span>
                    Valor:
                    ${moeda(
                        produto.valorVenda
                    )}
                    |
                    Estoque:
                    ${produto.quantidade}
                </span>
            `;

            item.addEventListener(
                "click",
                function () {
                    selecionarProduto(
                        produto
                    );
                }
            );

            lista.appendChild(
                item
            );
        }
    );
}

function selecionarProduto(
    produto
) {
    const campoProduto =
        document.getElementById(
            "produto"
        );

    campoProduto.value =
        produto.nomeProduto;

    campoProduto.dataset.produtoId =
        produto.id;

    fecharModalProdutos();

    document
        .getElementById(
            "quantidade"
        )
        .focus();
}

/* =====================================================
   ITENS DA VENDA
===================================================== */

function adicionarProdutoVenda() {
    const campoProduto =
        document.getElementById(
            "produto"
        );

    const produtoId =
        Number(
            campoProduto.dataset.produtoId
        );

    const quantidade =
        Number(
            document.getElementById(
                "quantidade"
            ).value
        );

    if (!produtoId) {
        alert(
            "Selecione um produto."
        );

        return;
    }

    if (
        !Number.isInteger(
            quantidade
        ) ||
        quantidade <= 0
    ) {
        alert(
            "Informe uma quantidade válida."
        );

        return;
    }

    const produto =
        produtosCadastrados.find(
            function (item) {
                return Number(
                    item.id
                ) === produtoId;
            }
        );

    if (!produto) {
        alert(
            "Produto não encontrado."
        );

        return;
    }

    const itemExistente =
        itensVenda.find(
            function (item) {
                return Number(
                    item.produtoId
                ) === produtoId;
            }
        );

    const quantidadeExistente =
        itemExistente
            ? Number(
                itemExistente.quantidade
            )
            : 0;

    const quantidadeTotal =
        quantidadeExistente +
        quantidade;

    if (
        quantidadeTotal >
        Number(
            produto.quantidade
        )
    ) {
        alert(
            "Estoque insuficiente.\n\n" +
            "Estoque disponível: " +
            produto.quantidade
        );

        return;
    }

    const valorProduto =
        Number(
            produto.valorVenda
        );

    if (itemExistente) {
        itemExistente.quantidade =
            quantidadeTotal;

        itemExistente.subtotal =
            arredondarCentavos(
                itemExistente.quantidade *
                itemExistente.valorProduto
            );

    } else {
        itensVenda.push({
            produtoId:
                produto.id,

            produto:
                produto.nomeProduto,

            quantidade:
                quantidade,

            valorProduto:
                valorProduto,

            subtotal:
                arredondarCentavos(
                    quantidade *
                    valorProduto
                )
        });
    }

    campoProduto.value = "";

    delete campoProduto.dataset.produtoId;

    document.getElementById(
        "quantidade"
    ).value = "";

    atualizarListaItens();
    calcularTotais();
}

function removerItem(
    indice
) {
    itensVenda.splice(
        indice,
        1
    );

    atualizarListaItens();
    calcularTotais();
}

function atualizarListaItens() {
    const lista =
        document.getElementById(
            "lista-itens"
        );

    lista.innerHTML = "";

    itensVenda.forEach(
        function (
            item,
            indice
        ) {
            const elemento =
                document.createElement(
                    "div"
                );

            elemento.className =
                "item-venda";

            elemento.innerHTML = `
                <div>
                    <strong>
                        ${escaparHTML(
                            item.produto
                        )}
                    </strong>

                    <span>
                        Valor:
                        ${moeda(
                            item.valorProduto
                        )}
                    </span>

                    <span>
                        Quantidade:
                        ${item.quantidade}
                    </span>

                    <span>
                        Subtotal:
                        ${moeda(
                            item.subtotal
                        )}
                    </span>
                </div>
            `;

            const botao =
                document.createElement(
                    "button"
                );

            botao.type =
                "button";

            botao.className =
                "botao-remover";

            botao.textContent =
                "Remover";

            botao.addEventListener(
                "click",
                function () {
                    removerItem(
                        indice
                    );
                }
            );

            elemento.appendChild(
                botao
            );

            lista.appendChild(
                elemento
            );
        }
    );
}

/* =====================================================
   TOTAIS, DESCONTO E ENTRADA
===================================================== */

function calcularTotais() {
    totalVenda =
        itensVenda.reduce(
            function (
                soma,
                item
            ) {
                return (
                    soma +
                    Number(
                        item.subtotal
                    )
                );
            },
            0
        );

    totalVenda =
        arredondarCentavos(
            totalVenda
        );

    const desconto =
        Number(
            document.getElementById(
                "desconto"
            ).value
        ) || 0;

    const tipoDesconto =
        document.getElementById(
            "tipo-desconto"
        ).value;

    totalFinal =
        totalVenda;

    if (desconto > 0) {
        if (
            tipoDesconto ===
            "porcentagem"
        ) {
            totalFinal =
                totalVenda -
                (
                    totalVenda *
                    desconto /
                    100
                );

        } else {
            totalFinal =
                totalVenda -
                desconto;
        }
    }

    if (totalFinal < 0) {
        totalFinal = 0;
    }

    totalFinal =
        arredondarCentavos(
            totalFinal
        );

    document.getElementById(
        "total-venda"
    ).textContent =
        "Total da venda: " +
        moeda(
            totalVenda
        );

    document.getElementById(
        "total-final"
    ).textContent =
        "Total final: " +
        moeda(
            totalFinal
        );

    calcularSaldoParcelar();
}

function calcularSaldoParcelar() {
    const valorDigitado =
        Number(
            document.getElementById(
                "valor-recebido"
            ).value
        ) || 0;

    valorRecebidoEntrada =
        Math.max(
            0,
            valorDigitado
        );

    saldoParcelar =
        arredondarCentavos(
            totalFinal -
            valorRecebidoEntrada
        );

    if (
        saldoParcelar < 0
    ) {
        saldoParcelar = 0;
    }

    document.getElementById(
        "saldo-parcelar"
    ).textContent =
        moeda(
            saldoParcelar
        );

    atualizarResumoParcelamento();
}

/* =====================================================
   FORMA DE PAGAMENTO
===================================================== */

function mostrarCamposPagamento() {
    const forma =
        document.getElementById(
            "forma-pagamento"
        ).value;

    document.getElementById(
        "area-avista"
    ).hidden =
        forma !==
        "avista";

    document.getElementById(
        "area-prazo"
    ).hidden =
        forma !==
        "prazo";

    alterarTipoPrazo();
    atualizarResumoParcelamento();
}

function alterarTipoPrazo() {
    const tipo =
        document.getElementById(
            "tipo-prazo"
        ).value;

    document.getElementById(
        "configuracao-pagamento-vale"
    ).hidden =
        tipo !==
        "pagamento-vale";

    atualizarResumoParcelamento();
}

/* =====================================================
   PARCELAMENTO
===================================================== */

function dividirParcelasExatas(
    totalCentavos,
    quantidade
) {
    const valorBase =
        Math.floor(
            totalCentavos /
            quantidade
        );

    const resto =
        totalCentavos %
        quantidade;

    const parcelas = [];

    for (
        let indice = 0;
        indice < quantidade;
        indice++
    ) {
        let centavos =
            valorBase;

        if (
            indice < resto
        ) {
            centavos += 1;
        }

        parcelas.push(
            centavos /
            100
        );
    }

    return parcelas;
}

function dividirValorEmParcelas(
    valorTotal,
    quantidade
) {
    const totalCentavos =
        Math.round(
            Number(
                valorTotal
            ) * 100
        );

    quantidade =
        Number(
            quantidade
        );

    if (
        totalCentavos <= 0 ||
        !Number.isInteger(
            quantidade
        ) ||
        quantidade <= 0
    ) {
        return [];
    }

    if (
        quantidade === 1
    ) {
        return [
            totalCentavos /
            100
        ];
    }

    const totalReais =
        totalCentavos /
        100;

    const media =
        totalReais /
        quantidade;

    const centavosDoTotal =
        totalCentavos %
        100;

    const parcelas = [];

    /*
     * Exemplo:
     * R$ 230,00 em 3x:
     * 75, 75 e 80.
     */
    if (
        centavosDoTotal === 0
    ) {
        const valorBase =
            Math.floor(
                media /
                5
            ) * 5;

        if (
            valorBase <= 0
        ) {
            return dividirParcelasExatas(
                totalCentavos,
                quantidade
            );
        }

        for (
            let indice = 0;
            indice <
                quantidade - 1;
            indice++
        ) {
            parcelas.push(
                valorBase
            );
        }

        const ultimaParcela =
            arredondarCentavos(
                totalReais -
                (
                    valorBase *
                    (
                        quantidade -
                        1
                    )
                )
            );

        if (
            ultimaParcela <= 0
        ) {
            return dividirParcelasExatas(
                totalCentavos,
                quantidade
            );
        }

        parcelas.push(
            ultimaParcela
        );

        return parcelas;
    }

    /*
     * Exemplo:
     * R$ 199,90 em 3x:
     * 59,90, 70 e 70.
     */
    let valorRedondo =
        Math.round(
            media /
            10
        ) * 10;

    let primeiraParcela =
        arredondarCentavos(
            totalReais -
            (
                valorRedondo *
                (
                    quantidade -
                    1
                )
            )
        );

    if (
        primeiraParcela <= 0
    ) {
        valorRedondo =
            Math.floor(
                media /
                10
            ) * 10;

        primeiraParcela =
            arredondarCentavos(
                totalReais -
                (
                    valorRedondo *
                    (
                        quantidade -
                        1
                    )
                )
            );
    }

    if (
        valorRedondo <= 0 ||
        primeiraParcela <= 0
    ) {
        return dividirParcelasExatas(
            totalCentavos,
            quantidade
        );
    }

    parcelas.push(
        primeiraParcela
    );

    for (
        let indice = 1;
        indice < quantidade;
        indice++
    ) {
        parcelas.push(
            valorRedondo
        );
    }

    return parcelas;
}
function gerarParcelasPorValor(
    valorTotal,
    valorParcela
) {
    let restanteCentavos =
        Math.round(
            Number(
                valorTotal
            ) * 100
        );

    const parcelaCentavos =
        Math.round(
            Number(
                valorParcela
            ) * 100
        );

    if (
        restanteCentavos <= 0 ||
        parcelaCentavos <= 0
    ) {
        return [];
    }

    const parcelas = [];

    while (
        restanteCentavos > 0
    ) {
        const valorAtual =
            Math.min(
                parcelaCentavos,
                restanteCentavos
            );

        parcelas.push(
            valorAtual /
            100
        );

        restanteCentavos -=
            valorAtual;
    }

    return parcelas;
}

function calcularPorValorParcela() {
    modoParcelamento =
        "valor";

    const valorParcela =
        Number(
            document.getElementById(
                "valor-parcela"
            ).value
        );

    if (
        valorParcela > 0 &&
        saldoParcelar > 0
    ) {
        const parcelas =
            gerarParcelasPorValor(
                saldoParcelar,
                valorParcela
            );

        document.getElementById(
            "quantidade-parcelas"
        ).value =
            parcelas.length;

    } else {
        document.getElementById(
            "quantidade-parcelas"
        ).value = "";
    }

    atualizarResumoParcelamento();
}

function calcularPorQuantidade() {
    modoParcelamento =
        "quantidade";

    document.getElementById(
        "valor-parcela"
    ).value = "";

    atualizarResumoParcelamento();
}

function obterValoresParcelas() {
    if (
        saldoParcelar <= 0
    ) {
        return [];
    }

    const valorParcela =
        Number(
            document.getElementById(
                "valor-parcela"
            ).value
        );

    const quantidade =
        Number(
            document.getElementById(
                "quantidade-parcelas"
            ).value
        );

    if (
        modoParcelamento ===
        "valor" &&
        valorParcela > 0
    ) {
        return gerarParcelasPorValor(
            saldoParcelar,
            valorParcela
        );
    }

    if (
        Number.isInteger(
            quantidade
        ) &&
        quantidade > 0
    ) {
        return dividirValorEmParcelas(
            saldoParcelar,
            quantidade
        );
    }

    return [];
}

/* =====================================================
   DATAS DAS PARCELAS
===================================================== */

function obterProximaDataPagamentoVale(
    dataAtual,
    diaPagamento,
    diaVale
) {
    const candidatos = [];

    for (
        let acrescimo = 0;
        acrescimo <= 2;
        acrescimo++
    ) {
        const base =
            new Date(
                dataAtual.getFullYear(),
                dataAtual.getMonth() +
                acrescimo,
                1
            );

        candidatos.push(
            criarDataComDia(
                base.getFullYear(),
                base.getMonth(),
                diaPagamento
            )
        );

        candidatos.push(
            criarDataComDia(
                base.getFullYear(),
                base.getMonth(),
                diaVale
            )
        );
    }

    candidatos.sort(
        function (a, b) {
            return a - b;
        }
    );

    return candidatos.find(
        function (data) {
            return (
                data >
                dataAtual
            );
        }
    );
}

function gerarDatasParcelas(
    primeiroVencimento,
    quantidade,
    tipoPrazo,
    diaPagamento,
    diaVale
) {
    const dataInicial =
        criarDataLocal(
            primeiroVencimento
        );

    if (
        !dataInicial ||
        quantidade <= 0
    ) {
        return [];
    }

    const datas = [];

    let dataAtual =
        new Date(
            dataInicial
        );

    const diaOriginal =
        dataInicial.getDate();

    for (
        let indice = 0;
        indice < quantidade;
        indice++
    ) {
        datas.push(
            formatarDataBanco(
                dataAtual
            )
        );

        if (
            tipoPrazo ===
            "semanal"
        ) {
            dataAtual.setDate(
                dataAtual.getDate() +
                7
            );

        } else if (
            tipoPrazo ===
            "quinzenal"
        ) {
            dataAtual.setDate(
                dataAtual.getDate() +
                15
            );

        } else if (
            tipoPrazo ===
            "mensal"
        ) {
            const proximoMes =
                new Date(
                    dataAtual.getFullYear(),
                    dataAtual.getMonth() +
                    1,
                    1
                );

            dataAtual =
                criarDataComDia(
                    proximoMes.getFullYear(),
                    proximoMes.getMonth(),
                    diaOriginal
                );

        } else if (
            tipoPrazo ===
            "pagamento-vale"
        ) {
            dataAtual =
                obterProximaDataPagamentoVale(
                    dataAtual,
                    diaPagamento,
                    diaVale
                );
        }
    }

    return datas;
}

/* =====================================================
   RESUMO DO PARCELAMENTO
===================================================== */

function atualizarResumoParcelamento() {
    const resumo =
        document.getElementById(
            "resumo-parcelamento"
        );

    const forma =
        document.getElementById(
            "forma-pagamento"
        ).value;

    if (
        forma !==
        "prazo"
    ) {
        resumo.innerHTML = "";

        return;
    }

    if (
        saldoParcelar <= 0
    ) {
        resumo.innerHTML = `
            <div class="resumo-parcelas">

                <strong>
                    Venda totalmente recebida
                </strong>

                <p>
                    Não há saldo para parcelar.
                </p>

            </div>
        `;

        return;
    }

    const valores =
        obterValoresParcelas();

    if (
        valores.length === 0
    ) {
        resumo.innerHTML = "";

        return;
    }

    const tipoPrazo =
        document.getElementById(
            "tipo-prazo"
        ).value;

    const primeiroVencimento =
        document.getElementById(
            "primeiro-vencimento"
        ).value;

    const diaPagamento =
        Number(
            document.getElementById(
                "dia-pagamento"
            ).value
        );

    const diaVale =
        Number(
            document.getElementById(
                "dia-vale"
            ).value
        );

    const pagamentoValeValido =
        tipoPrazo !==
        "pagamento-vale" ||
        (
            diaPagamento >= 1 &&
            diaPagamento <= 31 &&
            diaVale >= 1 &&
            diaVale <= 31 &&
            diaPagamento !==
            diaVale
        );

    let datas = [];

    /*
     * Não apresenta alerta enquanto
     * a data está sendo digitada.
     */
    if (
        dataCompleta(
            primeiroVencimento
        ) &&
        primeiroVencimento >=
            obterDataAtualTexto() &&
        pagamentoValeValido &&
        criarDataLocal(
            primeiroVencimento
        )
    ) {
        datas =
            gerarDatasParcelas(
                primeiroVencimento,
                valores.length,
                tipoPrazo,
                diaPagamento,
                diaVale
            );
    }

    let html = `
        <div class="resumo-parcelas">

            <strong>
                Parcelamento:
            </strong>
    `;

    valores.forEach(
        function (
            valor,
            indice
        ) {
            html += `
                <p>
                    Parcela ${indice + 1}:
                    ${moeda(
                        valor
                    )}

                    ${
                        datas[indice]
                            ? " — " +
                              formatarDataBrasileira(
                                  datas[indice]
                              )
                            : ""
                    }
                </p>
            `;
        }
    );

    const somaParcelas =
        valores.reduce(
            function (
                soma,
                valor
            ) {
                return (
                    soma +
                    Number(
                        valor
                    )
                );
            },
            0
        );

    html += `
            <hr>

            <p>
                Entrada:
                <strong>
                    ${moeda(
                        valorRecebidoEntrada
                    )}
                </strong>
            </p>

            <p>
                Saldo parcelado:
                <strong>
                    ${moeda(
                        somaParcelas
                    )}
                </strong>
            </p>

        </div>
    `;

    resumo.innerHTML =
        html;
}

/* =====================================================
   VALIDAR PAGAMENTO E VALE
===================================================== */

function validarPagamentoVale() {
    const diaPagamento =
        Number(
            document.getElementById(
                "dia-pagamento"
            ).value
        );

    const diaVale =
        Number(
            document.getElementById(
                "dia-vale"
            ).value
        );

    if (
        diaPagamento < 1 ||
        diaPagamento > 31
    ) {
        alert(
            "Informe um dia de pagamento válido."
        );

        document.getElementById(
            "dia-pagamento"
        ).focus();

        return false;
    }

    if (
        diaVale < 1 ||
        diaVale > 31
    ) {
        alert(
            "Informe um dia de vale válido."
        );

        document.getElementById(
            "dia-vale"
        ).focus();

        return false;
    }

    if (
        diaPagamento ===
        diaVale
    ) {
        alert(
            "O dia do pagamento e o dia do vale devem ser diferentes."
        );

        document.getElementById(
            "dia-vale"
        ).focus();

        return false;
    }

    return true;
}

/* =====================================================
   MONTAR OS DADOS DA VENDA
===================================================== */

function montarDadosVenda() {
    const campoCliente =
        document.getElementById(
            "cliente"
        );

    const clienteId =
        Number(
            campoCliente.dataset.clienteId
        );

    const cliente =
        campoCliente.value.trim();

    if (
        !clienteId ||
        !cliente
    ) {
        alert(
            "Selecione um cliente."
        );

        return null;
    }

    if (
        itensVenda.length === 0
    ) {
        alert(
            "Adicione pelo menos um produto."
        );

        return null;
    }

    if (
        totalFinal <= 0
    ) {
        alert(
            "O total da venda deve ser maior que zero."
        );

        return null;
    }

    const campoValorRecebido =
        document.getElementById(
            "valor-recebido"
        );

    const valorDigitadoEntrada =
        Number(
            campoValorRecebido.value
        ) || 0;

    if (
        valorDigitadoEntrada <
        0
    ) {
        alert(
            "O valor recebido não pode ser negativo."
        );

        campoValorRecebido.focus();

        return null;
    }

    if (
        valorDigitadoEntrada >
        totalFinal
    ) {
        const troco =
            arredondarCentavos(
                valorDigitadoEntrada -
                totalFinal
            );

        alert(
            "O valor recebido é maior que o total da venda.\n\n" +
            "Troco: " +
            moeda(
                troco
            )
        );

        return null;
    }

    const formaPagamento =
        document.getElementById(
            "forma-pagamento"
        ).value;

    let tipoPagamento = "";
    let primeiroVencimento = null;
    let quantidadeParcelas = 0;
    let valorParcelaDesejada = 0;
    let diaPagamento = null;
    let diaVale = null;

    /*
     * Atualiza novamente os valores antes
     * de preparar os dados para envio.
     */
    calcularSaldoParcelar();

    if (
        formaPagamento ===
        "avista"
    ) {
        tipoPagamento =
            document.getElementById(
                "tipo-avista"
            ).value;

        /*
         * Se o campo de valor recebido estiver
         * vazio ou zero em venda à vista,
         * considera que o total foi recebido.
         */
        if (
            valorDigitadoEntrada ===
            0
        ) {
            valorRecebidoEntrada =
                totalFinal;

            saldoParcelar =
                0;
        }

    } else {
        tipoPagamento =
            document.getElementById(
                "tipo-prazo"
            ).value;

        primeiroVencimento =
            document.getElementById(
                "primeiro-vencimento"
            ).value;

        quantidadeParcelas =
            Number(
                document.getElementById(
                    "quantidade-parcelas"
                ).value
            );

        valorParcelaDesejada =
            Number(
                document.getElementById(
                    "valor-parcela"
                ).value
            );

        if (
            saldoParcelar >
            0
        ) {
            /*
             * A data só é validada aqui,
             * quando o usuário tenta registrar.
             */
            if (
                !validarPrimeiroVencimento()
            ) {
                return null;
            }

            if (
                quantidadeParcelas <= 0 &&
                valorParcelaDesejada <= 0
            ) {
                alert(
                    "Informe o valor da parcela ou a quantidade de parcelas."
                );

                return null;
            }
        }

        if (
            tipoPagamento ===
            "pagamento-vale" &&
            saldoParcelar >
            0
        ) {
            if (
                !validarPagamentoVale()
            ) {
                return null;
            }

            diaPagamento =
                Number(
                    document.getElementById(
                        "dia-pagamento"
                    ).value
                );

            diaVale =
                Number(
                    document.getElementById(
                        "dia-vale"
                    ).value
                );
        }
    }

    return {
        clienteId:
            clienteId,

        cliente:
            cliente,

        itens:
            itensVenda.map(
                function (item) {
                    return {
                        ...item
                    };
                }
            ),

        totalVenda:
            arredondarCentavos(
                totalVenda
            ),

        desconto:
            Number(
                document.getElementById(
                    "desconto"
                ).value
            ) || 0,

        tipoDesconto:
            document.getElementById(
                "tipo-desconto"
            ).value,

        totalFinal:
            arredondarCentavos(
                totalFinal
            ),

        valorRecebidoEntrada:
            arredondarCentavos(
                valorRecebidoEntrada
            ),

        saldoParcelar:
            arredondarCentavos(
                saldoParcelar
            ),

        formaPagamento:
            formaPagamento,

        tipoPagamento:
            tipoPagamento,

        primeiroVencimento:
            primeiroVencimento,

        quantidadeParcelas:
            quantidadeParcelas,

        valorParcelaDesejada:
            modoParcelamento ===
            "valor"
                ? valorParcelaDesejada
                : 0,

        diaPagamento:
            diaPagamento,

        diaVale:
            diaVale
    };
}
/* =====================================================
   REGISTRAR VENDA
===================================================== */

async function registrarVenda() {
    const dadosVenda = montarDadosVenda();

    if (!dadosVenda) {
        return;
    }

    const botao = document.getElementById("btn-registrar-venda");

    botao.disabled = true;
    botao.textContent = "Registrando...";

    try {
        const dados = await window.API.requisicao(
            "/vendas",
            {
                method: "POST",
                body: dadosVenda
            }
        );

        alert(
            dados.mensagem ||
            "Venda registrada com sucesso!"
        );

        mostrarResumoVenda(dadosVenda, dados);
        limparFormulario();

        await carregarProdutos();

    } catch (erro) {
        console.error("Erro ao registrar venda:", erro);

        alert(
            erro.message ||
            "Erro ao registrar venda."
        );

    } finally {
        botao.disabled = false;
        botao.textContent = "Registrar Venda";
    }
}

/* =====================================================
   RESUMO FINAL DA VENDA
===================================================== */

function mostrarResumoVenda(
    venda,
    resposta
) {
    let html = `
        <div class="resumo-venda-box">

            <p>
                <strong>
                    Cliente:
                </strong>

                ${escaparHTML(
                    venda.cliente
                )}
            </p>

            <p>
                <strong>
                    Total bruto:
                </strong>

                ${moeda(
                    venda.totalVenda
                )}
            </p>

            <p>
                <strong>
                    Desconto:
                </strong>

                ${
                    venda.tipoDesconto ===
                    "porcentagem"
                        ? venda.desconto +
                          "%"
                        : moeda(
                            venda.desconto
                          )
                }
            </p>

            <p>
                <strong>
                    Total final:
                </strong>

                ${moeda(
                    venda.totalFinal
                )}
            </p>

            <p>
                <strong>
                    Valor recebido / Entrada:
                </strong>

                ${moeda(
                    venda.valorRecebidoEntrada
                )}
            </p>

            <p>
                <strong>
                    Saldo parcelado:
                </strong>

                ${moeda(
                    venda.saldoParcelar
                )}
            </p>

            <p>
                <strong>
                    Forma de pagamento:
                </strong>

                ${formatarFormaPagamento(
                    venda
                )}
            </p>
    `;

    if (
        resposta &&
        Array.isArray(
            resposta.parcelas
        ) &&
        resposta.parcelas.length >
        0
    ) {
        html += `
            <hr>

            <strong>
                Recebimentos e parcelas
            </strong>
        `;

        resposta.parcelas.forEach(
            function (parcela) {
                html += `
                    <p>
                        ${
                            Number(
                                parcela.numeroParcela
                            ) === 0
                                ? "Entrada"
                                : "Parcela " +
                                  parcela.numeroParcela
                        }:

                        ${moeda(
                            parcela.valorParcela
                        )}

                        ${
                            parcela.vencimento
                                ? " — " +
                                  formatarDataBrasileira(
                                      extrairDataBanco(
                                          parcela.vencimento
                                      )
                                  )
                                : ""
                        }
                    </p>
                `;
            }
        );
    }

    html += `
        </div>
    `;

    document.getElementById(
        "resumo-venda"
    ).innerHTML =
        html;
}

function formatarFormaPagamento(
    venda
) {
    if (
        venda.formaPagamento ===
        "avista"
    ) {
        const tiposAvista = {
            pix:
                "À vista - Pix",

            dinheiro:
                "À vista - Dinheiro",

            cartao:
                "À vista - Cartão"
        };

        return (
            tiposAvista[
                venda.tipoPagamento
            ] ||
            "À vista"
        );
    }

    const tiposPrazo = {
        semanal:
            "Prazo - Semanal",

        quinzenal:
            "Prazo - Quinzenal",

        mensal:
            "Prazo - Mensal",

        "pagamento-vale":
            "Prazo - Pagamento e Vale"
    };

    return (
        tiposPrazo[
            venda.tipoPagamento
        ] ||
        "Prazo"
    );
}

/*
 * Trata datas recebidas do backend:
 *
 * 2026-07-12
 * 2026-07-12T00:00:00.000Z
 */
function extrairDataBanco(
    dataTexto
) {
    if (!dataTexto) {
        return "";
    }

    return String(
        dataTexto
    ).slice(
        0,
        10
    );
}

/* =====================================================
   LIMPAR FORMULÁRIO
===================================================== */

function limparFormulario() {
    const campoCliente =
        document.getElementById(
            "cliente"
        );

    campoCliente.value = "";

    delete campoCliente
        .dataset
        .clienteId;

    const campoProduto =
        document.getElementById(
            "produto"
        );

    campoProduto.value = "";

    delete campoProduto
        .dataset
        .produtoId;

    document.getElementById(
        "quantidade"
    ).value = "";

    document.getElementById(
        "desconto"
    ).value = "";

    document.getElementById(
        "tipo-desconto"
    ).value =
        "valor";

    document.getElementById(
        "valor-recebido"
    ).value = "";

    document.getElementById(
        "forma-pagamento"
    ).value =
        "avista";

    document.getElementById(
        "tipo-avista"
    ).value =
        "pix";

    document.getElementById(
        "tipo-prazo"
    ).value =
        "semanal";

    document.getElementById(
        "dia-pagamento"
    ).value = "";

    document.getElementById(
        "dia-vale"
    ).value = "";

    document.getElementById(
        "primeiro-vencimento"
    ).value = "";

    document.getElementById(
        "valor-parcela"
    ).value = "";

    document.getElementById(
        "quantidade-parcelas"
    ).value = "";

    document.getElementById(
        "resumo-parcelamento"
    ).innerHTML = "";

    /*
     * O resumo final da venda não é apagado.
     * Assim ele continua visível após o registro.
     */

    itensVenda = [];

    totalVenda = 0;
    totalFinal = 0;
    valorRecebidoEntrada = 0;
    saldoParcelar = 0;

    modoParcelamento =
        "quantidade";

    document.getElementById(
        "lista-itens"
    ).innerHTML = "";

    calcularTotais();

    mostrarCamposPagamento();

    configurarDataMinimaVencimento();
}

/* =====================================================
   TESTE DE CARREGAMENTO
===================================================== */

console.log(
    "venda.js carregado completamente."
);