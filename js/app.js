/* ==========================================
   KT Cloud TECH UP — App Logic
   Firebase Firestore 연동 버전
   ========================================== */
'use strict';

// ── Firebase Config ──
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  deleteDoc, doc, query, orderBy, limit, startAfter
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDvOuoTdVNM0hpJ_TpXQmxEz6gdTkz8BdM",
  authDomain:        "lastday-tech-up-1.firebaseapp.com",
  projectId:         "lastday-tech-up-1",
  storageBucket:     "lastday-tech-up-1.firebasestorage.app",
  messagingSenderId: "176007963262",
  appId:             "1:176007963262:web:25600fa1fd4b4520c1ee2f"
};

const firebaseApp = initializeApp(firebaseConfig);
const db          = getFirestore(firebaseApp);
const COL         = 'messages';
const PAGE_LIMIT  = 20;

const ADMIN_PW  = 'ktcloud05!';
const ADMIN_KEY = 'ktcloud_admin_auth';

let lastDoc       = null;   // 페이지네이션용 마지막 문서
let totalLoaded   = 0;
let hasMore       = false;
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

// ── Utility ──
function showToast(msg, duration = 3000) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), duration);
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
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

async function deleteCard(card) {
  const id = card.dataset.id;
  if (!id) return;
  if (!confirm('이 메시지를 삭제하시겠습니까?')) return;

  card.classList.add('deleting');
  setTimeout(async () => {
    try {
      await deleteDoc(doc(db, COL, id));
      card.remove();
      totalLoaded = Math.max(0, totalLoaded - 1);
      showToast('🗑️ 카드가 삭제됐습니다.');
      if (cardsGrid.querySelectorAll('.msg-card').length === 0) showEmpty();
    } catch (err) {
      card.classList.remove('deleting');
      showToast('❌ 삭제에 실패했습니다.');
      console.error(err);
    }
  }, 350);
}

// ── Render Card ──
function renderCard(docSnap, prepend = false) {
  const msg  = docSnap.data ? docSnap.data() : docSnap;
  const id   = docSnap.id   || msg.id || '';

  const card = document.createElement('article');
  card.className = `msg-card grad-${msg.gradient || 'purple-blue'}`;
  card.dataset.id = id;
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

// ── Show Empty ──
function showEmpty() {
  cardsGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">✨</div>
      <p>아직 메시지가 없어요.<br/>첫 번째 축하 메시지를 남겨보세요!</p>
    </div>
  `;
}

function showLoader() {
  const el = document.createElement('div');
  el.className = 'loader-wrap';
  el.innerHTML = '<div class="loader"></div>';
  el.id = 'loaderEl';
  cardsGrid.appendChild(el);
}

function hideLoader() {
  const el = document.getElementById('loaderEl');
  if (el) el.remove();
}

// ── Load Messages (Firestore) ──
async function loadMessages(append = false) {
  if (!append) {
    cardsGrid.innerHTML = '';
    lastDoc = null;
    totalLoaded = 0;
  }
  showLoader();

  try {
    let q;
    if (lastDoc) {
      q = query(collection(db, COL), orderBy('created_at', 'desc'), startAfter(lastDoc), limit(PAGE_LIMIT));
    } else {
      q = query(collection(db, COL), orderBy('created_at', 'desc'), limit(PAGE_LIMIT));
    }

    const snapshot = await getDocs(q);
    hideLoader();

    if (snapshot.empty && !append) {
      showEmpty();
      loadMoreWrap.style.display = 'none';
      return;
    }

    snapshot.forEach(docSnap => {
      renderCard(docSnap);
      lastDoc = docSnap;
      totalLoaded++;
    });

    hasMore = snapshot.size === PAGE_LIMIT;
    loadMoreWrap.style.display = hasMore ? 'block' : 'none';

  } catch (err) {
    hideLoader();
    console.error('메시지 로드 실패:', err);
    if (!append) showEmpty();
    showToast('⚠️ 메시지를 불러오지 못했습니다.');
  }
}

// ── Load More ──
loadMoreBtn.addEventListener('click', () => loadMessages(true));

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

  try {
    const payload = {
      name,
      role,
      message,
      emoji:      selectedEmoji,
      gradient:   selectedGrad,
      tags:       parseTags(tagsRaw),
      created_at: new Date(),
    };

    const docRef = await addDoc(collection(db, COL), payload);

    // 빈 상태 제거
    const emptyEl = cardsGrid.querySelector('.empty-state');
    if (emptyEl) cardsGrid.innerHTML = '';

    // 새 카드 맨 앞에 삽입
    renderCard({ id: docRef.id, data: () => payload }, true);
    totalLoaded++;

    closeModal();
    messageForm.reset();
    charNumEl.textContent = '0';
    resetPickers();
    showToast('🎉 메시지가 등록되었습니다!');
    document.getElementById('messageWall').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error(err);
    showToast('❌ 등록에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 메시지 등록하기';
  }
});

function resetPickers() {
  selectedEmoji = '🚀';
  selectedGrad  = 'purple-blue';
  emojiPicker.querySelectorAll('.emoji-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  gradientPicker.querySelectorAll('.grad-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
}

// ── Init ──
loadMessages();

if (sessionStorage.getItem(ADMIN_KEY) === '1') {
  setTimeout(enterAdminMode, 600);
}
