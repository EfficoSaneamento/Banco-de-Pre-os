// Substitua pela URL que aparece no seu print (botão azul de copiar)
const API_URL = "https://script.google.com/macros/s/AKfycbxND5h9vpyq3YvLKXGuv2NJgxzPS5-_Je9Xxk4x-bT23nSf146HxnV-1y0D47rxFSTWQg/exec"; 

let abaAtiva = 'banco';
let dadosGlobais = [];

// Função para formatar moeda com segurança
const formatarMoeda = (valor) => {
    const num = parseFloat(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

async function mudarAba(aba) {
    if (abaAtiva === aba && dadosGlobais.length > 0) return; // Evita recarregar a mesma aba sem necessidade
    
    abaAtiva = aba;
    
    // UI: Títulos e Botões
    const titulos = { 'banco': 'BANCO DE PREÇOS', 'licitacao': 'LICITAÇÕES', 'solicitacao': 'SOLICITAÇÃO DE COMPRAS' };
    document.getElementById('tituloPagina').innerText = titulos[aba] || "SUPRIMENTOS";
    
    document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('bg-white/10', 'border-l-4', 'border-green-400'));
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if (btnAtivo) btnAtivo.classList.add('bg-white/10', 'border-l-4', 'border-green-400');

    await carregarDados();
}

async function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    const status = document.getElementById('statusConexao');
    const targets = { 'banco': 'DB_ITENS', 'licitacao': 'DB_LICITACOES', 'solicitacao': 'DB_SOLICITACOES' };

    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div><p>Carregando dados...</p></td></tr>';

    try {
        const response = await fetch(`${API_URL}?aba=${targets[abaAtiva]}`);
        if (!response.ok) throw new Error("Erro na rede");
        
        const dados = await response.json();
        dadosGlobais = Array.isArray(dados) ? dados : [];
        
        renderizarTabela(dadosGlobais);
        status.innerText = "Sincronizado";
    } catch (error) {
        console.error("Erro:", error);
        status.innerText = "Erro de Conexão";
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500 font-bold">Não foi possível carregar os dados. Verifique a internet ou o Script.</td></tr>';
    }
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center">Nenhum registro encontrado nesta aba.</td></tr>';
        return;
    }

    // Usamos um fragmento para melhorar a performance e não travar o navegador
    corpo.innerHTML = dados.slice().reverse().map(item => `
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="px-4 py-3">${item.DATA_CRIACAO || '-'}</td>
            <td class="px-4 py-3 font-bold">${item.CODCOTACAO || '-'}</td>
            <td class="px-4 py-3">${item.COD_REDUZIDO_CCUSTO || '-'}</td>
            <td class="px-4 py-3 text-[10px] max-w-xs truncate">${item.DESCRICAO_CC || '-'}</td>
            <td class="px-4 py-3">${item.ID_ITEM || '-'}</td>
            <td class="px-4 py-3 font-medium">${item.PRODUTO || '-'}</td>
            <td class="px-4 py-3">${item.QUANTIDADE || '0'}</td>
            <td class="px-4 py-3">${item.UNIDADE || '-'}</td>
            <td class="px-4 py-3">${formatarMoeda(item.PRECO_UNITARIO)}</td>
            <td class="px-4 py-3 font-bold text-green-700">${formatarMoeda(item.VALOR_TOTAL)}</td>
            <td class="px-4 py-3 uppercase text-[10px]">${item.FORNECEDOR || '-'}</td>
            <td class="px-4 py-3">${item.COMPRADOR || '-'}</td>
        </tr>
    `).join('');
}

// Busca (Debounce simples para não travar ao digitar)
let timeoutBusca;
document.getElementById('inputBusca').addEventListener('input', (e) => {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(() => {
        const termo = e.target.value.toLowerCase();
        const filtrados = dadosGlobais.filter(item => 
            JSON.stringify(item).toLowerCase().includes(termo)
        );
        renderizarTabela(filtrados);
    }, 300);
});

// Inicialização única
window.onload = () => mudarAba('banco');