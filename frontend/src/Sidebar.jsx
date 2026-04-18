import { useState } from "react";

export default function Sidebar({ 
  activeView,        // "add" | "ask" | "library"
  setActiveView,
  folders,           // array of folder objects from the API
  activeFolderId,    // currently selected folder (null = All Notes)
  setActiveFolderId,
  onNewFolder,       // function to create a folder
  onDeleteFolder,    // function to delete a folder
  onClear            // function to clear current view's inputs
}) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showInput, setShowInput] = useState(false);

  function handleNewFolder() {
    if (newFolderName.trim() === "") return;
    onNewFolder(newFolderName.trim());
    setNewFolderName("");
    setShowInput(false);
  }

  function handleLibraryClick() {
    setActiveView("library");
    setActiveFolderId(null); // show all notes
  }

  function handleFolderClick(folderId) {
    setActiveView("library");
    setActiveFolderId(folderId);
  }

  return (
    <div style={styles.sidebar}>

      {/* App title */}
      <div style={styles.title}>🧠 Second Brain</div>

      {/* Main navigation */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Navigation</div>
        <NavItem icon="📥" label="Add" active={activeView === "add"}
          onClick={() => setActiveView("add")} />
        <NavItem icon="🔍" label="Ask" active={activeView === "ask"}
          onClick={() => setActiveView("ask")} />
        <NavItem icon="📚" label="Library" active={activeView === "library" && activeFolderId === null}
          onClick={handleLibraryClick} />
      </div>

      {/* Folders */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Folders</div>

        {folders.map(folder => (
          <div key={folder.id} style={styles.folderRow}>
            <div
              style={{
                ...styles.navItem,
                ...(activeFolderId === folder.id ? styles.activeItem : {})
              }}
              onClick={() => handleFolderClick(folder.id)}
            >
              📁 {folder.name}
              <span style={styles.count}>{folder.entry_count}</span>
            </div>
            <button
              style={styles.deleteFolder}
              onClick={() => onDeleteFolder(folder.id)}
              title="Delete folder"
            >✕</button>
          </div>
        ))}

        {/* New folder input */}
        {showInput ? (
          <div style={styles.newFolderInput}>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNewFolder()}
              placeholder="Folder name..."
              style={styles.input}
            />
            <button onClick={handleNewFolder} style={styles.confirmBtn}>Add</button>
            <button onClick={() => setShowInput(false)} style={styles.cancelBtn}>✕</button>
          </div>
        ) : (
          <div style={styles.newFolderBtn} onClick={() => setShowInput(true)}>
            + New Folder
          </div>
        )}
      </div>

      {/* Clear button — pushed to the bottom */}
      <div style={styles.bottom}>
        <button style={styles.clearBtn} onClick={onClear}>
          🗑 Clear inputs
        </button>
      </div>

    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      style={{ ...styles.navItem, ...(active ? styles.activeItem : {}) }}
      onClick={onClick}
    >
      {icon} {label}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "220px",
    minHeight: "100vh",
    background: "#1a1a2e",
    color: "#eee",
    display: "flex",
    flexDirection: "column",
    padding: "20px 12px",
    boxSizing: "border-box",
    gap: "8px",
  },
  title: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "20px",
    paddingLeft: "8px",
  },
  section: {
    marginBottom: "16px",
  },
  sectionLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: "1px",
    marginBottom: "6px",
    paddingLeft: "8px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    gap: "8px",
  },
  activeItem: {
    background: "#2d2d5e",
    color: "#a78bfa",
  },
  folderRow: {
    display: "flex",
    alignItems: "center",
  },
  count: {
    marginLeft: "auto",
    fontSize: "12px",
    color: "#888",
  },
  deleteFolder: {
    background: "none",
    border: "none",
    color: "#555",
    cursor: "pointer",
    fontSize: "12px",
    padding: "4px",
  },
  newFolderBtn: {
    padding: "8px 10px",
    color: "#888",
    cursor: "pointer",
    fontSize: "13px",
    borderRadius: "8px",
  },
  newFolderInput: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
  },
  input: {
    flex: 1,
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #444",
    background: "#222",
    color: "#eee",
    fontSize: "13px",
  },
  confirmBtn: {
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "12px",
  },
  cancelBtn: {
    background: "none",
    color: "#888",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
  },
  bottom: {
    marginTop: "auto",
    borderTop: "1px solid #333",
    paddingTop: "12px",
  },
  clearBtn: {
    width: "100%",
    padding: "8px",
    background: "none",
    border: "1px solid #333",
    color: "#888",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
};