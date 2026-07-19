let clientesCadastrados = [];
let parcelasEncontradas = [];
let parcelaSelecionada = null;

window.onload = function () {
    carregarClientes();
};

function moeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    if (!data) return "";

    let partes = data.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

async function carregarClientes() {
    try {
        let resposta = await fetch("http://localhost:3000/clientes");
        clientesCadastrados = await resposta.json();
    } catch (erro) {
        console.log("Erro ao carregar clientes:", erro);
    }
}

function abrirModalClientes() {
    document.getElementById("modal-clientes").style.display = "flex";
    document.getElementById("pesquisa-cliente").value = "";
    mostrarClientesModal();
}

function fecharModalClientes() {
    document.getElementById("modal-clientes").style.display = "none";
}

function mostrarClientesModal() {
    let lista = document.getElementById("lista-clientes-modal");
    lista.innerHTML = "";

    clientesCadastrados.forEach(function (cliente) {
        lista.innerHTML += `
            <div class="item-modal" onclick="selecionarCliente('${cliente.nome}')">
                <strong>${cliente.nome}</strong><br>
                WhatsApp: ${cliente.contato || ""}
            </div>
        `;
    });
}

function filtrarClientesModal() {
    let busca = document.getElementById("pesquisa-cliente").value.toLowerCase();
    let lista = document.getElementById("lista-clientes-modal");

    lista.innerHTML = "";

    let filtrados = clientesCadastrados.filter(function (cliente) {
        return cliente.nome.toLowerCase().includes(busca);
    });

    if (filtrados.length === 0) {
        lista.innerHTML = `
            <div class="item-modal">
                Nenhum cliente encontrado.
            </div>
        `;
        return;
    }

    filtrados.forEach(function (cliente) {
        lista.innerHTML += `
            <div class="item-modal" onclick="selecionarCliente('${cliente.nome}')">
                <strong>${cliente.nome}</strong><br>
                WhatsApp: ${cliente.contato || ""}
            </div>
        `;
    });
}

function selecionarCliente(nome) {
    document.getElementById("cliente").value = nome;
    fecharModalClientes();
    buscarParcelas();
}
async function buscarParcelas() {
    let cliente = document.getElementById("cliente").value;

    if (cliente === "") {
        alert("Selecione um cliente.");
        return;
    }

    try {
        let resposta = await fetch(
            "http://localhost:3000/recebimentos/cliente/" + encodeURIComponent(cliente)
        );

        let parcelas = await resposta.json();

        parcelasEncontradas = parcelas;

        montarResumoCliente(parcelas);
        listarParcelas(parcelas);

    } catch (erro) {
        console.log("Erro ao buscar parcelas:", erro);
        alert("Erro ao buscar parcelas.");
    }
}

function montarResumoCliente(parcelas) {
    let totalAberto = 0;
    let totalRecebido = 0;
    let totalVencido = 0;

    let hoje = new Date().toISOString().split("T")[0];

    parcelas.forEach(function (parcela) {
        totalRecebido += Number(parcela.valorRecebido);

        let saldo = Number(parcela.valorParcela) - Number(parcela.valorRecebido);

        if (parcela.status !== "Recebida") {
            totalAberto += saldo;

            if (parcela.vencimento < hoje) {
                totalVencido += saldo;
            }
        }
    });

    document.getElementById("resumo-cliente").innerHTML = `
        <div class="resumo-cliente">
            <div>
                <span>Total em aberto</span>
                <strong>${moeda(totalAberto)}</strong>
            </div>

            <div>
                <span>Total vencido</span>
                <strong>${moeda(totalVencido)}</strong>
            </div>

            <div>
                <span>Total recebido</span>
                <strong>${moeda(totalRecebido)}</strong>
            </div>
        </div>
    `;
}

function listarParcelas(parcelas) {
    let area = document.getElementById("area-recebimento");

    if (parcelas.length === 0) {
        area.innerHTML = `
            <h3>Parcelas</h3>
            <p>Nenhuma parcela em aberto para este cliente.</p>
        `;
        return;
    }

    let html = `
        <h3>Parcelas em aberto</h3>

        <table class="tabela-parcelas">
            <thead>
                <tr>
                    <th>Parcela</th>
                    <th>Valor</th>
                    <th>Recebido</th>
                    <th>Saldo</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    parcelas.forEach(function (parcela) {
        let saldo = Number(parcela.valorParcela) - Number(parcela.valorRecebido);
        let hoje = new Date().toISOString().split("T")[0];

        let classe = "futura";

        if (parcela.vencimento < hoje) {
            classe = "vencida";
        }

        if (parcela.vencimento === hoje) {
            classe = "hoje";
        }

        html += `
            <tr class="${classe}" onclick="selecionarParcela(${parcela.id})">
                <td>${parcela.numeroParcela}</td>
                <td>${moeda(parcela.valorParcela)}</td>
                <td>${moeda(parcela.valorRecebido)}</td>
                <td>${moeda(saldo)}</td>
                <td>${formatarData(parcela.vencimento)}</td>
                <td>${parcela.status}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>

        <p class="aviso-clique">
            Clique em uma parcela para registrar o recebimento.
        </p>
    `;

    area.innerHTML = html;
}

function selecionarParcela(id) {
    parcelaSelecionada = parcelasEncontradas.find(function (parcela) {
        return parcela.id === id;
    });

    if (!parcelaSelecionada) {
        alert("Parcela não encontrada.");
        return;
    }

    let saldo =
        Number(parcelaSelecionada.valorParcela) -
        Number(parcelaSelecionada.valorRecebido);

    document.getElementById("area-recebimento").innerHTML = `
        <div class="painel-recebimento">

            <h3>Receber Parcela</h3>

            <div class="dados-parcela">
                <p><strong>Cliente:</strong> ${parcelaSelecionada.cliente}</p>
                <p><strong>Parcela:</strong> ${parcelaSelecionada.numeroParcela}</p>
                <p><strong>Valor da parcela:</strong> ${moeda(parcelaSelecionada.valorParcela)}</p>
                <p><strong>Valor já recebido:</strong> ${moeda(parcelaSelecionada.valorRecebido)}</p>
                <p><strong>Saldo restante:</strong> ${moeda(saldo)}</p>
                <p><strong>Vencimento:</strong> ${formatarData(parcelaSelecionada.vencimento)}</p>
                <p><strong>Status:</strong> ${parcelaSelecionada.status}</p>
            </div>

            <label>Valor recebido agora</label>
            <input 
                type="number" 
                id="valor-recebido" 
                placeholder="Digite o valor recebido"
                oninput="verificarRecebimentoParcial()"
            >

            <div id="area-restante" style="display:none;">
                <label>Vencimento do restante</label>
                <input type="date" id="vencimento-restante">

                <p id="mensagem-restante"></p>
            </div>

            <label>Forma de recebimento</label>
            <select id="forma-recebimento">
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
            </select>

            <label>Observação</label>
            <input type="text" id="observacao" placeholder="Opcional">

            <button onclick="baixarParcela()">
                Confirmar Recebimento
            </button>

            <button onclick="listarParcelas(parcelasEncontradas)" class="botao-secundario">
                Cancelar
            </button>

        </div>
    `;
}
function verificarRecebimentoParcial() {
    if (!parcelaSelecionada) {
        return;
    }

    let valorRecebidoAgora = Number(document.getElementById("valor-recebido").value);

    let saldo =
        Number(parcelaSelecionada.valorParcela) -
        Number(parcelaSelecionada.valorRecebido);

    let areaRestante = document.getElementById("area-restante");
    let mensagemRestante = document.getElementById("mensagem-restante");

    if (valorRecebidoAgora > 0 && valorRecebidoAgora < saldo) {
        let restante = saldo - valorRecebidoAgora;

        areaRestante.style.display = "block";
        mensagemRestante.innerHTML =
            "Restante a gerar nova parcela: " + moeda(restante);
    } else {
        areaRestante.style.display = "none";
        mensagemRestante.innerHTML = "";
    }
}

async function baixarParcela() {
    if (!parcelaSelecionada) {
        alert("Nenhuma parcela selecionada.");
        return;
    }

    let valorRecebidoAgora = Number(document.getElementById("valor-recebido").value);

    if (valorRecebidoAgora <= 0) {
        alert("Digite um valor recebido válido.");
        return;
    }

    let saldo =
        Number(parcelaSelecionada.valorParcela) -
        Number(parcelaSelecionada.valorRecebido);

    if (valorRecebidoAgora > saldo) {
        let troco = valorRecebidoAgora - saldo;

        alert("Valor maior que a parcela. Troco: " + moeda(troco));

        valorRecebidoAgora = saldo;
        document.getElementById("valor-recebido").value = saldo.toFixed(2);
    }

    let vencimentoRestante = null;

    if (valorRecebidoAgora < saldo) {
        vencimentoRestante = document.getElementById("vencimento-restante").value;

        if (vencimentoRestante === "") {
            alert("Informe o vencimento do restante.");
            return;
        }
    }

    try {
        let resposta = await fetch(
            "http://localhost:3000/recebimentos/" + parcelaSelecionada.id,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    valorRecebido: valorRecebidoAgora,
                    formaRecebimento: document.getElementById("forma-recebimento").value,
                    observacao: document.getElementById("observacao").value,
                    vencimentoRestante: vencimentoRestante
                })
            }
        );

        let dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem);

            document.getElementById("area-recebimento").innerHTML = `
                <div class="painel-recebimento">
                    <h3>Recebimento registrado</h3>

                    <p><strong>Cliente:</strong> ${parcelaSelecionada.cliente}</p>
                    <p><strong>Parcela:</strong> ${parcelaSelecionada.numeroParcela}</p>
                    <p><strong>Valor recebido agora:</strong> ${moeda(valorRecebidoAgora)}</p>

                    ${
                        dados.valorRestante
                        ? `<p><strong>Nova parcela gerada:</strong> ${moeda(dados.valorRestante)}</p>`
                        : ""
                    }

                    <button onclick="buscarParcelas()">
                        Ver parcelas restantes
                    </button>
                </div>
            `;

            parcelaSelecionada = null;

        } else {
            alert(dados.erro || "Erro ao registrar recebimento.");
        }

    } catch (erro) {
        console.log("Erro ao baixar parcela:", erro);
        alert("Erro de conexão com o servidor.");
    }
}