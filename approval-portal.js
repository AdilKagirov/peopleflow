const API_BASE = "http://localhost:3000/api";
const approvalType = document.body.dataset.approvalType;
const labels = approvalType === "customer"
  ? { queue: "Заказчик", comment: "Комментарий заказчика" }
  : { queue: "Служба безопасности", comment: "Заключение СБ" };

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
  const actions = item.status === "pending"
    ? `<div class="approval-actions">
        <button class="approve" data-id="${item.id}" data-decision="approved">Одобрить</button>
        <button class="reject" data-id="${item.id}" data-decision="rejected">Отклонить</button>
      </div>`
    : `<div class="approval-actions"><span class="badge ${item.status}">${statusLabel}</span></div>`;

  return `<article class="approval-item">
    <div>
      <div class="approval-title">
        <strong>${escapeHtml(item.candidate.name)}</strong>
        <span class="badge ${item.status}">${statusLabel}</span>
      </div>
      <div class="approval-details">
        <span>${escapeHtml(item.vacancy.title)}</span>
        <span>${escapeHtml(item.candidate.email || "Email не указан")}</span>
        <span>${escapeHtml(item.currentStage?.name || "Этап не указан")}</span>
        <span>${formatDate(item.requestedAt)}</span>
      </div>
      <p class="approval-comment">${escapeHtml(item.requestComment || item.decisionComment || "Комментарий не указан")}</p>
    </div>
    ${actions}
  </article>`;
}

function openDecision(id, decision) {
  const item = approvals.find((approval) => approval.id === id);
  if (!item) return;
  activeDecision = { id, decision };
  $("#decisionType").textContent = decision === "approved" ? "Одобрение" : "Отклонение";
  $("#decisionCandidate").textContent = item.candidate.name;
  $("#decisionComment").value = "";
  $("#confirmDecision").textContent = decision === "approved" ? "Одобрить кандидата" : "Отклонить кандидата";
  $("#decisionDialog").showModal();
  $("#decisionComment").focus();
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
    alert(`Не удалось сохранить решение: ${error.message}`);
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
  loadApprovals();
}

init();

