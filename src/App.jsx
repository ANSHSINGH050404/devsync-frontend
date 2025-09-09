import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { UserProvider } from "./context/user.context";
import Project from "./pages/Project";
import UserAuth from "./auth/UserAuth";
// import { useContext } from "react";
// import { ThemeProvider, ThemeContext } from "./context/ThemeContext.jsx";

// function ThemeSwitcher() {
//   const { theme, toggleTheme } = useContext(ThemeContext);
//   return (
//     <button onClick={toggleTheme}>
//       Switch to {theme === "light" ? "Dark" : "Light"} Mode
//     </button>
//   );
// }
function App() {
  return (
    <>
      {/* <ThemeProvider> */}
        {/* <div style={{ background: "var(--bg-color)", color: "var(--text-color)", height: "100vh" }}>
          <h1>Theme Switcher</h1> */}
        {/* <ThemeSwitcher /> */}
        <UserProvider>
          <Routes>
            <Route
              path="/"
              element={
                <UserAuth>
                  <Home />
                </UserAuth>
              }
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/project"
              element={
                <UserAuth>
                  <Project />
                </UserAuth>
              }
            />
          </Routes>
        </UserProvider>
        {/* </div> */}
      {/* </ThemeProvider> */}
    </>
  );
}

export default App;
