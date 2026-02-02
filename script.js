// ATENÇÃO: Substitua pela sua URL de implantação atualizada do Google
const API_URL = "https://script.google.com/macros/s/AKfycbzgeUvx3Q2LNp5KUoBXe6GvAVHkJrF2giBeLKP1gxQj6OJUcC03HngXRw1MVc2wkK7B6Q/exec"; 

let abaAtiva = ''; 
let dadosGlobais = [];
let estaCarregando = false; 

/**
 * Troca de aba e busca dados específicos
 */
async function mudarAba(aba) {
    // Impede o recarregamento se já estiver carregando ou se for a mesma aba
    if (estaCarregando || abaAtiva === aba) return;
    
    abaAtiva = aba;
    estaCarregando = true;

    // 1. Atualiza Visual da Interface
    const titulos = { 
        'banco': 'BANCO DE PREÇOS', 
        'licitacao': 'LICITAÇÕES', 
        'solicitacao': 'SOLICITAÇÃO DE COMPRAS' 
    };
    document.getElementById('tituloPagina').innerText = titulos[aba] || "GESTÃO DE SUPRIMENTOS";
    
    // Destaca o botão na barra lateral
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('bg-white/10', 'border-l-4', 'border-green-400');
    });
    const btnAtivo = document.getElementById(`btn-${aba}`);
    if (btnAtivo) btnAtivo.classList.add('bg-white/10', 'border-l-4', 'border-green-400');

    // 2. Prepara a Tabela para novos dados
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div><p class="mt-2 text-slate-500 italic">Buscando dados em ' + aba + '...</p></td></tr>';

    // 3. Busca os dados no Google
    const targets = { 
        'banco': 'DB_ITENS', 
        'licitacao': 'DB_LICITACOES', 
        'solicitacao': 'DB_SOLICITACOES' 
    };

    try {
        const response = await fetch(`${API_URL}?aba=${targets[aba]}`);
        if (!response.ok) throw new Error("Erro na comunicação com o Google.");
        
        const dados = await response.json();
        dadosGlobais = Array.isArray(dados) ? dados : [];
        
        renderizarTabela(dadosGlobais);
        document.getElementById('statusConexao').innerText = "Sincronizado: " + targets[aba];
    } catch (error) {
        console.error("Erro na busca:", error);
        document.getElementById('statusConexao').innerText = "Erro de Conexão";
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500 font-bold">Falha ao carregar a aba ' + aba + '. Verifique a publicação do Script.</td></tr>';
    } finally {
        estaCarregando = false;
    }
}

/**
 * Desenha as linhas da tabela com base nos dados recebidos
 */
function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }

    // Gerar HTML de todas as linhas (exibindo os mais recentes primeiro)
    corpo.innerHTML = dados.slice().reverse().map(item => `
        <tr class="border-b hover:bg-slate-50 transition">
            <td class="px-4 py-3">${item.DATA_CRIACAO || item.DATA_ENVIO || '-'}</td>
            <td class="px-4 py-3 font-bold">${item.CODCOTACAO || '-'}</td>
            <td class="px-4 py-3">${item.COD_REDUZIDO_CCUSTO || '-'}</td>
            <td class="px-4 py-3 text-[10px] max-w-xs truncate">${item.DESCRICAO_CC || item.CENTRO_DE_CUSTO || '-'}</td>
            <td class="px-4 py-3">${item.ID_ITEM || '-'}</td>
            <td class="px-4 py-3 font-medium">${item.PRODUTO || '-'}</td>
            <td class="px-4 py-3">${item.QUANTIDADE || '0'}</td>
            <td class="px-4 py-3">${item.UNIDADE || '-'}</td>
            <td class="px-4 py-3">R$ ${parseFloat(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-3 font-bold text-green-700">R$ ${parseFloat(item.VALOR_TOTAL || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-3 uppercase text-[10px]">${item.FORNECEDOR || '-'}</td>
            <td class="px-4 py-3">${item.COMPRADOR || item.COLABORADOR || '-'}</td>
        </tr>
    `).join('');
}

// Configuração da Busca Global com atraso (debounce) para não travar o PC
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

// Inicialização: Carrega a primeira aba assim que a página abrir
document.addEventListener('DOMContentLoaded', () => mudarAba('banco'));