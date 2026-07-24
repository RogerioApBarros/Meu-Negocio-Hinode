require("dotenv").config();

const express = require(
    "express"
);

const cors = require(
    "cors"
);

const helmet = require(
    "helmet"
);

const rateLimit = require(
    "express-rate-limit"
);

const sequelize = require(
    "./database/conexao"
);

const configurarAssociacoes = require(
    "./database/associacoes"
);

const executarMigracaoMultiempresa = require(
    "./database/migracaoMultiempresa"
);

/* =====================================================
   MODELS
===================================================== */

require(
    "./models/clientes"
);

require(
    "./models/produtosModel"
);

require(
    "./models/vendasModel"
);

require(
    "./models/itensVendaModel"
);

require(
    "./models/recebimentosModel"
);

require(
    "./models/mensagensWhatsappModel"
);

require(
    "./models/usuariosModel"
);

require(
    "./models/empresasModel"
);

/*
 * Configura os relacionamentos entre os models
 * antes da sincronização do banco.
 */
configurarAssociacoes();

/* =====================================================
   ROTAS
===================================================== */

const clientesRoutes = require(
    "./routes/clientesRoutes"
);

const produtosRoutes = require(
    "./routes/produtosRoutes"
);

const vendasRoutes = require(
    "./routes/vendasRoutes"
);

const recebimentosRoutes = require(
    "./routes/recebimentosRoutes"
);

const fluxoRoutes = require(
    "./routes/fluxoRoutes"
);

const rankingRoutes = require(
    "./routes/rankingRoutes"
);

const relatoriosRoutes = require(
    "./routes/relatoriosRoutes"
);

const mensagensWhatsappRoutes = require(
    "./routes/mensagensWhatsappRoutes"
);

const usuariosRoutes = require(
    "./routes/usuariosRoutes"
);

const empresasRoutes = require(
    "./routes/empresasRoutes"
);

/* =====================================================
   APLICAÇÃO
===================================================== */

const app =
    express();

/*
 * Necessário para o sistema funcionar corretamente
 * quando estiver atrás do proxy da hospedagem.
 *
 * Isso também permite que o express-rate-limit
 * identifique corretamente o endereço IP do usuário.
 */
app.set(
    "trust proxy",
    1
);

/* =====================================================
   SEGURANÇA
===================================================== */

app.use(
    helmet({
        crossOriginResourcePolicy: false
    })
);

/* =====================================================
   CONFIGURAÇÃO DO CORS
===================================================== */

/*
 * Em desenvolvimento, permite os endereços locais.
 *
 * Em produção, os endereços permitidos serão informados
 * por meio da variável FRONTEND_URL.
 *
 * É possível informar mais de um endereço,
 * separando-os por vírgula.
 *
 * Exemplo:
 *
 * FRONTEND_URL=https://meusistema.com.br,https://www.meusistema.com.br
 */

const origensPermitidas =
    process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL
            .split(",")
            .map(
                function (
                    origem
                ) {
                    return origem.trim();
                }
            )
            .filter(
                function (
                    origem
                ) {
                    return origem !== "";
                }
            )
        : [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:3000",
            "http://localhost:3000"
        ];

app.use(
    cors({
        origin: function (
            origem,
            callback
        ) {
            /*
             * Permite requisições sem o cabeçalho Origin.
             *
             * Isso é necessário para testes diretos,
             * Postman, Insomnia e serviços internos.
             */
            if (!origem) {
                return callback(
                    null,
                    true
                );
            }

            if (
                origensPermitidas.includes(
                    origem
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            console.warn(
                "Tentativa de acesso bloqueada pelo CORS:",
                origem
            );

            return callback(
                new Error(
                    "Origem não permitida pelo CORS."
                )
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

/* =====================================================
   LEITURA DE DADOS RECEBIDOS
===================================================== */

app.use(
    express.json({
        limit: "10mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);

/* =====================================================
   LIMITE GERAL DE REQUISIÇÕES
===================================================== */

const limiteGeral =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        max:
            300,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        message: {
            sucesso: false,
            mensagem:
                "Muitas requisições foram realizadas. Aguarde alguns minutos e tente novamente."
        }
    });

app.use(
    limiteGeral
);

/* =====================================================
   LIMITE ESPECÍFICO PARA LOGIN
===================================================== */

const limiteLogin =
    rateLimit({
        windowMs:
            15 * 60 * 1000,

        max:
            10,

        standardHeaders:
            true,

        legacyHeaders:
            false,

        skipSuccessfulRequests:
            true,

        message: {
            sucesso: false,
            mensagem:
                "Muitas tentativas de login. Aguarde 15 minutos e tente novamente."
        }
    });

/* =====================================================
   ROTA PRINCIPAL
===================================================== */

app.get(
    "/",
    function (
        req,
        res
    ) {
        res.status(200).json({
            sucesso: true,
            mensagem:
                "Back-end Meu Negócio Hinode funcionando!"
        });
    }
);

/* =====================================================
   ROTA DE VERIFICAÇÃO DO SERVIDOR
===================================================== */

app.get(
    "/status",
    function (
        req,
        res
    ) {
        res.status(200).json({
            sucesso: true,

            servidor:
                "online",

            ambiente:
                process.env.NODE_ENV ||
                "development",

            data:
                new Date()
        });
    }
);

/* =====================================================
   ROTAS DE USUÁRIOS
===================================================== */

app.use(
    "/usuarios/login",
    limiteLogin
);

app.use(
    "/usuarios",
    usuariosRoutes
);

app.use(
    "/empresas",
    empresasRoutes
);

/* =====================================================
   ROTAS DO SISTEMA
===================================================== */

app.use(
    "/clientes",
    clientesRoutes
);

app.use(
    "/produtos",
    produtosRoutes
);

app.use(
    "/vendas",
    vendasRoutes
);

app.use(
    "/recebimentos",
    recebimentosRoutes
);

app.use(
    "/fluxo",
    fluxoRoutes
);

app.use(
    "/ranking",
    rankingRoutes
);

app.use(
    "/relatorios",
    relatoriosRoutes
);

app.use(
    "/mensagens-whatsapp",
    mensagensWhatsappRoutes
);

/* =====================================================
   ROTA NÃO ENCONTRADA
===================================================== */

app.use(
    function (
        req,
        res
    ) {
        res.status(404).json({
            sucesso: false,
            mensagem:
                "Rota não encontrada."
        });
    }
);

/* =====================================================
   TRATAMENTO GERAL DE ERROS
===================================================== */

app.use(
    function (
        erro,
        req,
        res,
        next
    ) {
        console.error(
            "Erro interno do servidor:",
            erro
        );

        if (
            res.headersSent
        ) {
            return next(
                erro
            );
        }

        /*
         * Erros gerados pelo bloqueio do CORS.
         */
        if (
            erro.message ===
            "Origem não permitida pelo CORS."
        ) {
            return res.status(403).json({
                sucesso: false,
                mensagem:
                    "A origem desta requisição não possui permissão para acessar o servidor."
            });
        }

        return res.status(500).json({
            sucesso: false,
            mensagem:
                "Erro interno do servidor."
        });
    }
);

/* =====================================================
   PORTA DO SERVIDOR
===================================================== */

/*
 * Em produção, a hospedagem informa automaticamente
 * a porta através da variável PORT.
 *
 * Em desenvolvimento, será utilizada a porta 3000.
 */

const PORT =
    Number(
        process.env.PORT
    ) || 3000;

/* =====================================================
   INICIALIZAÇÃO DO BANCO E SERVIDOR
===================================================== */

async function iniciarServidor() {
    try {
        await sequelize.authenticate();

        console.log(
            "Banco conectado!"
        );

        /*
         * O sync cria tabelas que ainda não existem.
         *
         * Não utilizar force: true,
         * pois isso apagaria as tabelas existentes.
         */
        await sequelize.sync();

        console.log(
            "Tabelas sincronizadas!"
        );

        /*
         * Migração temporária da etapa multiempresa.
         * É segura para executar mais de uma vez.
         */
        await executarMigracaoMultiempresa();

        console.log(
            "Migração multiempresa verificada!"
        );

        app.listen(
            PORT,
            "0.0.0.0",
            function () {
                console.log(
                    `Servidor rodando na porta ${PORT}`
                );

                console.log(
                    `Ambiente: ${
                        process.env.NODE_ENV ||
                        "development"
                    }`
                );
            }
        );
    } catch (
        erro
    ) {
        console.error(
            "Erro ao iniciar o servidor:",
            erro
        );

        process.exit(
            1
        );
    }
}

iniciarServidor();