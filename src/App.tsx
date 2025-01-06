import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Agents from "./pages/Agents";
import CreateAgent from "./pages/CreateAgent";
import PhoneNumbers from "./pages/PhoneNumbers";
import NewPhoneNumber from "./pages/NewPhoneNumber";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/new" element={<CreateAgent />} />
        <Route path="/phone-numbers" element={<PhoneNumbers />} />
        <Route path="/phone-numbers/new" element={<NewPhoneNumber />} />
      </Routes>
    </Router>
  );
}

export default App;