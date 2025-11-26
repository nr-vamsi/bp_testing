
export function appendResultRow(variable, value, tableBody) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${variable}</td>
        <td>${value}</td>
    `;
    tableBody.appendChild(row);
}

export function displayResultContainer(container) {
    container.style.display = 'block';
}
