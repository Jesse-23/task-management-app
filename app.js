class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.currentFilter = "all";
    this.editingTaskId = null;
    this.deletingTaskId = null;

    this.initEventListeners();
    this.initTheme();
    this.renderTasks();
    this.updateStats();
  }

  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    const html = document.documentElement;
    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");

    if (theme === "dark") {
      html.classList.add("dark");
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    } else {
      html.classList.remove("dark");
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    }

    localStorage.setItem("theme", theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
  }

  initEventListeners() {
    // Added theme toggle event listener
    document.getElementById("theme-toggle").addEventListener("click", () => {
      this.toggleTheme();
    });

    document.getElementById("task-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTask();
    });

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter);
      });
    });

    document.getElementById("cancel-edit").addEventListener("click", () => {
      this.closeEditModal();
    });

    document.getElementById("save-edit").addEventListener("click", () => {
      this.saveEdit();
    });

    document.getElementById("cancel-delete").addEventListener("click", () => {
      this.closeDeleteModal();
    });

    document.getElementById("confirm-delete").addEventListener("click", () => {
      this.confirmDelete();
    });

    // This closes modals on backdrop click
    document.getElementById("edit-modal").addEventListener("click", (e) => {
      if (e.target.id === "edit-modal") this.closeEditModal();
    });

    document.getElementById("delete-modal").addEventListener("click", (e) => {
      if (e.target.id === "delete-modal") this.closeDeleteModal();
    });

    // This adds keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeEditModal();
        this.closeDeleteModal();
      }
    });
  }

  addTask() {
    const input = document.getElementById("task-input");
    const text = input.value.trim();

    if (!text) {
      this.showToast("Please enter a task description", "error");
      return;
    }

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();

    input.value = "";
    this.showToast("Task added successfully", "success");
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks();
      this.updateStats();

      if (task.completed) {
        this.showToast("Task completed!", "success");
      } else {
        this.showToast("Task marked as pending", "info");
      }
    }
  }

  editTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      this.editingTaskId = id;
      document.getElementById("edit-input").value = task.text;
      document.getElementById("edit-modal").classList.remove("hidden");
      document.getElementById("edit-modal").classList.add("flex");
      document.getElementById("edit-input").focus();
    }
  }

  saveEdit() {
    const newText = document.getElementById("edit-input").value.trim();

    if (!newText) {
      this.showToast("Task description cannot be empty", "error");
      return;
    }

    const task = this.tasks.find((t) => t.id === this.editingTaskId);
    if (task) {
      task.text = newText;
      this.saveTasks();
      this.renderTasks();
      this.closeEditModal();
      this.showToast("Task updated successfully", "success");
    }
  }

  closeEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");
    document.getElementById("edit-modal").classList.remove("flex");
    this.editingTaskId = null;
  }

  deleteTask(id) {
    this.deletingTaskId = id;
    document.getElementById("delete-modal").classList.remove("hidden");
    document.getElementById("delete-modal").classList.add("flex");
  }

  confirmDelete() {
    this.tasks = this.tasks.filter((t) => t.id !== this.deletingTaskId);
    this.saveTasks();
    this.renderTasks();
    this.updateStats();
    this.closeDeleteModal();
    this.showToast("Task deleted successfully", "success");
  }

  closeDeleteModal() {
    document.getElementById("delete-modal").classList.add("hidden");
    document.getElementById("delete-modal").classList.remove("flex");
    this.deletingTaskId = null;
  }

  setFilter(filter) {
    this.currentFilter = filter;

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.className =
          "filter-btn px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-primary text-primary-foreground shadow-sm";
      } else {
        btn.className =
          "filter-btn px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-secondary text-secondary-foreground hover:bg-muted";
      }
    });

    this.renderTasks();
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case "completed":
        return this.tasks.filter((task) => task.completed);
      case "pending":
        return this.tasks.filter((task) => !task.completed);
      default:
        return this.tasks;
    }
  }

  renderTasks() {
    const container = document.getElementById("tasks-container");
    const emptyState = document.getElementById("empty-state");
    const filteredTasks = this.getFilteredTasks();

    if (filteredTasks.length === 0) {
      container.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    container.innerHTML = filteredTasks
      .map(
        (task) => `
                    <div class="bg-card rounded-lg border border-border p-4 animate-slide-up task-item shadow-sm hover:shadow-md transition-shadow duration-200" data-id="${
                      task.id
                    }">
                        <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3 flex-1">
                                <input 
                                    type="checkbox" 
                                    ${task.completed ? "checked" : ""} 
                                    onchange="taskManager.toggleTask(${
                                      task.id
                                    })"
                                    class="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-ring cursor-pointer"
                                >
                                <span class="flex-1 ${
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                } break-words">
                                    ${this.escapeHtml(task.text)}
                                </span>
                                ${
                                  task.completed
                                    ? '<span class="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">Completed</span>'
                                    : '<span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full dark:bg-orange-900 dark:text-orange-200">Pending</span>'
                                }
                            </div>
                            <div class="flex gap-1 flex-shrink-0">
                                <button 
                                    onclick="taskManager.editTask(${task.id})"
                                    class="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors duration-200"
                                    title="Edit task"
                                >
                                    <i class="fas fa-edit w-4 h-4"></i>
                                </button>
                                <button 
                                    onclick="taskManager.deleteTask(${task.id})"
                                    class="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-colors duration-200"
                                    title="Delete task"
                                >
                                    <i class="fas fa-trash w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `
      )
      .join("");
  }

  updateStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    const pending = total - completed;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("pending-tasks").textContent = pending;
  }

  showToast(message, type = "success") {
    const toast = document.createElement("div");
    let bgColor = "bg-accent text-accent-foreground";

    if (type === "error")
      bgColor = "bg-destructive text-destructive-foreground";
    if (type === "info") bgColor = "bg-primary text-primary-foreground";

    toast.className = `${bgColor} px-4 py-3 rounded-lg shadow-lg animate-fade-in mb-2 max-w-xs border border-border`;
    toast.textContent = message;

    document.getElementById("toast-container").appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  saveTasks() {
    localStorage.setItem("taskflow_tasks", JSON.stringify(this.tasks));
  }

  loadTasks() {
    const saved = localStorage.getItem("taskflow_tasks");
    return saved ? JSON.parse(saved) : [];
  }
}

// This initializes the app
const taskManager = new TaskManager();

// Progressive Web App (PWA) + INSTALL PROMPT SETUP

// this registers service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch((err) => console.log("❌ Service Worker failed:", err));
  });
}

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // this hows install suggestion after 1 minute (60,000 ms)
  setTimeout(() => {
    showInstallPrompt();
  }, 60000);
});

function showInstallPrompt() {
  // this only shows once per session
  if (sessionStorage.getItem("installPromptShown")) return;
  sessionStorage.setItem("installPromptShown", "true");

  const banner = document.createElement("div");
  banner.className =
    "fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg animate-fade-in z-50 flex items-center gap-3";
  banner.innerHTML = `
    <span>📱 Install this Task Manager app?</span>
    <button id="install-btn" class="bg-accent text-accent-foreground px-3 py-1 rounded-md font-semibold hover:opacity-90 transition-all">Install</button>
  `;
  document.body.appendChild(banner);

  document.getElementById("install-btn").addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("App installed!");
      } else {
        console.log("User dismissed install");
      }
      deferredPrompt = null;
      banner.remove();
    }
  });
}
