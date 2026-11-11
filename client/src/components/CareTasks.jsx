import { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, Check, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Modal from "./Modal.jsx";
import PageSkeleton from "./PageSkeleton.jsx";

function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function TaskForm({ task, onClose, onSave, saving, t, direction }) {
  const [title, setTitle] = useState(task?.title || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");

  function submit(event) {
    event.preventDefault();
    void onSave({ title: title.trim(), dueDate });
  }

  return (
    <Modal
      open
      title={task ? t.care.editTask : t.care.addTask}
      closeLabel={t.care.cancel}
      onClose={onClose}
      direction={direction}
      footer={(
        <div className="flex justify-end gap-2">
          <button className="min-h-[44px] rounded-lg border border-slate-300 px-4" type="button" onClick={onClose}>{t.care.cancel}</button>
          <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white disabled:opacity-60" type="submit" form="care-task-form" disabled={!title.trim() || saving}>{saving ? t.care.savingTask : t.care.saveTask}</button>
        </div>
      )}
    >
      <form id="care-task-form" className="space-y-4" onSubmit={submit}>
        <label className="block space-y-1">
          <span>{t.care.taskTitle}</span>
          <input className="min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 text-gray-900" autoFocus maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="block space-y-1">
          <span>{t.care.taskDueDate}</span>
          <input className="min-h-[44px] w-full rounded-lg border border-slate-400 bg-white px-3 text-gray-900" type="date" value={dueDate || ""} onChange={(event) => setDueDate(event.target.value)} />
        </label>
      </form>
    </Modal>
  );
}

export default function CareTasks({ mode = "owner", ownerId, canClaimTasks = false, autoAdd = false }) {
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const isOwner = mode === "owner";
  const endpoint = isOwner ? "/api/tasks/mine" : `/api/tasks/with-me/${encodeURIComponent(ownerId)}`;

  async function loadTasks() {
    setError("");
    try {
      const { data } = await axios.get(endpoint);
      setTasks(data);
    } catch (requestError) {
      setError(requestError.response?.status === 403 ? t.care.tasksPermissionRequired : t.care.tasksLoadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, [endpoint, t.care.tasksLoadFailed, t.care.tasksPermissionRequired]);

  useEffect(() => {
    if (isOwner && autoAdd) {
      setEditingTask(null);
      setShowForm(true);
    }
  }, [autoAdd, isOwner]);

  async function saveTask(values) {
    setSaving(true);
    setError("");
    try {
      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask.id}`, values);
      } else {
        await axios.post("/api/tasks", values);
      }
      setShowForm(false);
      setEditingTask(null);
      await loadTasks();
    } catch {
      setError(t.care.taskSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(task, status) {
    setError("");
    try {
      await axios.put(`/api/tasks/${task.id}`, { status });
      await loadTasks();
    } catch {
      setError(t.care.taskUpdateFailed);
    }
  }

  async function releaseTask(task) {
    setError("");
    try {
      await axios.put(`/api/tasks/${task.id}`, { releaseClaim: true });
      await loadTasks();
    } catch {
      setError(t.care.taskUpdateFailed);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(t.care.deleteTaskConfirm)) return;
    setError("");
    try {
      await axios.delete(`/api/tasks/${task.id}`);
      await loadTasks();
    } catch {
      setError(t.care.taskDeleteFailed);
    }
  }

  async function caregiverAction(task, action) {
    setError("");
    try {
      await axios.post(`/api/tasks/${task.id}/${action}`);
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.status === 409 ? t.care.taskNoLongerOpen : t.care.taskUpdateFailed);
      await loadTasks();
    }
  }

  const filteredTasks = tasks.filter((task) => filter === "all" || task.status === filter);
  const statusLabels = {
    open: t.care.taskStatusOpen,
    claimed: t.care.taskStatusClaimed,
    done: t.care.taskStatusDone
  };
  const today = localDateString();

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-gray-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t.care.tasksTitle}</h2>
          {!isOwner && <p className="mt-1 text-sm text-slate-700">{t.family.readOnlyBanner}</p>}
        </div>
        {isOwner && (
          <button className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 font-medium text-white" type="button" onClick={() => { setEditingTask(null); setShowForm(true); }}>
            <Plus size={18} aria-hidden="true" />
            {t.care.addTask}
          </button>
        )}
      </div>
      {isOwner && (
        <div className="flex flex-wrap gap-2" aria-label={t.care.filterTasks}>
          {["all", "open", "claimed", "done"].map((status) => (
            <button className={`min-h-[44px] rounded-lg px-3 font-medium ${filter === status ? "bg-hayat-700 text-white" : "border border-slate-300 bg-white text-gray-900"}`} type="button" key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>
              {status === "all" ? t.care.taskStatusAll : statusLabels[status]}
            </button>
          ))}
        </div>
      )}
      {error && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-950" role="alert">{error}</p>}
      {loading ? <PageSkeleton label={t.care.tasksLoading} rows={2} /> : !filteredTasks.length ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{filter === "all" ? t.care.noTasks : t.care.noTasksInStatus}</p>
      ) : (
        <ul className="space-y-3">
          {filteredTasks.map((task) => {
            const overdue = task.dueDate && task.dueDate < today && task.status !== "done";
            return (
              <li className={`rounded-xl border p-4 ${task.status === "done" ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white"}`} key={task.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${task.status === "done" ? "line-through" : ""}`}>{task.title}</p>
                    <p className="mt-1 text-sm">{t.care.taskStatus}: {statusLabels[task.status]}</p>
                    {task.dueDate && (
                      <p className="mt-1 inline-flex items-center gap-1 text-sm">
                        {overdue && <AlertTriangle size={16} aria-hidden="true" />}
                        {overdue && <span className="font-semibold">{t.care.overdue}</span>}
                        <span>{t.care.taskDueDate}: {new Date(`${task.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString(language)}</span>
                      </p>
                    )}
                    {task.status === "claimed" && task.claimedByName && (
                      <p className="mt-1 text-sm font-medium">{t.care.takingTask.replace("{name}", task.claimedByName)}</p>
                    )}
                  </div>
                  {isOwner ? (
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-300 px-3" type="button" onClick={() => { setEditingTask(task); setShowForm(true); }}>
                        <Pencil size={16} aria-hidden="true" />{t.care.editTask}
                      </button>
                      {task.status === "claimed" && <button className="min-h-[44px] rounded-lg border border-amber-400 px-3 font-medium" type="button" onClick={() => void releaseTask(task)}>{t.care.releaseClaim}</button>}
                      {task.status === "open" && <button className="min-h-[44px] rounded-lg border border-emerald-500 px-3 font-medium text-emerald-900" type="button" onClick={() => void updateTaskStatus(task, "done")}>{t.care.markTaskDone}</button>}
                      {task.status === "done" && <button className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-300 px-3" type="button" onClick={() => void updateTaskStatus(task, "open")}><RotateCcw size={16} aria-hidden="true" />{t.care.reopenTask}</button>}
                      <button className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-100" type="button" onClick={() => void deleteTask(task)}>
                        <Trash2 size={16} aria-hidden="true" />{t.care.deleteTask}
                      </button>
                    </div>
                  ) : canClaimTasks && task.status === "open" ? (
                    <button className="min-h-[44px] rounded-lg bg-hayat-700 px-4 font-medium text-white" type="button" onClick={() => void caregiverAction(task, "claim")}>{t.care.claimTask}</button>
                  ) : canClaimTasks && task.status === "claimed" && task.claimedByMe ? (
                    <button className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-hayat-700 px-4 font-medium text-white" type="button" onClick={() => void caregiverAction(task, "done")}><Check size={17} aria-hidden="true" />{t.care.markTaskDone}</button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {showForm && isOwner && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onSave={saveTask}
          saving={saving}
          t={t}
          direction={language === "ar" ? "rtl" : "ltr"}
        />
      )}
    </section>
  );
}
