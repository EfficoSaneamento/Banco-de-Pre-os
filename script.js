// CONFIGURAÇÃO DA API
const API_URL = "https://script.google.com/macros/s/AKfycbxRiZBsoNCP3v8m55L341MXUnjbMH4VkpwsdxWMpCeiNMEeWZBFB-l5PfUgDPyAX9jH/exec";

let abaAtiva = 'banco';
let dadosAtuais = [];

// 1. CARREGAMENTO INICIAL
window.onload = () => carregarDados();

// 2. TROCA DE ABAS
async function mudarAba(aba) {
    abaAtiva = aba;
    
    // UI: Atualizar Botões (Remove de todos e adiciona no ativo)
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('bg-white/10'));
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if (btnAtivo) btnAtivo.classList.add('bg-white/10');

    // UI: Títulos (Correção da sintaxe ternária encadeada)
    const titulos = {
        'banco': "BANCO DE PREÇOS",
        'licitacao': "LICITAÇÕES",
        'solicitacao': "SOLICITAÇÃO DE COMPRAS"
    };
    document.getElementById('tituloPagina').innerText = titulos[aba] || "SUPRIMENTOS";
    
    await carregarDados();
}

// 3. BUSCA DE DADOS (GET)
async function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    const status = document.getElementById('statusConexao');
    
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div></td></tr>';
    
    // Define o destino da planilha baseado na aba
    const targets = {
        'banco': 'DB_ITENS',
        'licitacao': 'DB_LICITACOES',
        'solicitacao': 'DB_SOLICITACOES'
    };
    const target = targets[abaAtiva];

    try {
        const response = await fetch(`${API_URL}?aba=${target}`);
        const dados = await response.json();
        
        dadosAtuais = dados; // Armazena para filtros/buscas
        renderizarTabela(dados);
        status.innerText = "Sincronizado";
    } catch (error) {
        status.innerText = "Erro de Conexão";
        corpo.innerHTML = `<tr><td colspan="12" class="p-10 text-center text-red-500 font-bold">Falha ao carregar dados de ${target}.</td></tr>`;
    }
}

// 4. IMPORTAÇÃO E ENVIO (POST)
async function importarDados(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;

    document.getElementById('statusConexao').innerText = "Lendo arquivo...";
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const conteudo = e.target.result;
        let linhas = [];

        // Detecção de formato simplificada
        if (arquivo.name.endsWith('.xlsx') || arquivo.name.endsWith('.xls')) {
            const workbook = XLSX.read(new Uint8Array(conteudo), { type: 'array' });
            linhas = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        } else {
            const texto = new TextDecoder().decode(conteudo);
            // Detecta se é CSV (vírgula) ou RM (tabulação)
            const separador = texto.includes('\t') ? '\t' : ';';
            linhas = texto.split('\n').map(linha => linha.split(separador));
        }

        await enviarParaGoogle(linhas.slice(1)); // Pula o cabeçalho
    };

    reader.readAsArrayBuffer(arquivo);
}

async function enviarParaGoogle(linhas) {
    const targets = {
        'banco': 'DB_ITENS',
        'licitacao': 'DB_LICITACOES',
        'solicitacao': 'DB_SOLICITACOES'
    };
    const target = targets[abaAtiva];
    let processados = 0;

    for (let row of linhas) {
        if (!row[0] || row.length < 3) continue;

        // Mapeamento de colunas (Ajuste os índices [0, 1, 2...] conforme seu arquivo real)
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
            PRECO_UNITARIO: limparValor(row[8]),
            VALOR_TOTAL: limparValor(row[9]),
            FORNECEDOR: String(row[10] || ""),
            COMPRADOR: String(row[11] || "")
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                body: JSON.stringify(payload)
            });
            processados++;
            document.getElementById('statusConexao').innerText = `Enviando: ${processados} itens...`;
        } catch (e) {
            console.error("Erro ao enviar linha:", e);
        }
    }

    alert(`Sucesso! ${processados} registros enviados para ${target}.`);
    carregarDados();
}

// 5. FUNÇÕES AUXILIARES
function limparValor(valor) {
    if (!valor) return 0;
    let limpo = String(valor).replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    return parseFloat(limpo) || 0;
}

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