const URL_API = 'https://script.google.com/macros/s/AKfycbynSax6Q0OuPIiHvkOtQ_BYIuQh15kZtLZSWPUbRKxPboKFNPi4lTO2IGBKhpxYXprK/exec';

let abaAtiva = 'banco';

/* ---------- NAVEGAÇÃO ---------- */
function mudarAba(aba) {
    abaAtiva = aba;
    atualizarTitulo();
    atualizarBotoes();
    montarCabecalho();
    carregarDados();
}

function atualizarTitulo() {
    const titulos = {
        banco: 'BANCO DE PREÇOS',
        solicitacao: 'SOLICITAÇÃO DE COMPRAS',
        avaliacao: 'AVALIAÇÃO DO FORNECEDOR'
    };
    document.getElementById('tituloPagina').innerText = titulos[abaAtiva];
}

function atualizarBotoes() {
    ['banco', 'solicitacao', 'avaliacao'].forEach(a => {
        document.getElementById(`btn-${a}`)
            .classList.remove('bg-white/10');
    });
    document.getElementById(`btn-${abaAtiva}`)
        .classList.add('bg-white/10');
}

/* ---------- TABELA ---------- */
function montarCabecalho() {
    const cabecalho = document.getElementById('cabecalhoTabela');

    let colunas = [];

    if (abaAtiva === 'banco') {
        colunas = [
            'ID_ORIGEM','DATA_CRIACAO','COD_REDUZIDO_CCUSTO',
            'CODIGOPRD','PRODUTO','QUANTIDADEORC',
            'UNIDADE','PRECO_UNITARIO','VALOR_TOTAL',
            'FORNECEDOR','COMPRADOR'
        ];
    }

    if (abaAtiva === 'solicitacao') {
        colunas = [
            'IDENTIFICADOR','DATA_SOLICITACAO','DATA_LIMITE',
            'CENTRO_CUSTO','DESCRITIVO','QUANTIDADE','OBSERVACAO'
        ];
    }

    if (abaAtiva === 'avaliacao') {
        colunas = ['FORNECEDOR','NOTA','COMENTARIO'];
    }

    cabecalho.innerHTML = `
        <tr>
            ${colunas.map(c => `<th class="p-3 text-left">${c}</th>`).join('')}
        </tr>
    `;
}

/* ---------- DADOS ---------- */
function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = `
        <tr>
            <td colspan="20" class="p-4 text-center text-gray-400">
                Carregando...
            </td>
        </tr>
    `;

    const sheet =
        abaAtiva === 'solicitacao' ? 'DB_SOLICITACOES' :
        abaAtiva === 'avaliacao' ? 'DB_AVALIACAO' :
        'DB_ITENS';

    fetch(`${URL_API}?aba=${sheet}`)
        .then(res => res.json())
        .then(dados => renderizarTabela(dados))
        .catch(() => {
            corpo.innerHTML = `
                <tr>
                    <td colspan="20" class="p-4 text-center text-red-500">
                        Erro ao carregar dados
                    </td>
                </tr>
            `;
        });
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    if (!dados || dados.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="20" class="p-4 text-center text-gray-400">
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        return;
    }

    let colunas = [];

    if (abaAtiva === 'banco') {
        colunas = [
            'ID_ORIGEM','DATA_CRIACAO','COD_REDUZIDO_CCUSTO',
            'CODIGOPRD','PRODUTO','QUANTIDADEORC',
            'UNIDADE','PRECO_UNITARIO','VALOR_TOTAL',
            'FORNECEDOR','COMPRADOR'
        ];
    }

    if (abaAtiva === 'solicitacao') {
        colunas = [
            'IDENTIFICADOR','DATA_SOLICITACAO','DATA_LIMITE',
            'CENTRO_CUSTO','DESCRITIVO','QUANTIDADE','OBSERVACAO'
        ];
    }

    if (abaAtiva === 'avaliacao') {
        colunas = ['FORNECEDOR','NOTA','COMENTARIO'];
    }

    dados.forEach(linha => {
        corpo.innerHTML += `
            <tr class="border-t">
                ${colunas.map(c =>
                    `<td class="p-3">${linha[c] ?? ''}</td>`
                ).join('')}
            </tr>
        `;
    });
}

/* ---------- INICIAL ---------- */
montarCabecalho();
carregarDados();