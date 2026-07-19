let formasPagamento = [];

function salvarFormaPagamento() {

    let nomeForma = document.getElementById("nome-forma").value;
    let frequencia = document.getElementById("frequencia").value;
    let intervaloDias = document.getElementById("intervalo-dias").value;
    let diaFixo = document.getElementById("dia-fixo").value;
    let modeloCalculo = document.getElementById("modelo-calculo").value;

    if (nomeForma === "" || frequencia === "" || modeloCalculo === "") {
        alert("Preencha nome, frequência e modelo de cálculo.");
        return;
    }

    if (frequencia === "intervalo" && intervaloDias === "") {
        alert("Informe o intervalo diário.");
        return;
    }

    if (frequencia === "dia-fixo" && diaFixo === "") {
        alert("Informe o dia fixo.");
        return;
    }

    let forma = {
        nome: nomeForma,
        frequencia: frequencia,
        intervaloDias: intervaloDias,
        diaFixo: diaFixo,
        modeloCalculo: modeloCalculo
    };

    formasPagamento.push(forma);

    mostrarFormasPagamento();
    limparCampos();
}

function mostrarFormasPagamento() {

    let lista = document.getElementById("lista-formas");

    lista.innerHTML = "";

    for (let i = 0; i < formasPagamento.length; i++) {

        let textoFrequencia = "";

        if (formasPagamento[i].frequencia === "intervalo") {
            textoFrequencia = "A cada " + formasPagamento[i].intervaloDias + " dias";
        } else {
            textoFrequencia = "Todo dia " + formasPagamento[i].diaFixo;
        }

        let textoModelo = "";

        if (formasPagamento[i].modeloCalculo === "quantidade-parcelas") {
            textoModelo = "Quantidade de parcelas";
        } else {
            textoModelo = "Valor da parcela";
        }

        lista.innerHTML += `
            <div class="forma-item">
                <strong>${formasPagamento[i].nome}</strong><br>
                Frequência: ${textoFrequencia}<br>
                Modelo de cálculo: ${textoModelo}<br><br>

                <button class="botao-excluir" onclick="excluirFormaPagamento(${i})">
                    Excluir
                </button>
            </div>
        `;
    }
}

function excluirFormaPagamento(indice) {
    formasPagamento.splice(indice, 1);
    mostrarFormasPagamento();
}

function limparCampos() {
    document.getElementById("nome-forma").value = "";
    document.getElementById("frequencia").value = "";
    document.getElementById("intervalo-dias").value = "";
    document.getElementById("dia-fixo").value = "";
    document.getElementById("modelo-calculo").value = "";
}