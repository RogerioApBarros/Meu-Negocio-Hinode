require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");

const sequelize = require(
    "../database/conexao"
);

const Usuario = require(
    "../models/usuariosModel"
);

/* =====================================================
   LEITURA DOS DADOS NO TERMINAL
===================================================== */

const leitor = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(pergunta) {
    return new Promise(function (resolve) {
        leitor.question(
            pergunta,
            function (resposta) {
                resolve(
                    String(resposta || "").trim()
                );
            }
        );
    });
}

/* =====================================================
   VALIDAÇÕES
===================================================== */

function validarEmail(email) {
    const formatoEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return formatoEmail.test(email);
}

function validarSenhaForte(senha) {
    const senhaTexto =
        String(senha || "");

    const possuiOitoCaracteres =
        senhaTexto.length >= 8;

    const possuiMaiuscula =
        /[A-Z]/.test(senhaTexto);

    const possuiMinuscula =
        /[a-z]/.test(senhaTexto);

    const possuiNumero =
        /[0-9]/.test(senhaTexto);

    const possuiEspecial =
        /[^A-Za-z0-9]/.test(senhaTexto);

    return (
        possuiOitoCaracteres &&
        possuiMaiuscula &&
        possuiMinuscula &&
        possuiNumero &&
        possuiEspecial
    );
}

/* =====================================================
   CRIAÇÃO DO ADMINISTRADOR
===================================================== */

async function criarAdministrador() {
    try {
        console.log(
            "\n========================================"
        );

        console.log(
            " CRIAÇÃO DO ADMINISTRADOR DO SISTEMA"
        );

        console.log(
            "========================================\n"
        );

        await sequelize.authenticate();

        await sequelize.sync();

        console.log(
            "Banco de dados conectado com sucesso.\n"
        );

        const administradorExistente =
            await Usuario.findOne({
                where: {
                    perfil: "admin"
                }
            });

        if (administradorExistente) {
            console.log(
                "Já existe um administrador cadastrado."
            );

            console.log(
                "Nome:",
                administradorExistente.nome
            );

            console.log(
                "Login:",
                administradorExistente.login
            );

            console.log(
                "E-mail:",
                administradorExistente.email
            );

            return;
        }

        const nome = await perguntar(
            "Digite o nome completo: "
        );

        if (nome.length < 3) {
            throw new Error(
                "O nome deve possuir pelo menos 3 caracteres."
            );
        }

        const emailDigitado = await perguntar(
            "Digite o e-mail: "
        );

        const email =
            emailDigitado.toLowerCase();

        if (!validarEmail(email)) {
            throw new Error(
                "O e-mail informado não é válido."
            );
        }

        const loginDigitado = await perguntar(
            "Digite o login: "
        );

        const login =
            loginDigitado.toLowerCase();

        if (login.length < 3) {
            throw new Error(
                "O login deve possuir pelo menos 3 caracteres."
            );
        }

        /*
         * A senha será exibida enquanto você digita no terminal.
         * Digite-a somente no seu computador.
         */
        const senha = await perguntar(
            "Digite a senha: "
        );

        if (!validarSenhaForte(senha)) {
            throw new Error(
                "A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial."
            );
        }

        const confirmarSenha = await perguntar(
            "Confirme a senha: "
        );

        if (senha !== confirmarSenha) {
            throw new Error(
                "As senhas informadas são diferentes."
            );
        }

        const emailExistente =
            await Usuario.findOne({
                where: {
                    email
                }
            });

        if (emailExistente) {
            throw new Error(
                "Já existe um usuário com esse e-mail."
            );
        }

        const loginExistente =
            await Usuario.findOne({
                where: {
                    login
                }
            });

        if (loginExistente) {
            throw new Error(
                "Já existe um usuário com esse login."
            );
        }

        const senhaCriptografada =
            await bcrypt.hash(
                senha,
                12
            );

        const administrador =
            await Usuario.create({
                nome,
                email,
                login,
                senha: senhaCriptografada,
                perfil: "admin",
                ativo: true
            });

        console.log(
            "\n========================================"
        );

        console.log(
            " ADMINISTRADOR CRIADO COM SUCESSO!"
        );

        console.log(
            "========================================"
        );

        console.log(
            "ID:",
            administrador.id
        );

        console.log(
            "Nome:",
            administrador.nome
        );

        console.log(
            "E-mail:",
            administrador.email
        );

        console.log(
            "Login:",
            administrador.login
        );

        console.log(
            "Perfil:",
            administrador.perfil
        );

        console.log(
            "\nA senha foi armazenada de forma criptografada."
        );
    } catch (erro) {
        console.error(
            "\nNão foi possível criar o administrador."
        );

        console.error(
            erro.message
        );
    } finally {
        leitor.close();

        await sequelize.close();

        console.log(
            "\nConexão com o banco encerrada."
        );
    }
}

criarAdministrador();