document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check (MOVED TO THE VERY TOP for immediate redirect) ---
    const userToken = localStorage.getItem('userToken'); // Get token from local storage
    if (!userToken) {
        // If no token, redirect to login page immediately
        window.location.href = 'login.html';
        return; // Stop further script execution on this page if not authenticated
    }

    // Now, retrieve username and userId from the token or local storage (if stored)
    // For now, we are relying on username from local storage.
    // In a full JWT implementation, we would decode the token to get userId.
    let userName = localStorage.getItem('username') || 'User'; 
    const backendBaseUrl = 'http://localhost:5000/api'; // Your backend server URL

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
    const logoutBtn = document.getElementById('logoutBtn');


    // --- Dark Mode Logic ---
    const currentMode = localStorage.getItem('theme') || 'light';
    if (currentMode === 'dark') {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }

    if (darkModeToggle) {
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
        if (motivationLine) {
            motivationLine.textContent = motivations[currentMotivationIndex];
            currentMotivationIndex = (currentMotivationIndex + 1) % motivations.length;
        }
    }
    setInterval(updateMotivationLine, 7000);
    updateMotivationLine();

    // --- Daily News Section (Placeholder) ---
    function fetchDailyNews() {
        if (newsContent) {
            newsContent.innerHTML = `
                <p><strong><i class="fas fa-arrow-right"></i> Tech:</strong> AI integration in everyday apps is on the rise.</p>
                <p><strong><i class="fas fa-arrow-right"></i> Economy:</strong> Global markets show cautious optimism this week.</p>
                <p><strong><i class="fas fa-arrow-right"></i> Lifestyle:</strong> Importance of mental well-being in busy schedules.</p>
                <p><strong><i class="fas fa-arrow-right"></i> Local:</strong> Community cleanup drive successful in City Park.</p>
            `;
        }
    }
    fetchDailyNews();

    // --- Task Management (MODIFIED TO INTERACT WITH BACKEND) ---
    // NO LONGER using localStorage.getItem('dailyTasks') directly for fetching.
    // Tasks will be fetched from the backend for the selectedDate.

    // No longer need saveTasks() as tasks are saved via API
    // No longer need loadDayReview() as review is fetched via API (or handled separately)

    // Function to fetch tasks from the backend
    async function fetchTasksFromBackend(date) {
        try {
            const response = await fetch(`${backendBaseUrl}/tasks?date=${date}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` // Send JWT token for authentication
                }
            });

            if (!response.ok) {
                if (response.status === 401) { // Token expired or invalid
                    alert('Session expired. Please log in again.');
                    localStorage.clear();
                    window.location.href = 'login.html';
                    return [];
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tasksData = await response.json();
            // Group tasks by category for rendering
            const groupedTasks = { study: [], homework: [], custom: {} };
            tasksData.forEach(task => {
                if (task.category === 'study') groupedTasks.study.push(task);
                else if (task.category === 'homework') groupedTasks.homework.push(task);
                else {
                    if (!groupedTasks.custom[task.customCategoryName || task.category]) {
                        groupedTasks.custom[task.customCategoryName || task.category] = [];
                    }
                    groupedTasks.custom[task.customCategoryName || task.category].push(task);
                }
            });
            return groupedTasks;
        } catch (error) {
            console.error('Error fetching tasks from backend:', error);
            // alert('Failed to load tasks. Please try again.'); // Consider showing a less intrusive message
            return { study: [], homework: [], custom: {} }; // Return empty tasks on error
        }
    }


    // Function to render tasks fetched from backend
    async function renderTasks(date) {
        const todayTasks = await fetchTasksFromBackend(date); // Fetch from backend

        if (studyTasksList) studyTasksList.innerHTML = '';
        if (homeworkTasksList) homeworkTasksList.innerHTML = '';
        if (customTaskSections) customTaskSections.innerHTML = '';
        if (allDailyTasksList) allDailyTasksList.innerHTML = '';

        // Render Study Tasks
        if (studyTasksList) {
            if (todayTasks.study.length === 0) {
                studyTasksList.innerHTML = '<li class="no-task-message">No study tasks for today.</li>';
            } else {
                todayTasks.study.forEach(task => addTaskToDOM(task, studyTasksList, task.category, date));
            }
        }

        // Render Home Work Tasks
        if (homeworkTasksList) {
            if (todayTasks.homework.length === 0) {
                homeworkTasksList.innerHTML = '<li class="no-task-message">No homework tasks for today.</li>';
            } else {
                todayTasks.homework.forEach(task => addTaskToDOM(task, homeworkTasksList, task.category, date));
            }
        }
        
        // Render Custom Categories and their tasks
        // Fetch custom categories from local storage as they are not user specific yet
        // A future enhancement would be to store custom categories in the backend per user
        customCategories.forEach(category => {
            if (customTaskSections) {
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
                if (customTaskList) {
                    if (categoryTasks.length === 0) {
                        customTaskList.innerHTML = `<li class="no-task-message">No tasks in ${category} category.</li>`;
                    } else {
                        categoryTasks.forEach(task => addTaskToDOM(task, customTaskList, task.category, date));
                    }
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
                if (confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This will only remove the category from your local list.`)) { // Clarify that it's local
                    deleteCustomCategory(categoryToDelete);
                }
            };
        });

        // Consolidate all tasks for overview
        const allTasksForOverview = [
            ...todayTasks.study, 
            ...todayTasks.homework, 
            ...Object.values(todayTasks.custom).flat()
        ];

        if (allDailyTasksList) {
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


    // Function to add a task (MODIFIED TO SEND TO BACKEND)
    async function addTask(taskText, category, date) {
        const customCatName = (category !== 'study' && category !== 'homework') ? category : undefined;
        
        try {
            const response = await fetch(`${backendBaseUrl}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` // Send token
                },
                body: JSON.stringify({
                    text: taskText,
                    category: (customCatName ? 'custom' : category), // Ensure category is 'custom' if it's a custom name
                    customCategoryName: customCatName,
                    date: date
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newTask = await response.json();
            alert('Task added successfully!'); // Confirmation
            renderTasks(selectedDate); // Re-render tasks for the current date
            renderCalendar(currentMonth, currentYear); // Update calendar if needed (e.g., has-history class)

        } catch (error) {
            console.error('Error adding task:', error);
            alert('Failed to add task. Please try again.');
        }
    }

    // Function to render task in DOM (used for both local and fetched tasks)
    function addTaskToDOM(task, listElement, category, date) {
        const li = document.createElement('li');
        li.dataset.taskId = task._id; // Store MongoDB Task ID on the element
        
        const taskContentDiv = document.createElement('div');
        taskContentDiv.classList.add('task-content');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.onchange = () => toggleTaskComplete(task._id, task.completed, date); // Pass task ID
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
        deleteBtn.onclick = () => deleteTask(task._id, date); // Pass task ID

        actionsDiv.appendChild(deleteBtn);
        
        li.appendChild(taskContentDiv);
        li.appendChild(actionsDiv);
        if (listElement) listElement.appendChild(li); // Null check
    }

    // Function to toggle task complete status (MODIFIED TO SEND TO BACKEND)
    async function toggleTaskComplete(taskId, currentStatus, date) {
        try {
            const response = await fetch(`${backendBaseUrl}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}` // Send token
                },
                body: JSON.stringify({ completed: !currentStatus }) // Toggle status
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            renderTasks(date); // Re-render tasks for the current date
            renderCalendar(currentMonth, currentYear); // Update calendar if needed

        } catch (error) {
            console.error('Error toggling task complete:', error);
            alert('Failed to update task status. Please try again.');
        }
    }

    // Function to delete a task (MODIFIED TO SEND TO BACKEND)
    async function deleteTask(taskId, date) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const response = await fetch(`${backendBaseUrl}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userToken}` // Send token
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert('Task deleted successfully!');
            renderTasks(date); // Re-render tasks for the current date
            renderCalendar(currentMonth, currentYear); // Update calendar if needed

        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Failed to delete task. Please try again.');
        }
    }

    // Function to delete a custom category (still local as categories are not in backend yet)
    function deleteCustomCategory(categoryToDelete) {
        // This only removes the category from local storage and the dropdown.
        // If categories were stored in the backend, this would need an API call too.
        customCategories = customCategories.filter(cat => cat !== categoryToDelete);
        localStorage.setItem('customCategories', JSON.stringify(customCategories)); // Save updated local categories
        populateCategorySelect();
        alert(`Category "${categoryToDelete}" deleted from local list.`);
        renderTasks(selectedDate); // Re-render to reflect removal
    }


    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            const taskText = newTaskInput.value.trim();
            const selectedCategory = taskCategorySelect.value;
            if (taskText) {
                // Determine custom category name if selectedCategory is 'custom'
                const catName = (selectedCategory !== 'study' && selectedCategory !== 'homework') ? selectedCategory : undefined;
                addTask(taskText, selectedCategory, selectedDate); // Send to backend
                newTaskInput.value = '';
            } else {
                alert('Please enter a task!');
            }
        });
    }

    if (addCustomCategoryBtn) {
        addCustomCategoryBtn.addEventListener('click', () => {
            const newCategory = customCategoryInput.value.trim();
            if (newCategory) {
                if (!customCategories.includes(newCategory)) {
                    customCategories.push(newCategory);
                    localStorage.setItem('customCategories', JSON.stringify(customCategories)); // Save custom category locally
                    populateCategorySelect();
                    renderTasks(selectedDate);
                    customCategoryInput.value = '';
                    alert(`Custom category "${newCategory}" added to local list!`);
                } else {
                    alert('This category already exists!');
                }
            } else {
                alert('Please enter a custom category name!');
            }
        });
    }

    // --- Day Review (Still Local, could be moved to Backend later) ---
    if (saveDayReviewBtn) {
        saveDayReviewBtn.addEventListener('click', () => {
            // Day reviews are currently stored in local tasks object, linked by date.
            // If reviews need to be user-specific and persistent, they need their own backend model/routes.
            let dayReviews = JSON.parse(localStorage.getItem('dayReviews')) || {};
            dayReviews[selectedDate] = {
                weaknessImprovement: weaknessImprovement.value.trim(),
                rating: dayRating.value
            };
            localStorage.setItem('dayReviews', JSON.stringify(dayReviews));
            alert('Day review saved locally!');
            renderCalendar(currentMonth, currentYear);
        });
    }

    function loadDayReview(date) {
        if (weaknessImprovement && dayRating) {
            const dayReviews = JSON.parse(localStorage.getItem('dayReviews')) || {};
            const reviewData = dayReviews[date];
            if (reviewData) {
                weaknessImprovement.value = reviewData.weaknessImprovement;
                dayRating.value = reviewData.rating;
            } else {
                weaknessImprovement.value = '';
                dayRating.value = 3;
            }
        }
    }


    // --- Live Calendar & History (MODIFIED TO REFLECT BACKEND TASK DATA) ---
    let selectedDate = new Date().toISOString().slice(0, 10);
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    async function renderCalendar(month, year) {
        if (!calendarDiv) return;
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

                    // Check if tasks exist for this date from backend (or reviews from local storage for now)
                    const tasksForDate = await fetchTasksFromBackend(formattedCellDate);
                    const dayReviews = JSON.parse(localStorage.getItem('dayReviews')) || {};
                    const reviewForDate = dayReviews[formattedCellDate];

                    if (tasksForDate.study.length > 0 || tasksForDate.homework.length > 0 || Object.keys(tasksForDate.custom).length > 0 || reviewForDate) {
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
        if (prevMonthBtn) {
            prevMonthBtn.onclick = () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar(currentMonth, currentYear);
            };
        }
        if (nextMonthBtn) {
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

    async function selectCalendarDate(date) { // Made async to await fetchTasks
        selectedDate = date;
        await renderTasks(selectedDate); // Await tasks render
        loadDayReview(selectedDate); // Load local review
        if (document.getElementById('selected-day-history')) {
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
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('userToken'); // Remove the token
            localStorage.removeItem('username'); // Remove username
            localStorage.removeItem('dailyTasks'); // Remove old local tasks (no longer needed)
            localStorage.removeItem('customCategories'); // Remove old local categories
            localStorage.removeItem('dayReviews'); // Remove old local day reviews

            alert('Logged out successfully!'); // Provide user feedback
            window.location.href = 'login.html'; // Redirect to login page
        });
    }

    // Initial renders (should be called only if user is authenticated)
    // These calls are now inside the DOMContentLoaded, after the authentication check.
    // If the user is not authenticated, the script returns early.
    populateCategorySelect();
    renderTasks(selectedDate); // Initial fetch and render for today's tasks
    loadDayReview(selectedDate); // Load local review for today
    renderCalendar(currentMonth, currentYear); // Render calendar initially
});
