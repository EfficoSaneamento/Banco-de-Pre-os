const API_URL = "Shttps://script.google.com/macros/s/AKfycbzotZIuEBU8KP7ro-J9pVAhUop3yYl25isYfCUYQ6T1vS1OKq1mVl_YTuq69Qxij6QbwA/exec"; 

let abaAtiva = ''; 
let dadosGlobais = [];
let carregando = false; 

async function mudarAba(aba) {
    if (carregando || abaAtiva === aba) return;
    abaAtiva = aba;
    carregando = true;

    // UI: Títulos e Botões
    const titulos = { 'banco': 'DB_ITENS', 'licitacao': 'DB_LICITACOES', 'solicitacao': 'DB_SOLICITACOES' };
    document.getElementById('tituloPagina').innerText = aba === 'solicitacao' ? 'SOLICITAÇÃO DE COMPRAS' : 'BANCO DE PREÇOS';
    
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center">Sincronizando...</td></tr>';

    try {
        const response = await fetch(`${API_URL}?aba=${titulos[aba]}`);
        const dados = await response.json();
        dadosGlobais = Array.isArray(dados) ? dados : [];
        renderizarTabela(dadosGlobais);
    } catch (error) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500">Erro de conexão.</td></tr>';
    } finally {
        carregando = false;
    }
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    const cabecalho = document.querySelector('thead tr');
    document.getElementById('contadorRegistros').innerText = dados.length;

    // DEFINIR COLUNAS POR ABA
    if (abaAtiva === 'solicitacao') {
        cabecalho.innerHTML = `
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">DATA SOLIC.</th>
            <th class="px-4 py-3 text-left">PRODUTO</th>
            <th class="px-4 py-3 text-left">QTD</th>
            <th class="px-4 py-3 text-left">SOLICITANTE</th>
            <th class="px-4 py-3 text-left">COMPRADOR</th>
            <th class="px-4 py-3 text-left">STATUS</th>
            <th class="px-4 py-3 text-center">AÇÃO</th>`;
    } else {
        cabecalho.innerHTML = `
            <th class="px-4 py-3 text-left">DATA</th>
            <th class="px-4 py-3 text-left">PRODUTO</th>
            <th class="px-4 py-3 text-left">QTD</th>
            <th class="px-4 py-3 text-left">VL. UNIT</th>
            <th class="px-4 py-3 text-left">VL. TOTAL</th>
            <th class="px-4 py-3 text-left">FORNECEDOR</th>
            <th class="px-4 py-3 text-left">COMPRADOR</th>`;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => {
        // Regra: Se estiver CONCLUÍDO, some do visual
        if (abaAtiva === 'solicitacao' && item.STATUS === 'CONCLUÍDO') return '';

        if (abaAtiva === 'solicitacao') {
            const corStatus = item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'bg-yellow-400' : 'bg-white';
            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="px-4 py-2 font-bold">${item.IDENTIFICADOR || '-'}</td>
                <td class="px-4 py-2">${item.DATA_DE_SOLICITACAO || '-'}</td>
                <td class="px-4 py-2 font-medium">${item.DESCRICAO_DO_PRODUTO || '-'}</td>
                <td class="px-4 py-2">${item.QUANTIDADE || '0'}</td>
                <td class="px-4 py-2">${item.USUARIO_CRIACAO || '-'}</td>
                <td class="px-4 py-2">
                    <input type="text" value="${item.COMPRADOR_ATUAL || ''}" 
                        class="border rounded w-full px-1" 
                        onchange="atualizarDadosLocais('${item.IDENTIFICADOR}', 'COMPRADOR_ATUAL', this.value)">
                </td>
                <td class="px-4 py-2">
                    <select onchange="atualizarDadosLocais('${item.IDENTIFICADOR}', 'STATUS', this.value)" 
                        class="border rounded w-full px-1 ${corStatus}">
                        <option value="PENDENTE" ${item.STATUS === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                        <option value="ENVIADO AO FORNECEDOR" ${item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'selected' : ''}>ENVIADO</option>
                        <option value="CONCLUÍDO" ${item.STATUS === 'CONCLUÍDO' ? 'selected' : ''}>CONCLUÍDO</option>
                    </select>
                </td>
                <td class="px-4 py-2 text-center">
                    <button onclick="salvarNoGoogle('${item.IDENTIFICADOR}')" class="bg-green-500 text-white px-2 py-1 rounded text-xs">Salvar</button>
                </td>
            </tr>`;
        } else {
            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="px-4 py-2">${item.DATA_CRIACAO || '-'}</td>
                <td class="px-4 py-2 font-medium">${item.PRODUTO || '-'}</td>
                <td class="px-4 py-2">${item.QUANTIDADE || '0'}</td>
                <td class="px-4 py-2">R$ ${parseFloat(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR')}</td>
                <td class="px-4 py-2 font-bold text-green-700">R$ ${parseFloat(item.VALOR_TOTAL || 0).toLocaleString('pt-BR')}</td>
                <td class="px-4 py-2">${item.FORNECEDOR || '-'}</td>
                <td class="px-4 py-2">${item.COMPRADOR || '-'}</td>
            </tr>`;
        }
    }).join('');
}

function atualizarDadosLocais(id, campo, valor) {
    const item = dadosGlobais.find(d => d.IDENTIFICADOR == id);
    if (item) item[campo] = valor;
}

async function salvarNoGoogle(id) {
    const item = dadosGlobais.find(d => d.IDENTIFICADOR == id);
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'UPDATE_STATUS',
                id: id,
                comprador: item.COMPRADOR_ATUAL,
                status: item.STATUS
            })
        });
        alert("Atualizado!");
        mudarAba('solicitacao');
    } catch (e) { alert("Erro ao salvar."); }
}

document.addEventListener('DOMContentLoaded', () => mudarAba('banco'));