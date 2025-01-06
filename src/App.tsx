import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Agents from "./pages/Agents";
import CreateAgent from "./pages/CreateAgent";
import PhoneNumbers from "./pages/PhoneNumbers";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/new" element={<CreateAgent />} />
        <Route path="/phone-numbers" element={<PhoneNumbers />} />
      </Routes>
    </Router>
  );
}

export default App;