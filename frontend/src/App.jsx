import { useState, useEffect } from 'react'
import Sidebar from "./Sidebar";
import StoreTab from "./StoreTab";
import SearchTab from "./SearchTab";
import LibraryTab from "./LibraryTab";

export default function App() {
  const [activeView, setActiveView] = useState("add");
  const [folders, setFolders] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [clearSignal, setClearSignal] = useState(0); // increments to trigger clear

  // Load folders on startup
  useEffect(() => {
    fetchFolders();
  }, []);

  async function fetchFolders() {
    const res = await fetch("/folders");
    const data = await res.json();
    setFolders(data);
  }

  async function handleNewFolder(name) {
    await fetch("/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchFolders(); // refresh the list
  }

  async function handleDeleteFolder(id) {
    await fetch(`/folders/${id}`, { method: "DELETE" });
    if (activeFolderId === id) setActiveFolderId(null);
    fetchFolders();
  }

  function handleClear() {
    setClearSignal(s => s + 1); // child components watch this number
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#111", color: "#eee" }}>

      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        folders={folders}
        activeFolderId={activeFolderId}
        setActiveFolderId={setActiveFolderId}
        onNewFolder={handleNewFolder}
        onDeleteFolder={handleDeleteFolder}
        onClear={handleClear}
      />

      {/* Main content panel */}
      <div style={{ flex: 1, padding: "32px", maxWidth: "800px" }}>
        {activeView === "add" && (
          <StoreTab
            folders={folders}
            onClearSignal={clearSignal}
            onStoreDone={fetchFolders} // refresh counts after saving
          />
        )}
        {activeView === "ask" && (
          <SearchTab onClearSignal={clearSignal} />
        )}
        {activeView === "library" && (
          <LibraryTab
            activeFolderId={activeFolderId}
            folders={folders}
            onClearSignal={clearSignal}
            onEntryDeleted={fetchFolders}
          />
        )}
      </div>

    </div>
  );
}