const inputTaskBox = document.querySelector('.todo-input');
const addNewTaskBtn = document.querySelector('.todo-add-new-task-button');
const deleteAllTaskBtn = document.querySelector('.clear-all');
const todoList = document.querySelector('.todo-list');
const filterOption = document.querySelector('.filter-todo');

const API_URL = 'http://localhost:5000/tasks';

// Fetch tasks from the backend
async function fetchTasks() {
  try {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    todoList.innerHTML = '';
    tasks.forEach(createTodoElement);
    updatePendingCount(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

// Create and display a task element
function createTodoElement(task) {
  const todoDiv = document.createElement('div');
  todoDiv.classList.add('todo');
  if (task.completed) {
    todoDiv.classList.add('completed');
  }

  todoDiv.innerHTML = `
    <button class="complete-btn">${
      task.completed
        ? '<i class="fa-solid fa-circle-check"></i>'
        : '<i class="fa-regular fa-circle"></i>'
    }</button>
    <li class="todo-item">${task.text}</li>
    <button class="edit-btn" ${
      task.completed ? "disabled style='opacity:0.5;'" : ''
    }><i class="fas fa-edit"></i></button>
    <button class="trash-btn"><i class="fas fa-trash"></i></button>
  `;

  todoDiv.dataset.id = task._id;
  todoList.appendChild(todoDiv);
}

// Update pending task count
async function updatePendingCount() {
  const tasks = await fetch(API_URL).then((res) => res.json());
  const pendingCount = tasks.filter((task) => !task.completed).length;
  document.querySelector('.pendingTasks').textContent = pendingCount;
  deleteAllTaskBtn.classList.toggle('active', tasks.length > 0);
}

// Filter tasks
async function filterTodo(e) {
  const filterValue = e.target.value;
  try {
    const response = await fetch(`${API_URL}?filter=${filterValue}`);
    console.log(response);

    const filteredTasks = await response.json();

    todoList.innerHTML = '';
    filteredTasks.forEach(createTodoElement);
  } catch (error) {
    console.error('Error fetching filtered tasks:', error);
  }
}

async function addTodo() {
  const taskText = inputTaskBox.value.trim();
  if (!taskText) return;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: taskText }),
    });

    const newTask = await response.json();
    createTodoElement(newTask);
    inputTaskBox.value = '';
    addNewTaskBtn.classList.remove('active');
    fetchTasks();
  } catch (error) {
    console.error('Error adding task:', error);
  }
}

// Handle task actions (Complete, Edit, Delete)
todoList.addEventListener('click', async (e) => {
  const todo = e.target.closest('.todo');
  if (!todo) return;

  const taskId = todo.dataset.id;

  if (e.target.closest('.complete-btn')) {
    toggleTaskCompletion(taskId);
  }

  if (e.target.closest('.edit-btn')) {
    editTask(taskId, todo);
  }

  if (e.target.closest('.trash-btn')) {
    deleteTask(taskId);
  }
});

// Toggle task completion
async function toggleTaskCompletion(taskId) {
  try {
    const response = await fetch(`${API_URL}/${taskId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(response);

    const updatedTask = await response.json();

    const todoElement = document.querySelector(`[data-id='${taskId}']`);
    if (todoElement) {
      todoElement.classList.toggle('completed', updatedTask.completed);
      todoElement.querySelector('.complete-btn').innerHTML =
        updatedTask.completed
          ? '<i class="fa-solid fa-circle-check"></i>'
          : '<i class="fa-regular fa-circle"></i>';

      const editBtn = todoElement.querySelector('.edit-btn');
      editBtn.disabled = updatedTask.completed;
      editBtn.style.opacity = updatedTask.completed ? '0.5' : '1';
    }

    const filterValue = filterOption.value;
    if (shouldRemoveElement(filterValue, todoElement)) {
      todoElement.remove();
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

function shouldRemoveElement(filterValue, todoElement) {
  switch (filterValue) {
    case 'incomplete':
      return todoElement.classList.contains('completed');
    case 'completed':
      return !todoElement.classList.contains('completed');
    default:
      return false;
  }
}

// Edit task
function editTask(taskId, todoElement) {
  const taskItem = todoElement.querySelector('.todo-item');
  const currentText = taskItem.textContent;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.classList.add('edit-input');

  taskItem.replaceWith(input);
  input.focus();

  input.addEventListener('blur', () =>
    finishEdit(taskId, input.value.trim(), todoElement)
  );
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && input.value.trim() !== currentText)
      input.blur();
    else if (event.key === 'Escape')
      finishEdit(taskId, currentText, todoElement);
  });
}

// Save edited task
async function finishEdit(taskId, newText, todoElement) {
  if (!newText) return;
  try {
    const response = await fetch(`${API_URL}/${taskId}/editTask`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText }),
    });
    console.log(response);
    const taskItem = document.createElement('li');
    taskItem.classList.add('todo-item');
    taskItem.textContent = newText;

    const input = todoElement.querySelector('.edit-input');
    input.replaceWith(taskItem);

    fetchTasks();
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

async function deleteTask(taskId) {
  try {
    const response = await fetch(`${API_URL}/${taskId}/deleteTask`, {
      method: 'DELETE',
    });
    console.log(response);

    const todo = document.querySelector(`[data-id='${taskId}']`);
    todo.classList.add('slide');
    todo.addEventListener('transitionend', () => todo.remove());
    fetchTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

async function deleteAllTasks() {
  const tasks = await fetch(API_URL).then((res) => res.json());
  for (let task of tasks) {
    await deleteTask(task._id);
  }
}

// Load tasks when page loads
document.addEventListener('DOMContentLoaded', fetchTasks);
addNewTaskBtn.addEventListener('click', addTodo);
deleteAllTaskBtn.addEventListener('click', deleteAllTasks);
inputTaskBox.addEventListener('keyup', () => {
  addNewTaskBtn.classList.toggle('active', inputTaskBox.value.trim() !== '');
});

document.addEventListener('DOMContentLoaded', () => {
  //const filterSelect = document.querySelector('.filter-todo');
  const savedFilter = localStorage.getItem('selectedFilter') || 'all';

  filterOption.value = savedFilter;
  filterTodo({ target: { value: savedFilter } });

  filterOption.addEventListener('change', (e) => {
    localStorage.setItem('selectedFilter', e.target.value);
    filterTodo(e);
  });
});
