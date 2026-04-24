import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api';

const fieldConfigs = {
  events: {
    columns: ['name', 'location', 'event_type', 'start_date', 'expected_attendees', 'registration_fee', 'status'],
    fields: [
      { key: 'name', label: 'Event Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'venue', label: 'Venue', type: 'text' },
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'end_date', label: 'End Date', type: 'date' },
      { key: 'event_type', label: 'Event Type', type: 'select', options: ['Trade Show', 'Conference', 'Festival', 'Trade Fair', 'Symposium', 'Summit'] },
      { key: 'expected_attendees', label: 'Expected Attendees', type: 'number' },
      { key: 'registration_fee', label: 'Registration Fee', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['upcoming', 'active', 'completed', 'cancelled'] },
    ]
  },
  booths: {
    columns: ['booth_number', 'event_name', 'size', 'booth_type', 'rental_cost', 'setup_cost', 'status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'booth_number', label: 'Booth Number', type: 'text', required: true },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'location_in_venue', label: 'Location in Venue', type: 'text' },
      { key: 'rental_cost', label: 'Rental Cost', type: 'number' },
      { key: 'setup_cost', label: 'Setup Cost', type: 'number' },
      { key: 'booth_type', label: 'Booth Type', type: 'select', options: ['Island', 'Peninsula', 'Corner', 'Inline'] },
      { key: 'amenities', label: 'Amenities', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['reserved', 'confirmed', 'setup', 'active', 'completed', 'cancelled'] },
    ]
  },
  leads: {
    columns: ['contact_name', 'company', 'event_name', 'job_title', 'interest_level', 'estimated_value', 'status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'contact_name', label: 'Contact Name', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'job_title', label: 'Job Title', type: 'text' },
      { key: 'interest_level', label: 'Interest Level', type: 'select', options: ['hot', 'warm', 'cold'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'estimated_value', label: 'Estimated Value ($)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'] },
    ]
  },
  expenses: {
    columns: ['category', 'description', 'event_name', 'amount', 'vendor', 'expense_date', 'status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Booth Rental', 'Booth Setup', 'Travel', 'Hotel', 'Marketing Materials', 'Registration', 'Catering', 'Shipping', 'Swag', 'Sponsorship', 'AV Equipment', 'Insurance', 'Training', 'Booth Design', 'Miscellaneous'] },
      { key: 'description', label: 'Description', type: 'text', required: true },
      { key: 'amount', label: 'Amount ($)', type: 'number', required: true },
      { key: 'vendor', label: 'Vendor', type: 'text' },
      { key: 'expense_date', label: 'Expense Date', type: 'date' },
      { key: 'payment_method', label: 'Payment Method', type: 'select', options: ['Credit Card', 'Wire Transfer', 'Purchase Order', 'Check', 'Cash'] },
      { key: 'receipt_number', label: 'Receipt Number', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected', 'reimbursed'] },
    ]
  },
  staff: {
    columns: ['name', 'role', 'department', 'event_name', 'travel_cost', 'hotel_cost', 'status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'department', label: 'Department', type: 'select', options: ['Marketing', 'Sales', 'Engineering', 'Product', 'Executive', 'Operations'] },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'travel_cost', label: 'Travel Cost ($)', type: 'number' },
      { key: 'hotel_cost', label: 'Hotel Cost ($)', type: 'number' },
      { key: 'per_diem', label: 'Per Diem ($)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['confirmed', 'pending', 'cancelled'] },
    ]
  },
  sponsors: {
    columns: ['company_name', 'contact_name', 'event_name', 'sponsorship_level', 'amount', 'contract_status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'company_name', label: 'Company Name', type: 'text', required: true },
      { key: 'contact_name', label: 'Contact Name', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'sponsorship_level', label: 'Level', type: 'select', options: ['Platinum', 'Gold', 'Silver', 'Bronze'] },
      { key: 'amount', label: 'Amount ($)', type: 'number' },
      { key: 'benefits', label: 'Benefits', type: 'textarea' },
      { key: 'contract_status', label: 'Contract Status', type: 'select', options: ['pending', 'negotiating', 'signed', 'expired'] },
    ]
  },
  materials: {
    columns: ['name', 'material_type', 'event_name', 'quantity', 'unit_cost', 'design_status', 'print_status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'material_type', label: 'Type', type: 'select', options: ['Brochure', 'Flyer', 'Banner', 'Digital', 'Swag', 'Signage', 'Document', 'Video'] },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'unit_cost', label: 'Unit Cost ($)', type: 'number' },
      { key: 'vendor', label: 'Vendor', type: 'text' },
      { key: 'design_status', label: 'Design Status', type: 'select', options: ['draft', 'in-progress', 'approved'] },
      { key: 'print_status', label: 'Print Status', type: 'select', options: ['pending', 'printed', 'shipped', 'n/a'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  competitors: {
    columns: ['company_name', 'event_name', 'booth_location', 'booth_size', 'threat_level', 'estimated_budget'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'company_name', label: 'Company Name', type: 'text', required: true },
      { key: 'booth_location', label: 'Booth Location', type: 'text' },
      { key: 'booth_size', label: 'Booth Size', type: 'text' },
      { key: 'products_displayed', label: 'Products Displayed', type: 'textarea' },
      { key: 'marketing_tactics', label: 'Marketing Tactics', type: 'textarea' },
      { key: 'staff_count', label: 'Staff Count', type: 'number' },
      { key: 'estimated_budget', label: 'Estimated Budget ($)', type: 'number' },
      { key: 'threat_level', label: 'Threat Level', type: 'select', options: ['critical', 'high', 'medium', 'low'] },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ]
  },
  followups: {
    columns: ['contact_name', 'company', 'event_name', 'followup_type', 'priority', 'due_date', 'status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'contact_name', label: 'Contact Name', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'followup_type', label: 'Type', type: 'select', options: ['Email Follow-up', 'Demo Scheduling', 'Proposal', 'Executive Meeting', 'Technical Assessment', 'Partnership Proposal', 'Partnership Discussion', 'Compliance Review', 'Competitive Analysis', 'Product Demo', 'Technical POC', 'Nurture Email', 'Technical Workshop', 'Channel Partner', 'Market Entry Support'] },
      { key: 'priority', label: 'Priority', type: 'select', options: ['critical', 'high', 'medium', 'low'] },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'assigned_to', label: 'Assigned To', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'cancelled'] },
    ]
  },
  budgets: {
    columns: ['category', 'event_name', 'planned_amount', 'actual_amount', 'fiscal_year', 'quarter', 'approval_status'],
    fields: [
      { key: 'event_id', label: 'Event ID', type: 'number', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['Booth & Space', 'Travel & Accommodation', 'Marketing Materials', 'Catering & Entertainment', 'Registration & Fees', 'AV & Technology', 'Security Demo Equipment', 'Total Event Budget'] },
      { key: 'planned_amount', label: 'Planned Amount ($)', type: 'number', required: true },
      { key: 'actual_amount', label: 'Actual Amount ($)', type: 'number' },
      { key: 'variance_notes', label: 'Variance Notes', type: 'textarea' },
      { key: 'fiscal_year', label: 'Fiscal Year', type: 'number' },
      { key: 'quarter', label: 'Quarter', type: 'select', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
      { key: 'approval_status', label: 'Approval Status', type: 'select', options: ['draft', 'pending', 'approved', 'rejected'] },
    ]
  },
};

function formatCell(key, value) {
  if (value === null || value === undefined) return '-';
  if (key.includes('cost') || key.includes('amount') || key.includes('fee') || key.includes('value') || key === 'amount' || key.includes('budget')) {
    return <span className="money">${parseFloat(value).toLocaleString()}</span>;
  }
  if (key.includes('date')) {
    return new Date(value).toLocaleDateString();
  }
  if (key === 'status' || key === 'contract_status' || key === 'approval_status') {
    const badges = {
      upcoming: 'badge-info', active: 'badge-success', completed: 'badge-success',
      cancelled: 'badge-danger', new: 'badge-info', contacted: 'badge-warning',
      qualified: 'badge-purple', pending: 'badge-warning', approved: 'badge-success',
      confirmed: 'badge-success', reserved: 'badge-info', signed: 'badge-success',
      negotiating: 'badge-warning', draft: 'badge-default', 'in-progress': 'badge-info',
      rejected: 'badge-danger', expired: 'badge-danger', won: 'badge-success', lost: 'badge-danger',
      proposal: 'badge-purple', reimbursed: 'badge-success',
    };
    return <span className={`badge ${badges[value] || 'badge-default'}`}>{value}</span>;
  }
  if (key === 'interest_level') {
    const m = { hot: 'badge-danger', warm: 'badge-warning', cold: 'badge-info' };
    return <span className={`badge ${m[value] || 'badge-default'}`}>{value}</span>;
  }
  if (key === 'threat_level') {
    const m = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-default' };
    return <span className={`badge ${m[value] || 'badge-default'}`}>{value}</span>;
  }
  if (key === 'priority') {
    const m = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-default' };
    return <span className={`badge ${m[value] || 'badge-default'}`}>{value}</span>;
  }
  if (key === 'sponsorship_level') {
    const m = { Platinum: 'badge-purple', Gold: 'badge-warning', Silver: 'badge-default', Bronze: 'badge-info' };
    return <span className={`badge ${m[value] || 'badge-default'}`}>{value}</span>;
  }
  if (key === 'design_status' || key === 'print_status') {
    const m = { draft: 'badge-default', 'in-progress': 'badge-info', approved: 'badge-success', pending: 'badge-warning', printed: 'badge-success', shipped: 'badge-success', 'n/a': 'badge-default' };
    return <span className={`badge ${m[value] || 'badge-default'}`}>{value}</span>;
  }
  return String(value).length > 40 ? String(value).substring(0, 40) + '...' : String(value);
}

function DetailView({ item, config, onClose, onEdit, onDelete }) {
  return (
    <div>
      <button className="back-btn" onClick={onClose}>← Back to list</button>
      <div className="detail-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>
            {item.name || item.contact_name || item.company_name || item.category || `#${item.id}`}
          </h3>
          <div className="detail-actions">
            <button className="btn btn-primary btn-sm" onClick={() => onEdit(item)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-grid">
          {config.fields.map(f => (
            <div key={f.key} className="detail-item">
              <label>{f.label}</label>
              <div className="value">{formatCell(f.key, item[f.key])}</div>
            </div>
          ))}
          {item.event_name && (
            <div className="detail-item">
              <label>Event</label>
              <div className="value">{item.event_name}</div>
            </div>
          )}
          <div className="detail-item">
            <label>Created</label>
            <div className="value">{new Date(item.created_at).toLocaleString()}</div>
          </div>
          <div className="detail-item">
            <label>Updated</label>
            <div className="value">{new Date(item.updated_at).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormModal({ config, item, onSave, onClose, title }) {
  const [form, setForm] = useState(() => {
    if (item) return { ...item };
    const defaults = {};
    config.fields.forEach(f => { defaults[f.key] = ''; });
    return defaults;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {config.fields.map(f => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    className="form-control"
                    value={form[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                  >
                    <option value="">Select...</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="form-control"
                    value={form[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                  />
                ) : (
                  <input
                    type={f.type}
                    className="form-control"
                    value={form[f.key] || ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    step={f.type === 'number' ? '0.01' : undefined}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResourcePage({ resource, title, resourceKey }) {
  const key = resourceKey || resource;
  const config = fieldConfigs[key] || fieldConfigs.events;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list | detail

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await api.getAll(key);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, [key]);

  const handleCreate = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleSave = async (form) => {
    try {
      if (editItem) {
        await api.update(key, editItem.id, form);
      } else {
        await api.create(key, form);
      }
      setShowForm(false);
      setEditItem(null);
      setViewMode('list');
      setSelectedItem(null);
      loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(key, id);
      setViewMode('list');
      setSelectedItem(null);
      loadItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setViewMode('detail');
  };

  if (loading) return <div className="loading"><div className="spinner" /> Loading {title}...</div>;

  return (
    <div>
      {viewMode === 'detail' && selectedItem ? (
        <DetailView
          item={selectedItem}
          config={config}
          onClose={() => { setViewMode('list'); setSelectedItem(null); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <>
          <div className="page-header">
            <div>
              <h2>{title}</h2>
              <div className="page-header-sub">{items.length} total records</div>
            </div>
            <button className="btn btn-primary" onClick={handleCreate}>
              + New {title.replace(/s$/, '')}
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {config.columns.map(col => (
                    <th key={col}>{col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={config.columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found. Click "New" to add one.</td></tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} onClick={() => handleRowClick(item)}>
                      {config.columns.map(col => (
                        <td key={col}>{formatCell(col, item[col])}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <FormModal
          config={config}
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          title={editItem ? `Edit ${title.replace(/s$/, '')}` : `New ${title.replace(/s$/, '')}`}
        />
      )}
    </div>
  );
}
