const today = new Date('2026-06-10T09:00:00');
const iso = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
const dayLabel = (dateString) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${dateString}T12:00:00`));
const uid = () => Math.random().toString(36).slice(2, 10);

const seed = {
  onboarded: false,
  activeView: 'today',
  quickAddOpen: false,
  detailTaskId: null,
  triageOpen: false,
  triageIndex: 0,
  theme: 'light',
  insightsHidden: false,
  user: { id: 'u1', name: 'Marina', mode: 'advanced', focus: 'trabalho' },
  projects: [
    { id: 'p-work', name: 'Trabalho', color: '#3d6dd8', icon: '💼', shared: true, progress: 68, count: 8 },
    { id: 'p-admin', name: 'Admin', color: '#de4c3f', icon: '🗂️', shared: false, progress: 42, count: 5 },
    { id: 'p-home', name: 'Casa', color: '#2b9b6b', icon: '🏡', shared: true, progress: 54, count: 6 },
    { id: 'p-study', name: 'Estudos', color: '#7b61ff', icon: '📚', shared: false, progress: 25, count: 3 }
  ],
  labels: ['casa', 'rua', '15min', 'profundo', 'aguardando', 'financeiro'],
  filters: [
    { id: 'f1', name: 'Hoje + alta prioridade', color: '#de4c3f', favorite: true, query: 'today & p1', rules: [{ field: 'date', op: 'is', value: 'hoje' }, { field: 'priority', op: 'is', value: 'p1' }] },
    { id: 'f2', name: 'Sem data', color: '#766b62', favorite: true, query: 'no date & active', rules: [{ field: 'date', op: 'is', value: 'sem data' }] },
    { id: 'f3', name: 'Recorrentes', color: '#7b61ff', favorite: false, query: 'recurring', rules: [{ field: 'recurring', op: 'is', value: 'true' }] }
  ],
  tasks: [
    { id: 't1', title: 'Enviar proposta revisada para cliente', projectId: 'p-work', labels: ['profundo'], priority: 1, dueDate: iso(today), dueTime: '10:30', status: 'active', recurrence: null, assignee: 'Marina', createdAt: '2026-06-08', comments: 2, attachments: 1, duration: 45, deferred: 0 },
    { id: 't2', title: 'Pagar condomínio', projectId: 'p-admin', labels: ['financeiro', 'casa'], priority: 1, dueDate: iso(today), dueTime: '14:00', status: 'active', recurrence: 'todo mês', recurrenceMode: 'schedule', assignee: null, createdAt: '2026-06-01', comments: 0, attachments: 0, duration: 10, deferred: 1 },
    { id: 't3', title: 'Comprar pilhas para controle', projectId: null, labels: ['rua'], priority: 3, dueDate: null, dueTime: null, status: 'active', recurrence: null, assignee: null, createdAt: '2026-06-10', comments: 0, attachments: 0, duration: 15, deferred: 0 },
    { id: 't4', title: 'Revisão semanal', projectId: 'p-work', labels: ['profundo'], priority: 2, dueDate: iso(today), dueTime: null, status: 'active', recurrence: 'toda sexta', recurrenceMode: 'completion', assignee: null, createdAt: '2026-05-02', comments: 1, attachments: 0, duration: 30, deferred: 0 },
    { id: 't5', title: 'Responder orçamento da escola', projectId: 'p-home', labels: ['aguardando'], priority: 2, dueDate: iso(addDays(today, -1)), dueTime: '16:00', status: 'active', recurrence: null, assignee: 'João', createdAt: '2026-06-05', comments: 3, attachments: 2, duration: 20, deferred: 2 },
    { id: 't6', title: 'Planejar roteiro de estudos', projectId: 'p-study', labels: ['profundo'], priority: 3, dueDate: iso(addDays(today, 2)), dueTime: null, status: 'active', recurrence: null, assignee: null, createdAt: '2026-06-09', comments: 0, attachments: 0, duration: 60, deferred: 0 },
    { id: 't7', title: 'Ligar para dentista', projectId: null, labels: ['rua'], priority: 2, dueDate: null, dueTime: null, status: 'active', recurrence: null, assignee: null, createdAt: '2026-06-10', comments: 0, attachments: 0, duration: 10, deferred: 0 },
    { id: 't8', title: 'Enviar ata da reunião', projectId: 'p-work', labels: ['15min'], priority: 2, dueDate: iso(addDays(today, 1)), dueTime: '09:00', status: 'active', recurrence: null, assignee: 'Ana', createdAt: '2026-06-09', comments: 1, attachments: 1, duration: 15, deferred: 0 }
  ],
  activity: ['Criou tarefa recorrente Revisão semanal', 'Anexou proposta.pdf em Trabalho', 'João comentou em Orçamento da escola']
};

let state = loadState();
function loadState() {
  const saved = localStorage.getItem('tarefinhas-state');
  return saved ? { ...seed, ...JSON.parse(saved) } : structuredClone(seed);
}
function saveState() { localStorage.setItem('tarefinhas-state', JSON.stringify(state)); }

function project(id) { return state.projects.find((item) => item.id === id); }
function activeTasks() { return state.tasks.filter((task) => task.status === 'active'); }
function isInbox(task) { return !task.projectId && task.status === 'active'; }
function isToday(task) { return task.dueDate && task.dueDate <= iso(today) && task.status === 'active'; }
function isUpcoming(task) { return task.dueDate && task.dueDate > iso(today) && task.status === 'active'; }

function parseQuickAdd(raw) {
  const parsed = { raw, title: raw, labels: [], chips: [], priority: 4, projectId: null, assignee: null, dueDate: null, dueTime: null, recurrence: null, reminder: null, attachment: null };
  let title = raw;
  const tokenPatterns = [
    { regex: /[#@]([\p{L}\w-]+)/giu, apply: (m) => { parsed.labels.push(m[1].toLowerCase()); parsed.chips.push(['Label', `${m[0][0]}${m[1]}`]); } },
    { regex: /\/([\p{L}\w-]+)/giu, apply: (m) => { const found = state.projects.find((p) => p.name.toLowerCase().startsWith(m[1].toLowerCase())); parsed.projectId = found?.id || null; parsed.chips.push(['Projeto', `/${found?.name || m[1]}`]); } },
    { regex: /\bp([1-4])\b/giu, apply: (m) => { parsed.priority = Number(m[1]); parsed.chips.push(['Prioridade', `P${m[1]}`]); } },
    { regex: /\+([\p{L}\w-]+)/giu, apply: (m) => { parsed.assignee = m[1]; parsed.chips.push(['Responsável', `+${m[1]}`]); } },
    { regex: /!(\d{1,2}:\d{2})/giu, apply: (m) => { parsed.reminder = m[1]; parsed.chips.push(['Lembrete', m[1]]); } }
  ];
  tokenPatterns.forEach(({ regex, apply }) => {
    title = title.replace(regex, (...args) => { apply(args); return ''; });
  });
  const rules = [
    [/\bamanh[ãa]\b/i, () => { parsed.dueDate = iso(addDays(today, 1)); parsed.chips.push(['Data', 'amanhã']); }],
    [/\bhoje\b/i, () => { parsed.dueDate = iso(today); parsed.chips.push(['Data', 'hoje']); }],
    [/\bsegunda\b|\btoda segunda\b/i, () => { parsed.recurrence = 'toda segunda'; parsed.dueDate ||= iso(addDays(today, 5)); parsed.chips.push(['Recorrência', 'toda segunda']); }],
    [/a cada 2 semanas/i, () => { parsed.recurrence = 'a cada 2 semanas'; parsed.chips.push(['Recorrência', 'a cada 2 semanas']); }],
    [/todo dia útil/i, () => { parsed.recurrence = 'todo dia útil'; parsed.chips.push(['Recorrência', 'dias úteis']); }]
  ];
  rules.forEach(([regex, apply]) => { if (regex.test(title)) { apply(); title = title.replace(regex, ''); } });
  const time = title.match(/\b(\d{1,2})h\b|\b(\d{1,2}:\d{2})\b/i);
  if (time) { parsed.dueTime = time[2] || `${time[1].padStart(2, '0')}:00`; parsed.chips.push(['Hora', parsed.dueTime]); title = title.replace(time[0], ''); }
  if (/\banexo\b/i.test(title)) { parsed.attachment = 'arquivo-importado.pdf'; parsed.chips.push(['Anexo', parsed.attachment]); }
  parsed.title = title.replace(/\s+/g, ' ').trim() || raw.trim();
  return parsed;
}

function completeTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  state.activity.unshift(`Concluiu ${task.title}`);
  if (task.recurrence) {
    const nextDate = task.recurrence.includes('mês') ? addDays(new Date(`${task.dueDate}T12:00:00`), 30) : addDays(new Date(`${task.dueDate || iso(today)}T12:00:00`), task.recurrence.includes('2 semanas') ? 14 : 7);
    state.tasks.unshift({ ...task, id: uid(), status: 'active', completedAt: null, dueDate: iso(nextDate), createdAt: iso(today), title: task.title, deferred: 0 });
    state.activity.unshift(`Gerou próxima ocorrência de ${task.title}`);
  }
  saveAndRender();
}

function saveAndRender() { saveState(); render(); }
function setView(view) { state.activeView = view; saveAndRender(); }

function TaskCheckbox(task) { return `<button class="check" aria-label="Concluir ${task.title}" data-complete="${task.id}">✓</button>`; }
function PriorityBadge(priority) { return `<span class="priority p${priority}">P${priority}</span>`; }
function DateChip(task) { if (!task.dueDate) return ''; const overdue = task.dueDate < iso(today); return `<span class="chip ${overdue ? 'brand' : 'blue'}">${overdue ? '⚠️' : '📅'} ${dayLabel(task.dueDate)}${task.dueTime ? ` · ${task.dueTime}` : ''}</span>`; }
function LabelChip(label) { return `<span class="chip">@${label}</span>`; }
function TaskRow(task) {
  const p = project(task.projectId);
  return `<article class="task-row" draggable="true" data-task="${task.id}">
    ${TaskCheckbox(task)}
    <div><div class="task-title">${task.title}</div><div class="meta">
      ${DateChip(task)} ${p ? `<span class="chip green">${p.icon} ${p.name}</span>` : '<span class="chip brand">Inbox</span>'}
      ${task.labels.map(LabelChip).join('')} ${task.recurrence ? `<span class="chip amber">↻ ${task.recurrence}</span>` : ''} ${task.assignee ? `<span class="chip blue">+${task.assignee}</span>` : ''}
    </div></div>
    <button class="ghost" data-detail="${task.id}">${PriorityBadge(task.priority)}</button>
  </article>`;
}
function EmptyState(title, body, cta = 'Capturar primeira tarefa') { return `<div class="empty"><div class="emoji">✨</div><h3>${title}</h3><p class="subtitle">${body}</p><button class="primary" data-open-quick>${cta}</button></div>`; }
function SectionHeader(title, count, action = '') { return `<div class="section-title"><h2>${title}</h2><span class="pill">${count} ${count === 1 ? 'item' : 'itens'}</span>${action}</div>`; }
function CalendarStrip(days = 14) {
  return `<div class="calendar-strip">${Array.from({ length: days }, (_, index) => {
    const date = addDays(today, index); const dateIso = iso(date); const has = activeTasks().some((t) => t.dueDate === dateIso);
    return `<button class="day-pill ${index === 0 ? 'active' : ''} ${has ? 'has' : ''}" data-add-date="${dateIso}"><small>${new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date)}</small><strong>${date.getDate()}</strong></button>`;
  }).join('')}</div>`;
}
function ProductivityCard(text, bars, tone = 'brand') { return `<article class="card insight-card"><strong>${text}</strong><div class="spark">${bars.map((b) => `<i style="height:${b}%"></i>`).join('')}</div><span class="subtitle">Toque para abrir tarefas relacionadas.</span></article>`; }

function renderOnboarding() {
  const steps = [
    ['Capture rápido. Organize sem esforço. Execute com clareza.', ['Pessoal', 'Trabalho', 'Estudos', 'Família']],
    ['Escolha seu modo de uso.', ['Simples', 'Avançado']],
    ['Ative lembretes acionáveis.', ['Agora', 'Depois']],
    ['Projetos iniciais sugeridos.', ['Trabalho', 'Casa', 'Admin', 'Estudos']],
    ['Importe ou comece limpo.', ['Importar', 'Pular']]
  ];
  const step = Number(sessionStorage.getItem('onboarding-step') || 0);
  const [title, options] = steps[step];
  document.querySelector('#app').innerHTML = `<main class="onboarding"><section class="onboarding-card">
    <span class="eyebrow">Tarefinhas</span><h1>${title}</h1><p class="subtitle">Um sistema operacional pessoal com Inbox, Today, Upcoming, Projetos, filtros visuais e insights silenciosos.</p>
    <div class="option-grid">${options.map((option, index) => `<button class="option ${index === 0 ? 'selected' : ''}" data-next-onboarding>${option}<br><small class="subtitle">Defaults inteligentes para ${option.toLowerCase()}.</small></button>`).join('')}</div>
    <div class="progress"><i style="width:${((step + 1) / steps.length) * 100}%"></i></div>
    <div class="row-actions" style="margin-top:16px"><button class="secondary" data-skip-onboarding>Pular</button><button class="primary" data-next-onboarding>${step === steps.length - 1 ? 'Entrar no app' : 'Continuar'}</button></div>
  </section></main>`;
}

function viewHeader(title, eyebrow, subtitle, right = '') { return `<header class="topbar"><span class="eyebrow">${eyebrow}</span><div class="header-row"><div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${right}</div></header>`; }
function renderToday() {
  const overdue = activeTasks().filter((t) => t.dueDate && t.dueDate < iso(today));
  const timed = activeTasks().filter((t) => t.dueDate === iso(today) && t.dueTime);
  const noTime = activeTasks().filter((t) => t.dueDate === iso(today) && !t.dueTime);
  const doneToday = state.tasks.filter((t) => t.completedAt?.startsWith('2026-06-10')).length;
  return `${viewHeader('Today', 'Execução', 'O que precisa da sua atenção agora.', `<span class="pill">${doneToday}/${overdue.length + timed.length + noTime.length + doneToday} feitas</span>`)}
    <section class="card" style="padding:14px"><div class="header-row"><strong>Top 3 do dia</strong><span class="pill">carga equilibrada</span></div><div class="meta">${activeTasks().filter(isToday).sort((a,b)=>a.priority-b.priority).slice(0,3).map((t)=>`<span class="chip brand">${t.title}</span>`).join('')}</div></section>
    ${SectionHeader('Overdue', overdue.length)}<div class="stack">${overdue.map(TaskRow).join('') || EmptyState('Nada atrasado', 'Seu dia começou com clareza.', 'Adicionar tarefa')}</div>
    ${SectionHeader('Com horário', timed.length)}<div class="stack">${timed.map(TaskRow).join('')}</div>
    ${SectionHeader('Sem horário', noTime.length)}<div class="stack">${noTime.map(TaskRow).join('')}</div>
    ${!state.insightsHidden ? `<section>${SectionHeader('Insights leves', 3, '<button class="ghost" data-hide-insights>ocultar</button>')}<div class="stack">${ProductivityCard('Você conclui mais tarefas às terças.', [40,90,52,68,46,30,24])}${ProductivityCard('Tarefas de baixa prioridade estão acumulando há 12 dias.', [18,22,30,46,70,76,84])}${ProductivityCard('Sua revisão semanal está consistente há 5 semanas.', [35,45,55,65,75])}</div></section>` : ''}`;
}
function renderInbox() {
  const inbox = activeTasks().filter(isInbox).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return `${viewHeader('Inbox', 'Captura universal', 'Tudo entra rápido; você decide o destino depois.', `<button class="primary" data-open-triage>Processar</button>`)}
    <section class="card" style="padding:14px"><div class="header-row"><strong>${inbox.length} capturas abertas</strong><span class="pill">ordem reversa</span></div><p class="subtitle">Swipe mental: concluir, reagendar, priorizar, mover ou enriquecer inline.</p></section>
    <div class="stack">${inbox.map(TaskRow).join('') || EmptyState('Inbox zerada', 'Ótimo. Capture algo novo ou revise seus próximos dias.', 'Capturar primeira tarefa')}</div>`;
}
function renderUpcoming() {
  const days = Array.from({ length: 14 }, (_, index) => iso(addDays(today, index + 1)));
  return `${viewHeader('Upcoming', 'Planejamento', 'Uma linha contínua para redistribuir sua carga.', '<span class="pill">7 · 14 · mês</span>')}${CalendarStrip(14)}
    <div class="stack">${days.map((date) => {
      const tasks = activeTasks().filter((t) => t.dueDate === date);
      const load = tasks.reduce((sum, task) => sum + (task.duration || 20), 0);
      return `<section class="card" style="padding:12px" data-day="${date}">${SectionHeader(dayLabel(date), tasks.length, `<button class="ghost" data-add-date="${date}">+ adicionar</button>`)}<div class="progress"><i style="width:${Math.min(100, load)}%"></i></div><div class="stack" style="margin-top:10px">${tasks.map(TaskRow).join('') || '<p class="subtitle">Dia livre para planejar sem sobrecarga.</p>'}</div></section>`;
    }).join('')}</div>`;
}
function renderProjects() {
  return `${viewHeader('Projects', 'Estrutura', 'Projetos leves para iniciantes e poderosos para avançados.', '<button class="secondary">Templates</button>')}
    <div class="project-grid">${state.projects.map((p) => `<article class="card project-card"><div><div class="project-icon" style="background:${p.color}22">${p.icon}</div><h2>${p.name}</h2><p class="subtitle">${p.count} tarefas · ${p.shared ? 'compartilhado' : 'pessoal'}</p></div><div class="progress"><i style="width:${p.progress}%; background:${p.color}"></i></div></article>`).join('')}</div>`;
}
function renderBrowse() {
  return `${viewHeader('Browse', 'Mais', 'Filtros, busca, insights, notificações e ajustes.', '<button class="icon-btn" data-toggle-theme>◐</button>')}
    <div class="stack">
      <button class="task-row" data-subview="filters"><span>🧩</span><div><strong>Filters & Labels</strong><p class="subtitle">Construtor visual, query avançada, widgets.</p></div><span>›</span></button>
      <button class="task-row" data-subview="search"><span>🔎</span><div><strong>Search</strong><p class="subtitle">Busca global por tarefas, comentários, anexos e labels.</p></div><span>›</span></button>
      <button class="task-row" data-subview="insights"><span>🌿</span><div><strong>Productivity Insights</strong><p class="subtitle">Ritmo, consistência, carga e atrasos sem dashboard pesado.</p></div><span>›</span></button>
      <button class="task-row" data-subview="settings"><span>⚙️</span><div><strong>Settings</strong><p class="subtitle">Tema, widgets, gestos, backup, integrações e acessibilidade.</p></div><span>›</span></button>
    </div>${renderFilters()}`;
}
function InlineFilterBuilder() {
  const rules = state.filters[0].rules;
  const preview = 'Mostrar tarefas ativas do projeto Trabalho com prioridade alta e vencimento hoje.';
  return `<section class="card" style="padding:14px"><div class="header-row"><strong>Novo filtro visual</strong><span class="pill">AND · OR · NOT</span></div>
    <div class="stack" style="margin-top:10px">${rules.map((r, i) => `<div class="filter-rule"><select><option>${r.field}</option><option>project</option><option>label</option><option>recurring</option></select><select><option>${r.op}</option><option>contains</option><option>not</option></select><input value="${r.value}"/><button class="icon-btn">⌘</button></div>`).join('')}</div>
    <p class="subtitle"><strong>Preview:</strong> ${preview}</p><p class="subtitle"><strong>Query:</strong> today & p1 & #Trabalho</p><p class="subtitle">Limitação MVP: recorrência filtra tarefas recorrentes em geral; frequência específica ainda é exibida como preview, não como condição combinável.</p>
    <div class="row-actions"><button class="primary">Salvar filtro</button><button class="secondary">Duplicar</button><button class="secondary">Transformar em widget</button></div></section>`;
}
function renderFilters() {
  return `<section style="margin-top:18px">${SectionHeader('Filters & Labels', state.filters.length)}<div class="stack">${InlineFilterBuilder()}${state.filters.map((f)=>`<article class="task-row"><span class="priority" style="color:${f.color}">◆</span><div><strong>${f.name}</strong><p class="subtitle">${f.query} · ${f.favorite ? 'favorito' : 'salvo'}</p></div><span>⭐</span></article>`).join('')}</div></section>`;
}
function renderShell() {
  document.documentElement.dataset.theme = state.theme;
  const views = { today: renderToday, upcoming: renderUpcoming, inbox: renderInbox, projects: renderProjects, browse: renderBrowse };
  const nav = [['today','☀️','Today'],['upcoming','📆','Upcoming'],['inbox','📥','Inbox'],['projects','▦','Projects'],['browse','•••','More']];
  document.querySelector('#app').innerHTML = `<div class="app-shell"><aside class="sidebar"><span class="eyebrow">Tarefinhas</span><h2>Capturar rápido</h2>${nav.map(([key,icon,label])=>`<button class="nav-btn ${state.activeView===key?'active':''}" data-view="${key}"><span>${icon}</span>${label}</button>`).join('')}</aside><main class="mobile-frame">${views[state.activeView]()}<button class="fab" data-open-quick aria-label="Adicionar tarefa">+</button></main><nav class="bottom-nav">${nav.map(([key,icon,label])=>`<button class="nav-btn ${state.activeView===key?'active':''}" data-view="${key}"><span>${icon}</span>${label}</button>`).join('')}</nav>${QuickAddComposer()}${TaskDetail()}${TriageSheet()}</div>`;
}
function QuickAddComposer() {
  const example = 'Pagar condomínio amanhã 9h #Financeiro @casa /Admin p1 !14:00 +João';
  return `<div class="quick-add ${state.quickAddOpen ? 'open' : ''}" data-backdrop><section class="composer"><div class="header-row"><strong>Quick Add</strong><span class="pill">parsing ativo</span></div><textarea id="quick-input" placeholder="${example}"></textarea><div id="parse-preview" class="meta"></div><div class="composer-actions" style="margin-top:12px"><button class="secondary" data-attach>📎 Anexar</button><button class="secondary" data-multiline>↵ múltiplas linhas</button><button class="ghost" data-close-quick>Cancelar</button><button class="primary" data-save-quick>Salvar</button></div></section></div>`;
}
function TaskDetail() {
  const task = state.tasks.find((t) => t.id === state.detailTaskId);
  if (!task) return '<div class="sheet"></div>';
  const p = project(task.projectId);
  return `<div class="sheet open"><section class="sheet-panel"><div class="header-row"><span class="pill">Task Detail</span><button class="icon-btn" data-close-detail>×</button></div><h2>${task.title}</h2><p class="subtitle">Descrição rica editável, subtarefas expansíveis e histórico operacional.</p><div class="meta">${DateChip(task)} ${p ? `<span class="chip green">${p.name}</span>` : '<span class="chip brand">Inbox</span>'} ${PriorityBadge(task.priority)} ${task.labels.map(LabelChip).join('')}</div><div class="stack" style="margin-top:14px"><article class="card" style="padding:14px"><strong>Recorrência</strong><p class="subtitle">${task.recurrence || 'Sem recorrência'} ${task.recurrence ? '· próxima ocorrência prevista automaticamente.' : ''}</p></article><article class="card" style="padding:14px"><strong>Comentários e anexos</strong><p class="subtitle">${task.comments} comentários · ${task.attachments} anexos · atividade recente registrada.</p></article></div><div class="row-actions" style="margin-top:14px"><button class="primary" data-complete="${task.id}">Concluir</button><button class="secondary">Duplicar</button><button class="secondary">Mover</button><button class="secondary">Arquivar</button></div></section></div>`;
}
function TriageSheet() {
  const inbox = activeTasks().filter(isInbox);
  const task = inbox[state.triageIndex];
  if (!state.triageOpen) return '<div class="sheet"></div>';
  if (!task) return `<div class="sheet open"><section class="sheet-panel">${EmptyState('Inbox processada', 'Resumo: itens processados, reagendados, descartados e convertidos em rotina.', 'Capturar nova tarefa')}<button class="primary" data-close-triage>Fechar</button></section></div>`;
  return `<div class="sheet open"><section class="sheet-panel triage-card"><div class="header-row"><span class="pill">${state.triageIndex + 1}/${inbox.length}</span><button class="icon-btn" data-close-triage>×</button></div><div class="big-title">${task.title}</div><p class="subtitle">Sugestão: parece uma tarefa de ${task.labels.includes('rua') ? 'Casa/Rua' : 'Admin'}. Título possui verbo claro? ${/^\w+ar|^\w+er|^\w+ir/i.test(task.title) ? 'Sim' : 'Talvez refine.'}</p><div class="progress"><i style="width:${((state.triageIndex + 1) / inbox.length) * 100}%"></i></div><div class="row-actions"><button class="primary" data-triage-action="project">Definir projeto</button><button class="secondary" data-triage-action="date">Definir data</button><button class="secondary" data-triage-action="priority">Priorizar</button><button class="secondary" data-triage-action="routine">Rotina</button><button class="ghost" data-triage-action="skip">Pular</button></div><label class="pill"><input type="checkbox"/> aplicar mesma regra a parecidas</label></section></div>`;
}

function render() { state.onboarded ? renderShell() : renderOnboarding(); bindEvents(); }
function bindEvents() {
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  document.querySelectorAll('[data-open-quick]').forEach((button) => button.addEventListener('click', () => { state.quickAddOpen = true; render(); setTimeout(() => document.querySelector('#quick-input')?.focus(), 0); }));
  document.querySelectorAll('[data-close-quick]').forEach((button) => button.addEventListener('click', () => { state.quickAddOpen = false; saveAndRender(); }));
  document.querySelectorAll('[data-complete]').forEach((button) => button.addEventListener('click', () => completeTask(button.dataset.complete)));
  document.querySelectorAll('[data-detail]').forEach((button) => button.addEventListener('click', () => { state.detailTaskId = button.dataset.detail; render(); }));
  document.querySelectorAll('[data-close-detail]').forEach((button) => button.addEventListener('click', () => { state.detailTaskId = null; render(); }));
  document.querySelectorAll('[data-toggle-theme]').forEach((button) => button.addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; saveAndRender(); }));
  document.querySelectorAll('[data-hide-insights]').forEach((button) => button.addEventListener('click', () => { state.insightsHidden = true; saveAndRender(); }));
  document.querySelectorAll('[data-open-triage]').forEach((button) => button.addEventListener('click', () => { state.triageOpen = true; state.triageIndex = 0; render(); }));
  document.querySelectorAll('[data-close-triage]').forEach((button) => button.addEventListener('click', () => { state.triageOpen = false; render(); }));
  document.querySelectorAll('[data-triage-action]').forEach((button) => button.addEventListener('click', () => {
    const inbox = activeTasks().filter(isInbox); const task = inbox[state.triageIndex];
    if (task && button.dataset.triageAction !== 'skip') {
      if (button.dataset.triageAction === 'project') task.projectId = task.labels.includes('rua') ? 'p-home' : 'p-admin';
      if (button.dataset.triageAction === 'date') task.dueDate = iso(addDays(today, 1));
      if (button.dataset.triageAction === 'priority') task.priority = 1;
      if (button.dataset.triageAction === 'routine') { task.recurrence = 'toda semana'; task.recurrenceMode = 'completion'; }
    }
    state.triageIndex += 1; saveAndRender();
  }));
  document.querySelectorAll('[data-next-onboarding]').forEach((button) => button.addEventListener('click', () => {
    const step = Number(sessionStorage.getItem('onboarding-step') || 0);
    if (step >= 4) { state.onboarded = true; saveAndRender(); } else { sessionStorage.setItem('onboarding-step', String(step + 1)); render(); }
  }));
  document.querySelectorAll('[data-skip-onboarding]').forEach((button) => button.addEventListener('click', () => { state.onboarded = true; saveAndRender(); }));
  document.querySelectorAll('[data-add-date]').forEach((button) => button.addEventListener('click', () => { state.quickAddOpen = true; state.prefillDate = button.dataset.addDate; render(); }));
  const input = document.querySelector('#quick-input');
  const preview = document.querySelector('#parse-preview');
  if (input && preview) {
    input.addEventListener('input', () => {
      const parsed = parseQuickAdd(input.value);
      preview.innerHTML = parsed.chips.map(([k, v]) => `<span class="chip brand">${k}: ${v}</span>`).join('') || '<span class="chip">Digite tokens como amanhã, #label, /projeto, p1, +pessoa</span>';
    });
  }
  document.querySelectorAll('[data-save-quick]').forEach((button) => button.addEventListener('click', () => {
    const value = document.querySelector('#quick-input')?.value || '';
    const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
    lines.forEach((line) => {
      const parsed = parseQuickAdd(line);
      state.tasks.unshift({ id: uid(), title: parsed.title, projectId: parsed.projectId, labels: parsed.labels, priority: parsed.priority, dueDate: parsed.dueDate || state.prefillDate || null, dueTime: parsed.dueTime, status: 'active', recurrence: parsed.recurrence, recurrenceMode: parsed.recurrence ? 'schedule' : null, assignee: parsed.assignee, createdAt: iso(today), comments: 0, attachments: parsed.attachment ? 1 : 0, duration: 20, deferred: 0 });
    });
    state.quickAddOpen = false; state.prefillDate = null; state.activeView = lines.some((line) => parseQuickAdd(line).dueDate === iso(today)) ? 'today' : state.activeView; saveAndRender();
  }));
}

render();
