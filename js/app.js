/* ==========================================
   KT Cloud TECH UP — App Logic
   GitHub Pages 배포 버전 (localStorage 기반)
   ========================================== */
'use strict';

const STORAGE_KEY  = 'ktcloud_techup_messages';
const ADMIN_PW     = 'ktcloud05!';
const ADMIN_KEY    = 'ktcloud_admin_auth';
const PAGE_LIMIT   = 20;

let allMessages   = [];   // 전체 메시지 배열 (최신순)
let displayCount  = PAGE_LIMIT;
let selectedEmoji = '🚀';
let selectedGrad  = 'purple-blue';
let isSubmitting  = false;
let isAdminMode   = false;

// ── DOM refs ──
const cardsGrid         = document.getElementById('cardsGrid');
const loadMoreWrap      = document.getElementById('loadMoreWrap');
const loadMoreBtn       = document.getElementById('loadMoreBtn');
const msgCountEl        = document.getElementById('msgCount');
const modalOverlay      = document.getElementById('modalOverlay');
const openModalBtn      = document.getElementById('openModal');
const closeModalBtn     = document.getElementById('closeModal');
const fabBtn            = document.getElementById('fabBtn');
const messageForm       = document.getElementById('messageForm');
const toastEl           = document.getElementById('toast');
const inputMessage      = document.getElementById('inputMessage');
const charNumEl         = document.getElementById('charNum');
const emojiPicker       = document.getElementById('emojiPicker');
const gradientPicker    = document.getElementById('gradientPicker');
const adminLoginBtn     = document.getElementById('adminLoginBtn');
const adminLoginOverlay = document.getElementById('adminLoginOverlay');
const closeAdminLogin   = document.getElementById('closeAdminLogin');
const adminPwInput      = document.getElementById('adminPwInput');
const pwToggle          = document.getElementById('pwToggle');
const pwError           = document.getElementById('pwError');
const adminLoginConfirm = document.getElementById('adminLoginConfirm');
const adminBar          = document.getElementById('adminBar');
const adminLogoutBtn    = document.getElementById('adminLogoutBtn');

// ── localStorage helpers ──
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { console.warn('localStorage 저장 실패'); }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Utility ──
function showToast(msg, duration = 3000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

function animateCount(el, target) {
  let current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const step = target > current ? Math.ceil((target - current) / 30) : -1;
  const timer = setInterval(() => {
    current = step > 0
      ? Math.min(current + step, target)
      : Math.max(current + step, target);
    el.textContent = current;
    if (current === target) clearInterval(timer);
  }, 30);
}

function formatDate(ts) {
  const d = new Date(ts);
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${M}월 ${D}일 ${h}:${m}`;
}

function parseTags(str) {
  if (!str || (Array.isArray(str) && str.length === 0)) return [];
  if (Array.isArray(str)) return str;
  return str.split(',')
    .map(t => t.trim().replace(/^#*/, '#').replace(/[^\wㄱ-ㅎ가-힣#_]/g, ''))
    .filter(t => t.length > 1)
    .slice(0, 3);
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Admin Mode ──
function enterAdminMode() {
  isAdminMode = true;
  sessionStorage.setItem(ADMIN_KEY, '1');
  document.body.classList.add('admin-mode');
  adminBar.style.display = 'flex';
  adminLoginBtn.classList.add('is-admin');
  adminLoginBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i><span class="admin-login-txt">관리자</span>';
  document.querySelectorAll('.msg-card').forEach(addDeleteBtn);
  showToast('🔓 관리자 모드가 활성화됐습니다.');
}

function exitAdminMode() {
  isAdminMode = false;
  sessionStorage.removeItem(ADMIN_KEY);
  document.body.classList.remove('admin-mode');
  adminBar.style.display = 'none';
  adminLoginBtn.classList.remove('is-admin');
  adminLoginBtn.innerHTML = '<i class="fa-solid fa-lock"></i><span class="admin-login-txt">관리자</span>';
  document.querySelectorAll('.card-delete-btn').forEach(btn => btn.remove());
  showToast('🔒 관리자 모드가 종료됐습니다.');
}

function addDeleteBtn(card) {
  if (card.querySelector('.card-delete-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'card-delete-btn';
  btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  btn.title = '카드 삭제';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteCard(card);
  });
  card.appendChild(btn);
}

function deleteCard(card) {
  const id = card.dataset.id;
  if (!id) return;
  if (!confirm('이 메시지를 삭제하시겠습니까?')) return;

  card.classList.add('deleting');
  setTimeout(() => {
    // 배열에서 제거
    allMessages = allMessages.filter(m => m.id !== id);
    saveStorage(allMessages);
    card.remove();
    if (msgCountEl) animateCount(msgCountEl, allMessages.length);
    showToast('🗑️ 카드가 삭제됐습니다.');
    if (cardsGrid.querySelectorAll('.msg-card').length === 0) showEmpty();
  }, 350);
}

// ── Render Card ──
function renderCard(msg, prepend = false) {
  const card = document.createElement('article');
  card.className = `msg-card grad-${msg.gradient || 'purple-blue'}`;
  card.dataset.id = msg.id;
  card.style.animationDelay = prepend ? '0ms' : `${Math.random() * 200}ms`;

  const tags = parseTags(msg.tags);
  const tagsHtml = tags.length
    ? `<div class="card-tags">${tags.map(t => `<span class="card-tag">${t}</span>`).join('')}</div>`
    : '';
  const role = msg.role ? `<p class="card-role">📚 ${escHtml(msg.role)}</p>` : '';
  const time = msg.created_at ? `<p class="card-time">${formatDate(msg.created_at)}</p>` : '';

  card.innerHTML = `
    <div class="card-profile">
      <div class="card-avatar">${msg.emoji || '🚀'}</div>
      <div class="card-info">
        <p class="card-name">${escHtml(msg.name)}<span class="card-name-suffix"> 님</span></p>
        ${role}
      </div>
    </div>
    <div class="card-quote">
      <span class="quote-mark">"</span>
      <p class="card-message">${escHtml(msg.message)}</p>
    </div>
    ${tagsHtml}
    ${time}
  `;

  if (isAdminMode) addDeleteBtn(card);

  if (prepend) {
    cardsGrid.insertBefore(card, cardsGrid.firstChild);
  } else {
    cardsGrid.appendChild(card);
  }
}

// ── Show loader / empty ──
function showEmpty() {
  cardsGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">✨</div>
      <p>아직 메시지가 없어요.<br/>첫 번째 축하 메시지를 남겨보세요!</p>
    </div>
  `;
}

// ── Load Messages ──
function loadMessages() {
  allMessages = loadStorage(); // 최신순 정렬 (저장 시 unshift로 맨 앞에 추가)
  cardsGrid.innerHTML = '';

  if (allMessages.length === 0) {
    showEmpty();
    loadMoreWrap.style.display = 'none';
    if (msgCountEl) msgCountEl.textContent = '0';
    return;
  }

  if (msgCountEl) animateCount(msgCountEl, allMessages.length);

  const visible = allMessages.slice(0, displayCount);
  visible.forEach(msg => renderCard(msg));

  loadMoreWrap.style.display = allMessages.length > displayCount ? 'block' : 'none';
}

// ── Load More ──
loadMoreBtn.addEventListener('click', () => {
  displayCount += PAGE_LIMIT;
  // 추가로 보여줄 카드만 렌더
  const extra = allMessages.slice(displayCount - PAGE_LIMIT, displayCount);
  extra.forEach(msg => renderCard(msg));
  loadMoreWrap.style.display = allMessages.length > displayCount ? 'block' : 'none';
});

// ── Write Modal ──
function openModal() {
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

openModalBtn.addEventListener('click', openModal);
fabBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeAdminLoginModal(); }
});

// ── Admin Login Modal ──
function openAdminLoginModal() {
  adminLoginOverlay.classList.add('active');
  adminPwInput.value = '';
  pwError.textContent = '';
  document.body.style.overflow = 'hidden';
  setTimeout(() => adminPwInput.focus(), 100);
}
function closeAdminLoginModal() {
  adminLoginOverlay.classList.remove('active');
  document.body.style.overflow = '';
  adminPwInput.value = '';
  pwError.textContent = '';
}

adminLoginBtn.addEventListener('click', () => {
  isAdminMode ? exitAdminMode() : openAdminLoginModal();
});
closeAdminLogin.addEventListener('click', closeAdminLoginModal);
adminLoginOverlay.addEventListener('click', (e) => {
  if (e.target === adminLoginOverlay) closeAdminLoginModal();
});

pwToggle.addEventListener('click', () => {
  const isText = adminPwInput.type === 'text';
  adminPwInput.type = isText ? 'password' : 'text';
  pwToggle.innerHTML = isText
    ? '<i class="fa-solid fa-eye"></i>'
    : '<i class="fa-solid fa-eye-slash"></i>';
});

function checkAdminPassword() {
  if (adminPwInput.value === ADMIN_PW) {
    closeAdminLoginModal();
    enterAdminMode();
  } else {
    pwError.textContent = '❌ 비밀번호가 올바르지 않습니다.';
    adminPwInput.value = '';
    adminPwInput.focus();
    adminPwInput.style.animation = 'shake 0.4s ease';
    setTimeout(() => { adminPwInput.style.animation = ''; }, 400);
  }
}

adminLoginConfirm.addEventListener('click', checkAdminPassword);
document.getElementById('adminLoginForm').addEventListener('submit', checkAdminPassword);
adminLogoutBtn.addEventListener('click', exitAdminMode);

// ── Emoji Picker ──
emojiPicker.querySelectorAll('.emoji-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    emojiPicker.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedEmoji = btn.dataset.emoji;
  });
});

// ── Gradient Picker ──
gradientPicker.querySelectorAll('.grad-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    gradientPicker.querySelectorAll('.grad-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedGrad = btn.dataset.grad;
  });
});

// ── Char Count ──
inputMessage.addEventListener('input', () => {
  charNumEl.textContent = inputMessage.value.length;
});

// ── Form Submit ──
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSubmitting) return;

  const name    = document.getElementById('inputName').value.trim();
  const role    = document.getElementById('inputRole').value.trim();
  const message = inputMessage.value.trim();
  const tagsRaw = document.getElementById('inputTags').value.trim();

  if (!name || !message) {
    showToast('⚠️ 이름과 메시지는 필수입니다.');
    return;
  }

  isSubmitting = true;
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 등록 중...';

  const newMsg = {
    id:         generateId(),
    name,
    role,
    message,
    emoji:      selectedEmoji,
    gradient:   selectedGrad,
    tags:       parseTags(tagsRaw),
    created_at: Date.now(),
  };

  // 최신순 앞에 추가
  allMessages.unshift(newMsg);
  saveStorage(allMessages);

  // 빈 상태면 초기화 후 렌더
  const emptyEl = cardsGrid.querySelector('.empty-state');
  if (emptyEl) cardsGrid.innerHTML = '';

  renderCard(newMsg, true);
  if (msgCountEl) animateCount(msgCountEl, allMessages.length);

  closeModal();
  messageForm.reset();
  charNumEl.textContent = '0';
  resetPickers();
  showToast('🎉 메시지가 등록되었습니다!');
  document.getElementById('messageWall').scrollIntoView({ behavior: 'smooth', block: 'start' });

  isSubmitting = false;
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 메시지 등록하기';
});

function resetPickers() {
  selectedEmoji = '🚀';
  selectedGrad  = 'purple-blue';
  emojiPicker.querySelectorAll('.emoji-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  gradientPicker.querySelectorAll('.grad-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
}

// ── Init ──
loadMessages();

// 세션 복원 (새로고침 후 관리자 모드 유지)
if (sessionStorage.getItem(ADMIN_KEY) === '1') {
  setTimeout(enterAdminMode, 500);
}
