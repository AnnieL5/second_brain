import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";

const paper = {
  bg:         "#FAF8F5",
  card:       "#FFFFFF",
  border:     "#E2DDD6",
  text:       "#3D3530",
  muted:      "#9C8F85",
  accent:     "#7C6F5B",
  accentSoft: "#EDE8E1",
  tagBg:      "#EDE8E1",
  tagText:    "#5C4F3D",
  red:        "#DC2626",
  redSoft:    "#FEE2E2",
};

export default function LibraryTab({ filterTag, setFilterTag, onEntriesChanged }) {
  const [entries, setEntries]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState("newest");
  const [expanded, setExpanded] = useState({});
  const [editingTags, setEditingTags] = useState({});  // entryId → new tag input value
  const limit = 10;

  useEffect(() => { loadEntries(); }, [page, sort]);

  async function loadEntries() {
    try {
      const res = await axios.get(`${API}/entries`, { params: { page, limit, sort } });
      const data = res.data;
      if (Array.isArray(data)) {
        setEntries(data); setTotal(data.length);
      } else if (data && Array.isArray(data.entries)) {
        setEntries(data.entries); setTotal(data.total ?? data.entries.length);
      } else {
        setEntries([]); setTotal(0);
      }
    } catch { setEntries([]); setTotal(0); }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this entry?")) return;
    await axios.delete(`${API}/entries/${id}`);
    loadEntries();
    onEntriesChanged?.();
  }

  // Save updated tags for an entry to the backend
  async function saveTags(entry, newTags) {
    try {
      await axios.patch(`${API}/entries/${entry.id}`, { tags: newTags });
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, tags: newTags } : e));
      onEntriesChanged?.();
    } catch { alert("Could not save tags."); }
  }

  function removeTag(entry, tagToRemove) {
    const newTags = entry.tags.filter(t => t !== tagToRemove);
    saveTags(entry, newTags);
  }

  function addTag(entry, newTag) {
    const trimmed = newTag.trim().toLowerCase();
    if (!trimmed || entry.tags.includes(trimmed)) return;
    saveTags(entry, [...entry.tags, trimmed]);
    setEditingTags(prev => ({ ...prev, [entry.id]: "" }));
  }

  function toggleRaw(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Filter by search input AND sidebar tag filter
  const filtered = entries.filter(e => {
    const matchesSearch = !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some(t => t.includes(search.toLowerCase()));
    const matchesTag = !filterTag || e.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const totalPages = Math.ceil(total / limit);
  const allTags = [...new Set(entries.flatMap(e => e.tags ?? []))];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ fontSize: 20, margin: 0, color: paper.text }}>Library</h2>
      </div>

      {/* Stat bar */}
      <p style={{ color: paper.muted, marginBottom: 16, fontSize: 13 }}>
        {total} entries · {allTags.length} tags
      </p>

      {/* Active tag filter badge */}
      {filterTag && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: paper.muted }}>Filtering by:</span>
          <span style={{
            padding: "2px 10px", borderRadius: 20, fontSize: 12,
            background: paper.accent, color: "#fff", fontWeight: 600,
          }}>{filterTag}</span>
          <button onClick={() => setFilterTag(null)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: paper.muted, fontSize: 12, padding: 0,
          }}>✕ clear</button>
        </div>
      )}

      {/* Filter + sort row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by keyword or tag..."
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            border: `1px solid ${paper.border}`, fontSize: 14,
            background: "#fff", color: paper.text, outline: "none",
          }}
        />
        <select
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
          style={{
            padding: "8px 12px", borderRadius: 8,
            border: `1px solid ${paper.border}`, fontSize: 14,
            background: "#fff", color: paper.text,
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Entry cards */}
      {filtered.length === 0 && (
        <p style={{ color: paper.muted, fontSize: 14 }}>No entries found.</p>
      )}

      {filtered.map(entry => (
        <div key={entry.id} style={{
          padding: 16, background: paper.card, borderRadius: 12,
          marginBottom: 12, border: `1px solid ${paper.border}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Title + date */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: paper.text }}>{entry.title}</span>
            <span style={{ color: paper.muted, fontSize: 12 }}>
              {new Date(entry.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* Summary */}
          <p style={{ margin: "0 0 10px", fontSize: 14, color: paper.muted, lineHeight: 1.6 }}>
            {entry.summary}
          </p>

          {/* Tags row — with delete × per tag + add tag input */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10, alignItems: "center" }}>
            {entry.tags.map(t => (
              <span key={t} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: paper.tagBg, padding: "2px 8px 2px 10px",
                borderRadius: 20, fontSize: 12, color: paper.tagText,
              }}>
                {t}
                <button
                  onClick={() => removeTag(entry, t)}
                  title="Remove tag"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: paper.muted, fontSize: 13, padding: 0, lineHeight: 1,
                  }}
                >×</button>
              </span>
            ))}

            {/* Add tag input */}
            <input
              type="text"
              value={editingTags[entry.id] ?? ""}
              onChange={e => setEditingTags(prev => ({ ...prev, [entry.id]: e.target.value }))}
              onKeyDown={e => {
                if (e.key === "Enter") addTag(entry, editingTags[entry.id] ?? "");
              }}
              placeholder="+ add tag"
              style={{
                padding: "2px 8px", borderRadius: 20, fontSize: 12,
                border: `1px dashed ${paper.border}`, background: "transparent",
                color: paper.tagText, outline: "none", width: 72,
              }}
            />
          </div>

          {/* Raw text expanded */}
          {expanded[entry.id] && (
            <pre style={{
              background: paper.accentSoft, padding: 10, borderRadius: 8,
              fontSize: 13, whiteSpace: "pre-wrap", marginBottom: 8,
              color: paper.text, border: `1px solid ${paper.border}`,
            }}>
              {entry.raw_text}
            </pre>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleRaw(entry.id)} style={{
              padding: "5px 12px", borderRadius: 6,
              border: `1px solid ${paper.border}`, cursor: "pointer",
              background: "#fff", fontSize: 13, color: paper.text,
            }}>
              {expanded[entry.id] ? "hide raw" : "show raw"}
            </button>
            <button onClick={() => handleDelete(entry.id)} style={{
              padding: "5px 12px", borderRadius: 6, border: "none",
              background: paper.redSoft, color: paper.red,
              cursor: "pointer", fontSize: 13, fontWeight: 500,
            }}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
            padding: "6px 14px", borderRadius: 6, border: `1px solid ${paper.border}`, cursor: "pointer", background: "#fff",
          }}>←</button>
          <span style={{ lineHeight: "32px", fontSize: 14, color: paper.muted }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
            padding: "6px 14px", borderRadius: 6, border: `1px solid ${paper.border}`, cursor: "pointer", background: "#fff",
          }}>→</button>
        </div>
      )}
    </div>
  );
}