// ============================================
// GLOBAL VARIABLES
// ============================================
let currentUser = null;
let workouts = [];
let weeklyChart = null;

// ============================================
// DOM ELEMENTS
// ============================================
const authScreen = document.getElementById('authScreen');
const appScreen = document.getElementById('appScreen');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormElement = document.getElementById('loginFormElement');
const signupFormElement = document.getElementById('signupFormElement');
const workoutForm = document.getElementById('workoutForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const successToast = document.getElementById('successToast');

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function showSuccess(message) {
    document.getElementById('successToastMessage').textContent = message;
    successToast.classList.remove('hidden');
    setTimeout(() => {
        successToast.classList.add('hidden');
    }, 3000);
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
    const inputElement = errorElement.previousElementSibling;
    if (inputElement && inputElement.tagName !== 'SELECT') {
        inputElement.classList.add('error');
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.classList.remove('show');
    const inputElement = errorElement.previousElementSibling;
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

function clearAllErrors(formPrefix) {
    const errors = document.querySelectorAll(`[id^="${formPrefix}"][id$="Error"]`);
    errors.forEach(error => {
        error.classList.remove('show');
    });
    const inputs = document.querySelectorAll('.form-input.error');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateLoginForm() {
    let isValid = true;
    clearAllErrors('login');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email) {
        showError('loginEmailError', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('loginEmailError', 'Please enter a valid email');
        isValid = false;
    }

    if (!password) {
        showError('loginPasswordError', 'Password is required');
        isValid = false;
    }

    return isValid;
}

function validateSignupForm() {
    let isValid = true;
    clearAllErrors('signup');

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name) {
        showError('signupNameError', 'Name is required');
        isValid = false;
    } else if (name.length < 2) {
        showError('signupNameError', 'Name must be at least 2 characters');
        isValid = false;
    }

    if (!email) {
        showError('signupEmailError', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError('signupEmailError', 'Please enter a valid email');
        isValid = false;
    }

    if (!password) {
        showError('signupPasswordError', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showError('signupPasswordError', 'Password must be at least 6 characters');
        isValid = false;
    }

    return isValid;
}

function validateWorkoutForm() {
    let isValid = true;
    clearAllErrors('workout');

    const type = document.getElementById('workoutType').value;
    const name = document.getElementById('workoutName').value.trim();
    const duration = parseInt(document.getElementById('workoutDuration').value);
    const calories = parseInt(document.getElementById('workoutCalories').value);
    const date = document.getElementById('workoutDate').value;

    if (!type) {
        showError('workoutTypeError', 'Please select a workout type');
        isValid = false;
    }

    if (!name) {
        showError('workoutNameError', 'Please enter an exercise name');
        isValid = false;
    } else if (name.length < 2) {
        showError('workoutNameError', 'Name must be at least 2 characters');
        isValid = false;
    }

    if (!duration || duration < 1) {
        showError('workoutDurationError', 'Duration must be at least 1 minute');
        isValid = false;
    }

    if (calories === undefined || calories < 0) {
        showError('workoutCaloriesError', 'Please enter valid calories');
        isValid = false;
    }

    if (!date) {
        showError('workoutDateError', 'Please select a date');
        isValid = false;
    }

    return isValid;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
function switchToSignup() {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    clearAllErrors('login');
}

function switchToLogin() {
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    clearAllErrors('signup');
}

async function handleLogin(e) {
    e.preventDefault();
    
    if (!validateLoginForm()) {
        return;
    }

    showLoading();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Simulate API call
    setTimeout(() => {
        // Mock authentication - in production, use real Firebase Auth
        const storedUser = localStorage.getItem('fitnessUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.email === email && user.password === password) {
                currentUser = user;
                showApp();
                hideLoading();
            } else {
                hideLoading();
                document.getElementById('loginError').textContent = 'Invalid email or password';
                document.getElementById('loginError').classList.remove('hidden');
            }
        } else {
            hideLoading();
            document.getElementById('loginError').textContent = 'No account found. Please sign up.';
            document.getElementById('loginError').classList.remove('hidden');
        }
    }, 1000);
}

async function handleSignup(e) {
    e.preventDefault();
    
    if (!validateSignupForm()) {
        return;
    }

    showLoading();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    // Simulate API call
    setTimeout(() => {
        // Mock user creation - in production, use real Firebase Auth
        const user = {
            name: name,
            email: email,
            password: password,
            uid: 'user_' + Date.now()
        };
        
        localStorage.setItem('fitnessUser', JSON.stringify(user));
        currentUser = user;
        showApp();
        hideLoading();
        showSuccess('Account created successfully!');
    }, 1000);
}

function handleLogout() {
    currentUser = null;
    workouts = [];
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    loginFormElement.reset();
    signupFormElement.reset();
    clearAllErrors('login');
    clearAllErrors('signup');
}

function showApp() {
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.name}!`;
    loadWorkouts();
    updateStats();
    updateChart();
}

// ============================================
// WORKOUT FUNCTIONS
// ============================================
async function handleAddWorkout(e) {
    e.preventDefault();
    
    if (!validateWorkoutForm()) {
        return;
    }

    showLoading();

    const workout = {
        id: 'workout_' + Date.now(),
        type: document.getElementById('workoutType').value,
        name: document.getElementById('workoutName').value.trim(),
        duration: parseInt(document.getElementById('workoutDuration').value),
        calories: parseInt(document.getElementById('workoutCalories').value),
        date: document.getElementById('workoutDate').value,
        notes: document.getElementById('workoutNotes').value.trim(),
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
    };

    // Simulate API call
    setTimeout(() => {
        workouts.unshift(workout);
        saveWorkouts();
        workoutForm.reset();
        document.getElementById('workoutDate').valueAsDate = new Date();
        renderWorkouts();
        updateStats();
        updateChart();
        hideLoading();
        showSuccess('Workout logged successfully! 💪');
        clearAllErrors('workout');
    }, 500);
}

function deleteWorkout(workoutId) {
    if (confirm('Are you sure you want to delete this workout?')) {
        workouts = workouts.filter(w => w.id !== workoutId);
        saveWorkouts();
        renderWorkouts();
        updateStats();
        updateChart();
        showSuccess('Workout deleted');
    }
}

function saveWorkouts() {
    const key = `workouts_${currentUser.uid}`;
    localStorage.setItem(key, JSON.stringify(workouts));
}

function loadWorkouts() {
    const key = `workouts_${currentUser.uid}`;
    const stored = localStorage.getItem(key);
    workouts = stored ? JSON.parse(stored) : [];
    renderWorkouts();
}

function renderWorkouts() {
    const workoutsList = document.getElementById('workoutsList');
    
    if (workouts.length === 0) {
        workoutsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏃</div>
                <p class="empty-text">No workouts logged yet. Start tracking!</p>
            </div>
        `;
        return;
    }

    workoutsList.innerHTML = workouts.map(workout => `
        <div class="workout-item">
            <div class="workout-header">
                <div class="workout-info">
                    <div class="workout-title-row">
                        <span class="badge badge-${workout.type}">${workout.type}</span>
                        <h3 class="workout-name">${workout.name}</h3>
                    </div>
                    <div class="workout-meta">
                        <span class="meta-item">
                            <span>⏱️</span> ${workout.duration} min
                        </span>
                        <span class="meta-item">
                            <span>🔥</span> ${workout.calories} cal
                        </span>
                        <span class="meta-item">
                            <span>📅</span> ${formatDate(workout.date)}
                        </span>
                    </div>
                    ${workout.notes ? `<p class="workout-notes">"${workout.notes}"</p>` : ''}
                </div>
                <button 
                    onclick="deleteWorkout('${workout.id}')"
                    class="delete-btn"
                    title="Delete workout"
                >
                    <svg class="delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================
function updateStats() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    
    document.getElementById('totalWorkouts').textContent = workouts.length;
    document.getElementById('weekWorkouts').textContent = weekWorkouts.length;
    document.getElementById('goalProgress').textContent = weekWorkouts.length;
    
    const weeklyGoal = 5;
    const progress = Math.min((weekWorkouts.length / weeklyGoal) * 100, 100);
    document.getElementById('goalProgressBar').style.width = progress + '%';

    const totalDuration = weekWorkouts.reduce((sum, w) => sum + w.duration, 0);
    document.getElementById('totalDuration').textContent = totalDuration;
}

// ============================================
// CHART FUNCTIONS
// ============================================
function updateChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    // Get last 7 days
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }

    // Count workouts per day
    const workoutsPerDay = days.map(day => {
        return workouts.filter(w => w.date === day).length;
    });

    // Calculate calories per day
    const caloriesPerDay = days.map(day => {
        return workouts
            .filter(w => w.date === day)
            .reduce((sum, w) => sum + w.calories, 0);
    });

    const labels = days.map(day => {
        const date = new Date(day);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Workouts',
                    data: workoutsPerDay,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Calories Burned',
                    data: caloriesPerDay,
                    backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    borderRadius: 8,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Workouts',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Calories',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('showSignupBtn').addEventListener('click', switchToSignup);
document.getElementById('showLoginBtn').addEventListener('click', switchToLogin);
loginFormElement.addEventListener('submit', handleLogin);
signupFormElement.addEventListener('submit', handleSignup);
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
workoutForm.addEventListener('submit', handleAddWorkout);

// ============================================
// INITIALIZATION
// ============================================
// Set default date to today
document.getElementById('workoutDate').valueAsDate = new Date();

// Check if user is already logged in
const storedUser = localStorage.getItem('fitnessUser');
if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showApp();
}
