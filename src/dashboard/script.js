// Глобальные переменные
let vehiclesData = [];
let filteredVehicles = [];
let currentSort = 'none';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    
    // Автообновление каждые 30 секунд
    setInterval(loadData, 30000);
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка добавления транспортного средства
    const addBtn = document.getElementById('add-vehicle-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openModal();
        });
    }
    
    // Закрытие модального окна
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Закрытие при клике вне модального окна
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Поиск
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Фильтр по статусу
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilter);
    }
    
    // Сортировка
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
    
    // Форма добавления
    const form = document.getElementById('vehicle-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Загрузка данных с API
async function loadData() {
    const container = document.getElementById('vehicles-container');
    const loadingEl = document.getElementById('loading');
    
    try {
        if (loadingEl) loadingEl.style.display = 'block';
        if (container) container.innerHTML = '';
        
        const response = await fetch('/api/vehicles');
        
        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            if (response.status === 404) {
                errorMessage = 'API endpoint не найден. Проверьте конфигурацию Nginx и убедитесь, что сервисы запущены.';
            } else if (response.status === 503) {
                errorMessage = 'Сервис временно недоступен. Проверьте подключение к базе данных.';
            }
            throw new Error(errorMessage);
        }
        
        vehiclesData = await response.json();
        filteredVehicles = [...vehiclesData];
        
        updateStatistics();
        renderVehicles();
        
        if (loadingEl) loadingEl.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading data:', error);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <strong>Ошибка загрузки данных</strong><br>
                    ${error.message}<br>
                    <small>Проверьте подключение к API</small>
                </div>
            `;
        }
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// Обновление статистики
function updateStatistics() {
    const total = vehiclesData.length;
    const active = vehiclesData.filter(v => v.status === 'active').length;
    const maintenance = vehiclesData.filter(v => v.status === 'maintenance').length;
    const inactive = vehiclesData.filter(v => v.status === 'inactive').length;
    
    updateStatCard('total-vehicles', total);
    updateStatCard('active-vehicles', active);
    updateStatCard('maintenance-vehicles', maintenance);
    
    // Анимация обновления значений
    animateValue('total-vehicles', total);
    animateValue('active-vehicles', active);
    animateValue('maintenance-vehicles', maintenance);
}

// Анимация изменения значения
function animateValue(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue;
        }
    }
    
    requestAnimationFrame(update);
}

// Обновление карточки статистики
function updateStatCard(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Отображение транспортных средств
function renderVehicles() {
    const container = document.getElementById('vehicles-container');
    if (!container) return;
    
    if (filteredVehicles.length === 0) {
        container.innerHTML = `
            <div class="vehicle-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="color: #999; font-size: 1.2rem;">Транспортные средства не найдены</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredVehicles.map(vehicle => createVehicleCard(vehicle)).join('');
    
    // Добавляем анимацию появления
    const cards = container.querySelectorAll('.vehicle-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Переключение меню
function toggleMenu(vehicleId) {
    // Закрываем все открытые меню
    document.querySelectorAll('.vehicle-menu').forEach(menu => {
        if (menu.id !== `menu-${vehicleId}`) {
            menu.classList.remove('active');
        }
    });
    
    // Переключаем текущее меню
    const menu = document.getElementById(`menu-${vehicleId}`);
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Закрытие всех меню при клике вне их
document.addEventListener('click', (e) => {
    if (!e.target.closest('.vehicle-menu-container')) {
        document.querySelectorAll('.vehicle-menu').forEach(menu => {
            menu.classList.remove('active');
        });
    }
});

// Открытие модального окна для изменения статуса
function openStatusModal(vehicleId) {
    // Закрываем меню
    const menu = document.getElementById(`menu-${vehicleId}`);
    if (menu) {
        menu.classList.remove('active');
    }
    
    // Находим транспортное средство
    const vehicle = vehiclesData.find(v => v.id === vehicleId);
    if (!vehicle) {
        alert('Транспортное средство не найдено');
        return;
    }
    
    // Показываем модальное окно выбора статуса
    showStatusModal(vehicle);
}

// Показ модального окна выбора статуса
function showStatusModal(vehicle) {
    const statusOptions = [
        { value: 'active', label: 'Готова к работе', icon: '🚗' },
        { value: 'maintenance', label: 'На обслуживании', icon: '🔧' },
        { value: 'inactive', label: 'Неактивен', icon: '⏸️' }
    ];
    
    const modalHtml = `
        <div class="modal active" id="status-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Изменить статус</h3>
                    <button class="close" onclick="closeStatusModal()">&times;</button>
                </div>
                <div class="status-modal-body">
                    <p style="margin-bottom: 1.5rem; color: #666;">
                        Транспортное средство: <strong>${vehicle.model} (${vehicle.license_plate})</strong>
                    </p>
                    <p style="margin-bottom: 1rem; color: #666;">Текущий статус: <strong>${getStatusLabel(vehicle.status)}</strong></p>
                    <div class="status-options">
                        ${statusOptions.map(option => `
                            <button class="status-option ${vehicle.status === option.value ? 'current' : ''}" 
                                    onclick="changeStatus(${vehicle.id}, '${option.value}')">
                                <span class="status-option-icon">${option.icon}</span>
                                <span class="status-option-label">${option.label}</span>
                                ${vehicle.status === option.value ? '<span class="status-option-current">Текущий</span>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Удаляем старое модальное окно если есть
    const oldModal = document.getElementById('status-modal');
    if (oldModal) {
        oldModal.remove();
    }
    
    // Добавляем новое модальное окно
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

// Закрытие модального окна статуса
function closeStatusModal() {
    const modal = document.getElementById('status-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Изменение статуса транспортного средства
async function changeStatus(vehicleId, newStatus) {
    try {
        const response = await fetch(`/api/vehicles/${vehicleId}/status?status=${newStatus}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
            throw new Error(error.detail || 'Ошибка при изменении статуса');
        }
        
        // Закрываем модальное окно
        closeStatusModal();
        
        // Обновляем данные
        await loadData();
        showNotification('Статус успешно изменен!', 'success');
        
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Удаление транспортного средства
async function deleteVehicle(vehicleId) {
    const vehicle = vehiclesData.find(v => v.id === vehicleId);
    const vehicleName = vehicle ? `${vehicle.model} (${vehicle.license_plate})` : 'транспортное средство';
    
    if (!confirm(`Вы уверены, что хотите удалить ${vehicleName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/vehicles/${vehicleId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
            throw new Error(error.detail || 'Ошибка при удалении');
        }
        
        // Обновляем данные
        await loadData();
        showNotification('Транспортное средство успешно удалено!', 'success');
        
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Получить название статуса
function getStatusLabel(status) {
    const labels = {
        'active': 'Готова к работе',
        'maintenance': 'На обслуживании',
        'inactive': 'Неактивен'
    };
    return labels[status] || status;
}

// Создание карточки транспортного средства
function createVehicleCard(vehicle) {
    const statusLabels = {
        'active': 'Готова к работе',
        'maintenance': 'На обслуживании',
        'inactive': 'Неактивен'
    };
    
    const statusIcons = {
        'active': '🚗',
        'maintenance': '🔧',
        'inactive': '⏸️'
    };
    
    return `
        <div class="vehicle-card" data-vehicle-id="${vehicle.id}">
            <div class="vehicle-header">
                <div class="vehicle-model">${statusIcons[vehicle.status] || '🚗'} ${vehicle.model || 'Не указано'}</div>
                <div class="vehicle-plate">${vehicle.license_plate || 'N/A'}</div>
            </div>
            <div class="vehicle-menu-container">
                <button class="vehicle-menu-btn" onclick="toggleMenu(${vehicle.id})" title="Меню действий">
                    <span class="menu-bars">☰</span>
                </button>
                <div class="vehicle-menu" id="menu-${vehicle.id}">
                    <button class="menu-item" onclick="openStatusModal(${vehicle.id})">
                        <span class="menu-icon">🔄</span>
                        <span>Изменить статус</span>
                    </button>
                    <button class="menu-item menu-item-danger" onclick="deleteVehicle(${vehicle.id})">
                        <span class="menu-icon">🗑️</span>
                        <span>Удалить</span>
                    </button>
                </div>
            </div>
            <div class="vehicle-info">
                <strong>Год выпуска:</strong> ${vehicle.year || 'Не указан'}
            </div>
            <div class="vehicle-info">
                <strong>Тип топлива:</strong> ${vehicle.fuel_type || 'Не указан'}
            </div>
            ${vehicle.created_at ? `
            <div class="vehicle-info">
                <strong>Добавлено:</strong> ${new Date(vehicle.created_at).toLocaleDateString('ru-RU')}
            </div>
            ` : ''}
            <div style="margin-top: 15px;">
                <span class="vehicle-status status-${vehicle.status || 'inactive'}">
                    ${statusLabels[vehicle.status] || 'Неизвестно'}
                </span>
            </div>
        </div>
    `;
}

// Поиск
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    // Начинаем с полного списка
    filteredVehicles = [...vehiclesData];
    
    // Применяем поиск
    if (searchTerm !== '') {
        filteredVehicles = filteredVehicles.filter(vehicle => {
            const model = (vehicle.model || '').toLowerCase();
            const plate = (vehicle.license_plate || '').toLowerCase();
            return model.includes(searchTerm) || plate.includes(searchTerm);
        });
    }
    
    // Применяем фильтр по статусу
    applyStatusFilter();
    
    // Применяем сортировку
    applySort();
    
    renderVehicles();
}

// Фильтр по статусу
function handleFilter(e) {
    // Начинаем с полного списка или результатов поиска
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase().trim() || '';
    
    if (searchTerm === '') {
        filteredVehicles = [...vehiclesData];
    } else {
        filteredVehicles = vehiclesData.filter(vehicle => {
            const model = (vehicle.model || '').toLowerCase();
            const plate = (vehicle.license_plate || '').toLowerCase();
            return model.includes(searchTerm) || plate.includes(searchTerm);
        });
    }
    
    applyStatusFilter();
    applySort();
    renderVehicles();
}

function applyStatusFilter() {
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) return;
    
    const selectedStatus = statusFilter.value;
    
    if (selectedStatus === 'all') {
        return; // Не фильтруем по статусу
    }
    
    filteredVehicles = filteredVehicles.filter(v => v.status === selectedStatus);
}

// Сортировка
function handleSort(e) {
    currentSort = e.target.value;
    applySort();
    renderVehicles();
}

function applySort() {
    if (currentSort === 'none') {
        return; // Не сортируем
    }
    
    filteredVehicles.sort((a, b) => {
        switch(currentSort) {
            case 'model-asc':
                return (a.model || '').localeCompare(b.model || '', 'ru');
            case 'model-desc':
                return (b.model || '').localeCompare(a.model || '', 'ru');
            case 'year-asc':
                return (a.year || 0) - (b.year || 0);
            case 'year-desc':
                return (b.year || 0) - (a.year || 0);
            case 'plate-asc':
                return (a.license_plate || '').localeCompare(b.license_plate || '', 'ru');
            case 'plate-desc':
                return (b.license_plate || '').localeCompare(a.license_plate || '', 'ru');
            default:
                return 0;
        }
    });
}

// Открытие модального окна
function openModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('vehicle-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Очистка формы
    const form = document.getElementById('vehicle-form');
    if (form) {
        form.reset();
    }
}

// Обработка отправки формы
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const vehicleData = {
        license_plate: formData.get('license_plate'),
        model: formData.get('model'),
        year: parseInt(formData.get('year')),
        fuel_type: formData.get('fuel_type')
    };
    
    // Валидация
    if (!vehicleData.license_plate || !vehicleData.model) {
        alert('Заполните обязательные поля: Гос. номер и Модель');
        return;
    }
    
    try {
        const response = await fetch('/api/vehicles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vehicleData)
        });
        
        if (!response.ok) {
            let errorMessage = 'Ошибка при создании транспортного средства';
            try {
                const error = await response.json();
                errorMessage = error.detail || error.message || errorMessage;
            } catch (e) {
                if (response.status === 404) {
                    errorMessage = 'API endpoint не найден. Проверьте конфигурацию Nginx.';
                } else if (response.status === 503) {
                    errorMessage = 'Сервис временно недоступен. Проверьте подключение к базе данных.';
                } else {
                    errorMessage = `Ошибка сервера (${response.status})`;
                }
            }
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Закрываем модальное окно
        closeModal();
        
        // Обновляем данные
        await loadData();
        
        // Показываем уведомление об успехе
        showNotification('Транспортное средство успешно добавлено!', 'success');
        
    } catch (error) {
        console.error('Error creating vehicle:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Показ уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Добавляем стили для анимаций уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

