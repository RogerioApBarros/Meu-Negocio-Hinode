window.onload = function () {
    carregarCliente();
};

function obterIdCliente() {
    const parametros = new URLSearchParams(
        window.location.search
    );

    return parametros.get("id");
}

async function carregarCliente() {
    const id = obterIdCliente();

    if (!id) {
        alert("Cliente não informado.");

        window.location.href =
            "pesquisar-clientes.html";

        return;
    }

    try {
        const resposta = await fetch(
            "http://localhost:3000/clientes/" + id
        );

        const cliente = await resposta.json();

        if (!resposta.ok) {
            alert(
                cliente.erro ||
                "Cliente não encontrado."
            );

            window.location.href =
                "pesquisar-clientes.html";

            return;
        }

        document.getElementById("cliente-id").value =
            cliente.id;

        document.getElementById("nome").value =
            cliente.nome || "";

        document.getElementById("contato").value =
            cliente.contato || "";

        document.getElementById("rg").value =
            cliente.rg || "";

        document.getElementById("cpf").value =
            cliente.cpf || "";

        document.getElementById("data-nascimento").value =
            cliente.nascimento || "";

        document.getElementById("rua").value =
            cliente.rua || "";

        document.getElementById("numero").value =
            cliente.numero || "";

        document.getElementById("bairro").value =
            cliente.bairro || "";

        document.getElementById("cidade").value =
            cliente.cidade || "";

        document.getElementById("referencia").value =
            cliente.referencia || "";

        document.getElementById("indicacao").value =
            cliente.indicacao || "";

    } catch (erro) {
        console.log("Erro ao carregar cliente:", erro);

        alert("Erro de conexão com o servidor.");
    }
}

async function salvarAlteracoes() {
    const id = document
        .getElementById("cliente-id")
        .value;

    const cliente = {
        nome: document
            .getElementById("nome")
            .value
            .trim(),

        contato: document
            .getElementById("contato")
            .value
            .trim(),

        rg: document
            .getElementById("rg")
            .value
            .trim(),

        cpf: document
            .getElementById("cpf")
            .value
            .trim(),

        nascimento:
            document.getElementById("data-nascimento").value ||
            null,

        rua: document
            .getElementById("rua")
            .value
            .trim(),

        numero: document
            .getElementById("numero")
            .value
            .trim(),

        bairro: document
            .getElementById("bairro")
            .value
            .trim(),

        cidade: document
            .getElementById("cidade")
            .value
            .trim(),

        referencia: document
            .getElementById("referencia")
            .value
            .trim(),

        indicacao: document
            .getElementById("indicacao")
            .value
            .trim()
    };

    if (cliente.nome === "") {
        alert("O nome do cliente é obrigatório.");
        return;
    }

    try {
        const resposta = await fetch(
            "http://localhost:3000/clientes/" + id,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(cliente)
            }
        );

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(
                dados.mensagem ||
                "Cliente alterado com sucesso."
            );

            window.location.href =
                "pesquisar-clientes.html";

        } else {
            alert(
                dados.erro ||
                "Erro ao alterar cliente."
            );
        }

    } catch (erro) {
        console.log("Erro ao alterar cliente:", erro);

        alert("Erro de conexão com o servidor.");
    }
}