const API_URL = "https://script.google.com/macros/s/AKfycbyoWDwbTbXkli2f_rSGuKB07BA1T6K0LpW0gEdTCa3PHF3rYiKmkCVN9PDSieyfTE9N-w/exec"; 
let dadosGlobais = [];
let abaAtiva = 'banco';

document.addEventListener('DOMContentLoaded', () => mudarAba('banco'));

async function mudarAba(aba) {
    abaAtiva = aba;
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="text-center p-20"><div class="loader"></div><p>Carregando...</p></td></tr>';
    
    // Toggle do Dashboard
    document.getElementById('dashboard').style.display = (aba === 'solicitacao') ? 'grid' : 'none';

    try {
        const target = aba === 'solicitacao' ? 'DB_SOLICITACOES' : 'DB_ITENS';
        const response = await fetch(`${API_URL}?aba=${target}`);
        dadosGlobais = await response.json();
        
        if (aba === 'solicitacao') calcularDash(dadosGlobais);
        filtrarDados(); 
    } catch (e) {
        corpo.innerHTML = '<tr><td colspan="12" class="text-center text-red-500 p-10">Erro ao carregar dados.</td></tr>';
    }
}

function filtrarDados() {
    const busca = document.getElementById('inputBusca').value.toLowerCase();
    const cc = document.getElementById('filtroCC').value.toLowerCase();

    const filtrados = dadosGlobais.filter(item => {
        const centro = (item.CENTRO_DE_CUSTO || item.COD_REDUZIDO_CCUSTO || "").toLowerCase();
        const textoCompleto = JSON.stringify(item).toLowerCase();
        return centro.includes(cc) && textoCompleto.includes(busca);
    });

    renderizarTabela(filtrados);
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    const cabecalho = document.querySelector('thead tr');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (abaAtiva === 'solicitacao') {
        cabecalho.innerHTML = `<th>DATA SOLIC.</th><th>ID</th><th>PRODUTO</th><th>COMPRADOR</th><th>PREVISÃO ENTREGA</th><th>STATUS</th><th class="text-center">AÇÃO</th>`;
    } else {
        cabecalho.innerHTML = `<th>DATA</th><th>CÓDIGO</th><th>PRODUTO</th><th>QTD</th><th>VL. TOTAL</th><th>COMPRADOR</th>`;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => {
        if (abaAtiva === 'solicitacao' && item.STATUS === 'CONCLUÍDO') return '';

        if (abaAtiva === 'solicitacao') {
            const statusCor = item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-50 text-blue-700';
            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="px-4 py-3">${item.DATA_DE_SOLICITACAO || "-"}</td>
                <td class="px-4 py-3 font-bold">${item.IDENTIFICADOR || "-"}</td>
                <td class="px-4 py-3 font-medium">${item.DESCRICAO_DO_PRODUTO || "-"}</td>
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
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'STATUS', this.value)" class="rounded p-1 text-xs font-bold w-full ${statusCor}">
                        <option value="PENDENTE" ${item.STATUS === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                        <option value="ENVIADO AO FORNECEDOR" ${item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'selected' : ''}>ENVIADO</option>
                        <option value="CONCLUÍDO" ${item.STATUS === 'CONCLUÍDO' ? 'selected' : ''}>CONCLUÍDO</option>
                    </select>
                </td>
                <td class="px-4 py-3 text-center"><button onclick="salvarAlteracao('${item.IDENTIFICADOR}')" class="bg-slate-800 text-white px-3 py-1 rounded hover:bg-green-600 transition"><i class="fas fa-save"></i></button></td>
            </tr>`;
        } else {
            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="px-4 py-3">${item.DATA_CRIACAO || "-"}</td>
                <td class="px-4 py-3 font-bold">${item.CODIGO_PRD || "-"}</td>
                <td class="px-4 py-3 font-medium">${item.PRODUTO || "-"}</td>
                <td class="px-4 py-3">${item.QUANTIDADE || "0"}</td>
                <td class="px-4 py-3 font-bold text-green-700">R$ ${parseFloat(item.VALOR_TOTAL || 0).toLocaleString('pt-BR')}</td>
                <td class="px-4 py-3 text-xs uppercase">${item.COMPRADOR || "-"}</td>
            </tr>`;
        }
    }).join('');
}

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
                comprador: item.COMPRADOR_ATUAL
            })
        });
        alert("Dados sincronizados!");
        if (item.STATUS === 'CONCLUÍDO') mudarAba('solicitacao'); 
    } catch (e) { alert("Erro ao salvar."); }
}

function calcularDash(dados) {
    let pend = 0, env = 0, concl = 0, somaLead = 0, sla = 0;
    dados.forEach(item => {
        if (item.STATUS === 'PENDENTE') pend++;
        if (item.STATUS === 'ENVIADO AO FORNECEDOR') env++;
        if (item.STATUS === 'CONCLUÍDO' && item.DATA_ENTREGA && item.DATA_DE_SOLICITACAO) {
            concl++;
            const d1 = parseData(item.DATA_DE_SOLICITACAO);
            const d2 = parseData(item.DATA_ENTREGA);
            const diff = Math.floor((d2 - d1) / 86400000);
            somaLead += (diff > 0 ? diff : 0);
            if (diff <= 7) sla++;
        }
    });
    document.getElementById('dash-pendentes').innerText = pend;
    document.getElementById('dash-enviados').innerText = env;
    document.getElementById('dash-leadtime').innerText = concl ? (somaLead / concl).toFixed(1) : 0;
    document.getElementById('dash-sla').innerText = concl ? ((sla / concl) * 100).toFixed(0) + '%' : '0%';
}

function parseData(s) { 
    if(!s) return new Date();
    const p = s.split('/'); 
    return new Date(p[2], p[1]-1, p[0]); 
}