const API_URL = "https://script.google.com/macros/s/AKfycbzhZN5N-5b6hmvz9tuO4cIiVqYlc10XcoUy0dWdWloE60T12zEAMNLky5VOwuxGqTnAWg/exec"; 
let dadosGlobais = [];
let abaAtiva = 'banco';

async function mudarAba(aba) {
    abaAtiva = aba;
    document.getElementById('dashboard').style.display = (aba === 'solicitacao') ? 'grid' : 'none';
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="text-center p-20"><div class="spinner"></div></td></tr>';

    try {
        const target = aba === 'solicitacao' ? 'DB_SOLICITACOES' : 'DB_ITENS';
        const res = await fetch(`${API_URL}?aba=${target}`);
        dadosGlobais = await res.json();
        filtrarDados();
    } catch (e) { console.error("Erro ao carregar"); }
}

function filtrarDados() {
    const busca = document.getElementById('inputBusca').value.toLowerCase();
    const cc = document.getElementById('filtroCC').value.toLowerCase();
    const selecionados = Array.from(document.querySelectorAll('.filtro-comprador:checked')).map(cb => cb.value.toLowerCase());

    const filtrados = dadosGlobais.filter(item => {
        const responsavel = (item.COMPRADOR || item.COMPRADOR_ATUAL || item.USUARIO_CRIACAO || "").toLowerCase();
        const centro = (item.CENTRO_DE_CUSTO || item.DESCRITIVO_CENTRO_DE_CUSTO || "").toLowerCase();
        
        return (selecionados.includes(responsavel) || responsavel === "") &&
               (centro.includes(cc)) &&
               (JSON.stringify(item).toLowerCase().includes(busca));
    });

    if (abaAtiva === 'solicitacao') calcularDash(filtrados);
    renderizarTabela(filtrados);
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    const cabecalho = document.querySelector('thead tr');

    if (abaAtiva === 'solicitacao') {
        cabecalho.innerHTML = `<th>ID</th><th>SOLICITAÇÃO</th><th>PRODUTO</th><th>QTD</th><th>ENTREGA</th><th>STATUS</th><th>AÇÃO</th>`;
    } else {
        cabecalho.innerHTML = `<th>DATA</th><th>CÓDIGO</th><th>PRODUTO</th><th>QTD</th><th>VL. UNIT</th><th>VL. TOTAL</th><th>COMPRADOR</th>`;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => {
        if (abaAtiva === 'solicitacao' && item.STATUS === 'CONCLUÍDO') return '';

        if (abaAtiva === 'solicitacao') {
            const statusStyle = item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
            return `
            <tr class="border-b text-sm">
                <td class="px-4 py-2 font-bold">#${item.IDENTIFICADOR}</td>
                <td class="px-4 py-2 text-xs">${item.DATA_DE_SOLICITACAO}</td>
                <td class="px-4 py-2 font-medium">${item.DESCRICAO_DO_PRODUTO}</td>
                <td class="px-4 py-2">${item.QUANTIDADE}</td>
                <td class="px-4 py-2"><input type="text" value="${item.DATA_ENTREGA || ''}" class="border rounded w-24 text-xs p-1" onchange="atualizarLocal('${item.IDENTIFICADOR}', 'DATA_ENTREGA', this.value)"></td>
                <td class="px-4 py-2">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'STATUS', this.value)" class="rounded text-xs font-bold p-1 ${statusStyle}">
                        <option value="PENDENTE" ${item.STATUS === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                        <option value="ENVIADO AO FORNECEDOR" ${item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'selected' : ''}>ENVIADO</option>
                        <option value="CONCLUÍDO" ${item.STATUS === 'CONCLUÍDO' ? 'selected' : ''}>CONCLUÍDO</option>
                    </select>
                </td>
                <td class="px-4 py-2"><button onclick="salvarAlteracao('${item.IDENTIFICADOR}')" class="bg-green-600 text-white p-1 rounded hover:scale-110 transition"><i class="fas fa-save"></i></button></td>
            </tr>`;
        } else {
            return `
            <tr class="border-b text-sm">
                <td class="px-4 py-2">${item.DATA_CRIACAO}</td>
                <td class="px-4 py-2 font-bold">${item.CODIGO_PRD}</td>
                <td class="px-4 py-2 font-medium">${item.PRODUTO}</td>
                <td class="px-4 py-2">${item.QUANTIDADE}</td>
                <td class="px-4 py-2">R$ ${item.PRECO_UNITARIO}</td>
                <td class="px-4 py-2 font-bold text-green-700">R$ ${item.VALOR_TOTAL}</td>
                <td class="px-4 py-2 uppercase text-xs">${item.COMPRADOR}</td>
            </tr>`;
        }
    }).join('');
}

function calcularDash(dados) {
    let pendentes = 0, enviados = 0, concluido = 0, somaLead = 0, noSla = 0;

    dados.forEach(item => {
        if (item.STATUS === 'PENDENTE') pendentes++;
        if (item.STATUS === 'ENVIADO AO FORNECEDOR') enviados++;
        if (item.STATUS === 'CONCLUÍDO' && item.DATA_ENTREGA) {
            concluido++;
            const d1 = parseData(item.DATA_DE_SOLICITACAO);
            const d2 = parseData(item.DATA_ENTREGA);
            const dias = Math.floor((d2 - d1) / (86400000));
            somaLead += dias;
            if (dias <= 7) noSla++;
        }
    });

    document.getElementById('dash-pendentes').innerText = pendentes;
    document.getElementById('dash-enviados').innerText = enviados;
    document.getElementById('dash-leadtime').innerText = concluido ? (somaLead / concluido).toFixed(1) : 0;
    document.getElementById('dash-sla').innerText = concluido ? ((noSla / concluido) * 100).toFixed(0) + '%' : '0%';
}

function parseData(s) { const p = s.split('/'); return new Date(p[2], p[1]-1, p[0]); }

function atualizarLocal(id, campo, valor) {
    const item = dadosGlobais.find(d => d.IDENTIFICADOR == id);
    if (item) item[campo] = valor;
}

async function salvarAlteracao(id) {
    const item = dadosGlobais.find(d => d.IDENTIFICADOR == id);
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'UPDATE_STATUS',
                id: id,
                status: item.STATUS,
                entrega: item.DATA_ENTREGA,
                comprador: item.COMPRADOR_ATUAL || ""
            })
        });
        mudarAba('solicitacao');
    } catch (e) { alert("Erro ao salvar."); }
}