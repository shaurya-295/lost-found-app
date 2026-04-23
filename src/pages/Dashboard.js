import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { addItem, getAllItems, updateItem, deleteItem, searchItems } from '../services/api';

const emptyForm = {
  itemName: '', description: '', type: 'Lost',
  location: '', date: '', contactInfo: '',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('user'));

  const [items,    setItems]    = useState([]);
  const [form,     setForm]     = useState(emptyForm);
  const [search,   setSearch]   = useState('');
  const [editItem, setEditItem] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ text: '', type: '' });

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await getAllItems();
      setItems(data);
    } catch {
      showMsg('Failed to load items.', 'error');
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addItem(form);
      setForm(emptyForm);
      showMsg('Item reported successfully!');
      fetchItems();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to add item.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateItem(editItem._id, editItem);
      setEditItem(null);
      showMsg('Item updated successfully!');
      fetchItems();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to update item.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteItem(id);
      showMsg('Item deleted.');
      fetchItems();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Cannot delete this item.', 'error');
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) { fetchItems(); return; }
    try {
      const { data } = await searchItems(search);
      setItems(data);
    } catch {
      showMsg('Search failed.', 'error');
    }
  };

  return (
    <div>
      {/* Navbar */}
      <div className="navbar">
        <h2>🎒 Lost & Found</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>👋 {user?.name}</span>
          <button className="btn btn-sm btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="main-content">

        {/* Message */}
        {msg.text && (
          <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'}>
            {msg.text}
          </div>
        )}

        {/* Add Item Form */}
        <div className="section-card">
          <h3>📋 Report Lost / Found Item</h3>
          <form onSubmit={handleAddItem}>
            <div className="form-grid">
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Backpack"
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Lost</option>
                  <option>Found</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  placeholder="Describe the item..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Library Block B"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Contact Info</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn" style={{ maxWidth: '200px' }} disabled={loading}>
              {loading ? 'Submitting...' : '+ Report Item'}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="section-card">
          <h3>🔍 Search Items</h3>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn" style={{ width: 'auto', padding: '9px 20px' }} onClick={handleSearch}>
              Search
            </button>
            {search && (
              <button className="btn btn-outline" style={{ width: 'auto', padding: '9px 20px' }}
                onClick={() => { setSearch(''); fetchItems(); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* All Items */}
        <div className="section-card">
          <h3>📦 All Reported Items ({items.length})</h3>
          {items.length === 0 ? (
            <div className="no-items">No items found. Be the first to report one!</div>
          ) : (
            <div className="items-grid">
              {items.map((item) => (
                <div className="item-card" key={item._id}>
                  <span className={`badge ${item.type === 'Lost' ? 'badge-lost' : 'badge-found'}`}>
                    {item.type}
                  </span>
                  <h4>{item.itemName}</h4>
                  <p>{item.description}</p>
                  <p>📍 {item.location}</p>
                  <p>📅 {new Date(item.date).toLocaleDateString()}</p>
                  <p>📞 {item.contactInfo}</p>
                  <p>👤 {item.postedBy?.name}</p>
                  <div className="item-actions">
                    <button className="btn btn-sm btn-outline"
                      onClick={() => setEditItem({ ...item })}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(item._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Item</h3>
              <button className="modal-close" onClick={() => setEditItem(null)}>×</button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" value={editItem.itemName}
                  onChange={(e) => setEditItem({ ...editItem, itemName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={editItem.type}
                  onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}>
                  <option>Lost</option>
                  <option>Found</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={editItem.description}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={editItem.location}
                  onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editItem.date ? editItem.date.slice(0, 10) : ''}
                  onChange={(e) => setEditItem({ ...editItem, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Contact Info</label>
                <input type="text" value={editItem.contactInfo}
                  onChange={(e) => setEditItem({ ...editItem, contactInfo: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setEditItem(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;