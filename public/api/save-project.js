// Простой API endpoint для сохранения проектов
// В реальном приложении это должно быть на сервере

// Функция для сохранения проекта в localStorage (временное решение)
function saveProject(projectName) {
  try {
    // Получаем существующие проекты
    const existingProjects = JSON.parse(localStorage.getItem('sairyne_projects') || '[]');
    
    // Добавляем новый проект
    const newProject = {
      id: Date.now(),
      name: projectName,
      createdAt: new Date().toISOString()
    };
    
    existingProjects.push(newProject);
    
    // Сохраняем обратно в localStorage
    localStorage.setItem('sairyne_projects', JSON.stringify(existingProjects));
    
    return true;
  } catch (error) {
    return false;
  }
}

// Экспортируем функцию для использования
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { saveProject };
} else if (typeof window !== 'undefined') {
  window.saveProject = saveProject;
}
