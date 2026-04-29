USE vivadarte;
IF OBJECT_ID('LINHA_FATURACAO','U') IS NOT NULL DROP TABLE LINHA_FATURACAO;
IF OBJECT_ID('VALIDACAO_COACHING','U') IS NOT NULL DROP TABLE VALIDACAO_COACHING;
IF OBJECT_ID('COACHING','U') IS NOT NULL DROP TABLE COACHING;
IF OBJECT_ID('PEDIDO_COACHING_PARTICIPANTE','U') IS NOT NULL DROP TABLE PEDIDO_COACHING_PARTICIPANTE;
IF OBJECT_ID('PEDIDO_COACHING','U') IS NOT NULL DROP TABLE PEDIDO_COACHING;
IF OBJECT_ID('TABELA_PRECO','U') IS NOT NULL DROP TABLE TABELA_PRECO;
IF OBJECT_ID('FATURACAO_MENSAL','U') IS NOT NULL DROP TABLE FATURACAO_MENSAL;
IF OBJECT_ID('DISPONIBILIDADE_PROFESSOR','U') IS NOT NULL DROP TABLE DISPONIBILIDADE_PROFESSOR;
IF OBJECT_ID('PROFESSOR_MODALIDADE','U') IS NOT NULL DROP TABLE PROFESSOR_MODALIDADE;
IF OBJECT_ID('SALA_MODALIDADE','U') IS NOT NULL DROP TABLE SALA_MODALIDADE;
IF OBJECT_ID('ENCARREGADO_ALUNO','U') IS NOT NULL DROP TABLE ENCARREGADO_ALUNO;
IF OBJECT_ID('UTILIZADOR_PERFIL','U') IS NOT NULL DROP TABLE UTILIZADOR_PERFIL;
IF OBJECT_ID('TOKEN_RECUPERACAO','U') IS NOT NULL DROP TABLE TOKEN_RECUPERACAO;
IF OBJECT_ID('PENALIZACAO_PECA','U') IS NOT NULL DROP TABLE PENALIZACAO_PECA;
IF OBJECT_ID('EMPRESTIMO_ITEM','U') IS NOT NULL DROP TABLE EMPRESTIMO_ITEM;
IF OBJECT_ID('EMPRESTIMO','U') IS NOT NULL DROP TABLE EMPRESTIMO;
IF OBJECT_ID('VENDA_PECA','U') IS NOT NULL DROP TABLE VENDA_PECA;
IF OBJECT_ID('FOTO_PECA','U') IS NOT NULL DROP TABLE FOTO_PECA;
IF OBJECT_ID('PECA','U') IS NOT NULL DROP TABLE PECA;
IF OBJECT_ID('CATEGORIA_PECA','U') IS NOT NULL DROP TABLE CATEGORIA_PECA;
IF OBJECT_ID('ALUNO','U') IS NOT NULL DROP TABLE ALUNO;
IF OBJECT_ID('SALA','U') IS NOT NULL DROP TABLE SALA;
IF OBJECT_ID('MODALIDADE','U') IS NOT NULL DROP TABLE MODALIDADE;
IF OBJECT_ID('ANO_LETIVO','U') IS NOT NULL DROP TABLE ANO_LETIVO;
IF OBJECT_ID('UTILIZADOR','U') IS NOT NULL DROP TABLE UTILIZADOR;
IF OBJECT_ID('PERFIL','U') IS NOT NULL DROP TABLE PERFIL;


CREATE TABLE PERFIL (
    id_perfil INT IDENTITY(1,1) PRIMARY KEY,
    nome      NVARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO PERFIL (nome) VALUES
    ('Admin'), ('Coordenação'), ('Professor'), ('EE'), ('Contabilidade');


CREATE TABLE UTILIZADOR (
    id_utilizador INT IDENTITY(1,1) PRIMARY KEY,
    nome          NVARCHAR(255) NOT NULL,
    email         NVARCHAR(255) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    telefone      NVARCHAR(30),
    ativo         BIT           NOT NULL DEFAULT 1,
    data_criacao  DATE          NOT NULL DEFAULT (GETDATE())
);

CREATE TABLE UTILIZADOR_PERFIL (
    UTILIZADOR_id INT NOT NULL,
    PERFIL_id     INT NOT NULL,
    PRIMARY KEY (UTILIZADOR_id, PERFIL_id),
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (PERFIL_id)     REFERENCES PERFIL(id_perfil)
);


CREATE TABLE TOKEN_RECUPERACAO (
    id_token       INT IDENTITY(1,1) PRIMARY KEY,
    token          NVARCHAR(255) NOT NULL UNIQUE,
    data_expiracao DATETIME      NOT NULL,
    usado          BIT           NOT NULL DEFAULT 0,
    data_criacao   DATE          NOT NULL DEFAULT (GETDATE()),
    UTILIZADOR_id  INT           NOT NULL,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador)
);


CREATE TABLE MODALIDADE (
    id_modalidade INT IDENTITY(1,1) PRIMARY KEY,
    nome          NVARCHAR(255) NOT NULL UNIQUE,
    nivel         NVARCHAR(255),
    ativo         BIT           NOT NULL DEFAULT 1
);

CREATE TABLE PROFESSOR_MODALIDADE (
    UTILIZADOR_id INT NOT NULL,
    MODALIDADE_id INT NOT NULL,
    PRIMARY KEY (UTILIZADOR_id, MODALIDADE_id),
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (MODALIDADE_id) REFERENCES MODALIDADE(id_modalidade)
);


CREATE TABLE DISPONIBILIDADE_PROFESSOR (
    id_disponibilidade   INT IDENTITY(1,1) PRIMARY KEY,
    dia_semana           INT  NOT NULL,
    hora_inicio          TIME NOT NULL,
    hora_fim             TIME NOT NULL,
    data_inicio_vigencia DATE NOT NULL,
    data_fim_vigencia    DATE,
    UTILIZADOR_id        INT  NOT NULL,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador)
);


CREATE TABLE SALA (
    id_sala           INT IDENTITY(1,1) PRIMARY KEY,
    nome              NVARCHAR(255) NOT NULL UNIQUE,
    capacidade_maxima INT           NOT NULL
);


CREATE TABLE SALA_MODALIDADE (
    MODALIDADE_id INT NOT NULL,
    SALA_id       INT NOT NULL,
    PRIMARY KEY (MODALIDADE_id, SALA_id),
    FOREIGN KEY (MODALIDADE_id) REFERENCES MODALIDADE(id_modalidade),
    FOREIGN KEY (SALA_id)       REFERENCES SALA(id_sala)
);


CREATE TABLE CATEGORIA_PECA (
    id_categoria_peca INT IDENTITY(1,1) PRIMARY KEY,
    nome              NVARCHAR(255) NOT NULL UNIQUE
);


CREATE TABLE PECA (
    id_peca                    INT IDENTITY(1,1) PRIMARY KEY,
    nome                       NVARCHAR(255) NOT NULL,
    descricao                  NVARCHAR(255),
    tamanho                    NVARCHAR(50),
    estado                     NVARCHAR(50)  NOT NULL DEFAULT 'Disponível',
    origem                     NVARCHAR(50),
    localizacao                NVARCHAR(255),
    disponivel_para_emprestimo BIT           NOT NULL DEFAULT 1,
    disponivel_para_venda      BIT           NOT NULL DEFAULT 0,
    data_registo               DATE          NOT NULL DEFAULT (GETDATE()),
    UTILIZADOR_id              INT,
    CATEGORIA_PECA_id          INT,
    FOREIGN KEY (UTILIZADOR_id)     REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (CATEGORIA_PECA_id) REFERENCES CATEGORIA_PECA(id_categoria_peca)
);

CREATE TABLE FOTO_PECA (
    id_foto_peca INT IDENTITY(1,1) PRIMARY KEY,
    foto         NVARCHAR(255),
    descricao    NVARCHAR(255),
    PECA_id      INT NOT NULL,
    FOREIGN KEY (PECA_id) REFERENCES PECA(id_peca)
);


CREATE TABLE VENDA_PECA (
    id_venda            INT IDENTITY(1,1) PRIMARY KEY,
    preco               DECIMAL(10,2) NOT NULL,
    data_colocacao      DATE          NOT NULL DEFAULT (GETDATE()),
    data_venda          DATE,
    estado              NVARCHAR(50)  NOT NULL DEFAULT 'Disponível',
    metodo_pagamento    NVARCHAR(50),
    PECA_id             INT           NOT NULL,
    UTILIZADOR_vendedor_id  INT       NOT NULL,
    UTILIZADOR_comprador_id INT,
    FOREIGN KEY (PECA_id)                 REFERENCES PECA(id_peca),
    FOREIGN KEY (UTILIZADOR_vendedor_id)  REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (UTILIZADOR_comprador_id) REFERENCES UTILIZADOR(id_utilizador)
);

CREATE TABLE EMPRESTIMO (
    id_emprestimo    INT IDENTITY(1,1) PRIMARY KEY,
    data_pedido      DATE          NOT NULL DEFAULT (GETDATE()),
    data_inicio      DATE          NOT NULL,
    data_fim         DATE          NOT NULL,
    data_devolucao   DATE,
    estado           NVARCHAR(50)  NOT NULL DEFAULT 'Ativo',
    observacoes      NVARCHAR(255),
    valor            DECIMAL(10,2),
    metodo_pagamento NVARCHAR(50),
    estado_pagamento NVARCHAR(50)  NOT NULL DEFAULT 'Pendente',
    data_pagamento   DATE,
    UTILIZADOR_id    INT           NOT NULL,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador)
);


CREATE TABLE EMPRESTIMO_ITEM (
    PECA_id          INT          NOT NULL,
    EMPRESTIMO_id    INT          NOT NULL,
    estado_entrega   NVARCHAR(50),
    estado_devolucao NVARCHAR(50),
    observacoes      NVARCHAR(255),
    PRIMARY KEY (PECA_id, EMPRESTIMO_id),
    FOREIGN KEY (PECA_id)       REFERENCES PECA(id_peca),
    FOREIGN KEY (EMPRESTIMO_id) REFERENCES EMPRESTIMO(id_emprestimo)
);


CREATE TABLE PENALIZACAO_PECA (
    id_penalizacao INT IDENTITY(1,1) PRIMARY KEY,
    tipo           NVARCHAR(50),
    valor          DECIMAL(10,2) NOT NULL,
    descricao      NVARCHAR(255),
    data_registo   DATE          NOT NULL DEFAULT (GETDATE()),
    PECA_id        INT           NOT NULL,
    EMPRESTIMO_id  INT           NOT NULL,
    FOREIGN KEY (PECA_id)       REFERENCES PECA(id_peca),
    FOREIGN KEY (EMPRESTIMO_id) REFERENCES EMPRESTIMO(id_emprestimo)
);


CREATE TABLE ALUNO (
    id_aluno        INT IDENTITY(1,1) PRIMARY KEY,
    nome            NVARCHAR(255) NOT NULL,
    data_nascimento DATE,
    ativo           BIT           NOT NULL DEFAULT 1,
    data_criacao    DATE          NOT NULL DEFAULT (GETDATE()),
    UTILIZADOR_id   INT,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador)
);


CREATE TABLE ENCARREGADO_ALUNO (
    UTILIZADOR_id INT NOT NULL,
    ALUNO_id      INT NOT NULL,
    PRIMARY KEY (UTILIZADOR_id, ALUNO_id),
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (ALUNO_id)      REFERENCES ALUNO(id_aluno)
);


CREATE TABLE ANO_LETIVO (
    id_ano_letivo INT IDENTITY(1,1) PRIMARY KEY,
    ano           NVARCHAR(20) NOT NULL UNIQUE
);


CREATE TABLE TABELA_PRECO (
    id_preco                 INT IDENTITY(1,1) PRIMARY KEY,
    formato_aula             NVARCHAR(50)  NOT NULL,
    duracao_minutos          INT           NOT NULL,
    numero_min_participantes INT           NOT NULL DEFAULT 1,
    numero_max_participantes INT           NOT NULL,
    dia_semana               INT,
    preco                    DECIMAL(10,2) NOT NULL,
    ativo                    BIT           NOT NULL DEFAULT 1,
    UTILIZADOR_id            INT,
    MODALIDADE_id            INT           NOT NULL,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (MODALIDADE_id) REFERENCES MODALIDADE(id_modalidade)
);


CREATE TABLE PEDIDO_COACHING (
    id_pedido_coaching      INT IDENTITY(1,1) PRIMARY KEY,
    formato_aula            NVARCHAR(50)  NOT NULL,
    duracao_minutos         INT           NOT NULL,
    numero_participantes    INT           NOT NULL,
    data_pedido             DATE          NOT NULL DEFAULT (GETDATE()),
    data_aula_pretendida    DATE          NOT NULL,
    hora_inicio_pretendida  TIME,
    estado                  NVARCHAR(50)  NOT NULL DEFAULT 'Pendente',
    custo_estimado          DECIMAL(10,2),
    UTILIZADOR_id           INT           NOT NULL,
    ANO_LETIVO_id           INT           NOT NULL,
    MODALIDADE_id           INT           NOT NULL,
    UTILIZADOR_professor_id INT,
    FOREIGN KEY (UTILIZADOR_id)           REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (ANO_LETIVO_id)           REFERENCES ANO_LETIVO(id_ano_letivo),
    FOREIGN KEY (MODALIDADE_id)           REFERENCES MODALIDADE(id_modalidade),
    FOREIGN KEY (UTILIZADOR_professor_id) REFERENCES UTILIZADOR(id_utilizador)
);


CREATE TABLE PEDIDO_COACHING_PARTICIPANTE (
    ALUNO_id           INT NOT NULL,
    PEDIDO_COACHING_id INT NOT NULL,
    PRIMARY KEY (ALUNO_id, PEDIDO_COACHING_id),
    FOREIGN KEY (ALUNO_id)           REFERENCES ALUNO(id_aluno),
    FOREIGN KEY (PEDIDO_COACHING_id) REFERENCES PEDIDO_COACHING(id_pedido_coaching)
);


CREATE TABLE COACHING (
    id_coaching          INT IDENTITY(1,1) PRIMARY KEY,
    formato_aula         NVARCHAR(50)  NOT NULL,
    duracao_minutos      INT           NOT NULL,
    numero_participantes INT           NOT NULL,
    data_aula            DATE          NOT NULL,
    hora_inicio          TIME          NOT NULL,
    hora_fim             TIME          NOT NULL,
    estado               NVARCHAR(50)  NOT NULL DEFAULT 'Agendado',
    valor_final          DECIMAL(10,2),
    UTILIZADOR_id        INT           NOT NULL,
    ANO_LETIVO_id        INT           NOT NULL,
    MODALIDADE_id        INT           NOT NULL,
    SALA_id              INT           NOT NULL,
    PEDIDO_COACHING_id   INT,
    FOREIGN KEY (UTILIZADOR_id)      REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (ANO_LETIVO_id)      REFERENCES ANO_LETIVO(id_ano_letivo),
    FOREIGN KEY (MODALIDADE_id)      REFERENCES MODALIDADE(id_modalidade),
    FOREIGN KEY (SALA_id)            REFERENCES SALA(id_sala),
    FOREIGN KEY (PEDIDO_COACHING_id) REFERENCES PEDIDO_COACHING(id_pedido_coaching)
);


CREATE TABLE VALIDACAO_COACHING (
    id_validacao     INT IDENTITY(1,1) PRIMARY KEY,
    tipo_validador   NVARCHAR(50) NOT NULL,
    estado_validacao NVARCHAR(50) NOT NULL DEFAULT 'Pendente',
    data_validacao   DATE,
    observacoes      NVARCHAR(255),
    UTILIZADOR_id    INT          NOT NULL,
    COACHING_id      INT          NOT NULL,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (COACHING_id)   REFERENCES COACHING(id_coaching)
);

CREATE TABLE FATURACAO_MENSAL (
    id_faturacao     INT IDENTITY(1,1) PRIMARY KEY,
    ano              INT           NOT NULL,
    mes              INT           NOT NULL,
    data_geracao     DATE          NOT NULL DEFAULT (GETDATE()),
    total            DECIMAL(10,2) NOT NULL DEFAULT 0,
    metodo_pagamento NVARCHAR(50),
    data_pagamento   DATE,
    estado_pagamento NVARCHAR(50)  NOT NULL DEFAULT 'Pendente',
    UTILIZADOR_id    INT,
    ANO_LETIVO_id    INT           NOT NULL,
    FOREIGN KEY (UTILIZADOR_id) REFERENCES UTILIZADOR(id_utilizador),
    FOREIGN KEY (ANO_LETIVO_id) REFERENCES ANO_LETIVO(id_ano_letivo)
);


CREATE TABLE LINHA_FATURACAO (
    id_linha_faturacao  INT IDENTITY(1,1) PRIMARY KEY,
    descricao           NVARCHAR(255)  NOT NULL,
    valor               DECIMAL(10,2)  NOT NULL,
    ajuste              DECIMAL(10,2)  NOT NULL DEFAULT 0,
    COACHING_id         INT            NOT NULL,
    FATURACAO_MENSAL_id INT            NOT NULL,
    FOREIGN KEY (COACHING_id)         REFERENCES COACHING(id_coaching),
    FOREIGN KEY (FATURACAO_MENSAL_id) REFERENCES FATURACAO_MENSAL(id_faturacao)
);

PRINT 'Base de dados Viva D''Arte criada com sucesso!';
