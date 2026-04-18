import { useState } from 'react'
import StoreTab from "./StoreTab";
import SearchTab from "./SearchTab";
import LibraryTab from "./LibraryTab";

export default function App() {
  const [activeTab, setActiveTab] = useState("store");

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>🧠 Second Brain</h1>
      <p style={{ color: "#888", marginBottom: 20 }}>Paste anything. Find anything. Ask anything.</p>

      {/* Tab buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["store", "search", "library"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? "#6c63ff" : "#eee",
              color: activeTab === tab ? "#fff" : "#333",
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Show the right tab */}
      {activeTab === "store"   && <StoreTab />}
      {activeTab === "search"  && <SearchTab />}
      {activeTab === "library" && <LibraryTab />}
    </div>
  );
}