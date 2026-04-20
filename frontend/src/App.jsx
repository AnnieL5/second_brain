import { useState, useEffect } from "react";
import axios from "axios";
import StoreTab from "./StoreTab";
import SearchTab from "./SearchTab";
import LibraryTab from "./LibraryTab";

const API = "http://localhost:8000";

export default function App() {
  const [activeTab, setActiveTab]     = useState("store");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [entries, setEntries]         = useState([]);
  const [tagSearch, setTagSearch]     = useState("");
  const [filterTag, setFilterTag]     = useState(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Load all entries once so sidebar can compute tags
  useEffect(() => { fetchEntries(); }, []);

  async function fetchEntries() {
    try {
      const res = await axios.get(`${API}/entries`, { params: { page: 1, limit: 200 } });
      const data = res.data;
      setEntries(Array.isArray(data) ? data : (data.entries ?? []));
    } catch { setEntries([]); }
  }

  // Click a tag → switch to Library and filter by that tag
  function handleTagClick(tag) {
    setFilterTag(tag);
    setActiveTab("library");
  }

  // Clear all notes
  async function handleClearAll() {
    if (!clearConfirm) { setClearConfirm(true); return; }
    try {
      await Promise.all(entries.map(e => axios.delete(`${API}/entries/${e.id}`)));
      setEntries([]);
      setClearConfirm(false);
      setFilterTag(null);
    } catch { alert("Something went wrong clearing entries."); }
  }

  // Compute tag lists from entries
  const allTags = entries.flatMap(e => e.tags ?? []);

  // Frequency map
  const tagFreq = allTags.reduce((acc, t) => {
    acc[t] = (acc[t] || 0) + 1; return acc;
  }, {});

  // Top 6 most frequent tags
  const frequentTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);

  // 5 most recent unique tags (from newest entries first)
  const recentTags = [...new Set(
    [...entries].reverse().flatMap(e => e.tags ?? [])
  )].slice(0, 5);

  // Filter tag panel by tagSearch input
  const visibleTags = [...new Set([...recentTags, ...frequentTags])]
    .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()));

  const tabs = ["store", "search", "library"];
  const tabIcons = { store: "✏️", search: "🔍", library: "📚" };

  // Paper theme tokens
  const paper = {
    bg:         "#FAF8F5",
    sidebar:    "#F3F0EB",
    border:     "#E2DDD6",
    text:       "#3D3530",
    muted:      "#9C8F85",
    accent:     "#7C6F5B",
    accentSoft: "#EDE8E1",
    tagBg:      "#EDE8E1",
    tagActive:  "#7C6F5B",
    tagText:    "#5C4F3D",
  };

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: paper.bg, fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: paper.text,
    }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? 220 : 56,
        minWidth: sidebarOpen ? 220 : 56,
        background: paper.sidebar,
        borderRight: `1px solid ${paper.border}`,
        display: "flex", flexDirection: "column",
        transition: "width 0.2s, min-width 0.2s",
        overflow: "hidden",
      }}>

        {/* Toggle button */}
        <button
          onClick={() => { setSidebarOpen(o => !o); setClearConfirm(false); }}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            margin: "12px auto 8px", width: 32, height: 32,
            border: `1px solid ${paper.border}`, borderRadius: 8,
            background: "#fff", cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {sidebarOpen ? "←" : "→"}
        </button>

        {/* App title — only when open */}
        {sidebarOpen && (
          <div style={{ padding: "0 16px 12px", borderBottom: `1px solid ${paper.border}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: paper.text }}>🧠 Second Brain</div>
            <div style={{ fontSize: 11, color: paper.muted, marginTop: 2 }}>your personal knowledge store</div>
          </div>
        )}

        {/* Nav tabs */}
        <nav style={{ padding: "10px 8px", borderBottom: `1px solid ${paper.border}` }}>
          {tabs.map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); if (tab !== "library") setFilterTag(null); }}
                title={tab.charAt(0).toUpperCase() + tab.slice(1)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: 10, padding: sidebarOpen ? "8px 10px" : "8px 0",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? paper.accentSoft : "transparent",
                  color: active ? paper.accent : paper.text,
                  fontWeight: active ? 600 : 400, fontSize: 14,
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 16 }}>{tabIcons[tab]}</span>
                {sidebarOpen && (tab.charAt(0).toUpperCase() + tab.slice(1))}
              </button>
            );
          })}
        </nav>

        {/* Tag panel — only when open */}
        {sidebarOpen && (
          <div style={{ padding: "12px 12px 8px", flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: paper.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Tags
            </div>

            {/* Tag search */}
            <input
              type="text"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              placeholder="Search tags..."
              style={{
                width: "100%", padding: "5px 8px", fontSize: 12,
                borderRadius: 6, border: `1px solid ${paper.border}`,
                background: "#fff", color: paper.text,
                boxSizing: "border-box", marginBottom: 8, outline: "none",
              }}
            />

            {/* Tag chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {visibleTags.length === 0 && (
                <span style={{ fontSize: 12, color: paper.muted }}>No tags yet</span>
              )}
              {visibleTags.map(tag => {
                const active = filterTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    style={{
                      padding: "3px 9px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                      border: `1px solid ${active ? paper.tagActive : paper.border}`,
                      background: active ? paper.tagActive : paper.tagBg,
                      color: active ? "#fff" : paper.tagText,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Clear filter */}
            {filterTag && (
              <button
                onClick={() => setFilterTag(null)}
                style={{
                  marginTop: 8, fontSize: 11, color: paper.muted,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                ✕ clear filter
              </button>
            )}
          </div>
        )}

        {/* Clear All button — bottom of sidebar */}
        <div style={{ padding: "10px 8px", borderTop: `1px solid ${paper.border}` }}>
          {sidebarOpen ? (
            clearConfirm ? (
              <div style={{ fontSize: 12 }}>
                <div style={{ color: paper.muted, marginBottom: 6 }}>Delete all notes?</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleClearAll} style={{
                    flex: 1, padding: "5px 0", borderRadius: 6, border: "none",
                    background: "#DC2626", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>Yes, clear</button>
                  <button onClick={() => setClearConfirm(false)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 6,
                    border: `1px solid ${paper.border}`, background: "#fff",
                    cursor: "pointer", fontSize: 12,
                  }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={handleClearAll} style={{
                width: "100%", padding: "7px 0", borderRadius: 8,
                border: `1px solid ${paper.border}`, background: "#fff",
                color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 500,
              }}>
                🗑 Clear all notes
              </button>
            )
          ) : (
            <button onClick={handleClearAll} title="Clear all notes" style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${paper.border}`,
              background: "#fff", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
            }}>🗑</button>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: "32px 40px", boxSizing: "border-box" }}>
        {activeTab === "store"   && <StoreTab onSaved={fetchEntries} />}
        {activeTab === "search"  && <SearchTab />}
        {activeTab === "library" && (
          <LibraryTab
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            onEntriesChanged={fetchEntries}
          />
        )}
      </main>
    </div>
  );
}