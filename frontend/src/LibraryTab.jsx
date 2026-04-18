import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function LibraryTab({ activeFolderId, folders = [], onClearSignal, onEntryDeleted }) {
  const [entries, setEntries]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState("newest");
  const [expanded, setExpanded] = useState({});
  const limit = 10;

  // Re-fetch when folder changes, page changes, sort changes, or clear is triggered
  useEffect(() => {
    loadEntries();
  }, [page, sort, activeFolderId, onClearSignal]);

  // Reset to page 1 when folder changes
  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [activeFolderId, onClearSignal]);

  async function loadEntries() {
    try {
      const params = { page, limit, sort };
      if (activeFolderId) params.folder_id = activeFolderId;

      const res = await axios.get(`${API}/entries`, { params });
      const data = res.data;

      if (Array.isArray(data)) {
        setEntries(data);
        setTotal(data.length);
      } else if (data && Array.isArray(data.entries)) {
        setEntries(data.entries);
        setTotal(data.total ?? data.entries.length);
      } else {
        setEntries([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Failed to load entries:", err);
      setEntries([]);
      setTotal(0);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    await axios.delete(`${API}/entries/${id}`);
    loadEntries();
    if (onEntryDeleted) onEntryDeleted(); // refresh folder counts in sidebar
  }

  async function handleMoveFolder(entryId, newFolderId) {
    await axios.patch(`${API}/entries/${entryId}/folder`, {
      folder_id: newFolderId ? Number(newFolderId) : null
    });
    loadEntries();
    if (onEntryDeleted) onEntryDeleted(); // reuse this to refresh sidebar counts
  }

  function toggleRaw(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const filtered = entries.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.tags.some(t => t.includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(total / limit);
  const allTags = [...new Set((entries ?? []).flatMap(e => e.tags ?? []))];

  // Find the active folder name for the heading
  const activeFolderName = activeFolderId
    ? folders.find(f => f.id === activeFolderId)?.name
    : null;

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 4 }}>
        {activeFolderName ? `📁 ${activeFolderName}` : "Library"}
      </h2>

      {/* Stat bar */}
      <p style={{ color: "#888", marginBottom: 16, fontSize: 13 }}>
        {total} entries · {allTags.length} tags
      </p>

      {/* Filter + sort */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by keyword or tag..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
        />
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 14 }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Entry cards */}
      {filtered.map(entry => (
        <div key={entry.id} style={{ padding: 16, background: "#f9f9f9", borderRadius: 12, marginBottom: 12, border: "1px solid #e0e0e0" }}>
          
          {/* Title + date */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{entry.title}</span>
            <span style={{ color: "#aaa", fontSize: 12 }}>{new Date(entry.created_at).toLocaleDateString()}</span>
          </div>

          {/* Summary */}
          <p style={{ margin: "0 0 8px", fontSize: 14, color: "#555" }}>{entry.summary}</p>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {entry.tags.map(t => (
              <span key={t} style={{ background: "#e0ddff", padding: "2px 10px", borderRadius: 20, fontSize: 12, color: "#5a50d4" }}>
                {t}
              </span>
            ))}
          </div>

          {/* Folder badge + move dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {entry.folder_id && (
              <span style={{ fontSize: 11, background: "#2d2d5e", color: "#a78bfa", padding: "2px 8px", borderRadius: 12 }}>
                📁 {folders.find(f => f.id === entry.folder_id)?.name ?? "Unknown"}
              </span>
            )}
            <select
              value={entry.folder_id ?? ""}
              onChange={e => handleMoveFolder(entry.id, e.target.value || null)}
              style={{ fontSize: 12, background: "#f0f0f0", color: "#555", border: "1px solid #ddd", borderRadius: 6, padding: "2px 6px", cursor: "pointer" }}
            >
              <option value="">No folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Raw text if expanded */}
          {expanded[entry.id] && (
            <pre style={{ background: "#eee", padding: 10, borderRadius: 8, fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 8 }}>
              {entry.raw_text}
            </pre>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleRaw(entry.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer", background: "#fff", fontSize: 13 }}>
              {expanded[entry.id] ? "hide raw" : "show raw"}
            </button>
            <button onClick={() => handleDelete(entry.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              Delete
            </button>
          </div>

        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer" }}>
            ←
          </button>
          <span style={{ lineHeight: "32px", fontSize: 14 }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ccc", cursor: "pointer" }}>
            →
          </button>
        </div>
      )}
    </div>
  );
}