import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RequireAuth } from "./components/auth/RequireAuth";
import { AuthLayout } from "./components/auth/AuthLayout";
import Index from "./pages/Index";
import Agents from "./pages/Agents";
import CreateAgent from "./pages/CreateAgent";
import PhoneNumbers from "./pages/PhoneNumbers";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthLayout />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Index />
            </RequireAuth>
          }
        />
        <Route
          path="/agents"
          element={
            <RequireAuth>
              <Agents />
            </RequireAuth>
          }
        />
        <Route
          path="/agents/new"
          element={
            <RequireAuth>
              <CreateAgent />
            </RequireAuth>
          }
        />
        <Route
          path="/phone-numbers"
          element={
            <RequireAuth>
              <PhoneNumbers />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;