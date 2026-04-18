import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";

export default function StoreTab({ folders, onClearSignal }) {
  const [text, setText]       = useState("");
  const [tags, setTags]       = useState("");
  const [preview, setPreview] = useState(null);   // holds the AI summary before saving
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  // Clear when the sidebar Clear button is pressed
  useEffect(() => {
    setText("");
    setTags([]);
    setSelectedFolderId(null);
    setPreview(null);
  }, [onClearSignal]); // onClearSignal is a number that increments on clear

  // Step 1: send text to /store, get back AI summary
  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true);
    setSaved(false);
    setPreview(null);
    try {
      const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
      const res = await axios.post(`${API}/store`, { raw_text: text, tags: tagList, folder_id: selectedFolderId });
      setPreview(res.data);   // show the title, summary, tags the AI made
    } catch (err) {
      alert("Error: " + err.message);
    }
    setLoading(false);
  }

  // Step 2: user confirms — the data is already saved by /store, so just clear the form
  function handleSave() {
    setSaved(true);
    setPreview(null);
    setText("");
    setTags("");
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Paste anything</h2>

      <textarea
        rows={6}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="rough note, email, shower thought..."
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 15, boxSizing: "border-box" }}
      />

      <input
        type="text"
        value={tags}
        onChange={e => setTags(e.target.value)}
        placeholder="Tags (comma separated): coding, ideas, health"
        style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #ccc", fontSize: 14, boxSizing: "border-box" }}
      />

      <div style={{ margin: "12px 0" }}>
        <label style={{ fontSize: "13px", color: "#888" }}>Folder</label>
        <select
          value={selectedFolderId ?? ""}
          onChange={e => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)}
          style={{
            display: "block", marginTop: "6px", padding: "8px",
            borderRadius: "8px", border: "1px solid #333",
            background: "#1a1a1a", color: "#eee", width: "100%"
          }}
        >
          <option value="">No folder</option>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ marginTop: 12, padding: "10px 24px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
      >
        {loading ? "Thinking..." : "Submit →"}
      </button>

      {saved && <p style={{ color: "green", marginTop: 12 }}>✅ Saved to your brain!</p>}

      {/* Preview card — shows AI result before saving */}
      {preview && (
        <div style={{ marginTop: 20, padding: 16, background: "#f5f5ff", borderRadius: 12, border: "1px solid #c5c0ff" }}>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>📌 {preview.title}</p>
          <p style={{ margin: "0 0 8px", color: "#444", fontSize: 14 }}>{preview.summary}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {preview.tags.map(t => (
              <span key={t} style={{ background: "#e0ddff", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>{t}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPreview(null)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer", background: "#fff" }}>
              Edit
            </button>
            <button onClick={handleSave} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#6c63ff", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Save →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}