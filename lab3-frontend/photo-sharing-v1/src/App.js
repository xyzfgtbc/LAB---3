import "./App.css";

import React, { useEffect, useState } from "react";
import { Grid, Paper } from "@mui/material";
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import fetchModel from "./lib/fetchModelData";

function AppContent() {
  const [advancedFeatures, setAdvancedFeatures] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [uploadVersion, setUploadVersion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModel("/admin/user").then(setLoggedInUser).catch(() => setLoggedInUser(null));
  }, []);

  const handleLogin = (user) => {
    setLoggedInUser(user);
    navigate(`/users/${user._id}`);
  };

  const handleLogout = async () => {
    await fetchModel("/admin/logout", { method: "POST", body: JSON.stringify({}) }).catch(() => null);
    setLoggedInUser(null);
    navigate("/login");
  };

  const handlePhotoUploaded = () => {
    setUploadVersion((version) => version + 1);
    if (loggedInUser) navigate(`/photos/${loggedInUser._id}`);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TopBar advancedFeatures={advancedFeatures} onAdvancedFeaturesChange={setAdvancedFeatures} loggedInUser={loggedInUser} onLogout={handleLogout} onPhotoUploaded={handlePhotoUploaded} />
      </Grid>
      <div className="main-topbar-buffer" />
      <Grid item sm={3} xs={12}>
        <Paper className="main-grid-item">{loggedInUser ? <UserList /> : null}</Paper>
      </Grid>
      <Grid item sm={9} xs={12}>
        <Paper className="main-grid-item main-content-item">
          <Routes>
            <Route path="/login" element={<LoginRegister onLogin={handleLogin} />} />
            <Route path="/" element={loggedInUser ? <Navigate to={`/users/${loggedInUser._id}`} replace /> : <Navigate to="/login" replace />} />
            <Route path="/users" element={loggedInUser ? <UserList /> : <Navigate to="/login" replace />} />
            <Route path="/users/:userId" element={loggedInUser ? <UserDetail /> : <Navigate to="/login" replace />} />
            <Route path="/photos/:userId" element={loggedInUser ? <UserPhotos advancedFeatures={advancedFeatures} loggedInUser={loggedInUser} uploadVersion={uploadVersion} /> : <Navigate to="/login" replace />} />
            <Route path="/photos/:userId/:photoId" element={loggedInUser ? <UserPhotos advancedFeatures={advancedFeatures} loggedInUser={loggedInUser} uploadVersion={uploadVersion} /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={loggedInUser ? `/users/${loggedInUser._id}` : "/login"} replace />} />
          </Routes>
        </Paper>
      </Grid>
    </Grid>
  );
}

function App() { return <Router><AppContent /></Router>; }
export default App;
