document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check (MOVED TO THE VERY TOP for immediate redirect) ---
    const userToken = localStorage.getItem('userToken'); // Get token from local storage
    if (!userToken) {
        // If no token, redirect to login page immediately
        window.location.href = 'login.html';
        return; // Stop further script execution on this page if not authenticated
    }

    // Now, retrieve username as well (if needed for display, e.g., "Welcome, [username]!")
    // We get username from localStorage as it's set during login.
    let userName = localStorage.getItem('username') || 'User'; 
    
    // --- REMOVED THE OLD "User Name Prompt" SECTION from here ---
    // (It's no longer needed as username comes from login)


    // Get references to elements
    const motivationLine = document.getElementById('motivation-line');
    const newsContent = document.getElementById('news-content');
    const newTaskInput = document.getElementById('newTaskInput');
    const taskCategorySelect = document.getElementById('taskCategorySelect');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const studyTasksList = document.getElementById('study-tasks');
    const homeworkTasksList = document.getElementById('homework-tasks');
    const customCategoryInput = document.getElementById('customCategoryInput');
    const addCustomCategoryBtn = document.getElementById('addCustomCategoryBtn');
    const customTaskSections = document.getElementById('custom-task-sections');
    const allDailyTasksList = document.getElementById('all-daily-tasks');
    const weaknessImprovement = document.getElementById('weakness-improvement');
    const dayRating = document.getElementById('day-rating');
    const saveDayReviewBtn = document.getElementById('saveDayReviewBtn');
    const calendarDiv = document.getElementById('calendar');
    const selectedDayHistory = document.getElementById('selected-day-history');
    const toggleNewsBtn = document.getElementById('toggleNewsBtn');
    const toggleCalendarBtn = document.getElementById('toggleCalendarBtn');
    const dailyNewsSection = document.getElementById('daily-news-section');
    const calendarHistorySection = document.getElementById('calendar-history-section');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    // New: Get references for close buttons and logout button
    const closeNewsBtn = document.getElementById('closeNewsBtn');
    const closeCalendarBtn = document.getElementById('closeCalendarBtn');
    const logoutBtn = document.getElementById('logoutBtn'); // Reference to the logout button


    // --- Dark Mode Logic ---
    const currentMode = localStorage.getItem('theme') || 'light';
    if (currentMode === 'dark') {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }

    if (darkModeToggle) { // Ensure button exists before adding listener
        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            } else {
                localStorage.setItem('theme', 'light');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            }
        });
    }

    // --- Motivation Line ---
    const motivations = [
        "Your future is created by what you do today, not tomorrow.",
        "The best way to predict the future is to create it.",
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The journey of a thousand miles begins with a single step.",
        "Don't wait for opportunity. Create it."
    ];
    let currentMotivationIndex = 0;

    function updateMotivationLine() {
        if (motivationLine) { // Add null check for motivationLine
            motivationLine.textContent = motivations[currentMotivationIndex];
            currentMotivationIndex = (currentMotivationIndex + 1) % motivations.length;
        }
    }
    setInterval(updateMotivationLine, 7000);
    updateMotivationLine();

    // --- Daily News Section (Placeholder) ---
    function fetchDailyNews() {
        if (newsContent) { // Add null check for newsContent
            newsContent.innerHTML = `
                <p><strong><i class="fas fa-arrow-right"></i> Tech:</strong> AI integration in everyday apps is on the rise.</p>
                <p><strong><i class="fas fa-arrow-right"></i> Economy:</strong> Global markets show cautious optimism this week.</p>
                <p><strong><i class="fas fa-arrow-right"></i> Lifestyle:</strong> Importance of mental well-being in busy schedules.</p>
                <p><strong><i class="fas fa-arrow-right"></i> Local:</strong> Community cleanup drive successful in City Park.</p>
            `;
        }
    }
    fetchDailyNews();

    // --- Task Management ---
    // Note: Tasks are still stored by date for now, but will eventually be user-specific from backend
    let tasks = JSON.parse(localStorage.getItem('dailyTasks')) || {};
    let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];

    function saveTasks() {
        localStorage.setItem('dailyTasks', JSON.stringify(tasks));
    }

    function saveCustomCategories() {
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        populateCategorySelect();
    }

    function populateCategorySelect() {
        if (taskCategorySelect) { // Add null check for taskCategorySelect
            const existingCustomOptions = taskCategorySelect.querySelectorAll('option[value]:not([value="study"]):not([value="homework"])');
            existingCustomOptions.forEach(option => option.remove());

            customCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                taskCategorySelect.appendChild(option);
            });
        }
    }

    function renderTasks(date) {
        const todayTasks = tasks[date] || {
            study: [],
            homework: [],
            custom: {}
        };

        if (studyTasksList) studyTasksList.innerHTML = '';
        if (homeworkTasksList) homeworkTasksList.innerHTML = '';
        if (customTaskSections) customTaskSections.innerHTML = '';
        if (allDailyTasksList) allDailyTasksList.innerHTML = '';

        if (studyTasksList) { // Check if element exists
            if (todayTasks.study.length === 0) {
                studyTasksList.innerHTML = '<li class="no-task-message">No study tasks for today.</li>';
            } else {
                todayTasks.study.forEach(task => addTaskToDOM(task, studyTasksList, 'study', date));
            }
        }

        if (homeworkTasksList) { // Check if element exists
            if (todayTasks.homework.length === 0) {
                homeworkTasksList.innerHTML = '<li class="no-task-message">No homework tasks for today.</li>';
            } else {
                todayTasks.homework.forEach(task => addTaskToDOM(task, homeworkTasksList, 'homework', date));
            }
        }
        
        if (customTaskSections) { // Check if element exists before adding content
            customCategories.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('task-category-item');
                categoryDiv.innerHTML = `
                    <h4><i class="fas fa-folder"></i> ${category}</h4>
                    <ul id="${category.toLowerCase().replace(/\s/g, '-')}-tasks" class="task-list"></ul>
                    <div class="custom-category-input-group">
                        <input type="text" class="add-task-to-custom-input" placeholder="Add task to ${category}...">
                        <button class="add-task-to-custom-btn" data-category="${category}"><i class="fas fa-plus"></i> Add</button>
                        <button class="delete-custom-category-btn" data-category="${category}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                customTaskSections.appendChild(categoryDiv);

                const customTaskList = categoryDiv.querySelector('ul');
                const categoryTasks = todayTasks.custom[category] || [];
                if (customTaskList) { // Check before setting innerHTML
                    if (categoryTasks.length === 0) {
                        customTaskList.innerHTML = `<li class="no-task-message">No tasks in ${category} category.</li>`;
                    } else {
                        categoryTasks.forEach(task => addTaskToDOM(task, customTaskList, category, date));
                    }
                }
            });

            document.querySelectorAll('.add-task-to-custom-btn').forEach(button => {
                button.onclick = (e) => {
                    const category = e.currentTarget.dataset.category;
                    const input = e.currentTarget.previousElementSibling;
                    const taskText = input.value.trim();
                    if (taskText) {
                        addTask(taskText, category, date);
                        input.value = '';
                    }
                };
            });

            document.querySelectorAll('.delete-custom-category-btn').forEach(button => {
                button.onclick = (e) => {
                    const categoryToDelete = e.currentTarget.dataset.category;
                    if (confirm(`Are you sure you want to delete the category "${categoryToDelete}" and all its tasks?`)) {
                        deleteCustomCategory(categoryToDelete);
                    }
                };
            });
        } // End if customTaskSections exists

        const allTasksForOverview = [];
        if (todayTasks.study) allTasksForOverview.push(...todayTasks.study);
        if (todayTasks.homework) allTasksForOverview.push(...todayTasks.homework);
        if (todayTasks.custom) {
            for (const category in todayTasks.custom) {
                allTasksForOverview.push(...todayTasks.custom[category]);
            }
        }

        if (allDailyTasksList) { // Check if element exists
            if (allTasksForOverview.length === 0) {
                allDailyTasksList.innerHTML = '<li class="no-task-message">No tasks added for today yet.</li>';
            } else {
                allTasksForOverview.forEach(task => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}" style="color:${task.completed ? 'var(--primary-color)' : '#888'};"></i> ${task.text}`;
                    if (task.completed) {
                        li.classList.add('completed');
                    }
                    allDailyTasksList.appendChild(li);
                });
            }
        }
    }

    function addTask(taskText, category, date) {
        if (!tasks[date]) {
            tasks[date] = { study: [], homework: [], custom: {} };
        }
        if (category === 'study') {
            tasks[date].study.push({ text: taskText, completed: false });
        } else if (category === 'homework') {
            tasks[date].homework.push({ text: taskText, completed: false });
        } else {
            if (!tasks[date].custom[category]) {
                tasks[date].custom[category] = [];
            }
            tasks[date].custom[category].push({ text: taskText, completed: false });
        }
        saveTasks();
        renderTasks(selectedDate);
    }

    function addTaskToDOM(task, listElement, category, date) {
        const li = document.createElement('li');
        
        const taskContentDiv = document.createElement('div');
        taskContentDiv.classList.add('task-content');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.onchange = () => toggleTaskComplete(task.text, category, date);
        taskContentDiv.appendChild(checkbox);

        const taskTextSpan = document.createElement('span');
        taskTextSpan.textContent = task.text;
        taskContentDiv.appendChild(taskTextSpan);

        if (task.completed) {
            li.classList.add('completed');
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('task-actions');
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.title = 'Delete Task';
        deleteBtn.onclick = () => deleteTask(task.text, category, date);

        actionsDiv.appendChild(deleteBtn);
        
        li.appendChild(taskContentDiv);
        li.appendChild(actionsDiv);
        listElement.appendChild(li);
    }

    function toggleTaskComplete(taskText, category, date) {
        let taskList;
        if (category === 'study') {
            taskList = tasks[date].study;
        } else if (category === 'homework') {
            taskList = tasks[date].homework;
        } else {
            taskList = tasks[date].custom[category];
        }

        const task = taskList.find(t => t.text === taskText);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks(selectedDate);
        }
    }

    function deleteTask(taskText, category, date) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        let taskList;
        if (category === 'study') {
            taskList = tasks[date].study;
            tasks[date].study = taskList.filter(t => t.text !== taskText);
        } else if (category === 'homework') {
            taskList = tasks[date].homework;
            tasks[date].homework = taskList.filter(t => t.text !== taskText);
        } else {
            taskList = tasks[date].custom[category];
            tasks[date].custom[category] = taskList.filter(t => t.text !== taskText);
        }
        saveTasks();
        renderTasks(selectedDate);
    }

    function deleteCustomCategory(categoryToDelete) {
        customCategories = customCategories.filter(cat => cat !== categoryToDelete);
        saveCustomCategories();

        for (const date in tasks) {
            if (tasks[date].custom && tasks[date].custom[categoryToDelete]) {
                delete tasks[date].custom[categoryToDelete];
            }
        }
        saveTasks();

        renderTasks(selectedDate);
        alert(`Category "${categoryToDelete}" deleted successfully.`);
    }


    if (addTaskBtn) { // Add null check for addTaskBtn
        addTaskBtn.addEventListener('click', () => {
            const taskText = newTaskInput.value.trim();
            const selectedCategory = taskCategorySelect.value;
            if (taskText) {
                addTask(taskText, selectedCategory, selectedDate);
                newTaskInput.value = '';
            } else {
                alert('Please enter a task!');
            }
        });
    }

    if (addCustomCategoryBtn) { // Add null check for addCustomCategoryBtn
        addCustomCategoryBtn.addEventListener('click', () => {
            const newCategory = customCategoryInput.value.trim();
            if (newCategory) {
                if (!customCategories.includes(newCategory)) {
                    customCategories.push(newCategory);
                    saveCustomCategories();
                    renderTasks(selectedDate);
                    customCategoryInput.value = '';
                    alert(`Custom category "${newCategory}" added!`);
                } else {
                    alert('This category already exists!');
                }
            } else {
                alert('Please enter a custom category name!');
            }
        });
    }

    // --- Day Review ---
    if (saveDayReviewBtn) { // Add null check for saveDayReviewBtn
        saveDayReviewBtn.addEventListener('click', () => {
            if (!tasks[selectedDate]) {
                tasks[selectedDate] = { study: [], homework: [], custom: {} };
            }
            tasks[selectedDate].review = {
                weaknessImprovement: weaknessImprovement.value.trim(),
                rating: dayRating.value
            };
            saveTasks();
            alert('Day review saved!');
            renderCalendar(currentMonth, currentYear);
        });
    }

    function loadDayReview(date) {
        if (weaknessImprovement && dayRating) { // Add null check for elements
            const dayData = tasks[date];
            if (dayData && dayData.review) {
                weaknessImprovement.value = dayData.review.weaknessImprovement;
                dayRating.value = dayData.review.rating;
            } else {
                weaknessImprovement.value = '';
                dayRating.value = 3;
            }
        }
    }


    // --- Live Calendar & History ---
    let selectedDate = new Date().toISOString().slice(0, 10);
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    function renderCalendar(month, year) {
        if (!calendarDiv) return; // Add null check for calendarDiv
        calendarDiv.innerHTML = '';

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const today = new Date();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = firstDayOfMonth.getDay();

        const calendarHeader = document.createElement('div');
        calendarHeader.id = 'calendar-header';
        calendarHeader.innerHTML = `
            <button id="prevMonthBtn"><i class="fas fa-chevron-left"></i></button>
            <span>${monthNames[month]} ${year}</span>
            <button id="nextMonthBtn"><i class="fas fa-chevron-right"></i></button>
        `;
        calendarDiv.appendChild(calendarHeader);

        const table = document.createElement('table');
        let headerRow = table.insertRow();
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            let th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });

        let date = 1;
        for (let i = 0; i < 6; i++) {
            let row = table.insertRow();
            let rowHasContent = false;
            for (let j = 0; j < 7; j++) {
                let cell = row.insertCell();
                if (i === 0 && j < startDay) {
                    cell.textContent = '';
                } else if (date > daysInMonth) {
                    cell.textContent = '';
                } else {
                    cell.textContent = date;
                    const cellDate = new Date(year, month, date);
                    const formattedCellDate = cellDate.toISOString().slice(0, 10);

                    if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                        cell.classList.add('today');
                    }
                    // Check if any data exists for this date to apply 'has-history'
                    if (tasks[formattedCellDate] && (Object.keys(tasks[formattedCellDate].custom).length > 0 || tasks[formattedCellDate].study.length > 0 || tasks[formattedCellDate].homework.length > 0 || (tasks[formattedCellDate].review && (tasks[formattedCellDate].review.weaknessImprovement || tasks[formattedCellDate].review.rating)))) {
                        cell.classList.add('has-history');
                    }
                    if (formattedCellDate === selectedDate) {
                        cell.classList.add('selected-day');
                    }
                    
                    // Modify onclick to open history.html for days with history
                    if (cell.classList.contains('has-history') && formattedCellDate !== today.toISOString().slice(0, 10)) {
                        cell.onclick = () => openHistoryPage(formattedCellDate);
                    } else {
                        // For today or days without history, just select the date
                        cell.onclick = () => selectCalendarDate(formattedCellDate);
                    }
                    
                    rowHasContent = true;
                    date++;
                }
            }
            if (!rowHasContent && date > daysInMonth) {
                break;
            }
        }
        calendarDiv.appendChild(table);

        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        if (prevMonthBtn) { // Add null check
            prevMonthBtn.onclick = () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar(currentMonth, currentYear);
            };
        }
        if (nextMonthBtn) { // Add null check
            nextMonthBtn.onclick = () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendar(currentMonth, currentYear);
            };
        }
    }

    function selectCalendarDate(date) {
        selectedDate = date;
        renderTasks(selectedDate);
        loadDayReview(selectedDate);
        if (document.getElementById('selected-day-history')) { // Add null check
            document.getElementById('selected-day-history').innerHTML = '<p>Select a date with recorded history to view details in a new page.</p>';
        }
        renderCalendar(currentMonth, currentYear);
    }

    // Function to open the history page
    function openHistoryPage(date) {
        sessionStorage.setItem('selectedHistoryDate', date);
        window.open('history.html', '_blank'); // Open in a new tab/window
    }

    // --- Mobile Responsiveness Toggling ---
    // Added null checks to ensure elements exist before adding listeners
    if (toggleNewsBtn && dailyNewsSection && calendarHistorySection) {
        toggleNewsBtn.addEventListener('click', () => {
            dailyNewsSection.classList.toggle('visible-mobile');
            calendarHistorySection.classList.remove('visible-mobile');
        });
    }

    if (toggleCalendarBtn && dailyNewsSection && calendarHistorySection) {
        toggleCalendarBtn.addEventListener('click', () => {
            calendarHistorySection.classList.toggle('visible-mobile');
            dailyNewsSection.classList.remove('visible-mobile');
        });
    }

    // Event listeners for close buttons
    if (closeNewsBtn && dailyNewsSection) {
        closeNewsBtn.addEventListener('click', () => {
            dailyNewsSection.classList.remove('visible-mobile');
        });
    }

    if (closeCalendarBtn && calendarHistorySection) {
        closeCalendarBtn.addEventListener('click', () => {
            calendarHistorySection.classList.remove('visible-mobile');
        });
    }

    // --- Logout Logic (UPDATED) ---
    if (logoutBtn) { // Ensure button exists before adding listener
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userToken'); // Remove the token
            localStorage.removeItem('username'); // Remove username
            localStorage.removeItem('dailyTasks'); // Clear local tasks (important for user-specific data)
            localStorage.removeItem('customCategories'); // Clear custom categories

            alert('Logged out successfully!'); // Provide user feedback
            window.location.href = 'login.html'; // Redirect to login page
        });
    }

    // Initial renders (should be called only if user is authenticated)
    // These calls are now inside the DOMContentLoaded, after the authentication check.
    // If the user is not authenticated, the script returns early.
    populateCategorySelect();
    renderTasks(selectedDate);
    loadDayReview(selectedDate);
    renderCalendar(currentMonth, currentYear);
});
