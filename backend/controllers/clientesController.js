const Cliente = require("../models/clientes");
const Venda = require("../models/vendasModel");
const Recebimento = require("../models/recebimentosModel");

// CADASTRAR CLIENTE
async function cadastrarCliente(req, res) {
    try {
        const {
            nome,
            contato,
            rg,
            cpf,
            nascimento,
            rua,
            numero,
            bairro,
            cidade,
            referencia,
            indicacao
        } = req.body;

        if (!nome || nome.trim() === "") {
            return res.status(400).json({
                erro: "O nome do cliente é obrigatório."
            });
        }

        const cliente = await Cliente.create({
            nome: nome.trim(),
            contato: contato || null,
            rg: rg || null,
            cpf: cpf || null,
            nascimento: nascimento || null,
            rua: rua || null,
            numero: numero || null,
            bairro: bairro || null,
            cidade: cidade || null,
            referencia: referencia || null,
            indicacao: indicacao || null
        });

        res.status(201).json({
            mensagem: "Cliente cadastrado com sucesso.",
            cliente
        });

    } catch (erro) {
        console.log("Erro ao cadastrar cliente:", erro);

        res.status(500).json({
            erro: erro.message
        });
    }
}

// LISTAR CLIENTES
async function listarClientes(req, res) {
    try {
        const clientes = await Cliente.findAll({
            order: [["nome", "ASC"]]
        });

        res.json(clientes);

    } catch (erro) {
        console.log("Erro ao listar clientes:", erro);

        res.status(500).json({
            erro: erro.message
        });
    }
}

// BUSCAR CLIENTE PELO ID
async function buscarClientePorId(req, res) {
    try {
        const { id } = req.params;

        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        res.json(cliente);

    } catch (erro) {
        console.log("Erro ao buscar cliente:", erro);

        res.status(500).json({
            erro: erro.message
        });
    }
}

// ATUALIZAR CLIENTE
async function atualizarCliente(req, res) {
    try {
        const { id } = req.params;

        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        const nomeAnterior = cliente.nome;

        const {
            nome,
            contato,
            rg,
            cpf,
            nascimento,
            rua,
            numero,
            bairro,
            cidade,
            referencia,
            indicacao
        } = req.body;

        if (!nome || nome.trim() === "") {
            return res.status(400).json({
                erro: "O nome do cliente é obrigatório."
            });
        }

        await cliente.update({
            nome: nome.trim(),
            contato: contato || null,
            rg: rg || null,
            cpf: cpf || null,
            nascimento: nascimento || null,
            rua: rua || null,
            numero: numero || null,
            bairro: bairro || null,
            cidade: cidade || null,
            referencia: referencia || null,
            indicacao: indicacao || null
        });

        // Como as vendas e os recebimentos atualmente guardam o nome,
        // atualizamos também esses registros quando o nome for alterado.
        if (nomeAnterior !== nome.trim()) {
            await Venda.update(
                { cliente: nome.trim() },
                {
                    where: {
                        cliente: nomeAnterior
                    }
                }
            );

            await Recebimento.update(
                { cliente: nome.trim() },
                {
                    where: {
                        cliente: nomeAnterior
                    }
                }
            );
        }

        res.json({
            mensagem: "Cliente alterado com sucesso.",
            cliente
        });

    } catch (erro) {
        console.log("Erro ao atualizar cliente:", erro);

        res.status(500).json({
            erro: erro.message
        });
    }
}

// EXCLUIR CLIENTE
async function excluirCliente(req, res) {
    try {
        const { id } = req.params;

        const cliente = await Cliente.findByPk(id);

        if (!cliente) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        const vendas = await Venda.count({
            where: {
                cliente: cliente.nome
            }
        });

        const recebimentos = await Recebimento.count({
            where: {
                cliente: cliente.nome
            }
        });

        if (vendas > 0 || recebimentos > 0) {
            return res.status(400).json({
                erro:
                    "Este cliente possui vendas ou recebimentos registrados e não pode ser excluído."
            });
        }

        await cliente.destroy();

        res.json({
            mensagem: "Cliente excluído com sucesso."
        });

    } catch (erro) {
        console.log("Erro ao excluir cliente:", erro);

        res.status(500).json({
            erro: erro.message
        });
    }
}

// HISTÓRICO DO CLIENTE
async function historicoCliente(req, res) {
    try {
        const nome = decodeURIComponent(req.params.nome);

        const cliente = await Cliente.findOne({
            where: {
                nome
            }
        });

        if (!cliente) {
            return res.status(404).json({
                erro: "Cliente não encontrado."
            });
        }

        const vendas = await Venda.findAll({
            where: {
                cliente: nome
            },
            order: [["createdAt", "DESC"]]
        });

        const recebimentos = await Recebimento.findAll({
            where: {
                cliente: nome
            },
            order: [["vencimento", "ASC"]]
        });

        let totalComprado = 0;
        let totalRecebido = 0;
        let totalAberto = 0;

        vendas.forEach(function (venda) {
            totalComprado += Number(venda.totalFinal || 0);
        });

        recebimentos.forEach(function (recebimento) {
            totalRecebido += Number(recebimento.valorRecebido || 0);

            if (recebimento.status !== "Recebida") {
                totalAberto +=
                    Number(recebimento.valorParcela || 0) -
                    Number(recebimento.valorRecebido || 0);
            }
        });

        res.json({
            cliente,
            vendas,
            recebimentos,
            totalComprado,
            totalRecebido,
            totalAberto,
            quantidadeCompras: vendas.length
        });

    } catch (erro) {
        console.log("Erro ao buscar histórico:", erro);

        res.status(500).json({
            erro: erro.message
        });
    }
}

module.exports = {
    cadastrarCliente,
    listarClientes,
    buscarClientePorId,
    atualizarCliente,
    excluirCliente,
    historicoCliente
};