document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    const userToken = localStorage.getItem('userToken'); // Get token from local storage
    if (!userToken) {
        window.location.href = 'login.html';
        return; // Stop further script execution if not authenticated
    }

    const historyDetailsDiv = document.getElementById('history-details');
    const historyDateElement = document.getElementById('historyDate'); 
    const selectedDateRaw = sessionStorage.getItem('selectedHistoryDate');
    const userName = localStorage.getItem('username') || 'User'; // Get username from local storage
    const backendBaseUrl = 'http://localhost:5000/api'; // Your backend server URL

    // Apply dark mode preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Function to fetch tasks from the backend (Similar to index.js)
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
            // Group tasks by category for rendering on history page
            const groupedTasks = { study: [], homework: [], custom: {} };
            tasksData.forEach(task => {
                if (task.category === 'study') groupedTasks.study.push(task);
                else if (task.category === 'homework') groupedTasks.homework.push(task);
                else {
                    const catKey = task.customCategoryName || 'custom';
                    if (!groupedTasks.custom[catKey]) {
                        groupedTasks.custom[catKey] = [];
                    }
                    groupedTasks.custom[catKey].push(task);
                }
            });
            return groupedTasks;
        } catch (error) {
            console.error('Error fetching tasks from backend for history:', error);
            // alert('Failed to load history tasks. Please try again.'); 
            return { study: [], homework: [], custom: {} }; // Return empty tasks on error
        }
    }

    async function renderHistoryPage() {
        if (!selectedDateRaw) {
            historyDetailsDiv.innerHTML = '<p class="no-data">No date selected for history.</p>';
            return;
        }

        const dayDataTasks = await fetchTasksFromBackend(selectedDateRaw); // Fetch tasks for selected date
        const dayReviews = JSON.parse(localStorage.getItem('dayReviews')) || {}; // Day reviews are still local for now
        const dayReviewData = dayReviews[selectedDateRaw];

        let htmlContent = '';

        // --- Format the date for display ---
        const dateObj = new Date(selectedDateRaw + 'T00:00:00'); 
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);

        // Personalized Motivation based on user and data
        let personalizedMotivation = `Hello ${userName}, you are doing great!`;
        const totalTasks = (dayDataTasks.study?.length || 0) + (dayDataTasks.homework?.length || 0) + Object.values(dayDataTasks.custom || {}).flat().length;
        const completedTasks = (dayDataTasks.study?.filter(t => t.completed).length || 0) + (dayDataTasks.homework?.filter(t => t.completed).length || 0) + Object.values(dayDataTasks.custom || {}).flat().filter(t => t.completed).length;

        if (dayReviewData && dayReviewData.rating >= 4) {
            personalizedMotivation = `Excellent work, ${userName}! You had a highly productive day. Keep it up!`;
        } else if (totalTasks > 0 && completedTasks === totalTasks) {
            personalizedMotivation = `Fantastic, ${userName}! You completed all your tasks for this day. Well done!`;
        } else if (totalTasks > 0 && completedTasks > 0) {
            personalizedMotivation = `Good effort, ${userName}! You made solid progress on your tasks.`;
        } else if (totalTasks > 0 && completedTasks === 0) {
            personalizedMotivation = `Remember, ${userName}, every small step counts. Don't give up!`;
        } else {
            personalizedMotivation = `No tasks recorded for this day, ${userName}. A good day to plan for the future!`;
        }

        // Populate the historyDate element directly
        if (historyDateElement) {
            historyDateElement.innerHTML = `<i class="fas fa-calendar-day"></i> Daily Task History for ${formattedDate}`;
        }

        htmlContent += `
            <p class="personalized-message">${personalizedMotivation}</p>
        `;

        // Tasks Section
        htmlContent += `
            <div class="section-divider"></div>
            <h2><i class="fas fa-tasks"></i> Tasks Recorded:</h2>
        `;
        let tasksFound = false;

        if (dayDataTasks.study && dayDataTasks.study.length > 0) {
            tasksFound = true;
            htmlContent += `
                <div class="task-category-item">
                    <h4><i class="fas fa-book-reader"></i> Study Tasks</h4>
                    <ul class="task-list">
            `;
            dayDataTasks.study.forEach(task => {
                htmlContent += `<li class="${task.completed ? 'completed' : ''}">
                    <i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}"></i> ${task.text}
                </li>`;
            });
            htmlContent += `</ul></div>`;
        }

        if (dayDataTasks.homework && dayDataTasks.homework.length > 0) {
            tasksFound = true;
            htmlContent += `
                <div class="task-category-item">
                    <h4><i class="fas fa-home"></i> Home Work Tasks</h4>
                    <ul class="task-list">
            `;
            dayDataTasks.homework.forEach(task => {
                htmlContent += `<li class="${task.completed ? 'completed' : ''}">
                    <i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}"></i> ${task.text}
                </li>`;
            });
            htmlContent += `</ul></div>`;
        }

        if (dayDataTasks.custom) {
            for (const categoryName in dayDataTasks.custom) {
                if (dayDataTasks.custom[categoryName].length > 0) {
                    tasksFound = true;
                    htmlContent += `
                        <div class="task-category-item">
                            <h4><i class="fas fa-folder"></i> ${categoryName} Tasks</h4>
                            <ul class="task-list">
                    `;
                    dayDataTasks.custom[categoryName].forEach(task => {
                        htmlContent += `<li class="${task.completed ? 'completed' : ''}">
                            <i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}"></i> ${task.text}
                        </li>`;
                    });
                    htmlContent += `</ul></div>`;
                }
            }
        }

        if (!tasksFound) {
            htmlContent += '<p>No tasks were recorded for this day.</p>';
        }

        // Day Review Section (Still fetched from local storage)
        htmlContent += `
            <div class="section-divider"></div>
            <h2><i class="fas fa-star"></i> Day Review:</h2>
            <div class="day-review-section">
        `;
        if (dayReviewData && (dayReviewData.weaknessImprovement || dayReviewData.rating)) {
            htmlContent += `
                <p><strong>Weakness & Improvement:</strong> ${dayReviewData.weaknessImprovement || 'N/A'}</p>
                <p><strong>Rating:</strong> ${dayReviewData.rating || 'N/A'}/5</p>
            `;
        } else {
            htmlContent += '<p>No day review recorded for this day.</p>';
        }
        htmlContent += `</div>`;

        // Clear previous content and append new content
        historyDetailsDiv.innerHTML = historyDateElement.outerHTML + htmlContent; // Retain the h1 element
    }

    renderHistoryPage(); // Call this function to render the page on load
});
