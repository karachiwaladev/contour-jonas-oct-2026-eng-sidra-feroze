const DB_NAME = "todo";
const STORE = "tasks";
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function requestDone(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const dbPromise = openDb();

export async function withStore(mode, fn) {
  const db = await dbPromise;
  const tx = db.transaction(STORE, mode);
  const result = await fn(tx.objectStore(STORE));
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return result;
}

export async function loadAllTasks() {
  const tasks = await withStore("readonly", (store) => requestDone(store.getAll()));
  tasks.sort((a, b) => a.id - b.id);
  return tasks;
}

export async function addTaskRecord(record) {
  return withStore("readwrite", (store) => requestDone(store.add(record)));
}

export async function updateTaskRecord(task) {
  return withStore("readwrite", (store) => requestDone(store.put(task)));
}

export async function deleteTaskRecord(id) {
  return withStore("readwrite", (store) => requestDone(store.delete(id)));
}

export async function getTaskRecord(id) {
  return withStore("readonly", (store) => requestDone(store.get(id)));
}
