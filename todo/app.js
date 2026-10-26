import { applyDailyComplete, formatDateISO, isDailySeries } from "./lib/recurrence.js";
import {
  normalizeTitle,
  parseDue,
  parseRepeat,
  parseTags,
  taskTags,
} from "./lib/task-model.js";
import {
  addTaskRecord,
  deleteTaskRecord,
  getTaskRecord,
  loadAllTasks,
  updateTaskRecord,
} from "./lib/store.js";

let tasks = [];
let editingId = null;

function todayISO() {
  return formatDateISO(new Date());
}

function showError(err) {
  const node = document.getElementById("error");
  node.textContent = err ? "Could not save the task. Try again." : "";
  node.hidden = !err;
}

function visibleTasks() {
  const status = document.getElementById("status-filter").value;
  const tag = document.getElementById("tag-filter").value;
  return tasks.filter((task) => {
    if (status === "open" && task.done) return false;
    if (status === "done" && !task.done) return false;
    if (tag && !taskTags(task).some((item) => item.toLowerCase() === tag)) return false;
    return true;
  });
}

function fillTagFilter() {
  const select = document.getElementById("tag-filter");
  const current = select.value;
  const names = new Map();
  for (const task of tasks) {
    for (const tag of taskTags(task)) {
      const key = tag.toLowerCase();
      if (!names.has(key)) names.set(key, tag);
    }
  }
  select.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "All tags";
  select.append(all);
  for (const [key, label] of [...names.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    select.append(option);
  }
  select.value = names.has(current) || current === "" ? current : "";
}

function buildEditForm(task) {
  const form = document.createElement("form");
  form.className = "edit-series";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveSeriesEdit(task.id, titleInput, dueInput, tagsInput, repeatCheck);
  });

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.maxLength = 200;
  titleInput.required = true;
  titleInput.value = task.title;
  titleInput.setAttribute("aria-label", "Series title");

  const dueInput = document.createElement("input");
  dueInput.type = "date";
  dueInput.value = parseDue(task.due || "");
  dueInput.setAttribute("aria-label", "Series due date");

  const tagsInput = document.createElement("input");
  tagsInput.type = "text";
  tagsInput.maxLength = 200;
  tagsInput.value = taskTags(task).join(", ");
  tagsInput.placeholder = "Tags";
  tagsInput.setAttribute("aria-label", "Series tags");

  const repeatLabel = document.createElement("label");
  const repeatCheck = document.createElement("input");
  repeatCheck.type = "checkbox";
  repeatCheck.checked = isDailySeries(task);
  repeatLabel.append(repeatCheck, " Repeats daily");

  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Save series";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => {
    editingId = null;
    render();
  });

  form.append(titleInput, dueInput, tagsInput, repeatLabel, save, cancel);
  return form;
}

function renderTaskRow(task) {
  const item = document.createElement("li");
  if (task.done) item.className = "done";

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = Boolean(task.done);
  check.setAttribute("aria-label", task.done ? "Mark not done" : "Mark done");
  check.addEventListener("change", () => setDone(task.id, check.checked));

  const body = document.createElement("div");
  body.className = "body";

  if (editingId === task.id) {
    body.append(buildEditForm(task));
  } else {
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = task.title;
    body.append(title);

    const due = parseDue(task.due || "");
    const tags = taskTags(task);
    const bits = [];
    if (isDailySeries(task)) bits.push("Daily");
    if (due) bits.push("Due " + due);
    if (tags.length) bits.push(tags.join(", "));
    if (bits.length) {
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = bits.join(" · ");
      body.append(meta);
    }
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  if (editingId !== task.id) {
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = isDailySeries(task) ? "Edit series" : "Edit";
    edit.addEventListener("click", () => {
      editingId = task.id;
      render();
    });
    actions.append(edit);
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = isDailySeries(task) ? "Delete series" : "Delete";
  remove.addEventListener("click", () => removeTask(task.id));

  actions.append(remove);
  item.append(check, body, actions);
  return item;
}

function render() {
  fillTagFilter();
  const shown = visibleTasks();
  const list = document.getElementById("list");
  const empty = document.getElementById("empty");
  list.replaceChildren();
  empty.hidden = shown.length > 0;
  empty.textContent = tasks.length === 0 ? "No tasks yet." : "No tasks match these filters.";
  for (const task of shown) {
    list.append(renderTaskRow(task));
  }
}

async function load() {
  tasks = await loadAllTasks();
  render();
}

async function addTask(title, due, tags, repeatDaily) {
  const clean = normalizeTitle(title);
  if (!clean) return;
  await addTaskRecord({
    title: clean,
    done: false,
    due: parseDue(due),
    tags: parseTags(tags),
    repeat: repeatDaily ? "daily" : "",
  });
  await load();
}

async function saveSeriesEdit(id, titleInput, dueInput, tagsInput, repeatCheck) {
  const clean = normalizeTitle(titleInput.value);
  if (!clean) return;
  const existing = await getTaskRecord(id);
  if (!existing) return;
  const updated = {
    ...existing,
    title: clean,
    due: parseDue(dueInput.value),
    tags: parseTags(tagsInput.value),
    repeat: repeatCheck.checked ? "daily" : "",
  };
  await updateTaskRecord(updated);
  editingId = null;
  await load();
}

async function setDone(id, done) {
  const task = await getTaskRecord(id);
  if (!task) return;

  if (done && isDailySeries(task)) {
    const next = applyDailyComplete({ ...task, done: true }, todayISO());
    await updateTaskRecord(next);
  } else {
    task.done = done;
    await updateTaskRecord(task);
  }
  await load();
}

async function removeTask(id) {
  editingId = editingId === id ? null : editingId;
  await deleteTaskRecord(id);
  await load();
}

document.getElementById("add-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = document.getElementById("title");
  const due = document.getElementById("due");
  const tags = document.getElementById("tags");
  const repeatDaily = document.getElementById("repeat-daily");
  try {
    showError(null);
    await addTask(title.value, due.value, tags.value, repeatDaily.checked);
    title.value = "";
    due.value = "";
    tags.value = "";
    repeatDaily.checked = false;
    title.focus();
  } catch (err) {
    showError(err);
  }
});

document.getElementById("status-filter").addEventListener("change", render);
document.getElementById("tag-filter").addEventListener("change", render);
load().catch(showError);
