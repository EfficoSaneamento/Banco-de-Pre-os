const URL_API = 'SUA_URL_DO_APPS_SCRIPT_AQUI';

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
    ['banco', 'solicitacao', 'avaliacao'].forEach(aba => {
        document.getElementById(`btn-${aba}`)
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
        colunas = ['ID_ORIGEM', 'DATA_CRIACAO', 'COD_REDUZIDO_CCUSTO', 'CODIGOPRD','PRODUTO', 'QUANTIDADEORC', 'UNIDADE','PRECO_UNITARIO','VALOR_TOTAL' ,'FORNECEDOR', 'COMPRADOR' ];
    }

    if (abaAtiva === 'solicitacao') {
        colunas = ['Identificador', 'Data da Solicitação','Data limite', 'Centro de Custo',' Descritivo', 'Quantidade','Observacao' ]
    }

    if (abaAtiva === 'avaliacao') {
        colunas = ['Fornecedor', 'Nota', 'Comentário'];
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
            <td colspan="4" class="p-4 text-center text-gray-400">
                Carregando...
            </td>
        </tr>
    `;

    const sheet =
        abaAtiva === 'solicitacao' ? 'DB_SOLICITACOES' :
        abaAtiva === 'avaliacao' ? 'DB_AVALIACAO' :
        'DB_ITENS';

    fetch(`${URL_API}?sheet=${sheet}`)
        .then(res => res.json())
        .then(dados => renderizarTabela(dados))
        .catch(() => {
            corpo.innerHTML = `
                <tr>
                    <td colspan="4" class="p-4 text-center text-red-500">
                        Erro ao carregar dados
                    </td>
                </tr>
            `;
        });
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    dados.forEach(linha => {
        corpo.innerHTML += `
            <tr class="border-t">
                ${linha.map(v => `<td class="p-3">${v}</td>`).join('')}
            </tr>
        `;
    });
}

/* ---------- INICIAL ---------- */
montarCabecalho();
carregarDados();