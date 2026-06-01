// Browser Push Notification Service for HelmGuard AI
// Sends reminders for helmet cleaning, scan scheduling, and health tips

const NOTIFICATION_ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪖</text></svg>";

// Request permission to send notifications
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Browser doesn't support notifications");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function getNotificationStatus() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "granted" | "denied" | "default"
}

// Send an immediate browser notification
export function sendNotification(title, body, tag = "helmguard") {
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_ICON,
      tag, // prevents duplicate notifications with same tag
      requireInteraction: false,
      silent: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
    return n;
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}

// ── Scheduled Reminder System ──
// Uses localStorage to track reminder state + setInterval for checking

const STORAGE_KEY = "helmguard_reminders";

function getReminders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function saveReminders(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Schedule a reminder
export function scheduleReminder(id, { title, body, intervalHours, enabled = true }) {
  const reminders = getReminders();
  reminders[id] = {
    title, body, intervalHours, enabled,
    lastFired: reminders[id]?.lastFired || 0,
    createdAt: reminders[id]?.createdAt || Date.now(),
  };
  saveReminders(reminders);
}

// Toggle a reminder on/off
export function toggleReminder(id, enabled) {
  const reminders = getReminders();
  if (reminders[id]) {
    reminders[id].enabled = enabled;
    saveReminders(reminders);
  }
}

// Get all reminders
export function getAllReminders() {
  return getReminders();
}

// Delete a reminder
export function deleteReminder(id) {
  const reminders = getReminders();
  delete reminders[id];
  saveReminders(reminders);
}

// Check and fire due reminders — call this on app startup and periodically
export function checkAndFireReminders() {
  if (Notification.permission !== "granted") return;

  const reminders = getReminders();
  const now = Date.now();
  let updated = false;

  Object.entries(reminders).forEach(([id, r]) => {
    if (!r.enabled) return;
    const intervalMs = r.intervalHours * 60 * 60 * 1000;
    if (now - r.lastFired >= intervalMs) {
      sendNotification(r.title, r.body, id);
      reminders[id].lastFired = now;
      updated = true;
    }
  });

  if (updated) saveReminders(reminders);
}

// Initialize default reminders for a new user
export function initDefaultReminders() {
  const existing = getReminders();
  if (Object.keys(existing).length > 0) return; // already set up

  scheduleReminder("helmet_clean", {
    title: "🪣 Helmet Cleaning Reminder",
    body: "It's time to clean your helmet liner! Regular cleaning prevents bacteria buildup and scalp irritation.",
    intervalHours: 168, // 7 days
  });

  scheduleReminder("scalp_scan", {
    title: "🧠 Weekly Scalp Scan",
    body: "Time for your weekly AI scalp scan. Track changes early to prevent hair damage.",
    intervalHours: 168, // 7 days
  });

  scheduleReminder("journal_log", {
    title: "📓 Daily Scalp Journal",
    body: "Don't forget to log today's scalp symptoms. Consistent logging improves AI accuracy.",
    intervalHours: 24, // daily
  });

  scheduleReminder("hydration", {
    title: "💧 Scalp Hydration Reminder",
    body: "Apply scalp oil or moisturizer before your ride today. Hydrated scalp = less irritation.",
    intervalHours: 48, // every 2 days
  });

  scheduleReminder("break_reminder", {
    title: "🌬️ Take a Ventilation Break",
    body: "If you're on a long ride, remove your helmet for 5 minutes to let your scalp breathe.",
    intervalHours: 3, // every 3 hours during active use
  });
}

// Start the background reminder checker (runs every 5 minutes)
let _checkerInterval = null;
export function startReminderChecker() {
  if (_checkerInterval) return;
  checkAndFireReminders(); // fire immediately
  _checkerInterval = setInterval(checkAndFireReminders, 5 * 60 * 1000);
}

export function stopReminderChecker() {
  if (_checkerInterval) {
    clearInterval(_checkerInterval);
    _checkerInterval = null;
  }
}
