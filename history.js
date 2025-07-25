document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check (MOVED TO THE VERY TOP) ---
    const userToken = localStorage.getItem('userToken'); // Get token from local storage
    if (!userToken) {
        // If no token, redirect to login page
        window.location.href = 'login.html';
        return; // Stop further script execution if not authenticated
    }

    // Now, retrieve username as well (if needed for display)
    const userName = localStorage.getItem('username') || 'User'; // Get username from local storage

    const historyDetailsDiv = document.getElementById('history-details');
    const historyDateElement = document.getElementById('historyDate'); // Get the new h1 element
    const selectedDateRaw = sessionStorage.getItem('selectedHistoryDate'); // Get the raw YYYY-MM-DD date
    const tasks = JSON.parse(localStorage.getItem('dailyTasks')) || {};

    // Apply dark mode preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    if (!selectedDateRaw || !tasks[selectedDateRaw]) {
        historyDetailsDiv.innerHTML = '<p class="no-data">No data available for the selected date.</p>';
        return;
    }

    const dayData = tasks[selectedDateRaw]; // Use selectedDateRaw for data retrieval

    // --- Format the date for display ---
    const dateObj = new Date(selectedDateRaw + 'T00:00:00'); // Add T00:00:00 to handle timezone issues
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options); // Example: "Monday, July 21, 2025"

    let htmlContent = '';

    // Personalized Motivation based on user and data
    let personalizedMotivation = `Hello ${userName}, you are doing great!`;
    const totalTasks = (dayData.study?.length || 0) + (dayData.homework?.length || 0) + Object.values(dayData.custom || {}).flat().length;
    const completedTasks = (dayData.study?.filter(t => t.completed).length || 0) + (dayData.homework?.filter(t => t.completed).length || 0) + Object.values(dayData.custom || {}).flat().filter(t => t.completed).length;

    if (dayData.review && dayData.review.rating >= 4) {
        personalizedMotivation = `Excellent work, ${userName}! You had a highly productive day. Keep it up!`;
    } else if (totalTasks > 0 && completedTasks === totalTasks && totalTasks > 0) {
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

    if (dayData.study && dayData.study.length > 0) {
        tasksFound = true;
        htmlContent += `
            <div class="task-category-item">
                <h4><i class="fas fa-book-reader"></i> Study Tasks</h4>
                <ul class="task-list">
        `;
        dayData.study.forEach(task => {
            htmlContent += `<li class="${task.completed ? 'completed' : ''}">
                <i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}"></i> ${task.text}
            </li>`;
        });
        htmlContent += `</ul></div>`;
    }

    if (dayData.homework && dayData.homework.length > 0) {
        tasksFound = true;
        htmlContent += `
            <div class="task-category-item">
                <h4><i class="fas fa-home"></i> Home Work Tasks</h4>
                <ul class="task-list">
        `;
        dayData.homework.forEach(task => {
            htmlContent += `<li class="${task.completed ? 'completed' : ''}">
                <i class="${task.completed ? 'fas fa-check-circle' : 'far fa-circle'}"></i> ${task.text}
            </li>`;
        });
        htmlContent += `</ul></div>`;
    }

    if (dayData.custom) {
        for (const category in dayData.custom) {
            if (dayData.custom[category].length > 0) {
                tasksFound = true;
                htmlContent += `
                    <div class="task-category-item">
                        <h4><i class="fas fa-folder"></i> ${category} Tasks</h4>
                        <ul class="task-list">
                `;
                dayData.custom[category].forEach(task => {
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

    // Day Review Section
    htmlContent += `
        <div class="section-divider"></div>
        <h2><i class="fas fa-star"></i> Day Review:</h2>
        <div class="day-review-section">
    `;
    if (dayData.review && (dayData.review.weaknessImprovement || dayData.review.rating)) {
        htmlContent += `
            <p><strong>Weakness & Improvement:</strong> ${dayData.review.weaknessImprovement || 'N/A'}</p>
            <p><strong>Rating:</strong> ${dayData.review.rating || 'N/A'}/5</p>
        `;
    } else {
        htmlContent += '<p>No day review recorded for this day.</p>';
    }
    htmlContent += `</div>`;

    // Now append the generated HTML content below the historyDate element
    historyDetailsDiv.innerHTML += htmlContent;
});
