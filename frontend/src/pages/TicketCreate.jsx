import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { createTicket, listCategories, listPriorities } from '../api/tickets';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

export default function TicketCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [categoryid, setCategoryid] = useState('');
  const [priorityid, setPriorityid] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories().then((items) => {
      setCategories(items);
      if (items.length) setCategoryid(String(items[0].id));
    });
    listPriorities().then((items) => {
      setPriorities(items);
      if (items.length) setPriorityid(String(items[0].id));
    });
  }, []);

  const fieldError = (field) => errors[field]?.[0];

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      const ticket = await createTicket({ subject, description, categoryid, priorityid });
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {});
      else setErrors({ general: [err.response?.data?.message ?? 'Unable to create the ticket.'] });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="New support request"
        title="How can we help?"
        description="Share the issue and its impact. The right support specialist will take it from here."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} className="app-card space-y-6 p-5 sm:p-7">
          {errors.general && <div className="alert-error"><Icon name="alert" className="h-4 w-4 shrink-0" />{errors.general[0]}</div>}

          <div>
            <label htmlFor="ticket-subject" className="field-label">Subject</label>
            <input id="ticket-subject" type="text" required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} className="form-control" placeholder="A short summary of the issue" />
            <div className="flex justify-between gap-4">
              {fieldError('subject') ? <p className="mt-1.5 text-xs text-red-600">{fieldError('subject')}</p> : <p className="field-hint">Make it clear and specific.</p>}
              <span className="mt-1.5 text-xs text-slate-400">{subject.length}/200</span>
            </div>
          </div>

          <div>
            <label htmlFor="ticket-description" className="field-label">Description</label>
            <textarea id="ticket-description" required rows={8} value={description} onChange={(event) => setDescription(event.target.value)} className="form-control resize-y" placeholder="What happened? What did you expect? Include any error messages or steps already tried." />
            {fieldError('description') ? <p className="mt-1.5 text-xs text-red-600">{fieldError('description')}</p> : <p className="field-hint">Do not include passwords or other sensitive information.</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="ticket-category" className="field-label">Category</label>
              <select id="ticket-category" value={categoryid} onChange={(event) => setCategoryid(event.target.value)} className="form-control">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ticket-priority" className="field-label">Priority</label>
              <select id="ticket-priority" value={priorityid} onChange={(event) => setPriorityid(event.target.value)} className="form-control">
                {priorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.name} · {priority.targetresolutionhours}h target</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary sm:min-w-40">
              {submitting ? 'Creating...' : 'Create ticket'}
              {!submitting && <Icon name="arrowRight" className="h-4 w-4" />}
            </button>
          </div>
        </form>

        <aside className="app-card p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon name="sparkles" className="h-5 w-5" /></span>
          <h2 className="mt-4 text-sm font-semibold text-slate-900">Get a faster response</h2>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-500">
            {['Describe the business impact.', 'Include the exact error message.', 'List the steps that reproduce it.', 'Choose the closest category and priority.'].map((tip) => (
              <li key={tip} className="flex gap-2.5"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{tip}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
