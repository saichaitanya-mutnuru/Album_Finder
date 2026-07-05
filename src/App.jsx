import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const clientId = "YOUR_CLIENT_ID_HERE";

  // ✅ clean + stable redirect logic
  const redirectUri = import.meta.env.DEV
    ? "http://127.0.0.1:5173"
    : "https://album-finder-msc.vercel.app";

  const authEndpoint = "https://accounts.spotify.com/authorize";
  const tokenEndpoint = "https://accounts.spotify.com/api/token";

  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ---------------- PKCE HELPERS ----------------

  const generateRandomString = (length) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = crypto.getRandomValues(new Uint8Array(length));
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
    return result;
  };

  const sha256 = async (plain) => {
    const encoder = new TextEncoder();
    return crypto.subtle.digest("SHA-256", encoder.encode(plain));
  };

  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  // ---------------- LOGIN ----------------

  const handleLogin = async () => {
    if (!clientId) {
      alert("Client ID missing");
      return;
    }

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    localStorage.setItem("code_verifier", codeVerifier);

    const scope = "user-read-private user-read-email";

    const url =
      `${authEndpoint}` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&code_challenge_method=S256` +
      `&code_challenge=${codeChallenge}`;

    window.location.href = url;
  };

  // ---------------- TOKEN EXCHANGE ----------------

  const getToken = async (code) => {
    const codeVerifier = localStorage.getItem("code_verifier");

    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await res.json();
    return data.access_token;
  };

  // ---------------- CALLBACK HANDLING ----------------

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      getToken(code).then((accessToken) => {
        setToken(accessToken);
        window.history.replaceState({}, document.title, "/");
      });
    }
  }, []);

  // ---------------- SEARCH ----------------

  const fetchAlbums = async (term) => {
    if (!term || !token) return;

    setLoading(true);
    setAlbums([]);

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(term)}&type=album&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setAlbums(data.albums?.items || []);
    } catch (err) {
      console.error(err);
      setAlbums([]);
    }

    setLoading(false);
  };

  const handleSearch = () => {
    setSearchTerm(query);
    setHasSearched(true);
    fetchAlbums(query);
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
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <button onClick={handleSearch}>Search</button>
        </>
      )}

      {loading && <div className="spinner"></div>}

      {!loading && hasSearched && albums.length === 0 && (
        <p>No albums found</p>
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