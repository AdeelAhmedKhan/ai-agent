const STORAGE_KEY = 'intake_admin_api_key';

const authGate = document.getElementById('auth-gate');
const app = document.getElementById('app');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const apiKeyInput = document.getElementById('api-key');
const statusLine = document.getElementById('status-line');
const rowsEl = document.getElementById('patient-rows');
const emptyState = document.getElementById('empty-state');
const detailPanel = document.getElementById('detail-panel');
const detailName = document.getElementById('detail-name');
const detailFields = document.getElementById('detail-fields');
const filterLastName = document.getElementById('filter-last-name');
const filterPhone = document.getElementById('filter-phone');
const filterDob = document.getElementById('filter-dob');

/** @type {Array<Record<string, unknown>>} */
let patients = [];
/** @type {string | null} */
let selectedId = null;

function getApiKey() {
  return sessionStorage.getItem(STORAGE_KEY) ?? '';
}

function setApiKey(value) {
  sessionStorage.setItem(STORAGE_KEY, value);
}

function clearApiKey() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function showApp() {
  authGate.classList.add('is-hidden');
  authGate.hidden = true;
  app.classList.remove('is-hidden');
  app.hidden = false;
}

function showGate() {
  app.classList.add('is-hidden');
  app.hidden = true;
  authGate.classList.remove('is-hidden');
  authGate.hidden = false;
  detailPanel.hidden = true;
  selectedId = null;
}

function formatDob(iso) {
  if (typeof iso !== 'string') return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

function formatPhone(digits) {
  if (typeof digits !== 'string' || digits.length !== 10) return digits ?? '—';
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatWhen(value) {
  if (typeof value !== 'string') return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

async function api(path, options = {}) {
  const key = getApiKey();
  const res = await fetch(path, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': key,
      ...(options.headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return body.data;
}

function field(label, value) {
  const wrap = document.createElement('div');
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = label;
  dd.textContent = value == null || value === '' ? '—' : String(value);
  wrap.append(dt, dd);
  return wrap;
}

function renderDetail(patient) {
  if (!patient) {
    detailPanel.hidden = true;
    return;
  }

  detailPanel.hidden = false;
  detailName.textContent = `${patient.first_name} ${patient.last_name}`;
  detailFields.replaceChildren(
    field('Patient ID', patient.patient_id),
    field('Date of birth', formatDob(patient.date_of_birth)),
    field('Sex', patient.sex),
    field('Phone', formatPhone(patient.phone_number)),
    field('Email', patient.email),
    field('Address line 1', patient.address_line_1),
    field('Address line 2', patient.address_line_2),
    field('City', patient.city),
    field('State', patient.state),
    field('ZIP', patient.zip_code),
    field('Insurance provider', patient.insurance_provider),
    field('Insurance member ID', patient.insurance_member_id),
    field('Preferred language', patient.preferred_language),
    field('Emergency contact', patient.emergency_contact_name),
    field('Emergency phone', formatPhone(patient.emergency_contact_phone)),
    field('Created', formatWhen(patient.created_at)),
    field('Updated', formatWhen(patient.updated_at)),
  );
}

function renderRows() {
  rowsEl.replaceChildren();

  if (patients.length === 0) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  for (const patient of patients) {
    const tr = document.createElement('tr');
    tr.dataset.id = String(patient.patient_id);
    if (patient.patient_id === selectedId) tr.classList.add('active');
    tr.innerHTML = `
      <td>${escapeHtml(`${patient.first_name} ${patient.last_name}`)}</td>
      <td>${escapeHtml(formatDob(patient.date_of_birth))}</td>
      <td>${escapeHtml(formatPhone(patient.phone_number))}</td>
      <td>${escapeHtml(patient.city ?? '—')}</td>
      <td>${escapeHtml(formatWhen(patient.created_at))}</td>
    `;
    tr.addEventListener('click', () => {
      selectedId = String(patient.patient_id);
      renderRows();
      renderDetail(patient);
    });
    rowsEl.append(tr);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildQuery() {
  const params = new URLSearchParams();
  const last = filterLastName.value.trim();
  const phone = filterPhone.value.trim();
  const dob = filterDob.value.trim();
  if (last) params.set('last_name', last);
  if (phone) params.set('phone_number', phone);
  if (dob) params.set('date_of_birth', dob);
  const qs = params.toString();
  return qs ? `/patients?${qs}` : '/patients';
}

async function loadPatients() {
  statusLine.textContent = 'Loading…';
  try {
    patients = await api(buildQuery());
    statusLine.textContent = `${patients.length} patient${patients.length === 1 ? '' : 's'}`;
    const selected = patients.find((p) => p.patient_id === selectedId) ?? null;
    if (!selected) {
      selectedId = null;
      detailPanel.hidden = true;
    } else {
      renderDetail(selected);
    }
    renderRows();
  } catch (error) {
    statusLine.textContent = error.message || 'Failed to load patients';
    if (error.status === 401 || error.status === 403) {
      clearApiKey();
      showGate();
      authError.hidden = false;
      authError.textContent = 'Invalid API key. Try again.';
    }
  }
}

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  authError.hidden = true;
  const key = apiKeyInput.value.trim();
  if (!key) return;
  setApiKey(key);
  showApp();
  await loadPatients();
});

document.getElementById('refresh-btn').addEventListener('click', () => {
  void loadPatients();
});

document.getElementById('signout-btn').addEventListener('click', () => {
  clearApiKey();
  apiKeyInput.value = '';
  showGate();
});

document.getElementById('close-detail').addEventListener('click', () => {
  selectedId = null;
  detailPanel.hidden = true;
  renderRows();
});

document.getElementById('delete-btn').addEventListener('click', async () => {
  if (!selectedId) return;
  const patient = patients.find((p) => p.patient_id === selectedId);
  const label = patient ? `${patient.first_name} ${patient.last_name}` : 'this patient';
  if (!window.confirm(`Soft-delete ${label}? They will disappear from the active list.`)) {
    return;
  }
  try {
    await api(`/patients/${selectedId}`, { method: 'DELETE' });
    selectedId = null;
    detailPanel.hidden = true;
    await loadPatients();
  } catch (error) {
    statusLine.textContent = error.message || 'Delete failed';
  }
});

for (const input of [filterLastName, filterPhone, filterDob]) {
  let timer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void loadPatients();
    }, 300);
  });
}

if (getApiKey()) {
  showApp();
  void loadPatients();
}
