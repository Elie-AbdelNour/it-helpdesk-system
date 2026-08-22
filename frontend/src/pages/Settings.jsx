import { useEffect, useState } from 'react';
import { getSettings, updateSetting } from '../api/settings';
import { listPriorities, updatePriority } from '../api/tickets';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [hourDrafts, setHourDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    getSettings().then(setSettings);
    listPriorities().then((prios) => {
      setPriorities(prios);
      setHourDrafts(Object.fromEntries(prios.map((p) => [p.id, String(p.targetresolutionhours)])));
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleEmailNotifications() {
    setError(null);
    setMessage(null);
    setSavingKey('email_notifications_enabled');
    const nextValue = settings.email_notifications_enabled === '1' ? '0' : '1';
    try {
      await updateSetting('email_notifications_enabled', nextValue);
      setSettings((s) => ({ ...s, email_notifications_enabled: nextValue }));
      setMessage('Notification setting updated.');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to update setting.');
    } finally {
      setSavingKey(null);
    }
  }

  async function savePriority(priority) {
    setError(null);
    setMessage(null);
    setSavingKey(`priority-${priority.id}`);
    try {
      const updated = await updatePriority(priority.id, {
        targetresolutionhours: Number(hourDrafts[priority.id]),
      });
      setPriorities((list) => list.map((p) => (p.id === priority.id ? updated : p)));
      setMessage(`${priority.name} SLA target updated.`);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Unable to update priority.');
    } finally {
      setSavingKey(null);
    }
  }

  const emailEnabled = settings?.email_notifications_enabled === '1';

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="System settings" description="Configure workspace-wide notification and SLA behavior." />

      {message && <div className="alert-success"><Icon name="check" className="h-4 w-4 shrink-0" />{message}</div>}
      {error && <div className="alert-error"><Icon name="alert" className="h-4 w-4 shrink-0" />{error}</div>}

      <section className="app-card p-5 sm:p-6">
        <h2 className="section-title">Notifications</h2>
        <p className="mt-1 text-xs text-slate-400">Control whether ticket activity also sends an email, in addition to the in-app notification.</p>

        {settings && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Ticket email notifications</p>
              <p className="text-xs text-slate-400">Assignment, status changes, comments, and mentions are emailed to the recipient.</p>
            </div>
            <button
              type="button"
              onClick={toggleEmailNotifications}
              disabled={savingKey === 'email_notifications_enabled'}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${emailEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              aria-pressed={emailEnabled}
              aria-label="Toggle ticket email notifications"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  emailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </section>

      <section className="app-card p-5 sm:p-6">
        <h2 className="section-title">SLA targets</h2>
        <p className="mt-1 text-xs text-slate-400">Hours to resolve a ticket before it counts as overdue, per priority.</p>

        <div className="mt-4 space-y-3">
          {priorities.map((priority) => (
            <div key={priority.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="min-w-24 text-sm font-medium text-slate-800 dark:text-slate-100">{priority.name}</span>
              <input
                type="number"
                min={1}
                max={8760}
                value={hourDrafts[priority.id] ?? ''}
                onChange={(e) => setHourDrafts((d) => ({ ...d, [priority.id]: e.target.value }))}
                className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
              />
              <span className="text-xs text-slate-400">hours</span>
              <button
                type="button"
                onClick={() => savePriority(priority)}
                disabled={savingKey === `priority-${priority.id}`}
                className="btn-secondary ml-auto min-h-0 px-3 py-1.5"
              >
                {savingKey === `priority-${priority.id}` ? 'Saving...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
