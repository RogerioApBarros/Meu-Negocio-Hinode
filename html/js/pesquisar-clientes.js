let clientesCadastrados = [];

window.onload = function () {
    carregarClientes();
};

async function carregarClientes() {
    try {
        clientesCadastrados =
            await window.API.requisicao(
                "/clientes"
            );

        if (!Array.isArray(clientesCadastrados)) {
            clientesCadastrados = [];
        }

        clientesCadastrados.sort(function (a, b) {
            return String(
                a.nome || ""
            ).localeCompare(
                String(b.nome || ""),
                "pt-BR"
            );
        });

        document.getElementById(
            "total-clientes"
        ).textContent =
            clientesCadastrados.length;

        mostrarClientes(
            clientesCadastrados
        );

    } catch (erro) {
        console.error(
            "Erro ao carregar clientes:",
            erro
        );

        clientesCadastrados = [];

        document.getElementById(
            "total-clientes"
        ).textContent = "0";

        document.getElementById(
            "lista-clientes"
        ).innerHTML = `
            <div class="mensagem">
                ${
                    erro.message ||
                    "Não foi possível carregar os clientes."
                }
            </div>
        `;
    }
}

function filtrarClientes() {
    const busca = document
        .getElementById(
            "pesquisa-cliente"
        )
        .value
        .toLowerCase()
        .trim();

    if (busca === "") {
        mostrarClientes(
            clientesCadastrados
        );

        return;
    }

    const filtrados =
        clientesCadastrados.filter(
            function (cliente) {
                const nome =
                    String(
                        cliente.nome || ""
                    ).toLowerCase();

                const contato =
                    String(
                        cliente.contato || ""
                    ).toLowerCase();

                const cidade =
                    String(
                        cliente.cidade || ""
                    ).toLowerCase();

                const cpf =
                    String(
                        cliente.cpf || ""
                    ).toLowerCase();

                return (
                    nome.includes(busca) ||
                    contato.includes(busca) ||
                    cidade.includes(busca) ||
                    cpf.includes(busca)
                );
            }
        );

    mostrarClientes(
        filtrados
    );
}

function mostrarClientes(clientes) {
    const lista =
        document.getElementById(
            "lista-clientes"
        );

    lista.innerHTML = "";

    if (clientes.length === 0) {
        lista.innerHTML = `
            <div class="mensagem">
                Nenhum cliente encontrado.
            </div>
        `;

        return;
    }

    clientes.forEach(
        function (cliente) {
            const nomeSeguro =
                escaparAtributo(
                    cliente.nome || ""
                );

            lista.innerHTML += `
                <article class="cliente-card">

                    <div class="cliente-cabecalho">

                        <h3>
                            ${escaparHTML(
                                cliente.nome ||
                                "Cliente sem nome"
                            )}
                        </h3>

                        <span>
                            #${cliente.id}
                        </span>

                    </div>

                    <div class="cliente-dados">

                        <p>
                            <strong>WhatsApp:</strong>
                            ${mostrarValor(
                                cliente.contato
                            )}
                        </p>

                        <p>
                            <strong>CPF:</strong>
                            ${mostrarValor(
                                cliente.cpf
                            )}
                        </p>

                        <p>
                            <strong>RG:</strong>
                            ${mostrarValor(
                                cliente.rg
                            )}
                        </p>

                        <p>
                            <strong>Cidade:</strong>
                            ${mostrarValor(
                                cliente.cidade
                            )}
                        </p>

                        <p>
                            <strong>Bairro:</strong>
                            ${mostrarValor(
                                cliente.bairro
                            )}
                        </p>

                        <p>
                            <strong>Endereço:</strong>
                            ${montarEndereco(
                                cliente
                            )}
                        </p>

                    </div>

                    <div class="acoes-cliente">

                        <button
                            type="button"
                            onclick="editarCliente(${cliente.id})"
                            class="botao-editar"
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            onclick="excluirCliente(
                                ${cliente.id},
                                '${nomeSeguro}'
                            )"
                            class="botao-excluir"
                        >
                            Excluir
                        </button>

                        <button
                            type="button"
                            onclick="verHistorico(
                                '${nomeSeguro}'
                            )"
                            class="botao-historico"
                        >
                            Ver Histórico
                        </button>

                    </div>

                </article>
            `;
        }
    );
}

function mostrarValor(valor) {
    if (
        valor === null ||
        valor === undefined ||
        String(valor).trim() === ""
    ) {
        return "Não informado";
    }

    return escaparHTML(
        valor
    );
}

function montarEndereco(cliente) {
    const partes = [];

    if (
        cliente.rua &&
        String(cliente.rua).trim() !== ""
    ) {
        partes.push(
            cliente.rua
        );
    }

    if (
        cliente.numero &&
        String(cliente.numero).trim() !== ""
    ) {
        partes.push(
            "nº " + cliente.numero
        );
    }

    if (
        cliente.bairro &&
        String(cliente.bairro).trim() !== ""
    ) {
        partes.push(
            cliente.bairro
        );
    }

    if (
        cliente.cidade &&
        String(cliente.cidade).trim() !== ""
    ) {
        partes.push(
            cliente.cidade
        );
    }

    if (partes.length === 0) {
        return "Não informado";
    }

    return escaparHTML(
        partes.join(", ")
    );
}

function editarCliente(id) {
    window.location.href =
        "editar-cliente.html?id=" +
        encodeURIComponent(id);
}

async function excluirCliente(
    id,
    nome
) {
    const confirmou = confirm(
        `Deseja realmente excluir o cliente "${nome}"?\n\n` +
        "Essa ação não poderá ser desfeita."
    );

    if (!confirmou) {
        return;
    }

    try {
        const dados =
            await window.API.requisicao(
                "/clientes/" + id,
                {
                    method: "DELETE"
                }
            );

        alert(
            dados.mensagem ||
            "Cliente excluído com sucesso."
        );

        await carregarClientes();

    } catch (erro) {
        console.error(
            "Erro ao excluir cliente:",
            erro
        );

        alert(
            erro.message ||
            "Não foi possível excluir o cliente."
        );
    }
}

function verHistorico(nome) {
    window.location.href =
        "historico-cliente.html?cliente=" +
        encodeURIComponent(nome);
}

function escaparHTML(texto) {
    return String(texto)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function escaparAtributo(texto) {
    return String(texto)
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        )
        .replaceAll(
            "\n",
            " "
        )
        .replaceAll(
            "\r",
            " "
        );
}