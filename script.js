const API_URL = "https://script.google.com/macros/s/AKfycbxfNa90-sGGdqavuyTZh0bNHoblZ1dlXkVJZ5kcS9Kqcp7ElGJRSbgXmEIqpdqS3No_UA/exec";

let abaAtiva = 'banco';
let dadosGlobais = [];

// 1. CARREGAMENTO INICIAL
window.onload = () => mudarAba('banco');

// 2. TROCA DE ABAS (CORRIGIDO)
async function mudarAba(aba) {
    abaAtiva = aba;
    
    // UI: Destacar botão ativo na sidebar
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('bg-white/10', 'border-l-4', 'border-green-400'));
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if (btnAtivo) btnAtivo.classList.add('bg-white/10', 'border-l-4', 'border-green-400');

    // UI: Títulos
    const nomesAbas = {
        'banco': 'BANCO DE PREÇOS',
        'licitacao': 'LICITAÇÕES',
        'solicitacao': 'SOLICITAÇÃO DE COMPRAS'
    };
    document.getElementById('tituloPagina').innerText = nomesAbas[aba] || "SUPRIMENTOS";
    
    // Reiniciar Tabela e Buscar Dados
    document.getElementById('corpoTabela').innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div></td></tr>';
    await carregarDados();
}

// 3. BUSCA DE DADOS (GET)
async function carregarDados() {
    const status = document.getElementById('statusConexao');
    const targets = { 'banco': 'DB_ITENS', 'licitacao': 'DB_LICITACOES', 'solicitacao': 'DB_SOLICITACOES' };

    try {
        const response = await fetch(`${API_URL}?aba=${targets[abaAtiva]}`);
        const dados = await response.json();
        dadosGlobais = dados;
        renderizarTabela(dados);
        status.innerText = "Sincronizado";
    } catch (error) {
        status.innerText = "Erro de Conexão";
        document.getElementById('corpoTabela').innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500">Falha ao buscar dados no Google Sheets.</td></tr>';
    }
}

// 4. RENDERIZAÇÃO
function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => `
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="px-4 py-3">${item.DATA_CRIACAO || '-'}</td>
            <td class="px-4 py-3 font-bold">${item.CODCOTACAO || '-'}</td>
            <td class="px-4 py-3">${item.COD_REDUZIDO_CCUSTO || '-'}</td>
            <td class="px-4 py-3 text-[10px] max-w-xs truncate">${item.DESCRICAO_CC || '-'}</td>
            <td class="px-4 py-3">${item.ID_ITEM || '-'}</td>
            <td class="px-4 py-3 font-medium">${item.PRODUTO || '-'}</td>
            <td class="px-4 py-3">${item.QUANTIDADE || '-'}</td>
            <td class="px-4 py-3">${item.UNIDADE || '-'}</td>
            <td class="px-4 py-3">R$ ${Number(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-3 font-bold text-effico-green">R$ ${Number(item.VALOR_TOTAL || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-3 uppercase text-[10px]">${item.FORNECEDOR || '-'}</td>
            <td class="px-4 py-3">${item.COMPRADOR || '-'}</td>
        </tr>
    `).join('');
}

// 5. IMPORTAÇÃO
async function importarDados(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;

    document.getElementById('statusConexao').innerText = "Lendo arquivo...";
    const reader = new FileReader();

    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        await enviarParaGoogle(linhas.slice(1));
    };
    reader.readAsArrayBuffer(arquivo);
}

async function enviarParaGoogle(linhas) {
    const targets = { 'banco': 'DB_ITENS', 'licitacao': 'DB_LICITACOES', 'solicitacao': 'DB_SOLICITACOES' };
    const target = targets[abaAtiva];
    let count = 0;

    for (let row of linhas) {
        if (!row[0]) continue;
        const payload = {
            TABELA_DESTINO: target,
            DATA_CRIACAO: String(row[0] || ""),
            CODCOTACAO: String(row[1] || ""),
            COD_REDUZIDO_CCUSTO: String(row[2] || ""),
            DESCRICAO_CC: String(row[3] || ""),
            ID_ITEM: String(row[4] || ""),
            PRODUTO: String(row[5] || ""),
            QUANTIDADE: row[6] || 0,
            UNIDADE: String(row[7] || ""),
            PRECO_UNITARIO: String(row[8] || "0"),
            VALOR_TOTAL: String(row[9] || "0"),
            FORNECEDOR: String(row[10] || ""),
            COMPRADOR: String(row[11] || "")
        };

        await fetch(API_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
        count++;
        document.getElementById('statusConexao').innerText = `Enviando ${count}...`;
    }
    alert("Importação finalizada!");
    mudarAba(abaAtiva);
}

// 6. BUSCA FILTRADA
document.getElementById('inputBusca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = dadosGlobais.filter(item => 
        Object.values(item).some(val => String(val).toLowerCase().includes(termo))
    );
    renderizarTabela(filtrados);
});