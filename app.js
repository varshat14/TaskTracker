// app.js — Enhanced Task Tracker with Firebase Auth, private user tasks, edit, due dates, drag-drop ordering
const firebaseUrls = {
  app: "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js",
  auth: "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js",
  db: "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js"
};

let FB = null;
const state = {
  app: null, auth: null, db: null,
  user: null, tasksRef: null, tasks: {},
  filter: 'all', dragSrcId: null
};

function $(sel) { return document.querySelector(sel); }

async function loadFirebase() {
  const [
    { initializeApp },
    { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged },
    { getDatabase, ref, push, onValue, set, remove, update }
  ] = await Promise.all([
    import(firebaseUrls.app),
    import(firebaseUrls.auth),
    import(firebaseUrls.db)
  ]);
  FB = { initializeApp, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, getDatabase, ref, push, onValue, set, remove, update };
  return FB;
}

async function init() {
  await loadFirebase();

  const firebaseConfig = {
    apiKey: "AIzaSyCMSSJ-WLKVJuGvrqjah1nGVXdt9XLglwc",
    authDomain: "tasktrackerapp-3f83e.firebaseapp.com",
    projectId: "tasktrackerapp-3f83e",
    storageBucket: "tasktrackerapp-3f83e.firebasestorage.app",
    messagingSenderId: "217592593895",
    appId: "1:217592593895:web:038a2ce31abdcc5c935142",
    // 🔑 IMPORTANT: Add databaseURL
    databaseURL: "https://tasktrackerapp-3f83e-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

  const app = FB.initializeApp(firebaseConfig);
  const auth = FB.getAuth(app);
  const db = FB.getDatabase(app);
  state.app = app; state.auth = auth; state.db = db;

  bindUI();
  FB.onAuthStateChanged(auth, onAuthChanged);
}

function bindUI() {
  $('#btn-signin')?.addEventListener('click', openAuthModal);
  $('#open-login')?.addEventListener('click', openAuthModal);
  $('#auth-toggle')?.addEventListener('click', toggleAuthMode);
  $('#modal-close')?.addEventListener('click', closeAuthModal);

  $('#auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#email').value.trim();
    const pass = $('#password').value;
    const isRegister = $('#auth-submit').dataset.mode === 'register';
    try {
      if (isRegister) {
        await FB.createUserWithEmailAndPassword(state.auth, email, pass);
      } else {
        await FB.signInWithEmailAndPassword(state.auth, email, pass);
      }
      closeAuthModal();
    } catch (err) {
      alert('Auth error: ' + err.message);
    }
  });

  $('#auth-area')?.addEventListener('click', async (e) => {
    if (e.target.id === 'btn-signout') {
      await FB.signOut(state.auth);
    }
  });

  $('#task-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.user) { openAuthModal(); return; }
    const text = $('#task-input').value.trim();
    const due = $('#due-input').value || null;
    if (!text) return;
    await addTask(text, due);
    $('#task-input').value = '';
    $('#due-input').value = '';
  });

  document.querySelectorAll('.filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      renderTasks();
    });
  });

  $('#tasks').addEventListener('click', async (e) => {
    const li = e.target.closest('li.task');
    if (!li) return;
    const id = li.dataset.id;
    if (e.target.classList.contains('checkbox')) {
      await toggleComplete(id, !state.tasks[id].completed);
    } else if (e.target.classList.contains('delete')) {
      if (confirm('Delete this task?')) await deleteTask(id);
    } else if (e.target.classList.contains('edit')) {
      await openEditDialog(id);
    }
  });

  // Drag-drop ordering
  $('#tasks').addEventListener('dragstart', (e) => {
    const li = e.target.closest('li.task');
    if (!li) return;
    state.dragSrcId = li.dataset.id;
    li.classList.add('dragging');
  });
  $('#tasks').addEventListener('dragend', (e) => {
    const li = e.target.closest('li.task');
    if (li) li.classList.remove('dragging');
    state.dragSrcId = null;
  });
  $('#tasks').addEventListener('dragover', (e) => {
    e.preventDefault();
    const container = $('#tasks');
    const after = getDragAfterElement(container, e.clientY);
    const dragged = container.querySelector(`[data-id="${state.dragSrcId}"]`);
    if (after == null) container.appendChild(dragged);
    else container.insertBefore(dragged, after);
  });
  $('#tasks').addEventListener('drop', persistOrderFromDOM);
}

function onAuthChanged(user) {
  const authModal = $('#auth-modal');
  const mainApp = $('#main-app');
  const signedOut = $('#signed-out');
  const authArea = $('#auth-area');

  state.user = user;

  if (user) {
    // Hide modal, show app
    authModal.classList.add('hidden');
    mainApp.classList.remove('hidden');
    signedOut.classList.add('hidden');
    authArea.innerHTML = `<span style="font-size:13px;color:var(--muted);margin-right:8px">${user.email}</span>
      <button id="btn-signout" class="ghost">Sign out</button>`;

    // load tasks
    state.tasksRef = FB.ref(state.db, 'users/' + user.uid + '/tasks');
    subscribeTasks();
  } else {
    // Signed out
    mainApp.classList.add('hidden');
    signedOut.classList.remove('hidden');
    authArea.innerHTML = `<button id="btn-signin" class="ghost">Sign in</button>`;
  }
}

// --- Task Functions ---
async function addTask(text, due) {
  const now = Date.now();
  const taskData = {
    text,
    completed: false,
    createdAt: now,
    due: due || null,
    order: now
  };
  await FB.push(state.tasksRef, taskData);
}

async function toggleComplete(id, completed) {
  await FB.set(FB.ref(state.db, `users/${state.user.uid}/tasks/${id}/completed`), completed);
}

async function deleteTask(id) {
  await FB.remove(FB.ref(state.db, `users/${state.user.uid}/tasks/${id}`));
}

async function updateTask(id, changes) {
  await FB.update(FB.ref(state.db), Object.fromEntries(
    Object.entries(changes).map(([k, v]) => [`users/${state.user.uid}/tasks/${id}/${k}`, v])
  ));
}

function subscribeTasks() {
  FB.onValue(state.tasksRef, (snap) => {
    state.tasks = snap.val() || {};
    renderTasks();
  }, (err) => {
    console.error("Error loading tasks:", err);
  });
}

function renderTasks() {
  const container = $('#tasks');
  container.innerHTML = '';
  const arr = Object.entries(state.tasks || {}).sort((a, b) => (a[1].order || 0) - (b[1].order || 0));
  if (arr.length === 0) {
    container.innerHTML = "<p class='empty'>No tasks yet — add one above!</p>";
    return;
  }
  for (const [id, t] of arr) {
    if (state.filter === 'active' && t.completed) continue;
    if (state.filter === 'completed' && !t.completed) continue;
    const li = document.createElement('li');
    li.className = 'task' + (t.completed ? ' completed' : '');
    li.draggable = true; li.dataset.id = id;
    li.innerHTML = `
      <div class="checkbox ${t.completed ? 'checked' : ''}">${t.completed ? '✓' : ''}</div>
      <div style="flex:1;display:flex;flex-direction:column">
        <div class="title">${t.text}</div>
        <div style="font-size:12px;color:var(--muted)">
          ${new Date(t.createdAt).toLocaleString()}${t.due ? ' · Due: ' + new Date(t.due).toLocaleDateString() : ''}
        </div>
      </div>
      <div class="btns">
        <button class="icon-btn edit">✎</button>
        <button class="icon-btn delete">🗑</button>
      </div>`;
    container.appendChild(li);
  }
}

async function openEditDialog(id) {
  const t = state.tasks[id];
  if (!t) return;
  const newText = prompt('Edit task text:', t.text);
  if (newText === null) return;
  const newDue = prompt('Due date (YYYY-MM-DD) or blank:', t.due || '');
  await updateTask(id, { text: newText, due: newDue || null });
}

function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('li.task:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function persistOrderFromDOM() {
  const list = [...$('#tasks').querySelectorAll('li.task')];
  const base = Date.now(); const updates = {};
  list.forEach((li, idx) => updates[`users/${state.user.uid}/tasks/${li.dataset.id}/order`] = base + idx);
  await FB.update(FB.ref(state.db), updates);
}

// --- Modal helpers ---
function openAuthModal() {
  $('#auth-modal').classList.remove('hidden');
  $('#auth-submit').dataset.mode = 'signin';
  $('#auth-title').textContent = 'Sign In';
  $('#auth-submit').textContent = 'Sign In';
  $('#auth-toggle').textContent = 'Create account';
}
function closeAuthModal() {
  $('#auth-modal').classList.add('hidden');
  $('#email').value = '';
  $('#password').value = '';
}
function toggleAuthMode() {
  const isReg = $('#auth-submit').dataset.mode === 'register';
  if (isReg) {
    $('#auth-submit').dataset.mode = 'signin';
    $('#auth-title').textContent = 'Sign In';
    $('#auth-submit').textContent = 'Sign In';
    $('#auth-toggle').textContent = 'Create account';
  } else {
    $('#auth-submit').dataset.mode = 'register';
    $('#auth-title').textContent = 'Create Account';
    $('#auth-submit').textContent = 'Register';
    $('#auth-toggle').textContent = 'Have an account? Sign in';
  }
}

window.addEventListener('DOMContentLoaded', init);
