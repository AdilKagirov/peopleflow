const API_BASE = "http://localhost:3000/api";
const approvalType = document.body.dataset.approvalType;
const labels = approvalType === "customer"
  ? { queue: "Заказчик", comment: "Комментарий заказчика" }
  : { queue: "Служба безопасности", comment: "Заключение СБ" };
const documentAccess = approvalType === "customer"
  ? new Set(["resume", "additional_files"])
  : null;

let approvals = [];
let activeStatus = "pending";
let activeDecision = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
  return response.json();
}

async function loadApprovals() {
  setConnection("loading", "Обновление...");
  try {
    approvals = await apiFetch(`/approvals?type=${approvalType}`);
    setConnection("online", "API подключен");
    render();
  } catch (error) {
    setConnection("offline", "API недоступен");
    $("#approvalList").innerHTML = `<div class="empty-state">Не удалось загрузить очередь: ${escapeHtml(error.message)}</div>`;
  }
}

function render() {
  renderSummary();
  const items = approvals.filter((item) => !activeStatus || item.status === activeStatus);
  $("#approvalList").innerHTML = items.length
    ? items.map(approvalItem).join("")
    : `<div class="empty-state">В этой очереди нет кандидатов</div>`;

  $$("[data-decision]").forEach((button) => {
    button.addEventListener("click", () => openDecision(button.dataset.id, button.dataset.decision));
  });
  $$(".open-documents").forEach((button) => {
    button.addEventListener("click", () => openDocuments(button.dataset.id));
  });
}

function renderSummary() {
  const rows = [
    ["Ожидают решения", approvals.filter((item) => item.status === "pending").length],
    ["Одобрено", approvals.filter((item) => item.status === "approved").length],
    ["Отклонено", approvals.filter((item) => item.status === "rejected").length],
  ];
  $("#summary").innerHTML = rows
    .map(([label, value]) => `<article class="summary-item"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function approvalItem(item) {
  const statusLabel = {
    pending: "Ожидает решения",
    approved: "Одобрено",
    rejected: "Отклонено",
  }[item.status] || item.status;
  const decisionDate = item.decidedAt ? formatDate(item.decidedAt) : "Решение еще не принято";
  const stageName = item.currentStage?.name || "Этап не указан";
  const actions = item.status === "pending"
    ? `<div class="approval-actions">
        <button class="secondary open-documents" data-id="${item.id}">Файлы</button>
        <button class="approve" data-id="${item.id}" data-decision="approved">Одобрить</button>
        <button class="reject" data-id="${item.id}" data-decision="rejected">Отклонить</button>
      </div>`
    : `<div class="approval-actions">
        <button class="secondary open-documents" data-id="${item.id}">Файлы</button>
        <span class="badge ${item.status}">${statusLabel}</span>
      </div>`;

  return `<article class="approval-item">
    <div>
      <div class="approval-title">
        <strong>${escapeHtml(item.candidate.name)}</strong>
        <span class="badge ${item.status}">${statusLabel}</span>
        <span class="stage-badge">${escapeHtml(stageName)}</span>
      </div>
      <div class="status-strip">
        <div>
          <span>Статус решения</span>
          <strong>${escapeHtml(statusLabel)}</strong>
        </div>
        <div>
          <span>Статус подбора</span>
          <strong>${escapeHtml(stageName)}</strong>
        </div>
        <div>
          <span>${item.status === "pending" ? "Запрошено" : "Дата решения"}</span>
          <strong>${escapeHtml(item.status === "pending" ? formatDate(item.requestedAt) : decisionDate)}</strong>
        </div>
      </div>
      <div class="approval-details">
        <span>${escapeHtml(item.vacancy.title)}</span>
        <span>${escapeHtml(item.candidate.email || "Email не указан")}</span>
        <span>${escapeHtml(item.recruiter?.name || "Рекрутер не указан")}</span>
        <span>${formatDate(item.requestedAt)}</span>
      </div>
      <p class="approval-comment">${escapeHtml(item.requestComment || item.decisionComment || "Комментарий не указан")}</p>
    </div>
    ${actions}
  </article>`;
}

async function openDocuments(id) {
  const approval = approvals.find((item) => item.id === id);
  if (!approval) return;
  if (!$("#documentsDialog")) {
    alert("Обновите страницу, чтобы открыть файлы кандидата.");
    return;
  }

  $("#documentsCandidate").textContent = approval.candidate.name;
  $("#documentsBody").innerHTML = `<div class="empty-state compact">Загрузка файлов...</div>`;
  $("#documentsDialog").showModal();

  try {
    const documents = await apiFetch(`/candidates/${approval.candidate.id}/documents`);
    const visibleDocuments = documentAccess
      ? documents.filter((document) => documentAccess.has(document.type))
      : documents;
    $("#documentsBody").innerHTML = renderDocuments(approval, visibleDocuments);
  } catch (error) {
    $("#documentsBody").innerHTML = `<div class="empty-state compact">Не удалось загрузить файлы: ${escapeHtml(error.message)}</div>`;
  }
}

function renderDocuments(approval, documents) {
  if (!documents.length) {
    return `<div class="empty-state compact">Для этой роли нет доступных файлов кандидата</div>`;
  }

  const groups = documents.reduce((result, document) => {
    const label = document.typeName || documentTypeLabel(document.type);
    result[label] = [...(result[label] || []), document];
    return result;
  }, {});

  return Object.entries(groups).map(([label, files]) => `<section class="document-group">
    <h3>${escapeHtml(label)}</h3>
    <div class="document-list">
      ${files.map((file) => `<a class="document-link" href="${API_BASE}/candidates/${approval.candidate.id}/documents/${file.id}/download" target="_blank">
        <span>${escapeHtml(file.fileName)}</span>
        <small>${formatFileSize(file.fileSize)} · ${formatDate(file.uploadedAt)}</small>
      </a>`).join("")}
    </div>
  </section>`).join("");
}

function documentTypeLabel(type) {
  return {
    resume: "Резюме",
    candidate_questionnaire: "Анкета кандидата",
    security_questionnaire: "Анкета СБ",
    credit_bureau_report: "Полный отчет кредитного бюро",
    additional_files: "Дополнительные файлы",
  }[type] || "Файл";
}

async function openDecision(id, decision) {
  try {
    const item = await apiFetch(`/approvals/${id}`);
    if (item.status !== "pending") {
      await loadApprovals();
      alert("По этому согласованию решение уже принято. Очередь обновлена.");
      return;
    }
    activeDecision = { id, decision };
    $("#decisionType").textContent = decision === "approved" ? "Одобрение" : "Отклонение";
    $("#decisionCandidate").textContent = item.candidate.name;
    $("#decisionComment").value = "";
    $("#confirmDecision").textContent = decision === "approved" ? "Одобрить кандидата" : "Отклонить кандидата";
    $("#decisionDialog").showModal();
    $("#decisionComment").focus();
  } catch (error) {
    await loadApprovals();
    alert("Согласование уже недоступно. Очередь обновлена; попросите рекрутера отправить кандидата повторно.");
  }
}

async function submitDecision(event) {
  event.preventDefault();
  if (!activeDecision) return;
  const comment = $("#decisionComment").value.trim();
  if (!comment) return;
  const button = $("#confirmDecision");
  button.disabled = true;
  try {
    await apiFetch(`/approvals/${activeDecision.id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision: activeDecision.decision, comment }),
    });
    $("#decisionDialog").close();
    activeDecision = null;
    await loadApprovals();
  } catch (error) {
    if (error.message.startsWith("404:")) {
      $("#decisionDialog").close();
      activeDecision = null;
      await loadApprovals();
      alert("Согласование уже недоступно. Очередь обновлена; попросите рекрутера отправить кандидата повторно.");
    } else {
      alert(`Не удалось сохранить решение: ${error.message}`);
    }
  } finally {
    button.disabled = false;
  }
}

function closeDecision() {
  activeDecision = null;
  $("#decisionDialog").close();
}

function setConnection(state, text) {
  const element = $("#connectionStatus");
  element.className = `connection-status ${state}`;
  element.textContent = text;
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

function formatFileSize(value) {
  const size = Number(value || 0);
  if (!size) return "0 Б";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / 1024 / 1024).toFixed(1)} МБ`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function init() {
  document.title = `KMF PeopleFlow · ${labels.queue}`;
  ensureDocumentsDialog();
  $$(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      activeStatus = button.dataset.status;
      $$(".segment").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });
  $("#refreshButton").addEventListener("click", loadApprovals);
  $("#decisionForm").addEventListener("submit", submitDecision);
  $("#closeDialog").addEventListener("click", closeDecision);
  $("#cancelDecision").addEventListener("click", closeDecision);
  $("#closeDocuments")?.addEventListener("click", () => $("#documentsDialog")?.close());
  $("#closeDocumentsFooter")?.addEventListener("click", () => $("#documentsDialog")?.close());
  window.addEventListener("focus", loadApprovals);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadApprovals();
  });
  window.setInterval(() => {
    if (!document.hidden && !$("#decisionDialog").open) loadApprovals();
  }, 15000);
  loadApprovals();
}

function ensureDocumentsDialog() {
  if ($("#documentsDialog")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="documentsDialog">
      <div class="documents-modal">
        <div class="dialog-head">
          <div>
            <p class="eyebrow">Файлы кандидата</p>
            <h2 id="documentsCandidate"></h2>
          </div>
          <button type="button" class="icon-button" id="closeDocuments" aria-label="Закрыть">×</button>
        </div>
        <div id="documentsBody" class="documents-body"></div>
        <div class="dialog-actions">
          <button type="button" class="secondary" id="closeDocumentsFooter">Закрыть</button>
        </div>
      </div>
    </dialog>
  `);
}

init();
