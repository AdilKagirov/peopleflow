const stages = ["Резюме", "Телефонное интервью", "Собеседование", "Тестовое задание", "Проверка рекомендаций", "Финал"];
const vacancyStatuses = ["Открыта", "Приостановлена", "Закрыта", "Заполнена"];
const roles = ["Администратор", "Рекрутер", "Менеджер по найму", "HR филиала"];
const permissions = ["Просмотр", "Редактирование", "Создание", "Кандидаты", "Аналитика"];
const API_BASE = "http://localhost:3000/api";

const demo = {
  role: "Администратор",
  vacancies: [
    {
      id: crypto.randomUUID(),
      title: "Frontend-разработчик",
      department: "Продукт",
      position: "Middle Frontend Developer",
      description: "Разработка интерфейсов HR-платформы и личного кабинета сотрудников.",
      requirements: "JavaScript, React, REST API, аккуратность к UX.",
      conditions: "Гибрид, ДМС, техника, обучение.",
      employment: "Полная занятость",
      salary: "450 000 - 650 000 KZT",
      publishedAt: "2026-06-10",
      closedAt: "2026-07-10",
      status: "Открыта",
      access: "Администратор, Рекрутер, Менеджер по найму",
      attachments: "frontend-role.pdf",
      channels: "Сайт компании, hh.kz",
    },
    {
      id: crypto.randomUUID(),
      title: "HR business partner",
      department: "HR",
      position: "HRBP",
      description: "Сопровождение филиалов, развитие процессов адаптации и удержания.",
      requirements: "Опыт HRBP от 3 лет, аналитика, коммуникации.",
      conditions: "Офис, бонусы, корпоративное обучение.",
      employment: "Полная занятость",
      salary: "550 000 - 750 000 KZT",
      publishedAt: "2026-06-01",
      closedAt: "2026-06-28",
      status: "Приостановлена",
      access: "Администратор, HR филиала",
      attachments: "",
      channels: "Внутренний портал",
    },
  ],
  candidates: [
    {
      id: crypto.randomUUID(),
      name: "Алия Смагулова",
      contacts: "aliya@example.com, +7 701 111 22 33",
      vacancyTitle: "Frontend-разработчик",
      source: "hh.kz",
      experience: "4 года",
      education: "КазНУ, информационные системы",
      skills: "JavaScript, React, TypeScript, CSS",
      stage: "Собеседование",
      appliedAt: "2026-06-12",
      tags: "сильный frontend, Алматы",
      notes: "Хороший профиль, уверенно прошла скрининг.",
      rating: "5",
      history: "12.06 отклик; 13.06 звонок; 18.06 интервью",
      interviewAt: "2026-06-18T15:00",
    },
    {
      id: crypto.randomUUID(),
      name: "Дмитрий Волков",
      contacts: "d.volkov@example.com",
      vacancyTitle: "Frontend-разработчик",
      source: "Сайт компании",
      experience: "2 года",
      education: "Колледж связи",
      skills: "Vue, JavaScript, HTML, CSS",
      stage: "Тестовое задание",
      appliedAt: "2026-06-11",
      tags: "удаленно, быстрый отклик",
      notes: "Ждет тестовое задание.",
      rating: "4",
      history: "11.06 отклик; 12.06 письмо с тестовым",
      interviewAt: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Айгерим Нурлан",
      contacts: "aigerim@example.com",
      vacancyTitle: "HR business partner",
      source: "Рекомендация",
      experience: "6 лет",
      education: "KIMEP, менеджмент",
      skills: "HR analytics, onboarding, performance review",
      stage: "Телефонное интервью",
      appliedAt: "2026-06-14",
      tags: "HRBP, филиалы",
      notes: "Назначить звонок с руководителем HR.",
      rating: "5",
      history: "14.06 рекомендация; 15.06 письмо",
      interviewAt: "2026-06-19T11:30",
    },
  ],
  templates: [
    {
      id: crypto.randomUUID(),
      title: "Подтверждение получения резюме",
      subject: "Мы получили ваше резюме",
      body: "Здравствуйте, {{name}}! Спасибо за отклик на вакансию {{vacancy}}. Мы изучим резюме и вернемся с обратной связью.",
      stage: "Резюме",
    },
    {
      id: crypto.randomUUID(),
      title: "Приглашение на интервью",
      subject: "Интервью по вакансии {{vacancy}}",
      body: "Здравствуйте, {{name}}! Приглашаем вас на интервью. Детали встречи направим отдельным письмом.",
      stage: "Собеседование",
    },
    {
      id: crypto.randomUUID(),
      title: "Отказ",
      subject: "Статус по вакансии {{vacancy}}",
      body: "Здравствуйте, {{name}}! Спасибо за интерес. Сейчас мы не готовы продолжить процесс, но сохраним ваш профиль в базе.",
      stage: "Финал",
    },
  ],
  rolePermissions: {
    "Администратор": ["Просмотр", "Редактирование", "Создание", "Кандидаты", "Аналитика"],
    "Рекрутер": ["Просмотр", "Редактирование", "Создание", "Кандидаты"],
    "Менеджер по найму": ["Просмотр", "Кандидаты", "Аналитика"],
    "HR филиала": ["Просмотр", "Создание", "Кандидаты"],
  },
};

let state = loadState();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  const saved = localStorage.getItem("peopleflow-state");
  return saved ? JSON.parse(saved) : structuredClone(demo);
}

function saveState() {
  localStorage.setItem("peopleflow-state", JSON.stringify(state));
}

function init() {
  $("#roleSelect").innerHTML = roles.map((role) => `<option>${role}</option>`).join("");
  $("#roleSelect").value = state.role;
  $("#vacancyStatusFilter").innerHTML += vacancyStatuses.map((status) => `<option>${status}</option>`).join("");
  $("#candidateStageFilter").innerHTML += stages.map((stage) => `<option>${stage}</option>`).join("");
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  $$("[data-view-jump]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewJump)));
  $("#roleSelect").addEventListener("change", (event) => {
    state.role = event.target.value;
    saveState();
    render();
  });
  $("#resetDemo").addEventListener("click", () => {
    state = structuredClone(demo);
    saveState();
    render();
  });
  $("#newVacancy").addEventListener("click", () => vacancyForm());
  $("#newCandidate").addEventListener("click", () => candidateForm());
  $("#quickAddCandidate").addEventListener("click", () => candidateForm());
  $("#vacancySearch").addEventListener("input", renderVacancies);
  $("#vacancyStatusFilter").addEventListener("change", renderVacancies);
  $("#candidateSearch").addEventListener("input", renderCandidates);
  $("#candidateStageFilter").addEventListener("change", renderCandidates);
  $("#resumeImport").addEventListener("change", importResume);
  $("#addInterview").addEventListener("click", () => interviewForm());
  $("#sendMessage").addEventListener("click", () => messageForm());
  $("#exportExcel").addEventListener("click", exportExcel);
  $("#exportPdf").addEventListener("click", () => window.print());
  $("#saveRoles").addEventListener("click", saveRoles);
  $$(".modal-cancel").forEach((button) => button.addEventListener("click", () => $("#modal").close("cancel")));
  render();
  refreshFromApi();
}

function switchView(view) {
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  $$(".view").forEach((section) => section.classList.remove("active"));
  $(`#${view}View`).classList.add("active");
  $("#viewTitle").textContent = $(`.nav-item[data-view="${view}"]`).textContent;
}

function can(permission) {
  return state.rolePermissions[state.role]?.includes(permission);
}

function render() {
  $("#roleSelect").value = state.role;
  renderDashboard();
  renderVacancies();
  renderCandidates();
  renderPipeline();
  renderMessages();
  renderReports();
  renderRoles();
}

async function refreshFromApi() {
  try {
    const [reference, vacancies, candidates, applications] = await Promise.all([
      apiFetch("/reference"),
      apiFetch("/vacancies"),
      apiFetch("/candidates"),
      apiFetch("/applications"),
    ]);

    state.reference = reference;
    state.apiConnected = true;
    state.stageOptions = reference.pipelineStages.map((stage) => ({
      code: stage.code,
      name: stage.name,
    }));
    state.vacancies = vacancies.map(mapApiVacancy);
    state.candidates = candidates.map((candidate) => mapApiCandidate(candidate, applications));
    state.applications = applications;
    saveState();
    syncReferenceFilters();
    render();
  } catch (error) {
    state.apiConnected = false;
    console.warn("PeopleFlow API is unavailable, using local data.", error);
  }
}

async function apiFetch(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: isForm ? options.headers || {} : { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${text}`);
  }

  return response.status === 204 ? null : response.json();
}

function syncReferenceFilters() {
  if (state.reference?.vacancyStatuses?.length) {
    $("#vacancyStatusFilter").innerHTML = `<option value="">Все статусы</option>` +
      state.reference.vacancyStatuses.map((status) => `<option>${status.name}</option>`).join("");
  }

  if (state.stageOptions?.length) {
    $("#candidateStageFilter").innerHTML = `<option value="">Все этапы</option>` +
      state.stageOptions.map((stage) => `<option>${stage.name}</option>`).join("");
  }
}

function mapApiVacancy(item) {
  return {
    id: item.id,
    title: item.title,
    department: item.department?.name || "Без отдела",
    position: item.position,
    description: item.description,
    requirements: item.requirements,
    conditions: item.workingConditions,
    employment: item.employmentType?.name || "Не указано",
    employmentTypeCode: item.employmentType?.code || "full_time",
    salary: formatSalary(item.salary),
    publishedAt: dateOnly(item.publishedAt),
    closedAt: dateOnly(item.closedAt),
    status: item.status?.name || "Открыта",
    statusCode: item.status?.code || "open",
    access: "По ролям KMF PeopleFlow",
    attachments: "",
    channels: "KMF PeopleFlow API",
  };
}

function mapApiCandidate(item, applications = []) {
  const application = applications.find((entry) => entry.candidate.id === item.id);
  return {
    id: item.id,
    applicationId: application?.id || "",
    name: item.fullName,
    contacts: [item.email, item.phone].filter(Boolean).join(", ") || "Контакты не указаны",
    vacancyTitle: application?.vacancy?.title || "Без активной вакансии",
    source: item.source?.name || application?.source?.name || "Не указан",
    experience: item.totalExperienceMonths ? `${Math.round(item.totalExperienceMonths / 12)} г.` : "не указано",
    education: item.education || "",
    skills: item.skills || "",
    stage: application?.stage?.name || "Рассмотрение резюме",
    stageCode: application?.stage?.code || "resume_review",
    appliedAt: dateOnly(application?.appliedAt || item.createdAt),
    tags: item.city || "",
    notes: application?.summary || "",
    rating: application?.rating || "3",
    history: application ? `Отклик: ${application.status.name}` : "Профиль кандидата",
    interviewAt: "",
  };
}

function formatSalary(salary) {
  if (!salary) return "Не указано";
  const min = salary.min ? Number(salary.min).toLocaleString("ru-RU") : "";
  const max = salary.max ? Number(salary.max).toLocaleString("ru-RU") : "";
  const range = [min, max].filter(Boolean).join(" - ");
  return range ? `${range} ${salary.currency}` : `Не указано ${salary.currency || ""}`.trim();
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}

function renderDashboard() {
  const openVacancies = state.vacancies.filter((item) => item.status === "Открыта").length;
  const interviews = state.candidates.filter((item) => item.interviewAt).length;
  $("#metrics").innerHTML = [
    ["Открытые вакансии", openVacancies],
    ["Кандидаты в базе", state.candidates.length],
    ["Запланированные интервью", interviews],
    ["Средняя оценка", averageRating()],
  ].map(metricCard).join("");
  $("#activeVacancies").innerHTML = state.vacancies
    .filter((item) => item.status === "Открыта")
    .map((item) => `<article class="list-item"><strong>${item.title}</strong><p class="muted">${item.department} · ${item.salary}</p></article>`)
    .join("") || empty("Нет открытых вакансий");
  $("#upcomingInterviews").innerHTML = state.candidates
    .filter((item) => item.interviewAt)
    .sort((a, b) => a.interviewAt.localeCompare(b.interviewAt))
    .map((item) => `<article class="list-item"><strong>${item.name}</strong><p class="muted">${formatDateTime(item.interviewAt)} · ${item.vacancyTitle}</p></article>`)
    .join("") || empty("Интервью не запланированы");
}

function renderVacancies() {
  const query = $("#vacancySearch")?.value.toLowerCase() || "";
  const status = $("#vacancyStatusFilter")?.value || "";
  const items = state.vacancies.filter((item) => {
    const haystack = `${item.title} ${item.department} ${item.position}`.toLowerCase();
    return haystack.includes(query) && (!status || item.status === status);
  });
  $("#vacanciesList").innerHTML = items.length ? vacancyTable(items) : empty("Вакансии не найдены");
  $$(".edit-vacancy").forEach((button) => button.addEventListener("click", () => vacancyForm(button.dataset.id)));
}

function vacancyTable(items) {
  return `<div class="data-table-wrap"><table class="data-table">
    <thead>
      <tr>
        <th>Вакансия</th>
        <th>Отдел</th>
        <th>Статус</th>
        <th>Тип</th>
        <th>Зарплата</th>
        <th>Публикация</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${items.map(vacancyRow).join("")}</tbody>
  </table></div>`;
}

function vacancyRow(item) {
  const badgeClass = statusBadgeClass(item.status);
  return `<tr>
    <td>
      <strong>${item.title}</strong>
      <span class="muted table-subtext">${item.position}</span>
    </td>
    <td>${item.department}</td>
    <td><span class="badge ${badgeClass}">${item.status}</span></td>
    <td>${item.employment}</td>
    <td>${item.salary}</td>
    <td><span class="muted">${item.publishedAt || "—"} · ${item.closedAt || "—"}</span></td>
    <td class="table-actions">
      <button class="ghost edit-vacancy" data-id="${item.id}" ${can("Редактирование") ? "" : "disabled"}>Редактировать</button>
    </td>
  </tr>`;
}

function renderCandidates() {
  const query = $("#candidateSearch")?.value.toLowerCase() || "";
  const stage = $("#candidateStageFilter")?.value || "";
  const items = state.candidates.filter((item) => {
    const haystack = `${item.name} ${item.contacts} ${item.skills} ${item.tags}`.toLowerCase();
    return haystack.includes(query) && (!stage || item.stage === stage);
  });
  $("#candidatesList").innerHTML = items.length ? candidateTable(items) : empty("Кандидаты не найдены");
  $$(".edit-candidate").forEach((button) => button.addEventListener("click", () => candidateForm(button.dataset.id)));
  $$(".delete-candidate").forEach((button) => button.addEventListener("click", () => deleteCandidate(button.dataset.id)));
}

function candidateTable(items) {
  return `<div class="data-table-wrap"><table class="data-table">
    <thead>
      <tr>
        <th>Кандидат</th>
        <th>Вакансия</th>
        <th>Этап</th>
        <th>Источник</th>
        <th>Навыки</th>
        <th>Дата</th>
        <th></th>
      </tr>
    </thead>
    <tbody>${items.map(candidateRow).join("")}</tbody>
  </table></div>`;
}

function candidateRow(item) {
  return `<tr>
    <td>
      <strong>${item.name}</strong>
      <span class="muted table-subtext">${item.contacts}</span>
    </td>
    <td>${item.vacancyTitle}</td>
    <td><span class="badge open">${item.stage}</span></td>
    <td>${item.source}</td>
    <td><span class="muted">${item.skills || "—"}</span></td>
    <td><span class="muted">${item.appliedAt || "—"}</span></td>
    <td class="table-actions">
      <button class="ghost edit-candidate" data-id="${item.id}" ${can("Кандидаты") ? "" : "disabled"}>Профиль</button>
      <button class="danger delete-candidate" data-id="${item.id}" ${can("Кандидаты") ? "" : "disabled"}>Удалить</button>
    </td>
  </tr>`;
}

function statusBadgeClass(status) {
  return status === "Открыта" ? "open" : status === "Приостановлена" ? "pause" : "closed";
}

async function deleteCandidate(id) {
  const candidate = state.candidates.find((item) => item.id === id);
  if (!candidate) return;

  const confirmed = confirm(`Удалить кандидата "${candidate.name}"? Его отклики, резюме и импортированные вложения тоже будут удалены.`);
  if (!confirmed) return;

  try {
    if (state.apiConnected) {
      await apiFetch(`/candidates/${id}`, { method: "DELETE" });
      await refreshFromApi();
      return;
    }

    state.candidates = state.candidates.filter((item) => item.id !== id);
    saveState();
    render();
  } catch (error) {
    alert(`Не удалось удалить кандидата: ${error.message}`);
  }
}

function renderPipeline() {
  $("#pipelineBoard").innerHTML = getStageOptions().map((stage) => {
    const candidates = state.candidates.filter((item) => item.stage === stage.name);
    return `<section class="stage"><h3>${stage.name} · ${candidates.length}</h3>${candidates.map(pipelineCard).join("")}</section>`;
  }).join("");
  $$(".stage-select").forEach((select) => select.addEventListener("change", async (event) => {
    const candidate = state.candidates.find((item) => item.id === event.target.dataset.id);
    const selected = getStageOptions().find((stage) => stage.name === event.target.value);
    if (state.apiConnected && candidate.applicationId && selected?.code) {
      await apiFetch(`/applications/${candidate.applicationId}/move`, {
        method: "POST",
        body: JSON.stringify({
          stageCode: selected.code,
          comment: "Перемещено из интерфейса KMF PeopleFlow",
        }),
      });
      await refreshFromApi();
      return;
    }

    candidate.stage = selected?.name || event.target.value;
    candidate.stageCode = selected?.code || candidate.stageCode;
    candidate.history += `; ${new Date().toLocaleDateString("ru-RU")} этап: ${candidate.stage}`;
    saveState();
    render();
  }));
}

function pipelineCard(item) {
  return `<article class="candidate-mini">
    <strong>${item.name}</strong>
    <p class="muted">${item.vacancyTitle}</p>
    <select class="stage-select" data-id="${item.id}" ${can("Редактирование") ? "" : "disabled"}>
      ${getStageOptions().map((stage) => `<option ${stage.name === item.stage ? "selected" : ""}>${stage.name}</option>`).join("")}
    </select>
  </article>`;
}

function renderMessages() {
  $("#messageTemplates").innerHTML = state.templates.map((item) => `<article class="card">
    <span class="badge open">${item.stage}</span>
    <h3>${item.title}</h3>
    <p><strong>${item.subject}</strong></p>
    <p class="muted">${item.body}</p>
  </article>`).join("");
}

function renderReports() {
  const closed = state.vacancies.filter((item) => ["Закрыта", "Заполнена"].includes(item.status)).length;
  $("#reportMetrics").innerHTML = [
    ["Отклики", state.candidates.length],
    ["Закрытые вакансии", closed],
    ["Конверсия до финала", `${Math.round(stageCount("Финал") / Math.max(state.candidates.length, 1) * 100)}%`],
    ["Источники", new Set(state.candidates.map((item) => item.source)).size],
  ].map(metricCard).join("");
  renderChart("#stageChart", getStageOptions().map((stage) => [stage.name, stageCount(stage.name)]));
  const sources = groupBy(state.candidates, "source");
  renderChart("#sourceChart", Object.entries(sources).map(([key, value]) => [key, value.length]));
}

function renderRoles() {
  $("#rolesMatrix").innerHTML = `<table>
    <thead><tr><th>Роль</th>${permissions.map((permission) => `<th>${permission}</th>`).join("")}</tr></thead>
    <tbody>${roles.map((role) => `<tr><th>${role}</th>${permissions.map((permission) => {
      const checked = state.rolePermissions[role]?.includes(permission) ? "checked" : "";
      return `<td><input type="checkbox" data-role="${role}" data-permission="${permission}" ${checked}></td>`;
    }).join("")}</tr>`).join("")}</tbody>
  </table>`;
}

function vacancyForm(id) {
  const item = state.vacancies.find((vacancy) => vacancy.id === id) || {};
  openModal(id ? "Редактировать вакансию" : "Новая вакансия", [
    field("title", "Название", item.title, true),
    field("department", "Отдел", item.department, true),
    field("position", "Должность", item.position, true),
    field("employment", "Тип занятости", item.employment || "Полная занятость", true),
    field("salary", "Зарплатные ожидания", item.salary, true),
    selectField("status", "Статус", vacancyStatuses, item.status || "Открыта"),
    field("publishedAt", "Дата публикации", item.publishedAt || today(), true, "date"),
    field("closedAt", "Дата закрытия", item.closedAt || today(), true, "date"),
    field("channels", "Публикация", item.channels || "Сайт компании", true),
    field("attachments", "Вложения", item.attachments),
    field("access", "Права доступа", item.access || roles.join(", "), true, "text", true),
    field("description", "Описание", item.description, true, "textarea", true),
    field("requirements", "Требования", item.requirements, true, "textarea", true),
    field("conditions", "Условия работы", item.conditions, true, "textarea", true),
  ], async (data) => {
    if (state.apiConnected) {
      const payload = toVacancyPayload(data);
      if (id) {
        await apiFetch(`/vacancies/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/vacancies", { method: "POST", body: JSON.stringify(payload) });
      }
      await refreshFromApi();
      return;
    }

    if (id) Object.assign(item, data);
    else state.vacancies.unshift({ id: crypto.randomUUID(), ...data });
    saveState();
    render();
  });
}

function candidateForm(id) {
  const item = state.candidates.find((candidate) => candidate.id === id) || {};
  openModal(id ? "Профиль кандидата" : "Новый кандидат", [
    field("name", "ФИО", item.name, true),
    field("contacts", "Контакты", item.contacts, true),
    selectField("vacancyTitle", "Вакансия", state.vacancies.map((vacancy) => vacancy.title), item.vacancyTitle),
    field("source", "Источник", item.source || "Ручной ввод", true),
    field("experience", "Опыт", item.experience),
    field("education", "Образование", item.education),
    field("skills", "Навыки", item.skills, true),
    selectField("stage", "Этап", stages, item.stage || "Резюме"),
    field("appliedAt", "Дата отклика", item.appliedAt || today(), true, "date"),
    field("rating", "Оценка рекрутера", item.rating || "3", true, "number"),
    field("interviewAt", "Дата интервью", item.interviewAt, false, "datetime-local"),
    field("tags", "Теги", item.tags),
    field("notes", "Заметки", item.notes, false, "textarea", true),
    field("history", "История коммуникаций", item.history, false, "textarea", true),
  ], async (data) => {
    if (state.apiConnected) {
      const payload = toCandidatePayload(data);
      if (id) {
        await apiFetch(`/candidates/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        const candidate = await apiFetch("/candidates", { method: "POST", body: JSON.stringify(payload) });
        await createApplicationForCandidate(candidate.id, data);
      }
      await refreshFromApi();
      return;
    }

    if (id) Object.assign(item, data);
    else state.candidates.unshift({ id: crypto.randomUUID(), ...data });
    saveState();
    render();
  });
}

function interviewForm() {
  openModal("Запланировать интервью", [
    selectField("candidateId", "Кандидат", state.candidates.map((item) => `${item.id}|${item.name}`)),
    field("interviewAt", "Дата и время", "", true, "datetime-local"),
    field("comment", "Комментарий", "", false, "textarea", true),
  ], (data) => {
    const [id] = data.candidateId.split("|");
    const candidate = state.candidates.find((item) => item.id === id);
    candidate.interviewAt = data.interviewAt;
    candidate.history += `; интервью ${formatDateTime(data.interviewAt)} ${data.comment}`;
    saveState();
    render();
  });
}

function messageForm() {
  openModal("Подготовить письмо", [
    selectField("candidateId", "Кандидат", state.candidates.map((item) => `${item.id}|${item.name}`)),
    selectField("templateId", "Шаблон", state.templates.map((item) => `${item.id}|${item.title}`)),
    field("extra", "Ручная доработка", "", false, "textarea", true),
  ], (data) => {
    const candidate = state.candidates.find((item) => item.id === data.candidateId.split("|")[0]);
    const template = state.templates.find((item) => item.id === data.templateId.split("|")[0]);
    const body = template.body.replaceAll("{{name}}", candidate.name).replaceAll("{{vacancy}}", candidate.vacancyTitle);
    candidate.history += `; письмо: ${template.title}`;
    saveState();
    render();
    alert(`${template.subject.replaceAll("{{vacancy}}", candidate.vacancyTitle)}\n\n${body}\n\n${data.extra}`);
  });
}

function openModal(title, fields, onSubmit) {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = fields.join("");
  $("#modalForm").onsubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await onSubmit(data);
      $("#modal").close();
    } catch (error) {
      alert(`Не удалось сохранить: ${error.message}`);
    }
  };
  $("#modal").showModal();
}

function field(name, label, value = "", required = false, type = "text", full = false) {
  const control = type === "textarea"
    ? `<textarea name="${name}" ${required ? "required" : ""}>${value || ""}</textarea>`
    : `<input name="${name}" type="${type}" value="${value || ""}" ${required ? "required" : ""}>`;
  return `<label class="form-field ${full ? "full" : ""}"><span>${label}</span>${control}</label>`;
}

function selectField(name, label, options, value = "") {
  return `<label class="form-field"><span>${label}</span><select name="${name}">
    ${options.map((option) => {
      const clean = option.includes("|") ? option.split("|")[1] : option;
      return `<option value="${option}" ${option === value || clean === value ? "selected" : ""}>${clean}</option>`;
    }).join("")}
  </select></label>`;
}

function getStageOptions() {
  return state.stageOptions?.length
    ? state.stageOptions
    : stages.map((stage) => ({ code: stageToCode(stage), name: stage }));
}

function toVacancyPayload(data) {
  const status = state.reference?.vacancyStatuses?.find((item) => item.name === data.status);
  const employment = state.reference?.employmentTypes?.find((item) => item.name === data.employment);
  return {
    title: data.title,
    position: data.position,
    description: data.description,
    requirements: data.requirements,
    workingConditions: data.conditions,
    statusCode: status?.code || statusNameToCode(data.status),
    employmentTypeCode: employment?.code || "full_time",
    salaryCurrency: "KZT",
    publishedAt: data.publishedAt || null,
    closedAt: data.closedAt || null,
  };
}

function toCandidatePayload(data) {
  const source = state.reference?.sources?.find((item) => item.name === data.source);
  return {
    fullName: data.name,
    email: extractEmail(data.contacts),
    phone: extractPhone(data.contacts),
    education: data.education || null,
    skills: data.skills,
    sourceCode: source?.code || "manual",
    consentPersonalData: true,
  };
}

async function createApplicationForCandidate(candidateId, data) {
  const vacancy = state.vacancies.find((item) => item.title === data.vacancyTitle);
  if (!vacancy) return;

  const stage = getStageOptions().find((item) => item.name === data.stage);
  await apiFetch("/applications", {
    method: "POST",
    body: JSON.stringify({
      vacancyId: vacancy.id,
      candidateId,
      sourceCode: "manual",
      stageCode: stage?.code || "resume_review",
      rating: Number(data.rating || 3),
      summary: data.notes || null,
      appliedAt: data.appliedAt || null,
    }),
  });
}

function extractEmail(value = "") {
  return value.match(/[^\s,;]+@[^\s,;]+/)?.[0] || null;
}

function extractPhone(value = "") {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .find((item) => item && !item.includes("@")) || null;
}

function statusNameToCode(name) {
  return {
    "Открыта": "open",
    "Приостановлена": "paused",
    "Закрыта": "closed",
    "Заполнена": "filled",
  }[name] || "open";
}

function stageToCode(name) {
  return {
    "Резюме": "resume_review",
    "Рассмотрение резюме": "resume_review",
    "Телефонное интервью": "phone_screen",
    "Собеседование": "onsite_interview",
    "Личное собеседование": "onsite_interview",
    "Тестовое задание": "test_task",
    "Проверка рекомендаций": "reference_check",
    "Финал": "final_interview",
    "Финальное интервью": "final_interview",
  }[name] || "resume_review";
}

function saveRoles() {
  const next = {};
  roles.forEach((role) => next[role] = []);
  $$("#rolesMatrix input:checked").forEach((box) => next[box.dataset.role].push(box.dataset.permission));
  state.rolePermissions = next;
  saveState();
  render();
}

async function importResume(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (state.apiConnected) {
    try {
      const form = new FormData();
      form.append("resume", file);
      if (state.vacancies[0]?.id) form.append("vacancyId", state.vacancies[0].id);
      await apiFetch("/imports/resumes", { method: "POST", body: form });
      event.target.value = "";
      await refreshFromApi();
      return;
    } catch (error) {
      alert(`Не удалось импортировать резюме: ${error.message}`);
    }
  }

  const name = file.name.replace(/\.[^.]+$/, "").replaceAll("_", " ");
  state.candidates.unshift({
    id: crypto.randomUUID(),
    name,
    contacts: "уточнить",
    vacancyTitle: state.vacancies[0]?.title || "",
    source: "Импорт файла",
    experience: "уточнить",
    education: "уточнить",
    skills: "распознать и дополнить",
    stage: "Резюме",
    appliedAt: today(),
    tags: "импорт",
    notes: `Файл резюме: ${file.name}. Для промышленной версии подключается OCR/парсер PDF/DOCX.`,
    rating: "3",
    history: `${new Date().toLocaleDateString("ru-RU")} импорт резюме`,
    interviewAt: "",
  });
  saveState();
  event.target.value = "";
  render();
}

function exportExcel() {
  const rows = [
    ["Метрика", "Значение"],
    ["Кандидаты", state.candidates.length],
    ["Вакансии", state.vacancies.length],
    ["Открытые вакансии", state.vacancies.filter((item) => item.status === "Открыта").length],
    ["Средняя оценка", averageRating()],
    [],
    ["Кандидат", "Вакансия", "Этап", "Источник", "Дата отклика"],
    ...state.candidates.map((item) => [item.name, item.vacancyTitle, item.stage, item.source, item.appliedAt]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "kmf-peopleflow-report.csv";
  link.click();
}

function metricCard([label, value]) {
  return `<article class="metric"><span class="muted">${label}</span><strong>${value}</strong></article>`;
}

function renderChart(selector, rows) {
  const max = Math.max(...rows.map(([, value]) => value), 1);
  $(selector).innerHTML = rows.map(([label, value]) => `<div class="bar-row">
    <span class="muted">${label}</span>
    <div class="bar"><span style="width:${Math.max(value / max * 100, value ? 8 : 0)}%"></span></div>
    <strong>${value}</strong>
  </div>`).join("");
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = acc[item[key]] || [];
    acc[item[key]].push(item);
    return acc;
  }, {});
}

function stageCount(stage) {
  return state.candidates.filter((item) => item.stage === stage).length;
}

function averageRating() {
  const sum = state.candidates.reduce((total, item) => total + Number(item.rating || 0), 0);
  return state.candidates.length ? (sum / state.candidates.length).toFixed(1) : "0";
}

function splitValues(value = "") {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }) : "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function empty(text) {
  return `<p class="muted">${text}</p>`;
}

init();
