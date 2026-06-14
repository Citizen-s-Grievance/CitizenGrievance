import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import UserRegister from "./pages/UserRegister";
import AdminRegister from "./pages/AdminRegister";
import UserDashboard from "./pages/citizen/UserDashboard";
import UserProfile from "./pages/citizen/userProfile";
import FileComplaint from "./pages/citizen/FileComplaint";
import MyComplaints from "./pages/citizen/MyComplaints";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminComplaints from "./pages/admin/AdminComplaints";
import TelanganaLiveMap from "./pages/TelanganaLiveMap";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/user" element={<UserRegister />} />
        <Route path="/register/admin" element={<AdminRegister />} />

        {/* Citizen */}
        <Route path="/citizen/dashboard" element={<UserDashboard />} />
        <Route path="/citizen/profile" element={<UserProfile />} />
        <Route path="/citizen/file-complaint" element={<FileComplaint />} />
        <Route path="/citizen/complaints" element={<MyComplaints />} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />

        <Route path="/live-map" element={<TelanganaLiveMap />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
