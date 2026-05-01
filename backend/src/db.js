/**
 * In-memory database with persistence simulation
 * Using JSON file as a lightweight DB (no external DB required)
 * In production, swap for PostgreSQL/MySQL/MongoDB
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, '../data/db.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

let db = {
  users: [],
  projects: [],
  tasks: [],
  comments: [],
  notifications: [],
  projectMembers: [],
  activityLogs: [],
};

// Load from file if exists
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
    }
  } catch (e) {
    console.error('DB load error:', e.message);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('DB save error:', e.message);
  }
}

loadDB();

// Generic CRUD helpers
const getAll = (table) => db[table] || [];
const getById = (table, id) => (db[table] || []).find((item) => item.id === id);
const create = (table, data) => {
  const item = { id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
  db[table].push(item);
  saveDB();
  return item;
};
const update = (table, id, data) => {
  const idx = db[table].findIndex((item) => item.id === id);
  if (idx === -1) return null;
  db[table][idx] = { ...db[table][idx], ...data, updatedAt: new Date().toISOString() };
  saveDB();
  return db[table][idx];
};
const remove = (table, id) => {
  const idx = db[table].findIndex((item) => item.id === id);
  if (idx === -1) return false;
  db[table].splice(idx, 1);
  saveDB();
  return true;
};
const filter = (table, predicate) => (db[table] || []).filter(predicate);
const findOne = (table, predicate) => (db[table] || []).find(predicate);

module.exports = { db, getAll, getById, create, update, remove, filter, findOne, saveDB };
