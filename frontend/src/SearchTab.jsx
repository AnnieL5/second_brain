import { useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function SearchTab() {
  const [query, setQuery]     = useState("");
  const [mode, setMode]       = useState("find");   // "find" or "ask"
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await axios.post(`${API}/search`, { query, mode, limit: 5 });
      setResults(res.data);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Search your brain</h2>

      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSearch()}
        placeholder="What do I know about...?"
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 15, boxSizing: "border-box" }}
      />

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {["find", "ask"].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? "#6c63ff" : "#eee",
              color: mode === m ? "#fff" : "#333",
            }}
          >
            {m === "find" ? "Find entries" : "Ask a question"}
          </button>
        ))}
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ marginLeft: "auto", padding: "7px 20px", background: "#333", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results */}
      {results && mode === "ask" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ padding: 16, background: "#f0fff4", borderRadius: 12, border: "1px solid #86efac", marginBottom: 16 }}>
            <p style={{ fontWeight: 600, margin: "0 0 8px" }}>💡 Answer</p>
            <p style={{ margin: 0, lineHeight: 1.7 }}>{results.answer}</p>
          </div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Sources</p>
          {results.sources.map(s => (
            <div key={s.id} style={{ padding: 12, background: "#f9f9f9", borderRadius: 8, marginBottom: 8, border: "1px solid #e0e0e0" }}>
              <span style={{ fontWeight: 500 }}>{s.title}</span>
              <span style={{ float: "right", color: "#888", fontSize: 13 }}>{Math.round(s.score * 100)}% match</span>
            </div>
          ))}
        </div>
      )}

      {results && mode === "find" && (
        <div style={{ marginTop: 20 }}>
          {results.results.length === 0 && <p style={{ color: "#888" }}>No results found.</p>}
          {results.results.map(r => (
            <div key={r.id} style={{ padding: 14, background: "#f9f9f9", borderRadius: 10, marginBottom: 10, border: "1px solid #e0e0e0" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>{r.title}</span>
                <span style={{ color: "#6c63ff", fontSize: 13 }}>{Math.round(r.score * 100)}% match</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#555" }}>{r.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}