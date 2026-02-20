const API_URL = "https://script.google.com/macros/s/AKfycbxYeYJCmJRDyn0wI0or4CjupMEqInFwJF8QgLG0_cRe1rGm2LXpQ1d8CcaiGZd6iKm9VQ/exec";

let abaAtiva = 'banco';
let dadosCache = [];

/* 🔥 Função mestra – busca valor mesmo com nomes diferentes */
function pegarValor(item, ...opcoes) {
    for (let nome of opcoes) {
        if (item[nome] !== undefined && item[nome] !== null) return item[nome];
        if (item[nome.toLowerCase()] !== undefined) return item[nome.toLowerCase()];
        if (item[nome.toUpperCase()] !== undefined) return item[nome.toUpperCase()];
    }
    return "";
}

/* 🔁 Troca de aba */
async function mudarAba(aba) {
    abaAtiva = aba;
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('bg-white/10'));
    document.getElementById(`btn-${aba}`).classList.add('bg-white/10');
    document.getElementById('tituloPagina').innerText = aba.toUpperCase();
    await carregarDados();
}

/* 📥 Carregar dados do GAS */
async function carregarDados() {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = `<tr><td colspan="12" class="p-10 text-center">Carregando...</td></tr>`;

    const target =
        abaAtiva === 'solicitacao' ? 'DB_SOLICITACOES' :
        abaAtiva === 'banco' ? 'DB_ITENS' :
        'DB_LICITACOES';

    try {
        const res = await fetch(`${API_URL}?aba=${target}`);
        dadosCache = await res.json();
        renderizarTabela(dadosCache);
    } catch (e) {
        corpo.innerHTML = `<tr><td colspan="12" class="p-10 text-red-600">Erro ao carregar dados</td></tr>`;
    }
}

/* 🧩 Renderização inteligente */
function renderizarTabela(dados) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = "";

    /* 💰 BANCO DE PREÇOS */
    if (abaAtiva === 'banco') {
        dados.forEach(item => {
            corpo.innerHTML += `
            <tr class="border-b hover:bg-slate-50 text-[12px]">
                <td class="p-2 font-bold text-blue-900">
                    ${pegarValor(item,'PRODUTO','DESCRICAO','DESCRICAO_DO_PRODUTO') || 'SEM NOME'}
                </td>
                <td class="p-2 text-center">
                    ${pegarValor(item,'FORNECEDOR','FABRICANTE') || '-'}
                </td>
                <td class="p-2 text-center font-bold text-green-700">
                    R$ ${Number(pegarValor(item,'PRECO_UNITARIO','PRECO','VALOR') || 0).toLocaleString('pt-BR')}
                </td>
            </tr>`;
        });
        return;
    }

    /* 📦 SOLICITAÇÕES – AGRUPADAS */
    if (abaAtiva === 'solicitacao') {
        const grupos = {};

        dados.forEach(i => {
            const id = pegarValor(i,'ID','IDENTIFICADOR','NUM_SOLIC');
            if (!id) return;

            if (!grupos[id]) {
                grupos[id] = { id, itens: [], qtd: 0 };
            }

            grupos[id].qtd += parseFloat(pegarValor(i,'QUANTIDADE','QTD') || 0);
            grupos[id].itens.push(i);
        });

        Object.values(grupos).forEach(g => {
            corpo.innerHTML += `
            <tr class="border-b bg-white hover:bg-slate-50 text-[12px]">
                <td class="p-2 text-center">
                    <button class="btn-exp text-blue-600 font-bold text-lg" data-id="${g.id}">+</button>
                </td>
                <td class="p-2">
                    <b>#${g.id}</b><br>
                    ${pegarValor(g.itens[0],'PRODUTO','DESCRICAO')}
                </td>
                <td class="p-2 text-center font-bold text-indigo-700">${g.qtd}</td>
                <td class="p-2 text-center">
                    <span class="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold">
                        ${pegarValor(g.itens[0],'STATUS','SITUACAO') || 'ABERTO'}
                    </span>
                </td>
            </tr>

            <tr id="det-${g.id}" class="hidden bg-slate-50">
                <td colspan="4" class="p-4">
                    ${g.itens.map(i => `
                        <div class="text-[11px] mb-1 p-2 bg-white border rounded">
                            <b>Solicitante:</b> ${pegarValor(i,'USUARIO_CRIACAO','SOLICITANTE')} |
                            <b>CC:</b> ${pegarValor(i,'CENTRO_DE_CUSTO','CC')} |
                            <b>Produto:</b> ${pegarValor(i,'PRODUTO','DESCRICAO')} |
                            <b>Qtd:</b> ${pegarValor(i,'QUANTIDADE','QTD')}
                        </div>
                    `).join('')}
                </td>
            </tr>`;
        });

        document.querySelectorAll('.btn-exp').forEach(btn => {
            btn.onclick = () => {
                document.getElementById(`det-${btn.dataset.id}`).classList.toggle('hidden');
            };
        });

        return;
    }

    /* 📑 LICITAÇÕES – TABELA SIMPLES */
    dados.forEach(item => {
        corpo.innerHTML += `
        <tr class="border-b hover:bg-slate-50 text-[12px]">
            <td class="p-2">${pegarValor(item,'CODCOTACAO')}</td>
            <td class="p-2">${pegarValor(item,'PRODUTO')}</td>
            <td class="p-2">${pegarValor(item,'FORNECEDOR')}</td>
            <td class="p-2 font-bold text-green-700">
                R$ ${Number(pegarValor(item,'VALOR_TOTAL') || 0).toLocaleString('pt-BR')}
            </td>
        </tr>`;
    });
}

/* 🔍 Busca global */
document.getElementById('inputBusca').addEventListener('input', e => {
    const termo = e.target.value.toLowerCase();
    const filtrado = dadosCache.filter(i =>
        JSON.stringify(i).toLowerCase().includes(termo)
    );
    renderizarTabela(filtrado);
});

window.onload = carregarDados;
