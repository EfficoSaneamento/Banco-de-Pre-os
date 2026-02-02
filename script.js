const API_URL = "https://script.google.com/macros/s/AKfycbyoWDwbTbXkli2f_rSGuKB07BA1T6K0LpW0gEdTCa3PHF3rYiKmkCVN9PDSieyfTE9N-w/exec"; 
let dadosGlobais = [];
let abaAtiva = 'banco';

document.addEventListener('DOMContentLoaded', () => mudarAba('banco'));

async function mudarAba(aba) {
    abaAtiva = aba;
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="text-center p-20">Sincronizando dados...</td></tr>';
    
    document.getElementById('dashboard').style.display = (aba === 'solicitacao') ? 'grid' : 'none';
    document.getElementById('tituloPagina').innerText = aba === 'solicitacao' ? 'Solicitações' : 'Banco de Preços';

    try {
        const target = aba === 'solicitacao' ? 'DB_SOLICITACOES' : 'DB_ITENS';
        const response = await fetch(`${API_URL}?aba=${target}`);
        dadosGlobais = await response.json();
        
        if (aba === 'solicitacao') calcularDash(dadosGlobais);
        
        // Renderiza tudo imediatamente após carregar
        renderizarTabela(dadosGlobais); 
    } catch (e) {
        corpo.innerHTML = '<tr><td colspan="12" class="text-center text-red-500 p-10">Erro de conexão com a API.</td></tr>';
    }
}

function filtrarDados() {
    const busca = document.getElementById('inputBusca').value.toLowerCase();
    const cc = document.getElementById('filtroCC').value.toLowerCase();

    const filtrados = dadosGlobais.filter(item => {
        const textoCompleto = JSON.stringify(item).toLowerCase();
        const valorCC = (item.CENTRO_DE_CUSTO || item.COD_REDUZIDO_CCUSTO || "").toString().toLowerCase();
        return textoCompleto.includes(busca) && valorCC.includes(cc);
    });

    renderizarTabela(filtrados);
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    const cabecalho = document.querySelector('thead tr');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (!dados || dados.length === 0) {
        corpo.innerHTML = '<tr><td colspan="12" class="text-center p-10">Nenhum dado encontrado.</td></tr>';
        return;
    }

    if (abaAtiva === 'solicitacao') {
        cabecalho.innerHTML = `<th>DATA</th><th>ID</th><th>PRODUTO</th><th>COMPRADOR</th><th>ENTREGA</th><th>STATUS</th><th>AÇÃO</th>`;
        corpo.innerHTML = dados.slice().reverse().map(item => {
            if (item.STATUS === 'CONCLUÍDO') return '';
            return `
            <tr class="border-b text-sm hover:bg-gray-50">
                <td class="px-4 py-3">${item.DATA_DE_SOLICITACAO || item.DATA_CRIACAO || "-"}</td>
                <td class="px-4 py-3 font-bold">${item.IDENTIFICADOR || "-"}</td>
                <td class="px-4 py-3">${item.DESCRICAO_DO_PRODUTO || item.PRODUTO || "-"}</td>
                <td class="px-4 py-3">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'COMPRADOR_ATUAL', this.value)" class="border rounded p-1 text-xs w-full bg-white">
                        <option value="" ${!item.COMPRADOR_ATUAL ? 'selected' : ''}>Selecionar...</option>
                        <option value="Flavio Matos" ${item.COMPRADOR_ATUAL === 'Flavio Matos' ? 'selected' : ''}>Flavio Matos</option>
                        <option value="Pedro Prugoveschi" ${item.COMPRADOR_ATUAL === 'Pedro Prugoveschi' ? 'selected' : ''}>Pedro Prugoveschi</option>
                        <option value="Patricia Yoshimoto" ${item.COMPRADOR_ATUAL === 'Patricia Yoshimoto' ? 'selected' : ''}>Patricia Yoshimoto</option>
                    </select>
                </td>
                <td class="px-4 py-3"><input type="text" value="${item.DATA_ENTREGA || ''}" placeholder="dd/mm/aaaa" class="border rounded p-1 text-xs w-full" onchange="atualizarLocal('${item.IDENTIFICADOR}', 'DATA_ENTREGA', this.value)"></td>
                <td class="px-4 py-3">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'STATUS', this.value)" class="rounded p-1 text-xs font-bold w-full bg-blue-50">
                        <option value="PENDENTE" ${item.STATUS === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                        <option value="ENVIADO AO FORNECEDOR" ${item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'selected' : ''}>ENVIADO</option>
                        <option value="CONCLUÍDO" ${item.STATUS === 'CONCLUÍDO' ? 'selected' : ''}>CONCLUÍDO</option>
                    </select>
                </td>
                <td class="px-4 py-3 text-center"><button onclick="salvarAlteracao('${item.IDENTIFICADOR}')" class="bg-slate-800 text-white p-2 rounded hover:bg-green-600 transition"><i class="fas fa-save"></i></button></td>
            </tr>`;
        }).join('');
    } else {
        // ABA BANCO DE PREÇOS - Ajustada para os nomes da sua imagem
        cabecalho.innerHTML = `<th>DATA</th><th>CÓDIGO</th><th>PRODUTO</th><th>QTD</th><th>VL. TOTAL</th><th>COMPRADOR</th>`;
        corpo.innerHTML = dados.slice().reverse().map(item => `
            <tr class="border-b text-sm hover:bg-gray-50">
                <td class="px-4 py-3">${item.DATA_CRIACAO || item.DATA || "-"}</td>
                <td class="px-4 py-3 font-bold">${item.CODIGO_PRD || item.CODIGOPRD || "-"}</td>
                <td class="px-4 py-3 font-medium text-slate-700">${item.PRODUTO || "-"}</td>
                <td class="px-4 py-3">${item.QUANTIDADE || "0"}</td>
                <td class="px-4 py-3 font-bold text-green-700">R$ ${parseFloat(item.VALOR_TOTAL || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                <td class="px-4 py-3 text-[10px] uppercase text-slate-500">${item.COMPRADOR || "-"}</td>
            </tr>`).join('');
    }
}

// Funções de suporte (atualizarLocal e salvarAlteracao) devem ser mantidas do código anterior.