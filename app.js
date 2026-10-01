const STORAGE_KEYS = {
  user: 'fittrack_user',
  workouts: 'fittrack_workouts',
  goals: 'fittrack_goals',
  profile: 'fittrack_profile',
  settings: 'fittrack_settings',
  session: 'fittrack_session'
};

const WORKOUT_TYPES = {
  cardio: { label: 'Cardio', icon: '🏃', color: '#58d68d' },
  strength: { label: 'Strength', icon: '🏋️', color: '#7cb7ff' },
  flexibility: { label: 'Flexibility', icon: '🧘', color: '#f6c667' },
  sports: { label: 'Sports', icon: '⚽', color: '#ff8e7d' }
};

const DEMO_GOALS = [
  { id: 'goal-workouts', name: 'Weekly Workouts', target: 5, unit: 'workouts', period: 'weekly' },
  { id: 'goal-calories', name: 'Weekly Calories', target: 2500, unit: 'kcal', period: 'weekly' },
  { id: 'goal-duration', name: 'Weekly Duration', target: 180, unit: 'minutes', period: 'weekly' }
];

const state = {
  user: null,
  workouts: [],
  goals: [],
  profile: {},
  settings: {},
  currentView: 'dashboard',
  workoutSearch: '',
  workoutFilter: 'all',
  workoutSort: 'newest',
  range: 7,
  charts: {}
};

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

const productName = 'FITTRACK';

function hashValue(value) {
  return btoa(unescape(encodeURIComponent(value || '')));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDefaultUser() {
  return {
    id: 'demo-user',
    name: 'Alex Morgan',
    email: 'alex@fittrack.app',
    passwordHash: hashValue('demo123')
  };
}

function getDefaultProfile() {
  return {
    fullName: 'Alex Morgan',
    email: 'alex@fittrack.app',
    age: '28',
    height: '175',
    weight: '70',
    fitnessGoal: 'Build Muscle'
  };
}

function getDefaultSettings() {
  return {
    theme: 'dark',
    units: 'metric',
    lastView: 'dashboard'
  };
}

function ensureDefaults() {
  if (!storage.get(STORAGE_KEYS.user, null)) {
    storage.set(STORAGE_KEYS.user, getDefaultUser());
  }

  if (!storage.get(STORAGE_KEYS.profile, null)) {
    storage.set(STORAGE_KEYS.profile, getDefaultProfile());
  }

  if (!storage.get(STORAGE_KEYS.goals, null)) {
    storage.set(STORAGE_KEYS.goals, DEMO_GOALS);
  }

  if (!storage.get(STORAGE_KEYS.settings, null)) {
    storage.set(STORAGE_KEYS.settings, getDefaultSettings());
  }

  if (!storage.get(STORAGE_KEYS.workouts, null)) {
    storage.set(STORAGE_KEYS.workouts, []);
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getCurrentDateLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

function localDateKey(dateInput) {
  const value = new Date(dateInput);
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) return 'No date';
  const date = new Date(dateString + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (localDateKey(date) === localDateKey(today)) return 'Today';
  if (localDateKey(date) === localDateKey(yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}h ${mins}m`;
  if (hrs) return `${hrs}h`;
  return `${mins || 0}m`;
}

function getWorkoutIcon(type) {
  return WORKOUT_TYPES[type]?.icon || '🏋️';
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getWorkoutById(workoutId) {
  return state.workouts.find((workout) => workout.id === workoutId);
}

function updateAuthFormVisibility(mode) {
  const loginVisible = mode === 'login';
  const signupVisible = mode === 'signup';
  document.getElementById('loginForm').classList.toggle('hidden', !loginVisible);
  document.getElementById('signupForm').classList.toggle('hidden', !signupVisible);
  document.getElementById('showSignupBtn').classList.toggle('hidden', !loginVisible);
  document.getElementById('showLoginBtn').classList.toggle('hidden', !signupVisible);
  document.getElementById('authFormTitle').textContent = loginVisible ? 'Welcome back' : 'Create your account';
  document.getElementById('authFormSubtitle').textContent = loginVisible ? 'Sign in to continue your journey.' : 'Start tracking smarter today.';
  document.getElementById('authSwitchPrompt').textContent = loginVisible ? 'Need an account?' : 'Already have an account?';
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId.replace('Input', 'Error'));
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) {
    error.textContent = message || '';
  }
}

function clearAuthErrors(prefix) {
  const errorIds = Array.from(document.querySelectorAll('.field-error'));
  errorIds.forEach((element) => {
    if (element.id.startsWith(prefix)) {
      element.textContent = '';
    }
  });

  const inputs = document.querySelectorAll(`#${prefix}Email, #${prefix}Password, #${prefix}Name`);
  inputs.forEach((input) => input.setAttribute('aria-invalid', 'false'));

  const alert = document.getElementById(`${prefix}Error`);
  if (alert) {
    alert.classList.add('hidden');
    alert.textContent = '';
  }
}

function showAuthAlert(id, message, type = 'error') {
  const alert = document.getElementById(id);
  if (!alert) return;
  alert.textContent = message;
  alert.classList.remove('hidden', 'error', 'success');
  alert.classList.add(type);
}

function clearAllAuthAlerts() {
  showAuthAlert('loginError', '', 'error');
  showAuthAlert('signupError', '', 'error');
}

function applyTheme(theme) {
  const resolved = theme === 'dark' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', resolved);
  state.settings.theme = resolved;
  storage.set(STORAGE_KEYS.settings, state.settings);
  const themeIcon = document.getElementById('themeToggleBtn');
  if (themeIcon) {
    themeIcon.title = resolved === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function updateSidebarUser() {
  const name = state.profile.fullName || state.user?.name || 'Athlete';
  const email = state.profile.email || state.user?.email || 'your@email.com';
  const initial = (name || 'A').trim().charAt(0).toUpperCase();

  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const sidebarInitial = document.getElementById('sidebarUserInitial');
  const headerInitial = document.getElementById('headerUserInitial');

  if (sidebarUserName) sidebarUserName.textContent = name;
  if (sidebarUserEmail) sidebarUserEmail.textContent = email;
  if (sidebarInitial) sidebarInitial.textContent = initial;
  if (headerInitial) headerInitial.textContent = initial;
}

function updateNavState() {
  const navButtons = document.querySelectorAll('[data-view]');
  navButtons.forEach((button) => {
    const isActive = button.dataset.view === state.currentView;
    button.classList.toggle('active', isActive);
  });

  const pageLabel = document.getElementById('currentPageLabel');
  if (pageLabel) {
    const labels = {
      dashboard: 'Dashboard',
      workouts: 'Workouts',
      analytics: 'Analytics',
      goals: 'Goals',
      profile: 'Profile',
      settings: 'Settings'
    };
    pageLabel.textContent = labels[state.currentView] || 'Dashboard';
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="msg">
      <span>${type === 'success' ? '✓' : type === 'error' ? '!' : type === 'warning' ? '⚠' : 'i'}</span>
      <span>${escapeHtml(message)}</span>
    </div>
    <button class="close-toast" type="button" aria-label="Close notification">×</button>
  `;

  const closeButton = toast.querySelector('.close-toast');
  closeButton.addEventListener('click', () => toast.remove());

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function openWorkoutModal(workout = null) {
  const modalRoot = document.getElementById('modalRoot');
  const isEdit = Boolean(workout);
  const safeName = workout ? escapeHtml(workout.name) : '';
  const safeNotes = workout ? escapeHtml(workout.notes || '') : '';
  const safeDate = workout ? workout.date : new Date().toISOString().slice(0, 10);

  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal="true">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="workoutModalTitle">
        <div class="modal-header">
          <h3 id="workoutModalTitle">${isEdit ? 'Edit workout' : 'Log workout'}</h3>
          <button class="modal-close" type="button" data-close-modal="true" aria-label="Close modal">×</button>
        </div>

        <form id="workoutModalForm" class="modal-form">
          <input type="hidden" name="id" value="${isEdit ? workout.id : ''}" />

          <div class="field-row">
            <label for="modalWorkoutType">Workout type</label>
            <select id="modalWorkoutType" name="type" required>
              <option value="">Choose type</option>
              ${Object.entries(WORKOUT_TYPES).map(([key, meta]) => `
                <option value="${key}" ${workout && workout.type === key ? 'selected' : ''}>${meta.label}</option>
              `).join('')}
            </select>
          </div>

          <div class="field-row">
            <label for="modalWorkoutName">Exercise name</label>
            <input id="modalWorkoutName" name="name" type="text" value="${safeName}" placeholder="Running, Bench Press, Yoga" required />
          </div>

          <div class="form-grid">
            <div class="field-row">
              <label for="modalWorkoutDuration">Duration (minutes)</label>
              <input id="modalWorkoutDuration" name="duration" type="number" min="1" value="${workout ? workout.duration : 30}" required />
            </div>
            <div class="field-row">
              <label for="modalWorkoutCalories">Calories</label>
              <input id="modalWorkoutCalories" name="calories" type="number" min="0" value="${workout ? workout.calories : 0}" required />
            </div>
          </div>

          <div class="field-row">
            <label for="modalWorkoutDate">Date</label>
            <input id="modalWorkoutDate" name="date" type="date" value="${safeDate}" required />
          </div>

          <div class="field-row">
            <label for="modalWorkoutNotes">Notes</label>
            <textarea id="modalWorkoutNotes" name="notes" placeholder="How did it feel?">${safeNotes}</textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="action-btn" data-close-modal="true">Cancel</button>
            <button type="submit" class="primary-btn">${isEdit ? 'Save changes' : 'Add workout'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
    button.addEventListener('click', () => closeModal());
  });

  modalRoot.querySelector('#workoutModalForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      id: formData.get('id') || `workout-${Date.now()}`,
      type: formData.get('type')?.toString() || 'cardio',
      name: String(formData.get('name') || '').trim(),
      duration: Number(formData.get('duration') || 0),
      calories: Number(formData.get('calories') || 0),
      date: String(formData.get('date') || localDateKey(new Date())),
      notes: String(formData.get('notes') || '').trim(),
      createdAt: new Date().toISOString()
    };

    if (!payload.type || !payload.name || payload.duration < 1 || payload.calories < 0 || !payload.date) {
      showToast('Please complete all required workout fields.', 'error');
      return;
    }

    const currentList = [...state.workouts];
    if (workout) {
      const foundIndex = currentList.findIndex((item) => item.id === workout.id);
      if (foundIndex >= 0) {
        currentList[foundIndex] = { ...currentList[foundIndex], ...payload };
      }
    } else {
      currentList.unshift(payload);
    }

    state.workouts = currentList.sort((a, b) => new Date(b.date) - new Date(a.date));
    storage.set(STORAGE_KEYS.workouts, state.workouts);
    closeModal();
    renderCurrentView();
    showToast(workout ? 'Workout updated successfully.' : 'Workout added successfully.', 'success');
  });
}

function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

function confirmDeleteWorkout(workoutId) {
  const workout = getWorkoutById(workoutId);
  if (!workout) return;

  const modalRoot = document.getElementById('modalRoot');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal="true">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
        <div class="modal-header">
          <h3 id="deleteTitle">Delete workout?</h3>
          <button class="modal-close" type="button" data-close-modal="true" aria-label="Close modal">×</button>
        </div>

        <p class="confirm-message">Are you sure you want to remove <strong>${escapeHtml(workout.name)}</strong>? This action cannot be undone.</p>

        <div class="confirm-actions">
          <button type="button" class="action-btn" data-close-modal="true">Cancel</button>
          <button type="button" class="small-btn danger" id="confirmDeleteWorkout">Delete workout</button>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
    button.addEventListener('click', () => closeModal());
  });

  modalRoot.querySelector('#confirmDeleteWorkout').addEventListener('click', () => {
    state.workouts = state.workouts.filter((item) => item.id !== workoutId);
    storage.set(STORAGE_KEYS.workouts, state.workouts);
    closeModal();
    renderCurrentView();
    showToast('Workout deleted.', 'success');
  });
}

function calculateStreak() {
  if (!state.workouts.length) return 0;

  const uniqueDates = [...new Set(state.workouts.map((workout) => localDateKey(workout.date)))].sort((a, b) => new Date(b) - new Date(a));
  const today = new Date();
  let streak = 0;
  const todayKey = localDateKey(today);

  for (let i = 0; i < uniqueDates.length; i += 1) {
    const checkDate = new Date(uniqueDates[i] + 'T12:00:00');
    const expectedKey = localDateKey(new Date(today.getTime() - streak * 86400000));
    if (uniqueDates.includes(expectedKey)) {
      streak += 1;
    }
  }

  if (!uniqueDates.includes(todayKey)) {
    const yesterdayKey = localDateKey(new Date(today.getTime() - 86400000));
    if (!uniqueDates.includes(yesterdayKey)) {
      return 0;
    }
  }

  let current = 0;
  const dates = new Set(uniqueDates);
  let cursor = new Date();

  while (dates.has(localDateKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return current;
}

function calculateLongestStreak() {
  if (!state.workouts.length) return 0;
  const uniqueDates = [...new Set(state.workouts.map((workout) => localDateKey(workout.date)))].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i += 1) {
    const prev = new Date(uniqueDates[i - 1] + 'T12:00:00');
    const currentDate = new Date(uniqueDates[i] + 'T12:00:00');
    const diff = (currentDate - prev) / 86400000;
    if (diff === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function calculateStats() {
  const totalWorkouts = state.workouts.length;
  const totalMinutes = state.workouts.reduce((sum, workout) => sum + (Number(workout.duration) || 0), 0);
  const totalCalories = state.workouts.reduce((sum, workout) => sum + (Number(workout.calories) || 0), 0);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthCount = state.workouts.filter((workout) => new Date(workout.date) >= lastMonthDate).length;
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - 6);
  const thisWeekWorkouts = state.workouts.filter((workout) => new Date(workout.date) >= thisWeekStart).length;
  const monthlyDays = [...new Set(state.workouts.map((workout) => localDateKey(workout.date)))].length;

  return {
    totalWorkouts,
    totalMinutes,
    totalCalories,
    lastMonthCount,
    thisWeekWorkouts,
    avgWorkout: totalWorkouts ? Math.round(totalMinutes / totalWorkouts) : 0,
    monthlyDays,
    streak: calculateStreak(),
    longestStreak: calculateLongestStreak()
  };
}

function getProgressData(range) {
  const days = [];
  const today = new Date();

  for (let i = range - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  const labels = days.map((date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  const workoutCounts = days.map((date) => {
    const key = localDateKey(date);
    return state.workouts.filter((workout) => localDateKey(workout.date) === key).length;
  });

  const calories = days.map((date) => {
    const key = localDateKey(date);
    return state.workouts
      .filter((workout) => localDateKey(workout.date) === key)
      .reduce((sum, workout) => sum + (Number(workout.calories) || 0), 0);
  });

  return { labels, workoutCounts, calories };
}

function getGoalTotals() {
  return calculateGoalTotals();
}

function renderDashboard() {
  const stats = calculateStats();
  const goalData = getGoalTotals();
  const weeklyGoalProgress = Math.min((goalData.weeklyWorkouts / goalData.weeklyTarget) * 100, 100);
  const currentStreak = stats.streak;

  const recentWorkouts = state.workouts.slice(0, 4);
  const chartData = getProgressData(state.range || 7);

  const statsMarkup = [
    { label: 'Total Workouts', value: formatNumber(stats.totalWorkouts), meta: stats.totalWorkouts ? `${stats.lastMonthCount} in last month` : '0 workouts', icon: '🏋️' },
    { label: 'This Week', value: formatNumber(stats.thisWeekWorkouts), meta: goalData.weeklyTarget ? `${goalData.weeklyWorkouts}/${goalData.weeklyTarget} goal` : 'No goal yet', icon: '📅' },
    { label: 'Calories', value: `${formatNumber(stats.totalCalories)} kcal`, meta: 'This month', icon: '🔥' },
    { label: 'Duration', value: formatDuration(stats.totalMinutes), meta: 'This month', icon: '⏱️' },
    { label: 'Current Streak', value: `${currentStreak} days`, meta: 'Keep going', icon: '🔥' },
    { label: 'Avg Workout', value: `${stats.avgWorkout} min`, meta: 'Per session', icon: '📈' }
  ];

  const recentMarkup = recentWorkouts.length
    ? recentWorkouts.map((workout) => {
        const meta = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.cardio;
        return `
          <div class="workout-item">
            <div class="workout-main">
              <div class="workout-icon">${meta.icon}</div>
              <div class="workout-copy">
                <strong>${escapeHtml(workout.name)}</strong>
                <div class="workout-meta">
                  <span>${meta.label}</span>
                  <span>${Number(workout.duration)} min</span>
                  <span>${Number(workout.calories)} kcal</span>
                  <span>${formatDate(workout.date)}</span>
                </div>
              </div>
            </div>
            <div class="workout-actions">
              <button type="button" class="action-btn" data-action="edit-workout" data-id="${workout.id}">Edit</button>
              <button type="button" class="action-btn danger" data-action="delete-workout" data-id="${workout.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('')
    : `
      <div class="empty-state">
        <div class="empty-icon">🏃</div>
        <h4>No workouts yet</h4>
        <p>Your first workout is waiting.</p>
        <button type="button" class="primary-btn" data-action="log-workout">Log your first workout</button>
      </div>
    `;

  const typeData = getWorkoutTypeBreakdown();
  const typeMarkup = typeData.length
    ? typeData.map((item) => `
      <div class="type-row">
        <div class="type-row-left">
          <span class="type-dot" style="background:${item.color};"></span>
          <div>
            <div class="type-label">${item.label}</div>
            <div class="type-value">${item.percent}% of total</div>
          </div>
        </div>
        <strong>${item.count}</strong>
      </div>
    `).join('')
    : '<div class="empty-state"><div class="empty-icon">📊</div><h4>No analytics yet</h4><p>Complete a few workouts to unlock your performance insights.</p></div>';

  const achievementCards = calculateAchievements().map((achievement) => `
    <div class="achievement-item ${achievement.unlocked ? '' : 'locked'}">
      <div class="achievement-icon">${achievement.icon}</div>
      <strong>${escapeHtml(achievement.title)}</strong>
      <small>${escapeHtml(achievement.description)}</small>
    </div>
  `).join('');

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Overview</p>
        <h1>${getGreeting()}, ${escapeHtml(state.profile.fullName || state.user?.name || 'Athlete')} 👋</h1>
        <p class="page-subtitle">Ready to make today count? ${getCurrentDateLabel()}</p>
      </div>
      <div class="header-actions">
        <button type="button" class="primary-btn" data-action="log-workout">Log Workout</button>
      </div>
    </div>

    <section class="stat-grid">
      ${statsMarkup.map((stat) => `
        <article class="stat-card">
          <div class="stat-head">
            <span class="stat-label">${stat.label}</span>
            <div class="badge-icon">${stat.icon}</div>
          </div>
          <strong>${stat.value}</strong>
          <small>${stat.meta}</small>
        </article>
      `).join('')}
    </section>

    <section class="hero-grid">
      <article class="panel goal-hero">
        <div class="goal-top">
          <div>
            <p class="eyebrow accent">Weekly goal</p>
            <h3>${goalData.weeklyWorkouts} / ${goalData.weeklyTarget} workouts</h3>
          </div>
          <span class="mini-pill">${Math.round(weeklyGoalProgress)}%</span>
        </div>

        <div class="goal-kpi">${Math.round(weeklyGoalProgress)}%</div>

        <div class="progress-block">
          <div class="progress-meta">
            <span>Progress</span>
            <span>${goalData.weeklyTarget - goalData.weeklyWorkouts > 0 ? `${goalData.weeklyTarget - goalData.weeklyWorkouts} to go` : 'Goal reached'}</span>
          </div>
          <div class="progress-bar"><span style="width:${Math.min(weeklyGoalProgress, 100)}%"></span></div>
        </div>

        <p class="goal-copy">${goalData.weeklyTarget - goalData.weeklyWorkouts > 0 ? `One more workout to complete your weekly goal.` : 'You have completed your weekly goal. Nice work.'}</p>
      </article>

      <article class="panel streak-card">
        <div class="streak-badge">🔥</div>
        <div>
          <p class="eyebrow accent">Current streak</p>
          <div class="streak-value">${currentStreak} days</div>
          <p class="streak-copy">${currentStreak > 0 ? 'You are on a roll. Keep your momentum going.' : 'Build consistency with your next session.'}</p>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-header">
          <h3>Activity trend</h3>
          <div class="segmented" aria-label="Chart range switcher">
            <button type="button" class="${state.range === 7 ? 'active' : ''}" data-range="7">7D</button>
            <button type="button" class="${state.range === 30 ? 'active' : ''}" data-range="30">30D</button>
            <button type="button" class="${state.range === 90 ? 'active' : ''}" data-range="90">90D</button>
          </div>
        </div>
        <div class="chart-box">
          <canvas id="dashboardChart"></canvas>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h3>Workout mix</h3>
        </div>
        <div class="chart-box small">
          <canvas id="mixChart"></canvas>
        </div>
        <div class="card-list">
          ${typeMarkup}
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h3>Recent workouts</h3>
        <button type="button" class="link-btn" data-view="workouts">View all</button>
      </div>
      <div class="recent-list">
        ${recentMarkup}
      </div>
    </section>

    <section class="panel" style="margin-top:20px;">
      <div class="panel-header">
        <h3>Achievements</h3>
      </div>
      <div class="achievement-grid">
        ${achievementCards}
      </div>
    </section>
  `;

  initDashboardCharts(chartData, typeData);
  updateNavState();
}

function getWorkoutTypeBreakdown() {
  const total = state.workouts.length || 1;
  const counts = {
    cardio: 0,
    strength: 0,
    flexibility: 0,
    sports: 0
  };

  state.workouts.forEach((workout) => {
    if (counts[workout.type] !== undefined) counts[workout.type] += 1;
  });

  return Object.entries(WORKOUT_TYPES).map(([key, meta]) => ({
    label: meta.label,
    count: counts[key],
    percent: Math.round((counts[key] / total) * 100),
    color: meta.color
  }));
}

function initDashboardCharts(chartData, typeData) {
  const dashboardCanvas = document.getElementById('dashboardChart');
  const mixCanvas = document.getElementById('mixChart');

  if (dashboardCanvas) {
    if (state.charts.dashboard) state.charts.dashboard.destroy();
    const isDark = document.body.dataset.theme === 'dark';
    state.charts.dashboard = new Chart(dashboardCanvas, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Workouts',
            data: chartData.workoutCounts,
            backgroundColor: isDark ? 'rgba(56, 217, 141, 0.7)' : 'rgba(45, 223, 127, 0.7)',
            borderRadius: 10,
            borderSkipped: false
          },
          {
            label: 'Calories',
            data: chartData.calories,
            backgroundColor: isDark ? 'rgba(124, 183, 255, 0.75)' : 'rgba(84, 116, 255, 0.75)',
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: isDark ? '#dfe9e5' : '#122320' } },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: isDark ? '#9ab0a9' : '#5e6f69' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: isDark ? '#9ab0a9' : '#5e6f69', stepSize: 1 },
            grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18,35,32,0.08)' }
          }
        }
      }
    });
  }

  if (mixCanvas) {
    if (state.charts.mix) state.charts.mix.destroy();
    const hasData = typeData.some((item) => item.count > 0);
    state.charts.mix = new Chart(mixCanvas, {
      type: 'doughnut',
      data: {
        labels: hasData ? typeData.map((item) => item.label) : ['No data'],
        datasets: [{
          data: hasData ? typeData.map((item) => item.count) : [1],
          backgroundColor: hasData ? typeData.map((item) => item.color) : ['rgba(143, 170, 161, 0.24)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: document.body.dataset.theme === 'dark' ? '#dfe9e5' : '#122320' } },
          tooltip: { enabled: true }
        }
      }
    });
  }
}

function renderWorkoutsPage() {
  const filteredWorkouts = getFilteredWorkouts();
  const listMarkup = filteredWorkouts.length
    ? filteredWorkouts.map((workout) => {
        const meta = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.cardio;
        return `
          <div class="workout-item">
            <div class="workout-main">
              <div class="workout-icon">${meta.icon}</div>
              <div class="workout-copy">
                <strong>${escapeHtml(workout.name)}</strong>
                <div class="workout-meta">
                  <span>${meta.label}</span>
                  <span>${formatDuration(Number(workout.duration))}</span>
                  <span>${Number(workout.calories)} kcal</span>
                  <span>${formatDate(workout.date)}</span>
                </div>
                ${workout.notes ? `<div class="workout-meta"><span>“${escapeHtml(workout.notes)}”</span></div>` : ''}
              </div>
            </div>
            <div class="workout-actions">
              <button type="button" class="action-btn" data-action="edit-workout" data-id="${workout.id}">Edit</button>
              <button type="button" class="action-btn danger" data-action="delete-workout" data-id="${workout.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('')
    : `
      <div class="empty-state">
        <div class="empty-icon">🧭</div>
        <h4>No workouts match your search</h4>
        <p>Try a different keyword or log a new session.</p>
      </div>
    `;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Workout history</p>
        <h1>Workout History</h1>
        <p class="page-subtitle">Track everything you've done.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="primary-btn" data-action="log-workout">Log Workout</button>
      </div>
    </div>

    <div class="page-tools">
      <input id="workoutSearch" class="search-input" type="search" placeholder="Search workouts" value="${escapeHtml(state.workoutSearch)}" />

      <div class="select-wrap">
        <select id="workoutFilter" aria-label="Filter workouts">
          <option value="all" ${state.workoutFilter === 'all' ? 'selected' : ''}>All</option>
          ${Object.entries(WORKOUT_TYPES).map(([key, meta]) => `<option value="${key}" ${state.workoutFilter === key ? 'selected' : ''}>${meta.label}</option>`).join('')}
        </select>
      </div>

      <div class="select-wrap">
        <select id="workoutSort" aria-label="Sort workouts">
          <option value="newest" ${state.workoutSort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="oldest" ${state.workoutSort === 'oldest' ? 'selected' : ''}>Oldest</option>
          <option value="longest" ${state.workoutSort === 'longest' ? 'selected' : ''}>Longest</option>
          <option value="calories" ${state.workoutSort === 'calories' ? 'selected' : ''}>Most Calories</option>
        </select>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>Workout list</h3>
      </div>
      <div class="workout-list">
        ${listMarkup}
      </div>
    </div>
  `;

  updateNavState();

  document.getElementById('workoutSearch').addEventListener('input', (event) => {
    state.workoutSearch = event.target.value;
    renderWorkoutsPage();
  });

  document.getElementById('workoutFilter').addEventListener('change', (event) => {
    state.workoutFilter = event.target.value;
    renderWorkoutsPage();
  });

  document.getElementById('workoutSort').addEventListener('change', (event) => {
    state.workoutSort = event.target.value;
    renderWorkoutsPage();
  });
}

function getFilteredWorkouts() {
  let filtered = [...state.workouts];

  if (state.workoutFilter !== 'all') {
    filtered = filtered.filter((item) => item.type === state.workoutFilter);
  }

  if (state.workoutSearch) {
    const query = state.workoutSearch.toLowerCase();
    filtered = filtered.filter((item) => {
      return item.name.toLowerCase().includes(query) ||
        (item.notes || '').toLowerCase().includes(query) ||
        (WORKOUT_TYPES[item.type]?.label || '').toLowerCase().includes(query);
    });
  }

  switch (state.workoutSort) {
    case 'oldest':
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'longest':
      filtered.sort((a, b) => Number(b.duration) - Number(a.duration));
      break;
    case 'calories':
      filtered.sort((a, b) => Number(b.calories) - Number(a.calories));
      break;
    default:
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return filtered;
}

function calculateGoalTotals() {
  const weeklyWorkouts = state.workouts.filter((workout) => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return new Date(workout.date) >= start;
  }).length;

  const weeklyCalories = state.workouts.filter((workout) => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return new Date(workout.date) >= start;
  }).reduce((sum, workout) => sum + (Number(workout.calories) || 0), 0);

  const weeklyMinutes = state.workouts.filter((workout) => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return new Date(workout.date) >= start;
  }).reduce((sum, workout) => sum + (Number(workout.duration) || 0), 0);

  const workoutGoal = state.goals.find((goal) => goal.name === 'Weekly Workouts') || DEMO_GOALS[0];
  const caloriesGoal = state.goals.find((goal) => goal.name === 'Weekly Calories') || DEMO_GOALS[1];
  const durationGoal = state.goals.find((goal) => goal.name === 'Weekly Duration') || DEMO_GOALS[2];

  return {
    weeklyTarget: Number(workoutGoal?.target || 5),
    weeklyWorkouts,
    weeklyCalories,
    weeklyMinutes,
    caloriesGoal: Number(caloriesGoal?.target || 2500),
    durationGoal: Number(durationGoal?.target || 180)
  };
}

function renderGoalsPage() {
  const goalList = state.goals.length
    ? state.goals.map((goal) => {
        const currentValue = goal.name.toLowerCase().includes('workout')
          ? calculateGoalTotals().weeklyWorkouts
          : goal.name.toLowerCase().includes('calorie')
            ? calculateGoalTotals().weeklyCalories
            : calculateGoalTotals().weeklyMinutes;

        const progress = Math.min((currentValue / Number(goal.target || 1)) * 100, 100);
        return `
          <div class="goal-item">
            <div class="goal-row">
              <div>
                <div class="goal-name">${escapeHtml(goal.name)}</div>
                <div class="goal-value">${goal.period} target</div>
              </div>
              <span class="mini-pill">${Math.round(progress)}%</span>
            </div>
            <div class="goal-progress-text">
              <span>${formatNumber(currentValue)} / ${formatNumber(goal.target)} ${escapeHtml(goal.unit)}</span>
              <span>${goal.unit === 'minutes' ? formatDuration(currentValue) : `${formatNumber(currentValue)} ${goal.unit}`}</span>
            </div>
            <div class="progress-bar"><span style="width:${progress}%"></span></div>
            <div class="goal-actions">
              <button type="button" class="action-btn" data-action="edit-goal" data-id="${goal.id}">Edit</button>
              <button type="button" class="action-btn danger" data-action="delete-goal" data-id="${goal.id}">Delete</button>
            </div>
          </div>
        `;
      }).join('')
    : `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <h4>No goals yet</h4>
        <p>Set a new goal and start tracking your progress.</p>
      </div>
    `;

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Goal tracking</p>
        <h1>Goals</h1>
        <p class="page-subtitle">Build consistency and push forward.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="primary-btn" data-action="create-goal">Create Goal</button>
      </div>
    </div>

    <div class="goal-list">
      ${goalList}
    </div>
  `;

  updateNavState();
}

function openGoalModal(goal = null) {
  const modalRoot = document.getElementById('modalRoot');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal="true">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="goalModalTitle">
        <div class="modal-header">
          <h3 id="goalModalTitle">${goal ? 'Edit goal' : 'Create goal'}</h3>
          <button class="modal-close" type="button" data-close-modal="true" aria-label="Close modal">×</button>
        </div>

        <form id="goalForm" class="modal-form">
          <input type="hidden" name="id" value="${goal ? goal.id : `goal-${Date.now()}`}" />

          <div class="field-row">
            <label for="goalName">Goal name</label>
            <input id="goalName" name="name" type="text" value="${escapeHtml(goal?.name || '')}" placeholder="Weekly Workouts" required />
          </div>

          <div class="form-grid">
            <div class="field-row">
              <label for="goalTarget">Target</label>
              <input id="goalTarget" name="target" type="number" min="1" value="${goal ? goal.target : 5}" required />
            </div>
            <div class="field-row">
              <label for="goalUnit">Unit</label>
              <select id="goalUnit" name="unit">
                <option value="workouts" ${goal?.unit === 'workouts' ? 'selected' : ''}>Workouts</option>
                <option value="kcal" ${goal?.unit === 'kcal' ? 'selected' : ''}>Calories</option>
                <option value="minutes" ${goal?.unit === 'minutes' ? 'selected' : ''}>Minutes</option>
              </select>
            </div>
          </div>

          <div class="field-row">
            <label for="goalPeriod">Period</label>
            <select id="goalPeriod" name="period">
              <option value="daily" ${goal?.period === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${goal?.period === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${goal?.period === 'monthly' ? 'selected' : ''}>Monthly</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="action-btn" data-close-modal="true">Cancel</button>
            <button type="submit" class="primary-btn">${goal ? 'Save goal' : 'Create goal'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
    button.addEventListener('click', () => closeModal());
  });

  modalRoot.querySelector('#goalForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const entry = {
      id: formData.get('id') || `goal-${Date.now()}`,
      name: String(formData.get('name') || '').trim(),
      target: Number(formData.get('target') || 1),
      unit: String(formData.get('unit') || 'workouts'),
      period: String(formData.get('period') || 'weekly')
    };

    if (!entry.name || entry.target < 1) {
      showToast('Please enter a valid goal name and target.', 'error');
      return;
    }

    const list = [...state.goals];
    const index = list.findIndex((item) => item.id === entry.id);

    if (index >= 0) {
      list[index] = entry;
    } else {
      list.push(entry);
    }

    state.goals = list;
    storage.set(STORAGE_KEYS.goals, state.goals);
    closeModal();
    renderCurrentView();
    showToast(goal ? 'Goal updated.' : 'Goal created.', 'success');
  });
}

function deleteGoal(goalId) {
  state.goals = state.goals.filter((goal) => goal.id !== goalId);
  storage.set(STORAGE_KEYS.goals, state.goals);
  renderCurrentView();
  showToast('Goal removed.', 'success');
}

function renderProfilePage() {
  const profile = state.profile;
  const bmiValue = calculateBMI();
  const bmiClass = bmiValue ? bmiCategory(bmiValue) : 'Not available';

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Profile</p>
        <h1>Profile</h1>
        <p class="page-subtitle">Your personal health snapshot.</p>
      </div>
    </div>

    <div class="profile-layout">
      <section class="panel profile-card">
        <div class="profile-header">
          <div class="profile-avatar">${escapeHtml((profile.fullName || 'A').trim().charAt(0).toUpperCase())}</div>
          <div class="profile-meta">
            <h3>${escapeHtml(profile.fullName || 'Athlete')}</h3>
            <p>${escapeHtml(profile.email || state.user?.email || 'your@email.com')}</p>
          </div>
        </div>

        <form id="profileForm" class="profile-form">
          <div class="form-grid">
            <div class="field-row">
              <label for="profileName">Full name</label>
              <input id="profileName" name="fullName" type="text" value="${escapeHtml(profile.fullName || '')}" />
            </div>
            <div class="field-row">
              <label for="profileEmail">Email</label>
              <input id="profileEmail" name="email" type="email" value="${escapeHtml(profile.email || '')}" />
            </div>
            <div class="field-row">
              <label for="profileAge">Age</label>
              <input id="profileAge" name="age" type="number" min="1" value="${escapeHtml(profile.age || '')}" />
            </div>
            <div class="field-row">
              <label for="profileGoal">Fitness goal</label>
              <select id="profileGoal" name="fitnessGoal">
                <option value="Lose Weight" ${profile.fitnessGoal === 'Lose Weight' ? 'selected' : ''}>Lose Weight</option>
                <option value="Build Muscle" ${profile.fitnessGoal === 'Build Muscle' ? 'selected' : ''}>Build Muscle</option>
                <option value="Maintain Fitness" ${profile.fitnessGoal === 'Maintain Fitness' ? 'selected' : ''}>Maintain Fitness</option>
                <option value="Improve Endurance" ${profile.fitnessGoal === 'Improve Endurance' ? 'selected' : ''}>Improve Endurance</option>
                <option value="General Health" ${profile.fitnessGoal === 'General Health' ? 'selected' : ''}>General Health</option>
              </select>
            </div>
            <div class="field-row">
              <label for="profileHeight">Height (cm)</label>
              <input id="profileHeight" name="height" type="number" min="1" value="${escapeHtml(profile.height || '')}" />
            </div>
            <div class="field-row">
              <label for="profileWeight">Weight (kg)</label>
              <input id="profileWeight" name="weight" type="number" min="1" value="${escapeHtml(profile.weight || '')}" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="primary-btn">Save profile</button>
          </div>
        </form>
      </section>

      <section class="panel bmi-card">
        <div class="panel-header">
          <h3>BMI overview</h3>
        </div>
        <div class="bmi-number">${bmiValue ? bmiValue.toFixed(1) : '--'}</div>
        <p class="bmi-category">${bmiClass}</p>
        <div class="bmi-stats">
          <span class="mini-pill">Height: ${escapeHtml(profile.height || '--')} cm</span>
          <span class="mini-pill">Weight: ${escapeHtml(profile.weight || '--')} kg</span>
        </div>
        <p class="page-subtitle">BMI is for informational tracking and should not replace professional medical advice.</p>
      </section>
    </div>
  `;

  document.getElementById('profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedProfile = {
      fullName: String(formData.get('fullName') || '').trim() || 'Athlete',
      email: String(formData.get('email') || '').trim() || state.user?.email || '',
      age: String(formData.get('age') || '').trim(),
      height: String(formData.get('height') || '').trim(),
      weight: String(formData.get('weight') || '').trim(),
      fitnessGoal: String(formData.get('fitnessGoal') || 'General Health')
    };

    state.profile = updatedProfile;
    if (state.user) {
      state.user.name = updatedProfile.fullName;
      state.user.email = updatedProfile.email;
      storage.set(STORAGE_KEYS.user, state.user);
    }
    storage.set(STORAGE_KEYS.profile, state.profile);
    updateSidebarUser();
    renderCurrentView();
    showToast('Profile saved successfully.', 'success');
  });

  updateNavState();
}

function calculateBMI() {
  const height = Number(state.profile.height || 0);
  const weight = Number(state.profile.weight || 0);
  if (!height || !weight) return null;
  return weight / (((height / 100) ** 2));
}

function bmiCategory(value) {
  if (!value) return 'Not available';
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Healthy';
  if (value < 30) return 'Overweight';
  return 'Obesity';
}

function renderSettingsPage() {
  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Settings</p>
        <h1>Settings</h1>
        <p class="page-subtitle">Customize your FITTRACK experience.</p>
      </div>
    </div>

    <div class="settings-grid">
      <section class="panel settings-panel">
        <h3>Appearance</h3>

        <div class="setting-row">
          <div>
            <strong>Dark mode</strong>
            <p class="page-subtitle">Use the premium dark interface.</p>
          </div>
          <button type="button" class="toggle ${state.settings.theme === 'dark' ? 'active' : ''}" data-toggle="theme" aria-label="Toggle theme"></button>
        </div>

        <div class="setting-row">
          <div>
            <strong>Units</strong>
            <p class="page-subtitle">Choose your metric preference.</p>
          </div>
          <select id="unitsSelect" aria-label="Metric or imperial units">
            <option value="metric" ${state.settings.units === 'metric' ? 'selected' : ''}>Metric</option>
            <option value="imperial" ${state.settings.units === 'imperial' ? 'selected' : ''}>Imperial</option>
          </select>
        </div>
      </section>

      <section class="panel settings-panel">
        <h3>Data</h3>
        <div class="setting-row">
          <div>
            <strong>Load demo data</strong>
            <p class="page-subtitle">Create realistic workout history.</p>
          </div>
          <button type="button" class="primary-btn" data-action="load-demo-data">Load demo</button>
        </div>

        <div class="setting-row">
          <div>
            <strong>Export data</strong>
            <p class="page-subtitle">Download your profile and workout history.</p>
          </div>
          <button type="button" class="action-btn" data-action="export-data">Export</button>
        </div>

        <div class="setting-row">
          <div>
            <strong>Import data</strong>
            <p class="page-subtitle">Restore a saved FITTRACK backup.</p>
          </div>
          <button type="button" class="action-btn" data-action="import-data">Import</button>
        </div>

        <div class="setting-row">
          <div>
            <strong>Reset all data</strong>
            <p class="page-subtitle">Remove all workouts, goals, and settings.</p>
          </div>
          <button type="button" class="small-btn danger" data-action="reset-data">Reset</button>
        </div>
      </section>
    </div>
  `;

  document.querySelector('[data-toggle="theme"]').addEventListener('click', () => {
    const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    renderCurrentView();
  });

  document.getElementById('unitsSelect').addEventListener('change', (event) => {
    state.settings.units = event.target.value;
    storage.set(STORAGE_KEYS.settings, state.settings);
    showToast('Units updated.', 'success');
  });

  updateNavState();
}

function calculateAchievements() {
  const achievements = [
    { id: 'first-workout', title: 'First Workout', description: 'Complete your first session.', icon: '✅', unlocked: state.workouts.length >= 1 },
    { id: 'streak-3', title: '3 Day Streak', description: 'Stay consistent for 3 days straight.', icon: '🔥', unlocked: calculateStreak() >= 3 },
    { id: 'streak-7', title: '7 Day Streak', description: 'Build momentum for a full week.', icon: '🏆', unlocked: calculateStreak() >= 7 },
    { id: '10-workouts', title: '10 Workouts', description: 'Reach 10 logged sessions.', icon: '📈', unlocked: state.workouts.length >= 10 },
    { id: '25-workouts', title: '25 Workouts', description: 'Complete 25 workouts.', icon: '💪', unlocked: state.workouts.length >= 25 },
    { id: '50-workouts', title: '50 Workouts', description: 'Hit 50 sessions.', icon: '🏅', unlocked: state.workouts.length >= 50 },
    { id: '500-minutes', title: '500 Minutes', description: 'Log 500 total minutes.', icon: '⏱️', unlocked: calculateStats().totalMinutes >= 500 },
    { id: '5000-calories', title: '5,000 Calories', description: 'Burn 5,000 calories total.', icon: '⚡', unlocked: calculateStats().totalCalories >= 5000 }
  ];

  return achievements;
}

function renderAnalyticsPage() {
  const rangeOptions = [7, 30, 90, 365];
  const chartData = getProgressData(state.range || 7);

  document.getElementById('pageContent').innerHTML = `
    <div class="page-header">
      <div>
        <p class="eyebrow">Performance</p>
        <h1>Performance Analytics</h1>
        <p class="page-subtitle">Learn what is driving your progress.</p>
      </div>
      <div class="header-actions">
        <div class="segmented" aria-label="Analytics time range">
          ${rangeOptions.map((value) => `<button type="button" class="${state.range === value ? 'active' : ''}" data-analytics-range="${value}">${value === 365 ? '1Y' : `${value}D`}</button>`).join('')}
        </div>
      </div>
    </div>

    <section class="stat-grid">
      ${[
        { label: 'Total Workouts', value: formatNumber(state.workouts.length), meta: 'All time', icon: '🏋️' },
        { label: 'Total Calories', value: `${formatNumber(calculateStats().totalCalories)} kcal`, meta: 'Burned', icon: '🔥' },
        { label: 'Total Duration', value: formatDuration(calculateStats().totalMinutes), meta: 'Across all sessions', icon: '⏱️' },
        { label: 'Average Workout', value: `${calculateStats().avgWorkout} min`, meta: 'Per session', icon: '📈' }
      ].map((stat) => `
         <article class="stat-card">
           <div class="stat-head">
             <span class="stat-label">${stat.label}</span>
             <div class="badge-icon">${stat.icon}</div>
           </div>
           <strong>${stat.value}</strong>
           <small>${stat.meta}</small>
         </article>
      `).join('')}
    </section>

    <div class="dashboard-grid">
      <article class="panel">
        <div class="panel-header">
          <h3>Workout frequency</h3>
        </div>
        <div class="chart-box">
          <canvas id="analyticsChart"></canvas>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h3>Workout type mix</h3>
        </div>
        <div class="chart-box small">
          <canvas id="analyticsMixChart"></canvas>
        </div>
      </article>
    </div>
  `;

  initAnalyticsCharts(chartData, getWorkoutTypeBreakdown());
  updateNavState();
}

function initAnalyticsCharts(chartData, typeData) {
  const mainCanvas = document.getElementById('analyticsChart');
  const mixCanvas = document.getElementById('analyticsMixChart');
  const isDark = document.body.dataset.theme === 'dark';

  if (mainCanvas) {
    if (state.charts.analytics) state.charts.analytics.destroy();
    state.charts.analytics = new Chart(mainCanvas, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Workouts',
          data: chartData.workoutCounts,
          borderColor: isDark ? '#38d98d' : '#2ddf7f',
          backgroundColor: isDark ? 'rgba(56,217,141,.18)' : 'rgba(45,223,127,.12)',
          fill: true,
          tension: 0.32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: isDark ? '#dfe9e5' : '#122320' } } },
        scales: {
          x: { ticks: { color: isDark ? '#9ab0a9' : '#5e6f69' }, grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18,35,32,0.08)' } },
          y: { ticks: { color: isDark ? '#9ab0a9' : '#5e6f69', stepSize: 1 }, grid: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(18,35,32,0.08)' } }
        }
      }
    });
  }

  if (mixCanvas) {
    if (state.charts.analyticsMix) state.charts.analyticsMix.destroy();
    state.charts.analyticsMix = new Chart(mixCanvas, {
      type: 'doughnut',
      data: {
        labels: typeData.map((item) => item.label),
        datasets: [{
          data: typeData.map((item) => item.count || 0),
          backgroundColor: typeData.map((item) => item.color),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#dfe9e5' : '#122320' } } }
      }
    });
  }
}

function renderCurrentView() {
  updateSidebarUser();
  state.settings = storage.get(STORAGE_KEYS.settings, getDefaultSettings());
  applyTheme(state.settings.theme || 'dark');
  state.settings.lastView = state.currentView;
  storage.set(STORAGE_KEYS.settings, state.settings);

  if (state.currentView === 'dashboard') renderDashboard();
  if (state.currentView === 'workouts') renderWorkoutsPage();
  if (state.currentView === 'analytics') renderAnalyticsPage();
  if (state.currentView === 'goals') renderGoalsPage();
  if (state.currentView === 'profile') renderProfilePage();
  if (state.currentView === 'settings') renderSettingsPage();

  const navButtons = document.querySelectorAll('[data-view]');
  navButtons.forEach((button) => {
    const isActive = button.dataset.view === state.currentView;
    button.classList.toggle('active', isActive);
  });
}

function loadDemoData() {
  const demoWorkouts = [
    { id: 'demo-run', type: 'cardio', name: 'Morning Run', duration: 42, calories: 410, date: localDateKey(new Date(Date.now() - 86400000 * 1)), notes: 'Nice pace and strong finish.', createdAt: new Date().toISOString() },
    { id: 'demo-gym', type: 'strength', name: 'Upper Body Lift', duration: 55, calories: 460, date: localDateKey(new Date(Date.now() - 86400000 * 2)), notes: 'Felt strong on bench and rows.', createdAt: new Date().toISOString() },
    { id: 'demo-yoga', type: 'flexibility', name: 'Mobility Flow', duration: 28, calories: 180, date: localDateKey(new Date(Date.now() - 86400000 * 4)), notes: 'Good recovery session.', createdAt: new Date().toISOString() },
    { id: 'demo-hiit', type: 'sports', name: 'HIIT Circuit', duration: 35, calories: 390, date: localDateKey(new Date(Date.now() - 86400000 * 6)), notes: 'Pushed through the final round.', createdAt: new Date().toISOString() },
    { id: 'demo-cycle', type: 'cardio', name: 'Cycling', duration: 48, calories: 430, date: localDateKey(new Date(Date.now() - 86400000 * 9)), notes: 'Steady effort throughout.', createdAt: new Date().toISOString() }
  ];

  state.workouts = demoWorkouts;
  storage.set(STORAGE_KEYS.workouts, state.workouts);
  renderCurrentView();
  showToast('Demo data loaded successfully.', 'success');
}

function exportData() {
  const payload = {
    profile: state.profile,
    workouts: state.workouts,
    goals: state.goals,
    settings: state.settings,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'fittrack-data.json';
  anchor.click();
  URL.revokeObjectURL(url);
  showToast('Data exported successfully.', 'success');
}

function readImportedFile(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(String(event.target.result || '{}'));
      if (!parsed || !Array.isArray(parsed.workouts)) {
        throw new Error('Invalid FITTRACK file.');
      }

      state.workouts = parsed.workouts || [];
      state.profile = parsed.profile || state.profile;
      state.goals = parsed.goals || state.goals;
      state.settings = { ...state.settings, ...(parsed.settings || {}) };

      storage.set(STORAGE_KEYS.workouts, state.workouts);
      storage.set(STORAGE_KEYS.profile, state.profile);
      storage.set(STORAGE_KEYS.goals, state.goals);
      storage.set(STORAGE_KEYS.settings, state.settings);
      renderCurrentView();
      showToast('Data imported successfully.', 'success');
    } catch (error) {
      showToast('The selected file could not be imported.', 'error');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  const confirmMessage = 'This will clear your workouts, goals, profile, and settings. Continue?';
  if (!window.confirm(confirmMessage)) return;

  state.workouts = [];
  state.goals = DEMO_GOALS;
  state.profile = getDefaultProfile();
  state.settings = getDefaultSettings();
  state.user = getDefaultUser();
  storage.set(STORAGE_KEYS.user, state.user);
  storage.set(STORAGE_KEYS.workouts, state.workouts);
  storage.set(STORAGE_KEYS.profile, state.profile);
  storage.set(STORAGE_KEYS.goals, state.goals);
  storage.set(STORAGE_KEYS.settings, state.settings);
  applyTheme('dark');
  renderCurrentView();
  showToast('All data has been reset.', 'warning');
}

function handlePageAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;

  if (action === 'log-workout') {
    openWorkoutModal();
    return;
  }

  if (action === 'edit-workout') {
    const workout = getWorkoutById(button.dataset.id);
    openWorkoutModal(workout);
    return;
  }

  if (action === 'delete-workout') {
    confirmDeleteWorkout(button.dataset.id);
    return;
  }

  if (action === 'create-goal') {
    openGoalModal();
    return;
  }

  if (action === 'edit-goal') {
    const goal = state.goals.find((item) => item.id === button.dataset.id);
    openGoalModal(goal);
    return;
  }

  if (action === 'delete-goal') {
    deleteGoal(button.dataset.id);
    return;
  }

  if (action === 'load-demo-data') {
    loadDemoData();
    return;
  }

  if (action === 'export-data') {
    exportData();
    return;
  }

  if (action === 'import-data') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) readImportedFile(file);
    });
    input.click();
    return;
  }

  if (action === 'reset-data') {
    resetAllData();
  }
}

function handleGlobalNavigation(event) {
  const target = event.target.closest('[data-view]');
  if (!target) return;
  const view = target.dataset.view;
  if (!view) return;
  state.currentView = view;
  renderCurrentView();
}

function handleRangeButtons() {
  const rangeButtons = document.querySelectorAll('[data-range]');
  rangeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.range = Number(button.dataset.range);
      renderDashboard();
    });
  });

  const analyticsButtons = document.querySelectorAll('[data-analytics-range]');
  analyticsButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.range = Number(button.dataset.analyticsRange);
      renderAnalyticsPage();
    });
  });
}

function initializeApp() {
  ensureDefaults();
  state.user = storage.get(STORAGE_KEYS.user, getDefaultUser());
  state.profile = storage.get(STORAGE_KEYS.profile, getDefaultProfile());
  state.goals = storage.get(STORAGE_KEYS.goals, DEMO_GOALS);
  state.settings = storage.get(STORAGE_KEYS.settings, getDefaultSettings());
  state.workouts = storage.get(STORAGE_KEYS.workouts, []);
  state.currentView = state.settings.lastView || 'dashboard';

  applyTheme(state.settings.theme || 'dark');
  updateSidebarUser();

  document.getElementById('showSignupBtn').addEventListener('click', () => updateAuthFormVisibility('signup'));
  document.getElementById('showLoginBtn').addEventListener('click', () => updateAuthFormVisibility('login'));

  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !validateEmail(email)) {
      setFieldError('loginEmail', 'Please enter a valid email.');
      return;
    }

    if (!password || password.length < 6) {
      setFieldError('loginPassword', 'Password must be at least 6 characters.');
      return;
    }

    const user = storage.get(STORAGE_KEYS.user, null);
    if (!user || user.email !== email || user.passwordHash !== hashValue(password)) {
      showAuthAlert('loginError', 'Invalid email or password. Use the demo account or sign up.', 'error');
      return;
    }

    state.user = user;
    state.profile = storage.get(STORAGE_KEYS.profile, getDefaultProfile());
    storage.set(STORAGE_KEYS.session, { loggedIn: true, email: user.email });
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    renderCurrentView();
  });

  document.getElementById('signupForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || name.length < 2) {
      setFieldError('signupName', 'Name must be at least 2 characters.');
      return;
    }

    if (!email || !validateEmail(email)) {
      setFieldError('signupEmail', 'Please enter a valid email.');
      return;
    }

    if (!password || password.length < 6) {
      setFieldError('signupPassword', 'Password must be at least 6 characters.');
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      passwordHash: hashValue(password)
    };

    state.user = newUser;
    state.profile = {
      ...getDefaultProfile(),
      fullName: name,
      email,
      fitnessGoal: 'Build Muscle'
    };
    storage.set(STORAGE_KEYS.user, newUser);
    storage.set(STORAGE_KEYS.profile, state.profile);
    storage.set(STORAGE_KEYS.session, { loggedIn: true, email: newUser.email });

    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    renderCurrentView();
    showToast('Account created successfully.', 'success');
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    state.user = null;
    storage.remove(STORAGE_KEYS.session);
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    clearAllAuthAlerts();
    updateAuthFormVisibility('login');
  });

  document.getElementById('profileShortcutBtn').addEventListener('click', () => {
    state.currentView = 'profile';
    renderCurrentView();
  });

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    renderCurrentView();
  });

  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });

  document.getElementById('globalSearch').addEventListener('input', (event) => {
    if (state.currentView !== 'workouts') {
      state.currentView = 'workouts';
    }
    state.workoutSearch = event.target.value;
    renderWorkoutsPage();
  });

  const pageContent = document.getElementById('pageContent');
  pageContent.addEventListener('click', (event) => {
    const vButton = event.target.closest('[data-view]');
    if (vButton) {
      state.currentView = vButton.dataset.view;
      renderCurrentView();
      return;
    }

    handlePageAction(event);
  });

  pageContent.addEventListener('submit', (event) => {
    if (event.target.id === 'profileForm') {
      event.preventDefault();
      const formData = new FormData(event.target);
      state.profile = {
        fullName: String(formData.get('fullName') || '').trim() || 'Athlete',
        email: String(formData.get('email') || '').trim() || state.user?.email || '',
        age: String(formData.get('age') || '').trim(),
        height: String(formData.get('height') || '').trim(),
        weight: String(formData.get('weight') || '').trim(),
        fitnessGoal: String(formData.get('fitnessGoal') || 'General Health')
      };
      storage.set(STORAGE_KEYS.profile, state.profile);
      if (state.user) {
        state.user.name = state.profile.fullName;
        state.user.email = state.profile.email;
        storage.set(STORAGE_KEYS.user, state.user);
      }
      updateSidebarUser();
      renderCurrentView();
      showToast('Profile saved successfully.', 'success');
    }
  });

  document.body.addEventListener('click', (event) => {
    const closeTarget = event.target.closest('[data-close-modal="true"]');
    if (closeTarget) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  document.querySelectorAll('[data-view]').forEach((element) => {
    element.addEventListener('click', handleGlobalNavigation);
  });

  document.querySelectorAll('.mobile-nav-item').forEach((element) => {
    element.addEventListener('click', handleGlobalNavigation);
  });

  handleRangeButtons();

  const session = storage.get(STORAGE_KEYS.session, null);
  if (session && session.loggedIn) {
    state.user = storage.get(STORAGE_KEYS.user, getDefaultUser());
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    renderCurrentView();
  } else {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
    updateAuthFormVisibility('login');
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
