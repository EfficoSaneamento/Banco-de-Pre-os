const API_URL = "https://script.google.com/macros/s/AKfycbxYeYJCmJRDyn0wI0or4CjupMEqInFwJF8QgLG0_cRe1rGm2LXpQ1d8CcaiGZd6iKm9VQ/exec"; 
let dadosGlobais = [];
let abaAtiva = ''; 

async function mudarAba(aba) {
    abaAtiva = aba;
    const titulos = { 'banco': 'DB_ITENS', 'licitacao': 'DB_LICITACOES', 'solicitacao': 'DB_SOLICITACOES' };
    const corpo = document.getElementById('corpoTabela');
    
    // Exibir Dashboard apenas em solicitações
    document.getElementById('dashboard').style.display = (aba === 'solicitacao') ? 'grid' : 'none';
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center">Sincronizando...</td></tr>';

    try {
        const response = await fetch(`${API_URL}?aba=${titulos[aba]}`);
        dadosGlobais = await response.json();
        
        if (aba === 'solicitacao') calcularMetricas(dadosGlobais);
        renderizarTabela(dadosGlobais);
    } catch (e) {
        corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center text-red-500">Erro de conexão.</td></tr>';
    }
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    const cabecalho = document.querySelector('thead tr');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (abaAtiva === 'solicitacao') {
        cabecalho.innerHTML = `<th>ID</th><th>DATA SOLIC.</th><th>PRODUTO</th><th>COMPRADOR</th><th>DATA ENTREGA</th><th>STATUS</th><th>AÇÃO</th>`;
    } else {
        cabecalho.innerHTML = `<th>DATA</th><th>PRODUTO</th><th>QTD</th><th>VL. UNIT</th><th>VL. TOTAL</th><th>FORNECEDOR</th><th>COMPRADOR</th>`;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => {
        if (abaAtiva === 'solicitacao' && item.STATUS === 'CONCLUÍDO') return '';

        if (abaAtiva === 'solicitacao') {
            const corStatus = item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'bg-yellow-200' : 'bg-white';
            return `
            <tr class="border-b text-sm">
                <td class="px-4 py-2 font-bold">${item.IDENTIFICADOR}</td>
                <td class="px-4 py-2">${item.DATA_DE_SOLICITACAO}</td>
                <td class="px-4 py-2">${item.DESCRICAO_DO_PRODUTO}</td>
                <td class="px-4 py-2">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'COMPRADOR_ATUAL', this.value)" class="border rounded text-xs p-1 w-full">
                        <option value="" ${!item.COMPRADOR_ATUAL ? 'selected' : ''}>- Selecione -</option>
                        <option value="Flavio Matos" ${item.COMPRADOR_ATUAL === 'Flavio Matos' ? 'selected' : ''}>Flavio Matos</option>
                        <option value="Pedro Prugoveschi" ${item.COMPRADOR_ATUAL === 'Pedro Prugoveschi' ? 'selected' : ''}>Pedro Prugoveschi</option>
                        <option value="Patricia Yoshimoto" ${item.COMPRADOR_ATUAL === 'Patricia Yoshimoto' ? 'selected' : ''}>Patricia Yoshimoto</option>
                    </select>
                </td>
                <td class="px-4 py-2">
                    <input type="text" placeholder="dd/mm/aaaa" value="${item.DATA_ENTREGA || ''}" 
                           class="border rounded text-xs p-1 w-28" 
                           onchange="atualizarLocal('${item.IDENTIFICADOR}', 'DATA_ENTREGA', this.value)">
                </td>
                <td class="px-4 py-2">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'STATUS', this.value)" class="border rounded text-xs p-1 w-full ${corStatus}">
                        <option value="PENDENTE" ${item.STATUS === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                        <option value="ENVIADO" ${item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'selected' : ''}>ENVIADO</option>
                        <option value="CONCLUÍDO" ${item.STATUS === 'CONCLUÍDO' ? 'selected' : ''}>CONCLUÍDO</option>
                    </select>
                </td>
                <td class="px-4 py-2 text-center">
                    <button onclick="salvarNoGoogle('${item.IDENTIFICADOR}')" class="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-700">
                       <i class="fas fa-save"></i>
                    </button>
                </td>
            </tr>`;
        } else {
            // Renderização do Banco de Preços (DB_ITENS)
            return `
            <tr class="border-b text-sm">
                <td class="px-4 py-2">${item.DATA_CRIACAO}</td>
                <td class="px-4 py-2 font-medium">${item.PRODUTO}</td>
                <td class="px-4 py-2">${item.QUANTIDADE}</td>
                <td class="px-4 py-2">R$ ${parseFloat(item.PRECO_UNITARIO || 0).toLocaleString('pt-BR')}</td>
                <td class="px-4 py-2 font-bold text-green-700">R$ ${parseFloat(item.VALOR_TOTAL || 0).toLocaleString('pt-BR')}</td>
                <td class="px-4 py-2 text-xs uppercase">${item.FORNECEDOR}</td>
                <td class="px-4 py-2 text-xs uppercase">${item.COMPRADOR}</td>
            </tr>`;
        }
    }).join('');
}

function calcularMetricas(dados) {
    let pendentes = 0, noSla = 0, concluido = 0, somaLeadTime = 0;

    dados.forEach(item => {
        if (item.STATUS === 'PENDENTE') pendentes++;
        if (item.STATUS === 'CONCLUÍDO' && item.DATA_ENTREGA) {
            concluido++;
            const d1 = stringParaData(item.DATA_DE_SOLICITACAO);
            const d2 = stringParaData(item.DATA_ENTREGA);
            const dias = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
            somaLeadTime += (dias > 0 ? dias : 0);
            if (dias <= 7) noSla++;
        }
    });

    document.getElementById('dash-pendentes').innerText = pendentes;
    document.getElementById('dash-sla').innerText = concluido > 0 ? ((noSla / concluido) * 100).toFixed(0) + '%' : '0%';
    document.getElementById('dash-leadtime').innerText = concluido > 0 ? (somaLeadTime / concluido).toFixed(1) : '0';
}

function stringParaData(str) {
    const p = str.split('/');
    return new Date(p[2], p[1] - 1, p[0]);
}

function atualizarLocal(id, campo, valor) {
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
                status: item.STATUS,
                entrega: item.DATA_ENTREGA
            })
        });
        alert("Sincronizado!");
        mudarAba('solicitacao');
    } catch (e) { alert("Erro ao salvar."); }
}