import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const clientId = "YOUR_CLIENT_ID_HERE";
  const redirectUri = window.location.origin + "/callback";
  const authEndpoint = "https://accounts.spotify.com/authorize";

  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    let storedToken = "";

    if (hash) {
      const params = new URLSearchParams(hash.replace("#", ""));
      storedToken = params.get("access_token");

      window.location.hash = "";
      setToken(storedToken);
    }
  }, []);

  const handleLogin = () => {
    const scope = "user-read-private user-read-email";

    window.location.href =
      `${authEndpoint}` +
      `?client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}`;
  };

  const fetchAlbums = async (term) => {
    if (!term || !token) return;

    setLoading(true);
    setAlbums([]);

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${term}&type=album&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setAlbums(data.albums.items);
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

      {!token ? (
        <button onClick={handleLogin}>Login with Spotify</button>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button onClick={handleSearch}>Search</button>
        </>
      )}

      {loading && <div className="spinner"></div>}

      {!loading && hasSearched && albums.length === 0 && (
        <p className="no-results">No albums found</p>
      )}

      {!loading && hasSearched && albums.length > 0 && (
        <p>You searched: {searchTerm}</p>
      )}

      <div className="album-list">
        {albums.map((album) => (
          <div key={album.id} className="album-card">
            <img src={album.images?.[0]?.url} alt={album.name} />
            <p>{album.name}</p>
            <span>{album.artists?.[0]?.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;