import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Agents from "./pages/Agents";
import CreateAgent from "./pages/CreateAgent";
import PhoneNumbers from "./pages/PhoneNumbers";
import { PurchasePhoneNumberDialog } from "./components/phone-numbers/PurchasePhoneNumberDialog";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/new" element={<CreateAgent />} />
        <Route path="/phone-numbers" element={<PhoneNumbers />} />
        <Route 
          path="/phone-numbers/new" 
          element={
            <div className="container py-6">
              <PurchasePhoneNumberDialog defaultOpen={true} />
            </div>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;