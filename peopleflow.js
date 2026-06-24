const stages = ["Резюме", "Телефонное интервью", "Собеседование", "Тестовое задание", "Проверка рекомендаций", "Финал"];
const vacancyStatuses = ["Открыта", "Приостановлена", "Закрыта", "Заполнена"];
const roles = ["Администратор", "Рекрутер", "Заказчик", "Служба безопасности", "HR филиала"];
const permissions = ["Просмотр", "Редактирование", "Создание", "Кандидаты", "Согласование", "Аналитика"];
const API_BASE = "http://localhost:3000/api";
const candidateDocumentRequirements = [
  { type: "resume", name: "Резюме" },
  { type: "candidate_questionnaire", name: "Анкета кандидата" },
  { type: "security_questionnaire", name: "Анкета СБ" },
  { type: "credit_bureau_report", name: "Полный отчет кредитного бюро" },
];

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
    "Администратор": ["Просмотр", "Редактирование", "Создание", "Кандидаты", "Согласование", "Аналитика"],
    "Рекрутер": ["Просмотр", "Редактирование", "Создание", "Кандидаты", "Согласование"],
    "Заказчик": ["Просмотр", "Кандидаты", "Согласование", "Аналитика"],
    "Служба безопасности": ["Просмотр", "Согласование"],
    "HR филиала": ["Просмотр", "Создание", "Кандидаты"],
  },
};

let state = loadState();
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function loadState() {
  const saved = localStorage.getItem("peopleflow-state");
  if (!saved) return structuredClone(demo);
  const parsed = JSON.parse(saved);
  return {
    ...structuredClone(demo),
    ...parsed,
    role: parsed.role === "Менеджер по найму" ? "Заказчик" : parsed.role,
    rolePermissions: mergeRolePermissions(parsed.rolePermissions || {}),
  };
}

function mergeRolePermissions(savedPermissions) {
  return roles.reduce((result, role) => {
    const defaults = demo.rolePermissions[role] || [];
    const saved = savedPermissions[role] || [];
    result[role] = [...new Set([...defaults, ...saved])];
    return result;
  }, {});
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
  $("#candidateApprovalFilter").addEventListener("change", renderCandidates);
  $("#approvalTypeFilter").addEventListener("change", renderApprovals);
  $("#approvalStatusFilter").addEventListener("change", renderApprovals);
  $("#refreshApprovals").addEventListener("click", refreshFromApi);
  $("#resumeImport").addEventListener("change", importResume);
  $("#addInterview").addEventListener("click", () => interviewForm());
  $("#sendMessage").addEventListener("click", () => messageForm());
  $("#exportExcel").addEventListener("click", exportExcel);
  $("#exportPdf").addEventListener("click", () => window.print());
  $("#saveRoles").addEventListener("click", saveRoles);
  $$(".modal-cancel").forEach((button) => button.addEventListener("click", () => $("#modal").close("cancel")));
  syncResumeVacancyOptions();
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
  renderApprovals();
  renderMessages();
  renderReports();
  renderRoles();
}

async function refreshFromApi() {
  try {
    const [reference, vacancies, candidates, applications, approvals, interviews] = await Promise.all([
      apiFetch("/reference"),
      apiFetch("/vacancies"),
      apiFetch("/candidates"),
      apiFetch("/applications"),
      apiFetch("/approvals"),
      apiFetch("/interviews"),
    ]);

    state.reference = reference;
    state.apiConnected = true;
    state.stageOptions = reference.pipelineStages.map((stage) => ({
      code: stage.code,
      name: stage.name,
    }));
    state.vacancies = vacancies.map(mapApiVacancy);
    state.candidates = candidates.map((candidate) => mapApiCandidate(candidate, applications, interviews));
    state.applications = applications;
    state.approvals = approvals;
    state.interviews = interviews;
    saveState();
    syncReferenceFilters();
    syncResumeVacancyOptions();
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

function syncResumeVacancyOptions() {
  const select = $("#resumeVacancy");
  if (!select) return;
  const selected = select.value;
  select.innerHTML = `<option value="">Импорт без вакансии</option>` +
    state.vacancies.map((vacancy) => `<option value="${vacancy.id}">${vacancy.title}</option>`).join("");
  if (state.vacancies.some((vacancy) => vacancy.id === selected)) select.value = selected;
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

function mapApiCandidate(item, applications = [], interviews = []) {
  const candidateApplications = applications.filter((entry) => entry.candidate.id === item.id);
  const candidateInterviews = interviews.filter((entry) => entry.candidate.id === item.id);
  const application = candidateApplications[0];
  const vacancyTitles = candidateApplications.map((entry) => entry.vacancy.title);
  const stageNames = [...new Set(candidateApplications.map((entry) => entry.stage?.name).filter(Boolean))];
  return {
    id: item.id,
    applicationId: application?.id || "",
    applications: candidateApplications,
    interviews: candidateInterviews,
    vacancyIds: candidateApplications.map((entry) => entry.vacancy.id),
    name: item.fullName,
    contacts: [item.email, item.phone].filter(Boolean).join(", ") || "Контакты не указаны",
    vacancyTitle: vacancyTitles.join(", ") || "Без активной вакансии",
    source: item.source?.name || application?.source?.name || "Не указан",
    city: item.city || "",
    currentPosition: item.currentPosition || "",
    totalExperienceMonths: item.totalExperienceMonths,
    documentTypes: item.documentTypes || [],
    experience: item.totalExperienceMonths ? `${Math.round(item.totalExperienceMonths / 12)} г.` : "не указано",
    education: item.education || "",
    skills: item.skills || "",
    stage: stageNames.join(", ") || "Рассмотрение резюме",
    stages: stageNames,
    stageCode: application?.stage?.code || "resume_review",
    appliedAt: dateOnly(application?.appliedAt || item.createdAt),
    tags: item.city || "",
    notes: application?.summary || "",
    rating: application?.rating || "3",
    history: application ? `Отклик: ${application.status.name}` : "Профиль кандидата",
    interviewAt: candidateInterviews.find((entry) => entry.status === "planned")?.startsAt || "",
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
  const interviews = (state.interviews || []).filter((item) => item.status === "planned");
  const pendingApprovals = (state.approvals || []).filter((item) => item.status === "pending");
  $("#metrics").innerHTML = [
    ["Открытые вакансии", openVacancies],
    ["Кандидаты в базе", state.candidates.length],
    ["Запланированные интервью", interviews.length],
    ["На согласовании", pendingApprovals.length],
  ].map(metricCard).join("");
  $("#activeVacancies").innerHTML = state.vacancies
    .filter((item) => item.status === "Открыта")
    .map((item) => `<article class="list-item"><strong>${item.title}</strong><p class="muted">${item.department} · ${item.salary}</p></article>`)
    .join("") || empty("Нет открытых вакансий");
  $("#upcomingInterviews").innerHTML = interviews
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((item) => `<article class="list-item"><strong>${item.candidate.name}</strong><p class="muted">${formatDateTime(item.startsAt)} · ${item.vacancy.title}</p></article>`)
    .join("") || empty("Интервью не запланированы");
  $("#pendingApprovals").innerHTML = pendingApprovals
    .map((item) => `<article class="list-item approval-dashboard-item">
      <div>
        <strong>${item.candidate.name}</strong>
        <p class="muted">${item.vacancy.title} · ${approvalStatusLabel(item)}</p>
      </div>
      <span class="badge pause">${item.type === "customer" ? "Заказчик" : "СБ"}</span>
    </article>`)
    .join("") || empty("Нет кандидатов, ожидающих согласования");
}

function renderVacancies() {
  const query = $("#vacancySearch")?.value.toLowerCase() || "";
  const status = $("#vacancyStatusFilter")?.value || "";
  const items = state.vacancies.filter((item) => {
    const haystack = `${item.title} ${item.department} ${item.position}`.toLowerCase();
    return haystack.includes(query) && (!status || item.status === status);
  });
  $("#vacanciesList").innerHTML = items.length ? vacancyList(items) : empty("Вакансии не найдены");
  $$(".edit-vacancy").forEach((button) => button.addEventListener("click", () => vacancyForm(button.dataset.id)));
}

function vacancyList(items) {
  return `<div class="record-list">${items.map(vacancyRow).join("")}</div>`;
}

function vacancyRow(item) {
  const badgeClass = statusBadgeClass(item.status);
  return `<article class="record-row">
    <div class="record-main">
      <div class="record-title">
        <strong>${item.title}</strong>
        <span class="badge ${badgeClass}">${item.status}</span>
      </div>
      <div class="record-details">
        <span>${item.position}</span>
        <span>${item.department}</span>
        <span>${item.employment}</span>
        <span>${item.salary}</span>
        <span>${item.publishedAt || "—"} · ${item.closedAt || "—"}</span>
      </div>
    </div>
    <div class="record-actions">
      <button class="ghost edit-vacancy" data-id="${item.id}" ${can("Редактирование") ? "" : "disabled"}>Редактировать</button>
    </div>
  </article>`;
}

function renderCandidates() {
  const query = $("#candidateSearch")?.value.toLowerCase() || "";
  const stage = $("#candidateStageFilter")?.value || "";
  const approval = $("#candidateApprovalFilter")?.value || "";
  const items = state.candidates.filter((item) => {
    const haystack = `${item.name} ${item.contacts} ${item.skills} ${item.tags}`.toLowerCase();
    const matchesStage = !stage || item.stages?.includes(stage) || item.stage === stage;
    return haystack.includes(query) && matchesStage && matchesCandidateApproval(item, approval);
  });
  $("#candidatesList").innerHTML = items.length ? candidateList(items) : empty("Кандидаты не найдены");
  $$(".edit-candidate").forEach((button) => button.addEventListener("click", () => candidateForm(button.dataset.id)));
  $$(".delete-candidate").forEach((button) => button.addEventListener("click", () => deleteCandidate(button.dataset.id)));
  $$(".request-approval").forEach((button) => button.addEventListener("click", () => requestApproval(button.dataset.id, button.dataset.type)));
  $$(".assign-and-request").forEach((button) => button.addEventListener("click", () => assignCandidateAndRequest(button.dataset.id)));
}

function matchesCandidateApproval(candidate, filter) {
  if (!filter) return true;
  const approvals = (candidate.applications || [])
    .map((application) => getLatestApproval(application.id))
    .filter(Boolean);
  if (filter === "none") return approvals.length === 0;
  if (filter === "pending_customer") {
    return approvals.some((approval) => approval.status === "pending" && approval.type === "customer");
  }
  if (filter === "pending_security") {
    return approvals.some((approval) => approval.status === "pending" && approval.type === "security");
  }
  return approvals.some((approval) => approval.status === filter);
}

function candidateList(items) {
  return `<div class="record-list">${items.map(candidateRow).join("")}</div>`;
}

function candidateRow(item) {
  const stageLabel = item.applications?.length > 1
    ? formatVacancyCount(item.applications.length)
    : item.stage;
  const workflowActions = item.applications?.length
    ? `<div class="application-workflows">${item.applications.map(applicationWorkflowRow).join("")}</div>`
    : canRequestApproval()
      ? `<div class="application-workflows">
          <div class="record-workflow-actions">
            <span class="badge neutral">Без вакансии</span>
            <button class="workflow-button assign-and-request" data-id="${item.id}" ${state.vacancies.length && item.documentTypes?.includes("resume") ? "" : "disabled"}>${item.documentTypes?.includes("resume") ? "Выбрать вакансию и отправить" : "Сначала загрузите резюме"}</button>
          </div>
        </div>`
      : "";
  return `<article class="record-row">
    <div class="record-main">
      <div class="record-title">
        <strong>${item.name}</strong>
        <span class="badge open">${stageLabel}</span>
      </div>
      <div class="record-details">
        <span>${item.contacts}</span>
        <span>${item.vacancyTitle}</span>
        <span>${item.currentPosition || "Должность не указана"}</span>
        <span>${item.source}</span>
        <span>${item.skills || "—"}</span>
        <span>${item.appliedAt || "—"}</span>
      </div>
      ${workflowActions}
    </div>
    <div class="record-actions">
      <button class="ghost edit-candidate" data-id="${item.id}" ${can("Кандидаты") ? "" : "disabled"}>Профиль</button>
      <button class="danger delete-candidate" data-id="${item.id}" ${can("Кандидаты") ? "" : "disabled"}>Удалить</button>
    </div>
  </article>`;
}

function applicationWorkflowRow(application) {
  const status = getApplicationApprovalStatus(application.id);
  const customer = getLatestApproval(application.id, "customer");
  const security = getLatestApproval(application.id, "security");
  const candidate = state.candidates.find((item) => item.id === application.candidate.id);
  const documents = new Set(candidate?.documentTypes || []);
  const hasResume = documents.has("resume");
  const hasSecurityPackage = candidateDocumentRequirements.every((item) => documents.has(item.type));
  const canSendCustomer = canRequestApproval() && (!customer || customer.status === "rejected");
  const canSendSecurity = canRequestApproval() && customer?.status === "approved" && (!security || security.status === "rejected");
  return `<div class="record-workflow-actions">
    <span class="workflow-vacancy">${application.vacancy.title}</span>
    <span class="badge ${status.className}">${status.label}</span>
    ${canSendCustomer ? `<button class="workflow-button request-approval" data-id="${application.id}" data-type="customer" ${hasResume ? "" : "disabled"}>${hasResume ? "Заказчику" : "Нужно резюме"}</button>` : ""}
    ${canSendSecurity ? `<button class="workflow-button request-approval" data-id="${application.id}" data-type="security" ${hasSecurityPackage ? "" : "disabled"}>${hasSecurityPackage ? "В СБ" : "Нужны документы СБ"}</button>` : ""}
  </div>`;
}

function getLatestApproval(applicationId, type) {
  return (state.approvals || [])
    .filter((item) => item.applicationId === applicationId && (!type || item.type === type))
    .sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt)))[0] || null;
}

function getApplicationApprovalStatus(applicationId) {
  const approval = getLatestApproval(applicationId);
  if (!approval) return { label: "Не отправлен", className: "neutral" };
  if (approval.status === "pending") {
    return {
      label: approval.type === "customer" ? "На согласовании у заказчика" : "На проверке в СБ",
      className: "pause",
    };
  }
  if (approval.status === "rejected") {
    return {
      label: approval.type === "customer" ? "Отклонен заказчиком" : "Отклонен СБ",
      className: "closed",
    };
  }
  return {
    label: approval.type === "customer" ? "Одобрен заказчиком" : "Проверка СБ пройдена",
    className: "open",
  };
}

function approvalStatusLabel(approval) {
  return approval.type === "customer" ? "решение заказчика" : "проверка СБ";
}

function statusBadgeClass(status) {
  return status === "Открыта" ? "open" : status === "Приостановлена" ? "pause" : "closed";
}

function formatVacancyCount(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  const word = lastTwo >= 11 && lastTwo <= 14
    ? "вакансий"
    : last === 1
      ? "вакансия"
      : last >= 2 && last <= 4
        ? "вакансии"
        : "вакансий";
  return `${count} ${word}`;
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
  const entries = getPipelineEntries();
  $("#pipelineBoard").innerHTML = getStageOptions().map((stage) => {
    const candidates = entries.filter((item) => item.stage === stage.name);
    return `<section class="stage"><h3>${stage.name} · ${candidates.length}</h3>${candidates.map(pipelineCard).join("")}</section>`;
  }).join("");
  $$(".stage-select").forEach((select) => select.addEventListener("change", async (event) => {
    const applicationId = event.target.dataset.applicationId;
    const candidateId = event.target.dataset.candidateId;
    const candidate = state.candidates.find((item) => item.id === candidateId);
    const selected = getStageOptions().find((stage) => stage.name === event.target.value);
    if (state.apiConnected && applicationId && selected?.code) {
      await apiFetch(`/applications/${applicationId}/move`, {
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
    <select class="stage-select" data-application-id="${item.applicationId || ""}" data-candidate-id="${item.candidateId || item.id}" ${can("Редактирование") ? "" : "disabled"}>
      ${getStageOptions().map((stage) => `<option ${stage.name === item.stage ? "selected" : ""}>${stage.name}</option>`).join("")}
    </select>
  </article>`;
}

function getPipelineEntries() {
  if (!state.apiConnected || !state.applications?.length) return state.candidates;
  return state.applications.map((application) => ({
    id: `${application.candidate.id}-${application.id}`,
    candidateId: application.candidate.id,
    applicationId: application.id,
    name: application.candidate.name,
    vacancyTitle: application.vacancy.title,
    stage: application.stage?.name || "Рассмотрение резюме",
    stageCode: application.stage?.code || "resume_review",
  }));
}

function renderApprovals() {
  const approvals = state.approvals || [];
  const roleType = state.role === "Заказчик"
    ? "customer"
    : state.role === "Служба безопасности"
      ? "security"
      : "";
  const type = $("#approvalTypeFilter")?.value || roleType;
  const status = $("#approvalStatusFilter")?.value || "";
  const filtered = approvals.filter((item) =>
    (!type || item.type === type) && (!status || item.status === status)
  );

  const pending = approvals.filter((item) => item.status === "pending");
  $("#approvalSummary").innerHTML = [
    ["Ожидают заказчика", pending.filter((item) => item.type === "customer").length],
    ["Ожидают СБ", pending.filter((item) => item.type === "security").length],
    ["Одобрено", approvals.filter((item) => item.status === "approved").length],
    ["Отклонено", approvals.filter((item) => item.status === "rejected").length],
  ].map(metricCard).join("");

  $("#approvalsList").innerHTML = filtered.length
    ? `<div class="record-list">${filtered.map(approvalRow).join("")}</div>`
    : empty("В этой очереди согласований пока нет");

  $$(".approval-decision").forEach((button) => button.addEventListener("click", () => decideApproval(button.dataset.id, button.dataset.decision)));
}

function approvalRow(item) {
  const canDecide = item.status === "pending" && canDecideApproval(item.type);
  const statusLabel = {
    pending: "Ожидает решения",
    approved: "Одобрено",
    rejected: "Отклонено",
  }[item.status] || item.status;
  const statusClass = item.status === "approved" ? "open" : item.status === "rejected" ? "closed" : "pause";
  return `<article class="record-row approval-row">
    <div class="record-main">
      <div class="record-title">
        <strong>${item.candidate.name}</strong>
        <span class="badge ${statusClass}">${statusLabel}</span>
        <span class="tag">${item.typeName}</span>
      </div>
      <div class="record-details">
        <span>${item.vacancy.title}</span>
        <span>${item.candidate.email || "Email не указан"}</span>
        <span>${item.currentStage?.name || "Этап не указан"}</span>
        <span>${formatDateTime(item.requestedAt)}</span>
        <span>${item.requestComment || item.decisionComment || "Без комментария"}</span>
      </div>
    </div>
    <div class="record-actions">
      ${canDecide ? `
        <button class="approve approval-decision" data-id="${item.id}" data-decision="approved">Одобрить</button>
        <button class="danger approval-decision" data-id="${item.id}" data-decision="rejected">Отклонить</button>
      ` : `<span class="muted">${item.decidedBy?.name || item.assignedTo?.name || "Назначено роли"}</span>`}
    </div>
  </article>`;
}

function canRequestApproval() {
  return ["Администратор", "Рекрутер"].includes(state.role) && can("Согласование");
}

function canDecideApproval(type) {
  if (state.role === "Администратор") return true;
  return (type === "customer" && state.role === "Заказчик") ||
    (type === "security" && state.role === "Служба безопасности");
}

async function requestApproval(applicationId, type) {
  if (!state.apiConnected) {
    alert("Для согласования должен быть запущен backend.");
    return;
  }
  const label = type === "customer" ? "заказчику" : "в службу безопасности";
  const comment = prompt(`Комментарий при отправке ${label}`, "Прошу согласовать кандидата");
  if (comment === null) return;
  try {
    await apiFetch(`/approvals/applications/${applicationId}`, {
      method: "POST",
      body: JSON.stringify({
        type,
        requestedBy: currentUserId(),
        comment,
      }),
    });
    await refreshFromApi();
    switchView("approvals");
  } catch (error) {
    alert(`Не удалось отправить на согласование: ${error.message}`);
  }
}

function assignCandidateAndRequest(candidateId) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate || !state.vacancies.length) {
    alert("Сначала создайте вакансию.");
    return;
  }
  openModal("Отправить кандидата заказчику", [
    selectField(
      "vacancyId",
      "Вакансия",
      state.vacancies.map((vacancy) => `${vacancy.id}|${vacancy.title}`),
    ),
    field("comment", "Комментарий заказчику", "Прошу согласовать кандидата", true, "textarea", true),
  ], async (data) => {
    const [vacancyId] = data.vacancyId.split("|");
    const source = state.reference?.sources?.find((item) => item.name === candidate.source);
    const application = await apiFetch("/applications", {
      method: "POST",
      body: JSON.stringify({
        vacancyId,
        candidateId,
        sourceCode: source?.code || "manual",
        stageCode: "resume_review",
        appliedAt: new Date().toISOString(),
      }),
    });
    await apiFetch(`/approvals/applications/${application.id}`, {
      method: "POST",
      body: JSON.stringify({
        type: "customer",
        requestedBy: currentUserId(),
        comment: data.comment,
      }),
    });
    await refreshFromApi();
    switchView("approvals");
  });
}

async function decideApproval(id, decision) {
  const label = decision === "approved" ? "Одобрить кандидата" : "Отклонить кандидата";
  const comment = prompt(label + ". Укажите комментарий:", "");
  if (comment === null) return;
  try {
    await apiFetch(`/approvals/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, decidedBy: currentUserId(), comment }),
    });
    await refreshFromApi();
  } catch (error) {
    alert(`Не удалось сохранить решение: ${error.message}`);
  }
}

function currentUserId() {
  return state.reference?.users?.[0]?.id || null;
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

async function candidateForm(id) {
  const item = state.candidates.find((candidate) => candidate.id === id) || {};
  if (id && state.apiConnected) {
    try {
      item.documents = await apiFetch(`/candidates/${id}/documents`);
    } catch {
      item.documents = [];
    }
  }
  const newApplicationStage = item.applications?.length === 1
    ? item.applications[0].stage?.name
    : "Рассмотрение резюме";
  const selectedVacancyIds = item.vacancyIds?.length
    ? item.vacancyIds
    : state.vacancies
      .filter((vacancy) => vacancy.title === item.vacancyTitle)
      .map((vacancy) => vacancy.id);
  openModal(id ? "Профиль кандидата" : "Новый кандидат", [
    field("name", "ФИО", item.name, true),
    field("contacts", "Контакты", item.contacts, true),
    candidateDocumentsField(id, item.documents || []),
    candidateProcessesField(item.applications || []),
    candidateInterviewsField(item.interviews || []),
    checkboxGroupField(
      "vacancyIds",
      "Вакансии кандидата",
      state.vacancies.map((vacancy) => ({ value: vacancy.id, label: vacancy.title })),
      selectedVacancyIds,
    ),
    field("source", "Источник", item.source || "Ручной ввод", true),
    field("currentPosition", "Текущая или желаемая должность", item.currentPosition),
    field("city", "Город", item.city),
    field("totalExperienceMonths", "Опыт, месяцев", item.totalExperienceMonths, false, "number"),
    field("education", "Образование", item.education),
    field("skills", "Навыки", item.skills, true),
    selectField("stage", "Начальный этап для новых вакансий", getStageOptions().map((stage) => stage.name), newApplicationStage),
    field("appliedAt", "Дата отклика", item.appliedAt || today(), true, "date"),
    field("rating", "Оценка рекрутера", item.rating || "3", true, "number"),
    field("tags", "Теги", item.tags),
    field("notes", "Заметки", item.notes, false, "textarea", true),
    field("history", "История коммуникаций", item.history, false, "textarea", true),
  ], async (data) => {
    if (state.apiConnected) {
      const payload = toCandidatePayload(data);
      if (id) {
        await apiFetch(`/candidates/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
        await syncCandidateApplications(id, data);
      } else {
        const candidate = await apiFetch("/candidates", { method: "POST", body: JSON.stringify(payload) });
        await syncCandidateApplications(candidate.id, data);
      }
      await refreshFromApi();
      return;
    }

    data.vacancyTitle = state.vacancies
      .filter((vacancy) => data.vacancyIds.includes(vacancy.id))
      .map((vacancy) => vacancy.title)
      .join(", ") || "Без активной вакансии";
    if (id) Object.assign(item, data);
    else state.candidates.unshift({ id: crypto.randomUUID(), ...data });
    saveState();
    render();
  });
  bindCandidateDocumentControls(id);
}

function interviewForm() {
  if (state.apiConnected && !state.applications?.length) {
    alert("Сначала привяжите кандидата к вакансии.");
    return;
  }
  const interviewOptions = state.apiConnected
    ? state.applications.map((item) => `${item.id}|${item.candidate.name} — ${item.vacancy.title}`)
    : state.candidates.map((item) => `${item.id}|${item.name} — ${item.vacancyTitle}`);
  openModal("Запланировать интервью", [
    selectField(
      "applicationId",
      "Кандидат и вакансия",
      interviewOptions,
    ),
    selectField("interviewTypeCode", "Тип интервью", [
      "phone|Телефонное интервью",
      "hr|HR интервью",
      "manager|Интервью с руководителем",
      "final|Финальное интервью",
    ], "manager|Интервью с руководителем"),
    field("startsAt", "Начало", "", true, "datetime-local"),
    field("endsAt", "Окончание", "", false, "datetime-local"),
    field("location", "Место или комментарий", "", false, "text", true),
    field("meetingUrl", "Ссылка на встречу", "", false, "url", true),
  ], async (data) => {
    if (state.apiConnected) {
      const [applicationId] = data.applicationId.split("|");
      const [interviewTypeCode] = data.interviewTypeCode.split("|");
      await apiFetch("/interviews", {
        method: "POST",
        body: JSON.stringify({
          applicationId,
          interviewTypeCode,
          startsAt: new Date(data.startsAt).toISOString(),
          endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
          location: data.location || null,
          meetingUrl: data.meetingUrl || null,
          createdBy: currentUserId(),
        }),
      });
      await refreshFromApi();
      return;
    }

    const [id] = data.applicationId.split("|");
    const candidate = state.candidates.find((item) => item.id === id);
    candidate.interviewAt = data.startsAt;
    candidate.history += `; интервью ${formatDateTime(data.startsAt)} ${data.location}`;
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
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.vacancyIds = formData.getAll("vacancyIds");
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

function checkboxGroupField(name, label, options, selectedValues = []) {
  const selected = new Set(selectedValues);
  const controls = options.length
    ? options.map((option) => `<label class="checkbox-option">
        <input type="checkbox" name="${name}" value="${option.value}" ${selected.has(option.value) ? "checked" : ""}>
        <span>${option.label}</span>
      </label>`).join("")
    : `<span class="muted">Сначала создайте вакансию</span>`;
  return `<fieldset class="form-field full checkbox-group">
    <legend>${label}</legend>
    <div class="checkbox-options">${controls}</div>
  </fieldset>`;
}

function candidateProcessesField(applications) {
  const rows = applications.length
    ? applications.map((application) => {
      const status = getApplicationApprovalStatus(application.id);
      return `<div class="candidate-process-row">
        <div>
          <strong>${application.vacancy.title}</strong>
          <span>${application.stage?.name || "Этап не указан"}</span>
        </div>
        <span class="badge ${status.className}">${status.label}</span>
      </div>`;
    }).join("")
    : `<span class="muted">Кандидат пока не привязан к вакансии</span>`;
  return `<section class="form-field full candidate-processes">
    <span class="field-title">Статусы по вакансиям</span>
    <div>${rows}</div>
  </section>`;
}

function candidateInterviewsField(interviews) {
  if (!interviews.length) return "";
  const rows = interviews.map((interview) => `<div class="candidate-process-row">
    <div>
      <strong>${formatDateTime(interview.startsAt)} · ${interview.type?.name || "Интервью"}</strong>
      <span>${interview.vacancy.title}${interview.location ? ` · ${interview.location}` : ""}</span>
    </div>
    <span class="badge ${interview.status === "planned" ? "pause" : "neutral"}">${interview.status === "planned" ? "Запланировано" : interview.status}</span>
  </div>`).join("");
  return `<section class="form-field full candidate-processes">
    <span class="field-title">Интервью</span>
    <div>${rows}</div>
  </section>`;
}

function candidateDocumentsField(candidateId, documents) {
  const checklist = candidateDocumentRequirements.map((requirement) => {
    const files = documents.filter((document) => document.type === requirement.type);
    const fileList = files.length
      ? files.map((document) => `<div class="candidate-document-file">
          <a href="${API_BASE}/candidates/${candidateId}/documents/${document.id}/download" target="_blank">${document.fileName}</a>
          <span>${formatFileSize(document.fileSize)} · ${formatDateTime(document.uploadedAt)}</span>
          <button type="button" class="icon-button delete-candidate-document" data-id="${document.id}" title="Удалить документ">×</button>
        </div>`).join("")
      : `<span class="muted">Файл не загружен</span>`;
    return `<div class="candidate-document-row">
      <div class="candidate-document-heading">
        <strong>${requirement.name}</strong>
        <span class="badge ${files.length ? "open" : "closed"}">${files.length ? "Загружено" : "Обязательно"}</span>
      </div>
      <div class="candidate-document-files">${fileList}</div>
    </div>`;
  }).join("");
  const upload = candidateId
    ? `<div class="candidate-document-upload">
        <select id="candidateDocumentType">
          ${candidateDocumentRequirements.map((item) => `<option value="${item.type}">${item.name}</option>`).join("")}
        </select>
        <input id="candidateDocumentFile" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
        <button type="button" class="ghost" id="uploadCandidateDocument">Загрузить</button>
      </div>`
    : `<p class="muted">Сначала сохраните профиль, затем загрузите документы.</p>`;
  return `<section class="form-field full candidate-documents">
    <div class="candidate-documents-title">
      <span class="field-title">Документы кандидата</span>
      <span class="muted">Резюме обязательно для заказчика; весь комплект — для СБ</span>
    </div>
    <div class="candidate-document-list">${checklist}</div>
    ${upload}
  </section>`;
}

function bindCandidateDocumentControls(candidateId) {
  if (!candidateId) return;
  $("#uploadCandidateDocument")?.addEventListener("click", async () => {
    const file = $("#candidateDocumentFile").files[0];
    if (!file) {
      alert("Выберите файл.");
      return;
    }
    const button = $("#uploadCandidateDocument");
    button.disabled = true;
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentType", $("#candidateDocumentType").value);
      if (currentUserId()) form.append("uploadedBy", currentUserId());
      await apiFetch(`/candidates/${candidateId}/documents`, { method: "POST", body: form });
      $("#modal").close();
      await refreshFromApi();
      await candidateForm(candidateId);
    } catch (error) {
      alert(`Не удалось загрузить документ: ${error.message}`);
      button.disabled = false;
    }
  });
  $$(".delete-candidate-document").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm("Удалить этот документ из профиля кандидата?")) return;
    try {
      await apiFetch(`/candidates/${candidateId}/documents/${button.dataset.id}`, { method: "DELETE" });
      $("#modal").close();
      await refreshFromApi();
      await candidateForm(candidateId);
    } catch (error) {
      alert(`Не удалось удалить документ: ${error.message}`);
    }
  }));
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!size) return "0 Б";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
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
    city: data.city || null,
    currentPosition: data.currentPosition || null,
    totalExperienceMonths: data.totalExperienceMonths ? Number(data.totalExperienceMonths) : null,
    sourceCode: source?.code || "manual",
    consentPersonalData: true,
  };
}

async function syncCandidateApplications(candidateId, data) {
  const vacancyIds = [...new Set(data.vacancyIds || [])];
  const existing = state.applications.filter((application) => application.candidate.id === candidateId);
  const selected = new Set(vacancyIds);
  const existingVacancies = new Set(existing.map((application) => application.vacancy.id));
  const removed = existing.filter((application) => !selected.has(application.vacancy.id));
  const applicationsWithApprovals = new Set((state.approvals || []).map((approval) => approval.applicationId));
  const protectedApplications = removed.filter((application) => applicationsWithApprovals.has(application.id));
  const stage = getStageOptions().find((item) => item.name === data.stage);

  if (protectedApplications.length) {
    const titles = protectedApplications.map((application) => application.vacancy.title).join(", ");
    throw new Error(`Нельзя снять вакансии с историей согласования: ${titles}`);
  }

  await Promise.all(removed
    .map((application) => apiFetch(`/applications/${application.id}`, { method: "DELETE" })));

  await Promise.all(vacancyIds
    .filter((vacancyId) => !existingVacancies.has(vacancyId))
    .map((vacancyId) => apiFetch("/applications", {
      method: "POST",
      body: JSON.stringify({
        vacancyId,
        candidateId,
        sourceCode: "manual",
        stageCode: stage?.code || "resume_review",
        rating: Number(data.rating || 3),
        summary: data.notes || null,
        appliedAt: data.appliedAt || null,
      }),
    })));
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
      const vacancyId = $("#resumeVacancy")?.value;
      if (vacancyId) form.append("vacancyId", vacancyId);
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
