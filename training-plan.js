let activities = {};
let weeklySchedule = [];
let sections = [];
let activeEditorIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    fetch('training-plan.json')
        .then(res => res.json())
        .then(plan => {
            activities = plan.activities;
            weeklySchedule = JSON.parse(localStorage.getItem('weeklySchedule')) || plan.weeklySchedule;
            sections = plan.sections;

            renderSections();
            loadCargas();
            setupCollapsibles();
            setupFlexibleAgenda();
        })
        .catch(err => console.error('Erro ao carregar o plano:', err));
});

function saveCarga(exerciseId, value) {
    localStorage.setItem(exerciseId, value);
}

function loadCargas() {
    document.querySelectorAll('input[data-exercise-id]').forEach(input => {
        const savedValue = localStorage.getItem(input.dataset.exerciseId);
        if (savedValue) input.value = savedValue;
    });
}

function toggleDetails(row) {
    if (event.target.tagName === 'INPUT') return;
    let detailsRow = row.nextElementSibling;
    if (detailsRow && detailsRow.classList.contains('details-row')) {
        detailsRow.classList.toggle('hidden');
    }
}

function setupCollapsibles() {
    const collapsibleTitles = document.querySelectorAll('.collapsible-title');
    collapsibleTitles.forEach(title => {
        const content = title.nextElementSibling;
        if (content && content.tagName === 'TABLE') {
            content.classList.add('collapsible-content', 'hidden');
            title.addEventListener('click', () => {
                title.classList.toggle('expanded');
                content.classList.toggle('hidden');
            });
        }
    });
}

function renderSections() {
    const container = document.getElementById('sections-container');
    container.innerHTML = '';
    sections.forEach(section => {
        const div = document.createElement('div');
        div.className = `${section.colorClass || ''} content-section`;

        // header
        const header = `<h2 id="${section.id}" class="collapsible-title">${section.title}</h2>`;

        // table header
        const cols = section.columns.map(c => `<th>${c.title}</th>`).join('');
        let rowsHTML = '';

        section.exercises.forEach(ex => {
            const supClass = ex.superset ? 'superset-group' : '';
            let rowCells = '';
            section.columns.forEach(col => {
                if (col.key === 'areaIcon') {
                    rowCells += `<td>${ex.areaIcon ? `<img src="${ex.areaIcon}" onerror="this.style.display='none'" class="w-6 h-6 mx-auto" alt="">` : ''}</td>`;
                } else if (col.key === 'carga') {
                    const idAttr = ex.id ? `data-exercise-id="${ex.id}"` : '';
                    rowCells += `<td><input type="text" ${idAttr} oninput="saveCarga(this.dataset.exerciseId, this.value)" class="w-full text-sm p-1 border rounded-md"></td>`;
                } else {
                    const value = ex[col.key] || '';
                    const extraClass = col.key === 'name' ? 'exercise-name' : '';
                    rowCells += `<td class="${extraClass}">${value}</td>`;
                }
            });
            rowsHTML += `<tr class="${supClass} toggle-row" onclick="toggleDetails(this)">${rowCells}</tr>`;
            if (ex.note) {
                rowsHTML += `<tr class="details-row hidden"><td colspan="${section.columns.length}">${ex.note}</td></tr>`;
            }
        });

        const tableHTML = `<table class="collapsible-content hidden"><thead><tr>${cols}</tr></thead><tbody>${rowsHTML}</tbody></table>`;
        div.innerHTML = header + tableHTML;
        container.appendChild(div);
    });
}

function validateSchedule(schedule) {
    const warnings = Array(7).fill(null).map(() => ({ hasWarning: false, message: '' }));
    const strengthActivities = ['costas', 'peito', 'pernas'];

    for (let i = 0; i < 7; i++) {
        const currentDay = schedule[i];
        const nextDay = schedule[(i + 1) % 7];
        const prevDay = schedule[(i + 6) % 7];

        if (strengthActivities.includes(currentDay.activityId) && currentDay.activityId === nextDay.activityId) {
            warnings[(i + 1) % 7].hasWarning = true;
            warnings[(i + 1) % 7].message += 'Duas sessões de força idênticas em dias consecutivos.\n';
        }

        if (prevDay.activityId === 'costas' && currentDay.activityId === 'escalada') {
            warnings[i].hasWarning = true;
            warnings[i].message += 'Escalada não é recomendada após o treino de costas.\n';
        }

        if ((currentDay.activityId === 'pernas' && (nextDay.activityId === 'pedal' || prevDay.activityId === 'pedal')) ||
            (currentDay.activityId === 'pedal' && (nextDay.activityId === 'pernas' || prevDay.activityId === 'pernas')) ) {
            warnings[i].hasWarning = true;
            warnings[i].message += 'Treino de pernas e pedal em dias consecutivos não é ideal.\n';
        }
    }

    let globalWarning = '';
    const requiredActivities = {
        'costas': 'Costas & Bíceps', 'peito': 'Peito & Ombros',
        'pernas': 'Pernas', 'pedal': 'Pedal', 'escalada': 'Escalada'
    };
    const presentActivities = new Set(schedule.map(item => item.activityId));
    const missingActivities = [];
    for (const id in requiredActivities) {
        if (!presentActivities.has(id)) {
            missingActivities.push(requiredActivities[id]);
        }
    }
    if (missingActivities.length > 0) {
        globalWarning = `Faltam as seguintes atividades na semana: ${missingActivities.join(', ')}.`;
    }

    return { warnings, globalWarning };
}

function createIconHTML(activity) {
    const escapedSVG = activity.iconFallback.replace(/"/g, "'");
    return `<img src="${activity.iconUrl}" onerror="this.outerHTML = \`${escapedSVG}\`;" alt="icon">`;
}

function setupFlexibleAgenda() {
    const agendaContainer = document.getElementById('agenda-container');

    const renderAgenda = () => {
        agendaContainer.innerHTML = '';
        const { warnings, globalWarning } = validateSchedule(weeklySchedule);
        const todayIndex = (new Date().getDay() + 6) % 7;

        const warningContainer = document.getElementById('agenda-global-warning');
        if (globalWarning) {
            warningContainer.innerHTML = `
                <div class="warning-icon"><svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div>
                <span>${globalWarning}</span>`;
            warningContainer.className = 'global-warning';
        } else {
            warningContainer.innerHTML = '';
            warningContainer.className = 'hidden';
        }

        weeklySchedule.forEach((daySchedule, index) => {
            const activity = activities[daySchedule.activityId];
            const warning = warnings[index];
            const itemEl = document.createElement('div');
            let dayClasses = ['day-item'];
            if (activeEditorIndex === index) dayClasses.push('active');
            if (warning.hasWarning) dayClasses.push('has-warning');
            if (index === todayIndex) dayClasses.push('is-today');
            itemEl.className = dayClasses.join(' ');

            const warningIconHTML = warning.hasWarning
                ? `<div class="warning-icon" title="${warning.message.trim()}">
                       <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                   </div>`
                : '';

            itemEl.innerHTML = `
                <div class="day-display" data-index="${index}">
                    <div class="day-name">${daySchedule.day}</div>
                    <div class="activity-color-bar color-${activity.color.replace('-ombros','')}"></div>
                    <div class="activity-icon">${createIconHTML(activity)}</div>
                    <div class="activity-name">${activity.name}</div>
                    ${warningIconHTML}
                    <div class="edit-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                </div>
                <div class="activity-options ${activeEditorIndex === index ? '' : 'hidden'}">
                    ${Object.keys(activities).map(id => {
                        const act = activities[id];
                        return `
                        <button class="option-btn option-${act.color.replace('-biceps','').replace('-ombros','')} ${daySchedule.activityId === id ? 'selected' : ''}" title="${act.name}" onclick="updateActivity(${index}, '${id}')">
                            ${createIconHTML(act)}
                        </button>
                    `}).join('')}
                </div>
            `;
            agendaContainer.appendChild(itemEl);
        });

        document.querySelectorAll('.day-display').forEach(el => {
            el.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index, 10);
                activeEditorIndex = activeEditorIndex === index ? null : index;
                renderAgenda();
            });
        });
    };

    window.updateActivity = (dayIndex, activityId) => {
        weeklySchedule[dayIndex].activityId = activityId;
        localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
        activeEditorIndex = null;
        renderAgenda();
    };

    renderAgenda();
}
