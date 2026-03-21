import { useState, useEffect, useRef } from "react";
// API (Application Programming Interface): Ye server se data(Mausam ki jankari) mangwane ke liye URL aur secret key hoti hai.
// fetch() function isse hi pukarta(call) hai network pe.
const API_KEY = "ce8fc2b9ab82a32fa9bc23c59c6e6c34";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Ek object jisme har mausam ke hisaab se color aur icon define kiye gaye hain
const CONDITION_STYLES = {
  Clear: { icon: "☀", gradient: "from-amber-900/40 via-orange-900/20", accent: "#f59e0b", particle: "✦" },
  Clouds: { icon: "☁", gradient: "from-slate-700/40 via-slate-800/20", accent: "#94a3b8", particle: "◦" },
  Rain: { icon: "🌧", gradient: "from-blue-900/40 via-cyan-900/20", accent: "#38bdf8", particle: "｜" },
  Drizzle: { icon: "🌦", gradient: "from-cyan-900/40 via-blue-900/20", accent: "#67e8f9", particle: "·" },
  Thunderstorm: { icon: "⛈", gradient: "from-purple-900/40 via-indigo-900/20", accent: "#a78bfa", particle: "⚡" },
  Snow: { icon: "❄", gradient: "from-blue-200/10 via-indigo-900/20", accent: "#bae6fd", particle: "❆" },
  Mist: { icon: "🌫", gradient: "from-gray-800/40 via-gray-900/20", accent: "#9ca3af", particle: "~" },
  Haze: { icon: "🌫", gradient: "from-yellow-900/30 via-gray-900/20", accent: "#ca8a04", particle: "~" },
};

const getConditionStyle = (main) => CONDITION_STYLES[main] || CONDITION_STYLES["Clouds"];

const WindIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
  </svg>
);

const HumidityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const VisibilityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

function Particles({ condition }) {
  const style = getConditionStyle(condition);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit" }}>
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${8 + (i * 8) % 90}%`,
            top: `${5 + (i * 13) % 85}%`,
            color: style.accent,
            opacity: 0.12 + (i % 4) * 0.06,
            fontSize: `${10 + (i % 3) * 4}px`,
            animation: `float-${i % 3} ${4 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {style.particle}
        </span>
      ))}
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "12px 16px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      flex: "1 1 120px",
    }}>
      <div style={{ color: "rgba(255,255,255,0.5)", display: "flex" }}>{icon}</div>
      <div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>{label}</div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>{value}</div>
      </div>
    </div>
  );
}
// React app me har nayi UI screen ya widget ko 'Component' kehte hain. 'WeatherApp' ek component hai.
export default function WeatherApp() {
  // useState: In hooks ke through Variable banaye jaate hain taki unme temporary data(State) ko yaad rakha jaye. 
  // Jaise "city" user ne type jo kiya hai vo yaad rakhega, aur "setCity" usko tabdeel(change) karegi.
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null); // API se aaya object data jo screen pr display hota h. "Null" matlab abhi API response nahi aya.
  const [loading, setLoading] = useState(false); // Data fetch karte samey spinner True. Done ke bad wapis False m.
  const [error, setError] = useState(""); // Agar Invalid shehar mila toh error array.
  const [unit, setUnit] = useState("C"); // Tapman (Temperature) ki entity. Celsius ya Fahrenheit

  // Iska matlab agar user browser band karke dobara kholega, toh purani searched cities wahan dikhengi
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("wx-history") || "[]"); } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const inputRef = useRef(null); // useRef : Ekdum direct access deta HTML elem ko(For input textbox here).

  // Helper calculation function: temperature Kelvin ki jagah Degree Celsius ya Fahrenheit banakar "1.5°" shape m output deti
  const toDisplay = (k) => unit === "C" ? (k - 273.15).toFixed(1) + "°C" : ((k - 273.15) * 9 / 5 + 32).toFixed(1) + "°F";

  // Async (asynchronous): Matlab Network response ka wait hoga yahan pehle bina age badhe.
  const fetchWeather = async (q) => {
    if (!q.trim()) return; // Khali searches ko mat aage jaane do (Stop!)
    setLoading(true); // Spinner "True" => Ghoomna chalu karega HTML DOM mai!
    setError(""); // Purane errors delete maaro!
    setShowHistory(false);

    // try-catch lagaya he, kyuke network error aaye to software break(hang) na kare balki shanti se smbhal liya jaye.
    try {
      // fetch():  ye internet request marta he server endpoint pr apne App ki Identity token id(APPID) k saath 
      const res = await fetch(`${BASE_URL}?q=${encodeURIComponent(q)}&appid=${API_KEY}`);

      // "res.ok": Server se data ok true waps aaya ki nai ? Nai to => hum Throw karenge error Catch m seedha bhej de.
      if (!res.ok) throw new Error(res.status === 404 ? "City not found" : "Failed to fetch");

      // res(text mode response) se original Javascript JSON format object main translate kro data
      const data = await res.json();
      setWeather(data); // Woohho ! "weather" variable k andar agyi sasrikki weather API ki jankariya. (Automatically re-renders UI as data updates state!)
      setAnimKey(k => k + 1);

      const newHistory = [data.name, ...history.filter(h => h.toLowerCase() !== data.name.toLowerCase())].slice(0, 6);
      setHistory(newHistory);
      try { localStorage.setItem("wx-history", JSON.stringify(newHistory)); } catch { } // Local browser main bhi update save kro history
    } catch (e) {
      // Ooper try mai kahi err ai(jaise 404), toh fatne ki bajaye code yaha block m land krega. Hum simply bolngy set karo e.message.
      setError(e.message);
      setWeather(null);
    } finally {
      // Kaam hogya toh Try ho ya Catch Spinner hatawao false kar ke. Screen rukti nai rehdni chahiye. Wait over !
      setLoading(false);
    }
  };

  // e.preventDefault: "Submit" krne par normal Form nature refresh marta hai page usko Block kr rha h vrna app ki state udhjaygi start hony pehi! 
  const handleSubmit = (e) => { e.preventDefault(); fetchWeather(city); };

  // Ye weather ki sub conditions padkar appropriate icon dega (Jaise clouds hai toh bada cloud ya clear pr sun )
  const conditionMain = weather?.weather?.[0]?.main || "Clouds";
  const style = getConditionStyle(conditionMain);

  // Time conversion unix format API response(ex format:-17013829s ) m return deta hai jisko normal GMT type banana .toUTCString lagkr krtey.
  const localTime = weather ? new Date((weather.dt + weather.timezone) * 1000).toUTCString().match(/(\d+:\d+)/)?.[0] : null;

  // "Return" ke baad jo code likha h usko JSX(Javascript XML ) kahte hn. Normal HTML ko advance JS ke andr run karna. Taaki state hooks direct connect kre.
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0f1a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes float-0 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-12px) rotate(10deg)} }
        @keyframes float-1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(8px) rotate(-8deg)} }
        @keyframes float-2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(5deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse-ring { 0%{transform:scale(0.95);opacity:0.7} 50%{transform:scale(1.05);opacity:0.3} 100%{transform:scale(0.95);opacity:0.7} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .wx-input { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; outline: none !important; transition: all 0.2s !important; }
        .wx-input::placeholder { color: rgba(255,255,255,0.3) !important; }
        .wx-input:focus { border-color: rgba(255,255,255,0.25) !important; background: rgba(255,255,255,0.09) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.04) !important; }
        .wx-btn { cursor: pointer; transition: all 0.2s; }
        .wx-btn:hover { opacity: 0.85; transform: scale(0.98); }
        .wx-btn:active { transform: scale(0.95); }
        .hist-item { cursor: pointer; transition: all 0.15s; }
        .hist-item:hover { background: rgba(255,255,255,0.1) !important; }
        .toggle-btn { cursor: pointer; transition: all 0.2s; }
        .toggle-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px", animation: "fadeIn 0.6s ease" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "8px" }}>
            Live Weather
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>
            Atmosphere
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} style={{ position: "relative", marginBottom: "16px" }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none", display: "flex" }}>
              <SearchIcon />
            </div>
            <input
              ref={inputRef}
              className="wx-input"
              value={city}
              onChange={e => { setCity(e.target.value); setShowHistory(e.target.value.length === 0 && history.length > 0); }}
              onFocus={() => { if (!city && history.length > 0) setShowHistory(true); }}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              placeholder="Search any city..."
              style={{
                width: "100%",
                padding: "14px 56px 14px 44px",
                borderRadius: "14px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              className="wx-btn"
              disabled={loading}
              style={{
                position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                padding: "7px 14px",
                color: "white",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              {loading ? "..." : "Go"}
            </button>
          </div>

          {/* History dropdown */}
          {showHistory && history.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
              background: "#16161f",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              overflow: "hidden",
              zIndex: 50,
              animation: "fadeIn 0.15s ease",
            }}>
              <div style={{ padding: "10px 14px 6px", display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <ClockIcon /> Recent
              </div>
              {history.map((h, i) => (
                <div
                  key={i}
                  className="hist-item"
                  onClick={() => { setCity(h); fetchWeather(h); }}
                  style={{
                    padding: "10px 16px",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.75)",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>◷</span>
                  {h}
                </div>
              ))}
            </div>
          )}
        </form>
        {/* React me { variable && ( HTML ) } lagne ka matlb h tabhi show kro ye HTML part(Errorbox / Loading spinner) jab "variable" ki value TRUE ho! */}

        {/* Error */}
        {error && (
          <div style={{
            padding: "14px 18px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "12px",
            color: "#fca5a5",
            fontSize: "14px",
            marginBottom: "16px",
            animation: "fadeIn 0.3s ease",
          }}>
            ⚠ {error}. Please check the city name.
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{
            padding: "32px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "24px",
            textAlign: "center",
          }}>
            <div style={{
              width: "48px", height: "48px",
              border: "2px solid rgba(255,255,255,0.08)",
              borderTop: "2px solid rgba(255,255,255,0.5)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px" }}>Fetching weather data...</div>
          </div>
        )}

        {/* Weather Card */}
        {weather && !loading && (
          <div key={animKey} style={{
            position: "relative",
            background: "#0e0e18",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            overflow: "hidden",
            animation: "slideIn 0.5s cubic-bezier(0.16,1,0.3,1)",
          }}>
            {/* Ambient glow */}
            <div style={{
              position: "absolute", inset: 0,
              background: `radial-gradient(ellipse at 30% 20%, ${style.accent}15 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, ${style.accent}08 0%, transparent 50%)`,
              pointerEvents: "none",
            }} />

            <Particles condition={conditionMain} />

            <div style={{ position: "relative", padding: "28px" }}>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
                    {weather.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                    {weather.sys?.country}
                    {localTime && <span style={{ marginLeft: "10px", fontFamily: "'DM Mono', monospace" }}>{localTime} local</span>}
                  </div>
                </div>
                {/* Unit Toggle */}
                <div
                  className="toggle-btn"
                  onClick={() => setUnit(u => u === "C" ? "F" : "C")}
                  style={{
                    display: "flex",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {["C", "F"].map(u => (
                    <div key={u} style={{
                      padding: "7px 14px",
                      color: unit === u ? "white" : "rgba(255,255,255,0.3)",
                      background: unit === u ? "rgba(255,255,255,0.12)" : "transparent",
                      transition: "all 0.2s",
                    }}>°{u}</div>
                  ))}
                </div>
              </div>

              {/* Main temperature */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <div style={{
                  fontSize: "80px",
                  lineHeight: 1,
                  fontWeight: 300,
                  color: "white",
                  letterSpacing: "-0.04em",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {unit === "C"
                    ? (weather.main.temp - 273.15).toFixed(0)
                    : ((weather.main.temp - 273.15) * 9 / 5 + 32).toFixed(0)}
                </div>
                <div>
                  <div style={{ fontSize: "36px", marginBottom: "4px" }}>{style.icon}</div>
                  <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>°{unit}</div>
                </div>
              </div>

              {/* Condition + feels like */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  background: `${style.accent}18`,
                  border: `1px solid ${style.accent}30`,
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: style.accent,
                  marginBottom: "8px",
                }}>
                  {weather.weather[0].description.replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
                  Feels like {toDisplay(weather.main.feels_like)} · High {toDisplay(weather.main.temp_max)} · Low {toDisplay(weather.main.temp_min)}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", marginBottom: "20px" }} />

              {/* Stats */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <StatPill icon={<HumidityIcon />} label="Humidity" value={`${weather.main.humidity}%`} />
                <StatPill icon={<WindIcon />} label="Wind" value={`${weather.wind.speed} m/s`} />
                {weather.visibility && (
                  <StatPill icon={<VisibilityIcon />} label="Visibility" value={`${(weather.visibility / 1000).toFixed(1)} km`} />
                )}
              </div>

              {/* Sunrise / Sunset */}
              {weather.sys?.sunrise && (
                <div style={{
                  marginTop: "16px",
                  display: "flex",
                  gap: "10px",
                }}>
                  {[
                    { label: "Sunrise", ts: weather.sys.sunrise, icon: "↑" },
                    { label: "Sunset", ts: weather.sys.sunset, icon: "↓" },
                  ].map(({ label, ts, icon }) => {
                    const t = new Date((ts + weather.timezone) * 1000).toUTCString().match(/(\d+:\d+)/)?.[0];
                    return (
                      <div key={label} style={{
                        flex: 1,
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}>
                        <span style={{ color: style.accent, fontSize: "16px" }}>{icon}</span>
                        <div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "'DM Mono', monospace" }}>{t}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!weather && !loading && !error && (
          <div style={{
            padding: "48px 24px",
            textAlign: "center",
            animation: "fadeIn 0.6s ease",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.4 }}>⛅</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "14px", lineHeight: 1.6 }}>
              Enter a city name above<br />to check real-time weather
            </div>
            {history.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Quick access</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      className="wx-btn"
                      onClick={() => { setCity(h); fetchWeather(h); }}
                      style={{
                        padding: "7px 14px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "rgba(255,255,255,0.15)", letterSpacing: "0.05em" }}>
          Powered by OpenWeatherMap
        </div>
      </div>
    </div>
  );
}
