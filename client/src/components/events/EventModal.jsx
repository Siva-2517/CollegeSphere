import React, { useState, useEffect } from 'react';
import { X as CloseIcon, Calendar, MapPin, Building2, Tag, Users, AlertCircle, Upload } from 'lucide-react';

/**
 * Shared modal component for Creating (FormData with file) and Editing (JSON) events.
 * Preserves the exact multipart poster upload API contract for creation.
 */
export default function EventModal({ isOpen, onClose, event, onSave, colleges = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    venue: '',
    registrationDeadline: '',
    description: '',
    collegeId: '',
    category: '',
    poster: null,
    eventType: 'solo',
    minTeamSize: '',
    maxTeamSize: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || event.name || '',
        date: event.date ? event.date.split('T')[0] : '',
        venue: event.venue || '',
        registrationDeadline: event.registrationDeadline
          ? event.registrationDeadline.split('T')[0]
          : event.deadline
          ? event.deadline.split('T')[0]
          : '',
        description: event.description || '',
        collegeId: event.collegeId?._id || event.collegeId || '',
        category: event.category || '',
        poster: event.poster || null,
        eventType: event.eventType || 'solo',
        minTeamSize: event.minTeamSize || '',
        maxTeamSize: event.maxTeamSize || ''
      });
    } else {
      setFormData({
        title: '',
        date: '',
        venue: '',
        registrationDeadline: '',
        description: '',
        collegeId: colleges[0]?._id || '',
        category: '',
        poster: null,
        eventType: 'solo',
        minTeamSize: '',
        maxTeamSize: ''
      });
    }
    setErrors({});
  }, [event, isOpen, colleges]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Event date is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.registrationDeadline) newErrors.registrationDeadline = 'Registration deadline is required';
    if (!formData.collegeId) newErrors.collegeId = 'College is required';
    if (!formData.category) newErrors.category = 'Category is required';

    if (formData.date && formData.registrationDeadline) {
      const eventDate = new Date(formData.date);
      const deadlineDate = new Date(formData.registrationDeadline);
      if (deadlineDate >= eventDate) {
        newErrors.registrationDeadline = 'Registration deadline must be strictly before event date';
      }
    }

    if (formData.eventType === 'team') {
      if (!formData.minTeamSize && !formData.maxTeamSize) {
        newErrors.minTeamSize = 'Team size bounds are required';
      }
      if (formData.minTeamSize && formData.maxTeamSize) {
        const min = parseInt(formData.minTeamSize, 10);
        const max = parseInt(formData.maxTeamSize, 10);
        if (min > max) {
          newErrors.minTeamSize = 'Minimum members cannot exceed maximum';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div
        className="bg-surface-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-modal animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-900 border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div>
            <h2 id="event-modal-title" className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              {event ? 'Edit Event Details' : 'Publish New Inter-College Event'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {event ? 'Update event metadata and rules' : 'Submitted events are reviewed by College Admin before publishing'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., National AI Hackathon 2026"
              className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                errors.title ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Event Description & Guidelines *
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline event objectives, rules, eligibility, and prize tracks..."
              className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                errors.description ? 'border-rose-500' : 'border-slate-700'
              } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
            />
            {errors.description && <p className="mt-1 text-xs text-rose-400">{errors.description}</p>}
          </div>

          {/* Date & Deadline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Event Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                  errors.date ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600`}
              />
              {errors.date && <p className="mt-1 text-xs text-rose-400">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Registration Deadline *
              </label>
              <input
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                  errors.registrationDeadline ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600`}
              />
              {errors.registrationDeadline && (
                <p className="mt-1 text-xs text-rose-400">{errors.registrationDeadline}</p>
              )}
            </div>
          </div>

          {/* Venue & College Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Venue Location *
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., Main Auditorium, Hall A"
                className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                  errors.venue ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600`}
              />
              {errors.venue && <p className="mt-1 text-xs text-rose-400">{errors.venue}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Host College *
              </label>
              <select
                value={formData.collegeId}
                onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                  errors.collegeId ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600`}
              >
                <option value="">Select College</option>
                {colleges.map((c) => (
                  <option key={c._id} value={c._id} className="bg-surface-900 text-white">
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.collegeId && <p className="mt-1 text-xs text-rose-400">{errors.collegeId}</p>}
            </div>
          </div>

          {/* Category & Poster Upload Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2.5 bg-slate-950/70 border ${
                  errors.category ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-600`}
              >
                <option value="">Select Category</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Festival">Festival</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <p className="mt-1 text-xs text-rose-400">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Event Poster {!event && '(Image File)'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, poster: e.target.files[0] })}
                className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Event Participation Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Participation Mode *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="radio"
                  name="eventType"
                  value="solo"
                  checked={formData.eventType === 'solo'}
                  onChange={() => setFormData({ ...formData, eventType: 'solo', minTeamSize: '', maxTeamSize: '' })}
                  className="w-4 h-4 text-brand-600 bg-slate-900 border-slate-700 focus:ring-brand-600"
                />
                <span>Individual (Solo)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="radio"
                  name="eventType"
                  value="team"
                  checked={formData.eventType === 'team'}
                  onChange={() => setFormData({ ...formData, eventType: 'team' })}
                  className="w-4 h-4 text-brand-600 bg-slate-900 border-slate-700 focus:ring-brand-600"
                />
                <span>Team / Squad Entry</span>
              </label>
            </div>
          </div>

          {/* Team Size Limits */}
          {formData.eventType === 'team' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Min Team Size
                </label>
                <input
                  type="number"
                  min="2"
                  value={formData.minTeamSize}
                  onChange={(e) => setFormData({ ...formData, minTeamSize: e.target.value })}
                  placeholder="2"
                  className="w-full px-3 py-2 bg-surface-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Max Team Size
                </label>
                <input
                  type="number"
                  min="2"
                  value={formData.maxTeamSize}
                  onChange={(e) => setFormData({ ...formData, maxTeamSize: e.target.value })}
                  placeholder="5"
                  className="w-full px-3 py-2 bg-surface-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving Event...' : event ? 'Update Event' : 'Create & Submit Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
