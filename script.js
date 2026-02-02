const API_URL = "https://script.google.com/macros/s/AKfycbwvs3bk9QfF-d2vG1uRnjW5qUUkrrpqYyXWDon7xZ0iSv1kSqZ52c7CyCgeMjrIaiNseA/exec"; 
let dadosGlobais = [];
let abaAtiva = 'banco';

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => mudarAba('banco'));

async function mudarAba(aba) {
    abaAtiva = aba;
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '<tr><td colspan="12" class="p-10 text-center"><div class="loader"></div><p>Sincronizando...</p></td></tr>';
    
    // Mostra/Esconde Dashboard
    document.getElementById('dashboard').style.display = (aba === 'solicitacao') ? 'grid' : 'none';

    try {
        const target = aba === 'solicitacao' ? 'DB_SOLICITACOES' : 'DB_ITENS';
        const response = await fetch(`${API_URL}?aba=${target}`);
        dadosGlobais = await response.json();
        
        if (aba === 'solicitacao') calcularDash(dadosGlobais);
        filtrarDados(); 
    } catch (e) { console.error("Erro na conexão"); }
}

function filtrarDados() {
    const busca = document.getElementById('inputBusca').value.toLowerCase();
    const cc = document.getElementById('filtroCC').value.toLowerCase();
    const selecionados = Array.from(document.querySelectorAll('.filtro-comprador:checked')).map(cb => cb.value);

    const filtrados = dadosGlobais.filter(item => {
        const comp = item.COMPRADOR_ATUAL || item.COMPRADOR || item.USUARIO_CRIACAO || "";
        const centro = item.CENTRO_DE_CUSTO || item.DESCRITIVO_CENTRO_DE_CUSTO || "";
        
        return (selecionados.includes(comp) || comp === "") &&
               (centro.toLowerCase().includes(cc)) &&
               (JSON.stringify(item).toLowerCase().includes(busca));
    });

    renderizarTabela(filtrados);
}

function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    const cabecalho = document.querySelector('thead tr');
    document.getElementById('contadorRegistros').innerText = dados.length;

    if (abaAtiva === 'solicitacao') {
        cabecalho.innerHTML = `
            <th class="px-4 py-3">DATA</th>
            <th class="px-4 py-3">ID</th>
            <th class="px-4 py-3">PRODUTO</th>
            <th class="px-4 py-3">COMPRADOR</th>
            <th class="px-4 py-3">ENTREGA</th>
            <th class="px-4 py-3">STATUS</th>
            <th class="px-4 py-3 text-center">AÇÃO</th>`;
    } else {
        cabecalho.innerHTML = `
            <th class="px-4 py-3">DATA</th>
            <th class="px-4 py-3">CÓDIGO</th>
            <th class="px-4 py-3">PRODUTO</th>
            <th class="px-4 py-3">QTD</th>
            <th class="px-4 py-3">VL. TOTAL</th>
            <th class="px-4 py-3">COMPRADOR</th>`;
    }

    corpo.innerHTML = dados.slice().reverse().map(item => {
        if (abaAtiva === 'solicitacao' && item.STATUS === 'CONCLUÍDO') return '';

        if (abaAtiva === 'solicitacao') {
            const statusCor = item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'bg-yellow-200' : 'bg-blue-100';
            
            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="px-4 py-2">${item.DATA_DE_SOLICITACAO || "-"}</td>
                <td class="px-4 py-2 font-bold">${item.IDENTIFICADOR || "-"}</td>
                <td class="px-4 py-2 font-medium">${item.DESCRICAO_DO_PRODUTO || "-"}</td>
                
                <td class="px-4 py-2">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'COMPRADOR_ATUAL', this.value)" 
                        class="border rounded p-1 text-xs w-full bg-gray-50">
                        <option value="" ${!item.COMPRADOR_ATUAL ? 'selected' : ''}>Selecionar...</option>
                        <option value="Flavio Matos" ${item.COMPRADOR_ATUAL === 'Flavio Matos' ? 'selected' : ''}>Flavio Matos</option>
                        <option value="Pedro Prugoveschi" ${item.COMPRADOR_ATUAL === 'Pedro Prugoveschi' ? 'selected' : ''}>Pedro Prugoveschi</option>
                        <option value="Patricia Yoshimoto" ${item.COMPRADOR_ATUAL === 'Patricia Yoshimoto' ? 'selected' : ''}>Patricia Yoshimoto</option>
                    </select>
                </td>

                <td class="px-4 py-2">
                    <input type="text" value="${item.DATA_ENTREGA || ''}" 
                        placeholder="dd/mm/aaaa"
                        class="border rounded p-1 text-xs w-24" 
                        onchange="atualizarLocal('${item.IDENTIFICADOR}', 'DATA_ENTREGA', this.value)">
                </td>

                <td class="px-4 py-2">
                    <select onchange="atualizarLocal('${item.IDENTIFICADOR}', 'STATUS', this.value)" 
                        class="rounded p-1 text-xs font-bold w-full ${statusCor}">
                        <option value="PENDENTE" ${item.STATUS === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
                        <option value="ENVIADO AO FORNECEDOR" ${item.STATUS === 'ENVIADO AO FORNECEDOR' ? 'selected' : ''}>ENVIADO</option>
                        <option value="CONCLUÍDO" ${item.STATUS === 'CONCLUÍDO' ? 'selected' : ''}>CONCLUÍDO</option>
                    </select>
                </td>

                <td class="px-4 py-2 text-center">
                    <button onclick="salvarAlteracao('${item.IDENTIFICADOR}')" 
                        class="bg-slate-800 text-white p-2 rounded hover:bg-green-600 transition shadow-sm">
                        <i class="fas fa-save"></i>
                    </button>
                </td>
            </tr>`;
        } else {
            // Layout Banco de Preços
            return `
            <tr class="border-b hover:bg-slate-50 transition text-sm">
                <td class="px-4 py-2">${item.DATA_CRIACAO || "-"}</td>
                <td class="px-4 py-2 font-bold">${item.CODIGO_PRD || "-"}</td>
                <td class="px-4 py-2 font-medium">${item.PRODUTO || "-"}</td>
                <td class="px-4 py-2">${item.QUANTIDADE || "0"}</td>
                <td class="px-4 py-2 font-bold text-green-700">R$ ${parseFloat(item.VALOR_TOTAL || 0).toLocaleString('pt-BR')}</td>
                <td class="px-4 py-2 text-xs uppercase">${item.COMPRADOR || "-"}</td>
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
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'UPDATE_STATUS',
                id: id,
                status: item.STATUS,
                entrega: item.DATA_ENTREGA,
                comprador: item.COMPRADOR_ATUAL
            })
        });
        alert("Sincronizado com sucesso!");
        if (item.STATUS === 'CONCLUÍDO') mudarAba('solicitacao'); 
    } catch (e) { alert("Erro ao salvar."); }
}

// --- DASHBOARD ---
function calcularDash(dados) {
    let pend = 0, env = 0, concl = 0, somaLead = 0, sla = 0;
    dados.forEach(item => {
        if (item.STATUS === 'PENDENTE') pend++;
        if (item.STATUS === 'ENVIADO AO FORNECEDOR') env++;
        if (item.STATUS === 'CONCLUÍDO' && item.DATA_ENTREGA) {
            concl++;
            const d1 = parseData(item.DATA_DE_SOLICITACAO);
            const d2 = parseData(item.DATA_ENTREGA);
            const diff = Math.floor((d2 - d1) / 86400000);
            somaLead += diff;
            if (diff <= 7) sla++;
        }
    });
    document.getElementById('dash-pendentes').innerText = pend;
    document.getElementById('dash-enviados').innerText = env;
    document.getElementById('dash-leadtime').innerText = concl ? (somaLead / concl).toFixed(1) : 0;
    document.getElementById('dash-sla').innerText = concl ? ((sla / concl) * 100).toFixed(0) + '%' : '0%';
}

function parseData(s) { const p = s.split('/'); return new Date(p[2], p[1]-1, p[0]); }