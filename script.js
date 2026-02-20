// 🔴 COLE SUA URL DO APPS SCRIPT AQUI
const URL_API = 'https://script.google.com/macros/s/AKfycbycJKciXRHOzWzkmXEj71A8pf5U-qGU-RiEKf2JiJTzAt8161G8eRVukHTeItT6bOFr/exec';

let abaAtiva = 'solicitacoes';
let dadosCache = [];

/* ---------- NAVEGAÇÃO ---------- */
function mudarAba(aba) {
  abaAtiva = aba;

  document.getElementById('tituloPagina').innerText =
    aba === 'solicitacoes' ? 'SOLICITAÇÕES' :
    aba === 'avaliacao' ? 'AVALIAÇÃO DO FORNECEDOR' :
    'DASHBOARD';

  document.querySelectorAll('.btn-aba').forEach(b =>
    b.classList.remove('bg-white/10')
  );
  document.getElementById(`btn-${aba}`).classList.add('bg-white/10');

  if (aba === 'solicitacoes') carregarSolicitacoes();
  if (aba === 'avaliacao') carregarAvaliacao();
  if (aba === 'dashboard') carregarDashboard();
}

/* ---------- SOLICITAÇÕES ---------- */
function carregarSolicitacoes() {
  fetch(`${URL_API}?aba=DB_SOLICITACOES`)
    .then(r => r.json())
    .then(dados => {
      dadosCache = dados;
      renderizarSolicitacoes(dados);
    });
}

function renderizarSolicitacoes(dados) {
  const corpo = document.getElementById('corpoTabela');
  corpo.innerHTML = '';

  if (!dados.length) {
    corpo.innerHTML = `
      <tr>
        <td colspan="7" class="p-4 text-center text-gray-400">
          Nenhuma solicitação ativa
        </td>
      </tr>
    `;
    return;
  }

  dados.forEach(d => {
    corpo.innerHTML += `
      <tr class="border-t hover:bg-slate-50">
        <td class="p-3">${d.IDENTIFICADOR}</td>
        <td class="p-3">${d['Data da Solicitação']}</td>
        <td class="p-3">${d.Item}</td>
        <td class="p-3">${d.Quantidade}</td>
        <td class="p-3">${d.Solicitante}</td>
        <td class="p-3">${badgeStatus(d.STATUS)}</td>
        <td class="p-3">
          <button onclick="concluir('${d.IDENTIFICADOR}')"
            class="text-xs bg-green-600 text-white px-3 py-1 rounded">
            Concluir
          </button>
        </td>
      </tr>
    `;
  });
}

/* ---------- STATUS ---------- */
function badgeStatus(status) {
  if (status === 'Em andamento')
    return '<span class="text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs">🟡 Em andamento</span>';
  return '<span class="text-red-700 bg-red-100 px-2 py-1 rounded text-xs">🔴 Pendente</span>';
}

/* ---------- CONCLUIR ---------- */
function concluir(id) {
  if (!confirm('Concluir esta solicitação?')) return;

  fetch(URL_API, {
    method: 'POST',
    body: JSON.stringify({
      action: 'CONCLUIR',
      id: id
    })
  }).then(() => carregarSolicitacoes());
}

/* ---------- AVALIAÇÃO ---------- */
function carregarAvaliacao() {
  document.getElementById('corpoTabela').innerHTML = `
    <tr>
      <td colspan="7" class="p-4 text-center text-gray-400">
        Avaliação será exibida após conclusão
      </td>
    </tr>
  `;
}

/* ---------- DASHBOARD ---------- */
function carregarDashboard() {
  const senha = prompt('Digite a senha do dashboard:');
  if (senha !== 'Effico*2025') {
    alert('Acesso negado');
    mudarAba('solicitacoes');
    return;
  }

  document.getElementById('corpoTabela').innerHTML = `
    <tr>
      <td colspan="7" class="p-4 text-center font-bold">
        Dashboard em construção 🚀
      </td>
    </tr>
  `;
}

/* ---------- INICIAL ---------- */
document.addEventListener('DOMContentLoaded', () => {
  carregarSolicitacoes();
});