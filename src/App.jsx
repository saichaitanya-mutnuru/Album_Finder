import { useState } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchAlbums = async (term) => {
    if (!term) return;

    setLoading(true);
    setAlbums([]);

    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${term}&entity=album`
      );
      const data = await res.json();
      setAlbums(data.results);
    } catch (error) {
      console.error(error);
      setAlbums([]);
    }

    setLoading(false);
  };

  const handleSearch = () => {
    setSearchTerm(query);
    setHasSearched(true);
    fetchAlbums(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="app">
      <h1>Album Finder</h1>

      <input
        type="text"
        placeholder="Search albums..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button onClick={handleSearch}>Search</button>

      {/* Loading state */}
      {loading && <div className="spinner"></div>}

      {/* No results state */}
      {!loading && hasSearched && albums.length === 0 && (
        <p className="no-results">No albums found</p>
      )}

      {/* Search text */}
      {!loading && hasSearched && albums.length > 0 && (
        <p>You searched: {searchTerm}</p>
      )}

      {/* Album list */}
      <div className="album-list">
        {albums.map((album) => (
          <div key={album.collectionId} className="album-card">
            <img src={album.artworkUrl100} alt={album.collectionName} />
            <p>{album.collectionName}</p>
            <span>{album.artistName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;