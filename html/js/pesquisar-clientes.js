let clientesCadastrados = [];

window.onload = function () {
    carregarClientes();
};

async function carregarClientes() {
    try {
        const resposta = await fetch(
            "http://localhost:3000/clientes"
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Erro ao carregar clientes."
            );
        }

        clientesCadastrados = dados;

        clientesCadastrados.sort(function (a, b) {
            return String(a.nome).localeCompare(
                String(b.nome),
                "pt-BR"
            );
        });

        document.getElementById("total-clientes").textContent =
            clientesCadastrados.length;

        mostrarClientes(clientesCadastrados);

    } catch (erro) {
        console.log("Erro ao carregar clientes:", erro);

        document.getElementById("lista-clientes").innerHTML = `
            <div class="mensagem">
                Não foi possível carregar os clientes.
            </div>
        `;
    }
}

function filtrarClientes() {
    const busca = document
        .getElementById("pesquisa-cliente")
        .value
        .toLowerCase()
        .trim();

    if (busca === "") {
        mostrarClientes(clientesCadastrados);
        return;
    }

    const filtrados = clientesCadastrados.filter(function (cliente) {
        return (
            String(cliente.nome || "")
                .toLowerCase()
                .includes(busca) ||

            String(cliente.contato || "")
                .toLowerCase()
                .includes(busca) ||

            String(cliente.cidade || "")
                .toLowerCase()
                .includes(busca) ||

            String(cliente.cpf || "")
                .toLowerCase()
                .includes(busca)
        );
    });

    mostrarClientes(filtrados);
}

function mostrarClientes(clientes) {
    const lista = document.getElementById("lista-clientes");

    lista.innerHTML = "";

    if (clientes.length === 0) {
        lista.innerHTML = `
            <div class="mensagem">
                Nenhum cliente encontrado.
            </div>
        `;

        return;
    }

    clientes.forEach(function (cliente) {
        const nomeSeguro = escaparAtributo(cliente.nome);

        lista.innerHTML += `
            <article class="cliente-card">

                <div class="cliente-cabecalho">

                    <h3>
                        ${escaparHTML(cliente.nome)}
                    </h3>

                    <span>
                        #${cliente.id}
                    </span>

                </div>

                <div class="cliente-dados">

                    <p>
                        <strong>WhatsApp:</strong>
                        ${mostrarValor(cliente.contato)}
                    </p>

                    <p>
                        <strong>CPF:</strong>
                        ${mostrarValor(cliente.cpf)}
                    </p>

                    <p>
                        <strong>RG:</strong>
                        ${mostrarValor(cliente.rg)}
                    </p>

                    <p>
                        <strong>Cidade:</strong>
                        ${mostrarValor(cliente.cidade)}
                    </p>

                    <p>
                        <strong>Bairro:</strong>
                        ${mostrarValor(cliente.bairro)}
                    </p>

                    <p>
                        <strong>Endereço:</strong>
                        ${montarEndereco(cliente)}
                    </p>

                </div>

                <div class="acoes-cliente">

                    <button
                        onclick="editarCliente(${cliente.id})"
                        class="botao-editar"
                    >
                        Editar
                    </button>

                    <button
                        onclick="excluirCliente(
                            ${cliente.id},
                            '${nomeSeguro}'
                        )"
                        class="botao-excluir"
                    >
                        Excluir
                    </button>

                    <button
                        onclick="verHistorico('${nomeSeguro}')"
                        class="botao-historico"
                    >
                        Ver Histórico
                    </button>

                </div>

            </article>
        `;
    });
}

function mostrarValor(valor) {
    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "Não informado";
    }

    return escaparHTML(valor);
}

function montarEndereco(cliente) {
    const partes = [];

    if (cliente.rua) {
        partes.push(cliente.rua);
    }

    if (cliente.numero) {
        partes.push("nº " + cliente.numero);
    }

    if (partes.length === 0) {
        return "Não informado";
    }

    return escaparHTML(partes.join(", "));
}

function editarCliente(id) {
    window.location.href =
        "editar-cliente.html?id=" + encodeURIComponent(id);
}

async function excluirCliente(id, nome) {
    const confirmou = confirm(
        `Deseja realmente excluir o cliente "${nome}"?\n\n` +
        "Essa ação não poderá ser desfeita."
    );

    if (!confirmou) {
        return;
    }

    try {
        const resposta = await fetch(
            "http://localhost:3000/clientes/" + id,
            {
                method: "DELETE"
            }
        );

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(
                dados.mensagem ||
                "Cliente excluído com sucesso."
            );

            carregarClientes();

        } else {
            alert(
                dados.erro ||
                "Não foi possível excluir o cliente."
            );
        }

    } catch (erro) {
        console.log("Erro ao excluir cliente:", erro);

        alert("Erro de conexão com o servidor.");
    }
}

function verHistorico(nome) {
    window.location.href =
        "historico-cliente.html?cliente=" +
        encodeURIComponent(nome);
}

function escaparHTML(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escaparAtributo(texto) {
    return String(texto)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
}