import React, { useState, useEffect } from 'react';
import { fetchVenues, createVenue, updateVenue, deleteVenue, fetchVenueById, createVenueSeats, fetchSeatCategories } from '../services/venueService';
import { Building2, Plus, Edit2, Trash2, LayoutGrid, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminVenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueName, setVenueName] = useState('');
  const [venueLocation, setVenueLocation] = useState('');
  const [submittingVenue, setSubmittingVenue] = useState(false);

  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueSeats, setVenueSeats] = useState([]);
  const [rowsCount, setRowsCount] = useState(4);
  const [seatsPerRow, setSeatsPerRow] = useState(6);
  const [premiumRows, setPremiumRows] = useState(1);
  const [submittingLayout, setSubmittingLayout] = useState(false);

  const loadData = async () => {
    try {
      const [vData, cData] = await Promise.all([
        fetchVenues(),
        fetchSeatCategories()
      ]);
      setVenues(vData);
      setCategories(cData);
    } catch (err) {
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateVenue = () => {
    setEditingVenue(null);
    setVenueName('');
    setVenueLocation('');
    setShowVenueModal(true);
  };

  const handleOpenEditVenue = (v) => {
    setEditingVenue(v);
    setVenueName(v.name);
    setVenueLocation(v.location);
    setShowVenueModal(true);
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault();
    setSubmittingVenue(true);
    setError('');
    setSuccess('');

    try {
      if (editingVenue) {
        await updateVenue(editingVenue.id, { name: venueName, location: venueLocation });
        setSuccess('Venue updated successfully.');
      } else {
        await createVenue({ name: venueName, location: venueLocation });
        setSuccess('Venue created successfully.');
      }
      setShowVenueModal(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save venue.');
    } finally {
      setSubmittingVenue(false);
    }
  };

  const handleDeleteVenue = async (id) => {
    if (!window.confirm('Delete this venue?')) return;
    try {
      await deleteVenue(id);
      setSuccess('Venue deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete venue.');
    }
  };

  const handleOpenLayoutModal = async (v) => {
    setSelectedVenue(v);
    setError('');
    try {
      const vDetails = await fetchVenueById(v.id);
      setVenueSeats(vDetails.seats || []);
      setShowLayoutModal(true);
    } catch (err) {
      setError('Failed to load venue layout');
    }
  };

  const handleGenerateLayout = async (e) => {
    e.preventDefault();
    if (!selectedVenue) return;

    setSubmittingLayout(true);
    setError('');
    setSuccess('');

    const premiumCat = categories.find((c) => c.name.toLowerCase().includes('premium')) || categories[0];
    const standardCat = categories.find((c) => c.name.toLowerCase().includes('standard')) || categories[1] || categories[0];

    const generatedSeats = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let r = 0; r < rowsCount; r++) {
      const rowLabel = letters[r];
      const categoryId = r < premiumRows ? premiumCat.id : standardCat.id;

      for (let s = 1; s <= seatsPerRow; s++) {
        generatedSeats.push({
          rowLabel,
          seatNumber: s,
          categoryId
        });
      }
    }

    try {
      await createVenueSeats(selectedVenue.id, generatedSeats);
      setSuccess(`Layout generated: ${generatedSeats.length} seats created for ${selectedVenue.name}!`);
      setShowLayoutModal(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to generate layout.');
    } finally {
      setSubmittingLayout(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>Venue & Seat Administration</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create venues and configure physical seat layouts.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateVenue}>
          <Plus size={18} /> Add New Venue
        </button>
      </div>

      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading venues...</div>
        ) : venues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No venues registered.</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Venue Name</th>
                  <th>Location</th>
                  <th>Total Configured Seats</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.name}</strong></td>
                    <td>{v.location}</td>
                    <td>
                      <span className="badge badge-primary">{v.total_seats || 0} Seats</span>
                    </td>
                    <td>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleOpenLayoutModal(v)}>
                          <LayoutGrid size={14} /> Seat Layout
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleOpenEditVenue(v)}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVenue(v.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showVenueModal && (
        <div className="modal-backdrop" onClick={() => setShowVenueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '18px' }}>
              {editingVenue ? 'Edit Venue' : 'Create New Venue'}
            </h2>
            <form onSubmit={handleSaveVenue}>
              <div className="form-group">
                <label className="form-label">Venue Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Royal Opera House"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={venueLocation}
                  onChange={(e) => setVenueLocation(e.target.value)}
                  placeholder="e.g. 50 Arts Way, Central District"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowVenueModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingVenue}>
                  {submittingVenue ? 'Saving...' : 'Save Venue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLayoutModal && selectedVenue && (
        <div className="modal-backdrop" onClick={() => setShowLayoutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Configure Layout: {selectedVenue.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Current layout has {venueSeats.length} seats. Generating a layout will update seat configurations.
            </p>

            <form onSubmit={handleGenerateLayout}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Number of Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="form-input"
                    value={rowsCount}
                    onChange={(e) => setRowsCount(parseInt(e.target.value, 10))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Seats per Row</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    className="form-input"
                    value={seatsPerRow}
                    onChange={(e) => setSeatsPerRow(parseInt(e.target.value, 10))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Premium Front Rows</label>
                <input
                  type="number"
                  min="0"
                  max={rowsCount}
                  className="form-input"
                  value={premiumRows}
                  onChange={(e) => setPremiumRows(parseInt(e.target.value, 10))}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Rows A through {String.fromCharCode(65 + Math.max(0, premiumRows - 1))} will be set to Premium Category.
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px', margin: '16px 0' }}>
                Total Seats to Generate: <strong>{rowsCount * seatsPerRow}</strong> ({premiumRows * seatsPerRow} Premium, {(rowsCount - premiumRows) * seatsPerRow} Standard)
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowLayoutModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingLayout}>
                  {submittingLayout ? 'Generating Layout...' : 'Generate Seat Layout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
