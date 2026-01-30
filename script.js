// CONFIGURAÇÃO DA API (Substitua pela sua URL do Google Apps Script)
const API_URL = "https://script.google.com/macros/s/AKfycbxRiZBsoNCP3v8m55L341MXUnjbMH4VkpwsdxWMpCeiNMEeWZBFB-l5PfUgDPyAX9jH/exec";

let abaAtiva = 'banco';
let dadosBanco = [];
let dadosLicitacao = [];

// 1. CARREGAMENTO INICIAL
window.onload = () => carregarDados();

// 2. TROCA DE ABAS
async function mudarAba(aba) {
    abaAtiva = aba;
    
    // UI: Botões
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('bg-white/10'));
    document.getElementById(`btn-${aba}`).classList.add('bg-white/10');

    // UI: Títulos
    document.getElementById('tituloPagina').innerText = aba === 'banco' ? "BANCO DE PREÇOS" : "LICITAÇÕES";
    
    await carregarDados();
}

// 3. BUSCA DE DADOS (GET)
async function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    const status = document.getElementById('statusConexao');
    
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div></td></tr>';
    
    const target = abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES';

    try {
        const response = await fetch(`${API_URL}?aba=${target}`);
        const dados = await response.json();
        
        if (abaAtiva === 'banco') dadosBanco = dados;
        else dadosLicitacao = dados;

        renderizarTabela(dados);
        status.innerText = "Sincronizado";
    } catch (error) {
        status.innerText = "Erro de Conexão";
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500 font-bold">Falha ao carregar dados. Verifique a URL da API.</td></tr>';
    }
}

// 4. IMPORTAÇÃO (POST)
async function importarDados(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;

    document.getElementById('statusConexao').innerText = "Lendo arquivo...";
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const conteudo = e.target.result;
        let linhas = [];

        // Se for Excel (XLSX)
        if (arquivo.name.endsWith('.xlsx') || arquivo.name.endsWith('.xls')) {
            const workbook = XLSX.read(new Uint8Array(conteudo), { type: 'array' });
            linhas = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        } 
        // Se for TXT ou CSV
        else {
            const texto = new TextDecoder().decode(conteudo);
            linhas = texto.split('\n').map(linha => linha.split('\t')); // Assume tabulação do RM
        }

        await enviarParaGoogle(linhas.slice(1)); // Pula o cabeçalho
    };

    if (arquivo.name.endsWith('.xlsx') || arquivo.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(arquivo);
    } else {
        reader.readAsArrayBuffer(arquivo);
    }
}

async function enviarParaGoogle(linhas) {
    const target = abaAtiva === 'banco' ? 'DB_ITENS' : 'DB_LICITACOES';
    let processados = 0;

    for (let row of linhas) {
        // Ignora linhas vazias ou curtas demais
        if (!row[0] || row.length < 5) continue;

        const payload = {
            TABELA_DESTINO: target,
            DATA_CRIACAO: String(row[3] || ""),
            CODCOTACAO: String(row[2] || ""),
            COD_REDUZIDO_CCUSTO: String(row[4] || ""),
            DESCRICAO_CC: String(row[5] || ""),
            ID_ITEM: String(row[0] || ""),
            PRODUTO: String(row[7] || ""),
            QUANTIDADE: row[8] || 0,
            UNIDADE: String(row[9] || ""),
            PRECO_UNITARIO: limparValor(row[10]),
            VALOR_TOTAL: limparValor(row[11]),
            FORNECEDOR: String(row[12] || ""),
            COMPRADOR: String(row[13] || "")
        };

        // Enviamos usando mode: 'no-cors' para evitar o bloqueio do navegador
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify(payload)
        });
        
        processados++;
        document.getElementById('statusConexao').innerText = `Enviando: ${processados} itens`;
    }

    alert("Importação Concluída!");
    carregarDados();
}

// 5. FUNÇÕES AUXILIARES
function limparValor(valor) {
    if (!valor) return 0;
    // Remove R$, pontos de milhar e troca vírgula por ponto
    let limpo = String(valor).replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    return parseFloat(limpo) || 0;
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;

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