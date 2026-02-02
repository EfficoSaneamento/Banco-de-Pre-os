// URL de implantação do Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbz292QQuYA84hm4MzZvOLsO5YY41GmXYoQd7jLB-dfVU2qaqmn-ghZ0H9-5eP9B1g8gpA/exec"; 

let abaAtiva = ''; 
let dadosGlobais = [];
let carregando = false; 

/**
 * Troca de aba e carrega os dados específicos
 */
async function mudarAba(aba) {
    if (carregando || abaAtiva === aba) return; 
    
    abaAtiva = aba;
    carregando = true;

    // UI: Feedback Visual
    const titulos = { 'banco': 'DB_ITENS', 'licitacao': 'DB_LICITACOES', 'solicitacao': 'DB_SOLICITACOES' };
    document.getElementById('tituloPagina').innerText = titulos[aba].replace('DB_', '').replace('_', ' ');
    
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div><p>Sincronizando dados...</p></td></tr>';

    try {
        const response = await fetch(`${API_URL}?aba=${titulos[aba]}`);
        const dados = await response.json();
        
        dadosGlobais = Array.isArray(dados) ? dados : [];
        renderizarTabela(dadosGlobais);
        document.getElementById('statusConexao').innerText = "Sincronizado: " + titulos[aba];
    } catch (error) {
        document.getElementById('statusConexao').innerText = "Erro de Sincronização";
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500">Erro ao carregar dados. Verifique a internet.</td></tr>';
    } finally {
        carregando = false;
    }
}

/**
 * Renderiza a tabela mapeando as colunas específicas enviadas pelo usuário
 */
function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    document.getElementById('contadorRegistros').innerText = dados.length;

    corpo.innerHTML = dados.slice().reverse().map(item => {
        // Mapeamento dinâmico para garantir que os dados apareçam
        const data = item.DATA_CRIACAO || item.DATA_DE_SOLICITACAO || "-";
        const ident = item.CODIGO_PRD || item.IDENTIFICADOR || "-";
        const cc_cod = item.COD_REDUZIDO_CCUSTO || item.CENTRO_DE_CUSTO || "-";
        const cc_nome = item.CENTRO_DE_CUSTO || item.DESCRITIVO_CENTRO_DE_CUSTO || "-";
        const prod = item.PRODUTO || item.DESCRICAO_DO_PRODUTO || "-";
        const responsavel = item.COMPRADOR || item.USUARIO_CRIACAO || "-";
        
        const valorUnit = parseFloat(item.PRECO_UNITARIO || 0);
        const valorTotal = parseFloat(item.VALOR_TOTAL || 0);

        return `
        <tr class="border-b hover:bg-slate-50 transition text-[13px]">
            <td class="px-4 py-2">${data}</td>
            <td class="px-4 py-2 font-bold">${ident}</td>
            <td class="px-4 py-2">${cc_cod}</td>
            <td class="px-4 py-2 truncate max-w-[150px]">${cc_nome}</td>
            <td class="px-4 py-2">${item.ID_ORIGEM || item.DATA_LIMITE || "-"}</td>
            <td class="px-4 py-2 font-medium">${prod}</td>
            <td class="px-4 py-2">${item.QUANTIDADE || "0"}</td>
            <td class="px-4 py-2">${item.UNIDADE || item.ORC || "-"}</td>
            <td class="px-4 py-2">R$ ${valorUnit.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-2 font-bold text-green-700">R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="px-4 py-2 truncate max-w-[120px]">${item.FORNECEDOR || item.OBSERVACAO_DO_ITEM || "-"}</td>
            <td class="px-4 py-2">${responsavel}</td>
        </tr>`;
    }).join('');
}

// Inicia na aba de banco por padrão
document.addEventListener('DOMContentLoaded', () => mudarAba('banco'));