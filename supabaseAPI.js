const SUPABASE_URL = "https://ckacqhlpwlhvgwatufje.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrYWNxaGxwd2xodmd3YXR1ZmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2NDExNDYsImV4cCI6MjA1NzIxNzE0Nn0.zCBW8n7Xk_z8opHvi0nMjBBP2WhNXb8YgSfih-S4QFU";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Функция для загрузки списка учеников
async function fetchStudents() {
    let { data, error } = await supabase.from("students").select("*");
    if (error) {
        console.error("Ошибка загрузки студентов:", error);
        return [];
    }
    return data;
}

// Функция для добавления ученицы
async function addStudent(name, telegram) {
    let { error } = await supabase.from("students").insert([
        { name: name, telegram: telegram }
    ]);
    if (error) {
        console.error("Ошибка добавления ученицы:", error);
    } else {
        console.log("Ученица добавлена!");
    }
}

// Функция для обновления статуса оплаты
async function updatePayment(studentId, month, status) {
    let updateData = {};
    updateData[`${month}-month`] = status;
    let { error } = await supabase.from("students").update(updateData).eq("id", studentId);
    if (error) {
        console.error("Ошибка обновления оплаты:", error);
    } else {
        console.log("Оплата обновлена!");
    }
}

// Функция для удаления ученицы
async function deleteStudent(studentId) {
    let { error } = await supabase.from("students").delete().eq("id", studentId);
    if (error) {
        console.error("Ошибка удаления ученицы:", error);
    } else {
        console.log("Ученица удалена!");
    }
}

// Функции для добавления учителей, групп и студентов на странице

const months = Array.from({length: 10}, (_, i) => `${i + 1}-месяц`);
let chartInstance = null;

function addTeacher() {
    let teacherName = prompt("Введите имя учителя:");
    if (!teacherName) return;

    let teacherDiv = document.createElement("div");
    teacherDiv.classList.add("teacher");
    teacherDiv.innerHTML = `<h3>${teacherName}</h3>
        <button class='add-group-btn' onclick="addGroup(this.parentNode)">Добавить группу</button>
        <button class='delete-btn small-btn' onclick="deleteTeacher(this.parentNode)">Удалить учителя</button>
        <div class='groups'></div>`;
    document.getElementById("teacher-groups").appendChild(teacherDiv);
}

function deleteTeacher(teacherDiv) {
    teacherDiv.remove();
}

function addGroup(teacherDiv) {
    let groupName = prompt("Введите название группы:");
    if (!groupName) return;

    let groupDiv = document.createElement("div");
    groupDiv.classList.add("group");
    groupDiv.innerHTML = `<h4>${groupName}</h4>
        <button class='add-student-btn' onclick="addStudentToGroup(this.parentNode)">Добавить ученицу</button>
        <button class='delete-btn small-btn' onclick="deleteGroup(this.parentNode)">Удалить группу</button>
        <button class='toggle-chart-btn' onclick="toggleChart(this)">📊</button>
        <div class='chart-container' style='display:none;'>
            <canvas class='group-chart'></canvas>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Имя</th>
                    ${months.map(month => `<th>${month}</th>`).join('')}
                </tr>
            </thead>
            <tbody></tbody>
        </table>`;
    teacherDiv.querySelector(".groups").appendChild(groupDiv);
}

function deleteGroup(groupDiv) {
    groupDiv.remove();
}

function addStudentToGroup(groupDiv) {
    let studentName = prompt("Введите имя и фамилию ученицы:");
    if (!studentName) return;

    let username = prompt("Введите юзернейм ученицы в Telegram (если есть):");
    let tr = document.createElement("tr");
    tr.innerHTML = `<td><a href="${username ? 'https://t.me/' + username : '#'}" onclick="return checkUsername('${username}')">${studentName}</a></td>
        ${months.map(() => `<td class='unpaid'>
            <button class='pay-btn' onclick='markPaid(this)'>Оплачено</button>
            <button class='unpay-btn' onclick='markUnpaid(this)'>Не оплачено</button>
        </td>`).join('')}`;
    groupDiv.querySelector("tbody").appendChild(tr);
}

function checkUsername(username) {
    if (!username) {
        alert("Юзернейм не внесён");
        return false;
    }
    return true;
}

function markPaid(button) {
    let cell = button.parentNode;
    cell.classList.add("paid");
    cell.classList.remove("unpaid");
}

function markUnpaid(button) {
    let cell = button.parentNode;
    cell.classList.add("unpaid");
    cell.classList.remove("paid");
}

function toggleChart(button) {
    let chartContainer = button.nextElementSibling;
    chartContainer.style.display = chartContainer.style.display === 'none' ? 'block' : 'none';
    if (chartContainer.style.display === 'block') {
        generateChart(chartContainer.querySelector('.group-chart'), button.parentNode);
    }
}

function generateChart(canvas, groupDiv) {
    let selectedMonth = prompt("Введите номер месяца (1-10):");
    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 10) return;

    let unpaidCells = groupDiv.querySelectorAll(`tbody tr td:nth-child(${+selectedMonth + 1}).unpaid`).length;
    let paidCells = groupDiv.querySelectorAll(`tbody tr td:nth-child(${+selectedMonth + 1}).paid`).length;

    let ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [`${selectedMonth}-месяц Оплачено`, `${selectedMonth}-месяц Не оплачено`],
            datasets: [{
                data: [paidCells, unpaidCells],
                backgroundColor: ['#b3bf7d', '#C7495C']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            if (tooltipItem.label.includes('Не оплачено')) {
                                let unpaidNames = Array.from(groupDiv.querySelectorAll(`tbody tr td:nth-child(${+selectedMonth + 1}).unpaid`)).map(td => td.parentNode.firstChild.textContent);
                                return unpaidNames.length ? unpaidNames.join(', ') : 'Нет данных';
                            }
                            return tooltipItem.label;
                        }
                    }
                }
            }
        }
    });
}
