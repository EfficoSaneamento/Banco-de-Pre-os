const API = 'https://script.google.com/macros/s/AKfycbzF7Tv37LlMN-na6J_1f-rq90axU-tVnFQCG9qDZmh0I7qdCYmGgTqQlBLpoahpin9P/exec'

async function carregarSolicitacoes() {
  const res = await fetch(`${API}?acao=listar`)
  const dados = await res.json()

  const tbody = document.getElementById('tabelaSolicitacoes')
  tbody.innerHTML = ''

  dados.forEach(s => {
    const cor =
      s.status === 'Concluído' ? 'bg-green-200' :
      s.status === 'Em andamento' ? 'bg-yellow-200' :
      'bg-red-200'

    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.data}</td>
      <td>${s.item}</td>
      <td>${s.quantidade}</td>
      <td>${s.comprador}</td>
      <td><span class="px-2 py-1 rounded ${cor}">${s.status}</span></td>
      <td>
        <button onclick="concluir('${s.id}')"
                class="text-green-600 font-bold">
          Concluir
        </button>
      </td>
    `
    tbody.appendChild(tr)
  })
}

async function concluir(id) {
  await fetch(`${API}?acao=concluir&id=${id}`)
  carregarSolicitacoes()
}

async function salvarAvaliacao(dados) {
  const params = new URLSearchParams(dados).toString()
  await fetch(`${API}?acao=avaliar&${params}`)
}

async function loginDashboard() {
  const usuario = 'PEDRO'
  const senha = document.getElementById('senhaDashboard').value

  const res = await fetch(`${API}?acao=login&usuario=${usuario}&senha=${senha}`)
  const r = await res.json()

  if (r.acesso) {
    carregarDashboard()
  } else {
    alert('Senha inválida')
  }
}

async function carregarDashboard() {
  const res = await fetch(`${API}?acao=dashboard`)
  const d = await res.json()

  document.getElementById('dashPendentes').innerText = d.pendente
  document.getElementById('dashAndamento').innerText = d.andamento
  document.getElementById('dashConcluidas').innerText = d.concluido
}