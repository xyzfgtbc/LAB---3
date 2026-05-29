import React, { useRef } from "react";
import { AppBar, Button, Checkbox, FormControlLabel, Stack, Toolbar, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function contextText(pathname, loggedInUser) {
  if (!loggedInUser) return "Please Login";
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "photos") return "Photos";
  if (parts[0] === "users") return "User details";
  return "Photo Sharing App";
}

function TopBar({ advancedFeatures, onAdvancedFeaturesChange, loggedInUser, onLogout, onPhotoUploaded }) {
  const location = useLocation();
  const fileRef = useRef(null);

  const uploadPhoto = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("uploadedphoto", file);
    await fetchModel("/photos/new", { method: "POST", body: formData });
    event.target.value = "";
    onPhotoUploaded();
  };

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar className="topbar-toolbar">
        <Typography variant="h5" color="inherit" className="topbar-name">Lê Ngọc Minh</Typography>
        <Typography variant="h6" color="inherit" className="topbar-context">{contextText(location.pathname, loggedInUser)}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {loggedInUser ? (
            <>
              <Typography>Hi {loggedInUser.first_name}</Typography>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={uploadPhoto} />
              <Button color="inherit" variant="outlined" onClick={() => fileRef.current.click()}>Add Photo</Button>
              <Button color="inherit" variant="outlined" onClick={onLogout}>Logout</Button>
            </>
          ) : <Typography>Please Login</Typography>}
          <FormControlLabel className="topbar-advanced" control={<Checkbox checked={advancedFeatures} onChange={(event) => onAdvancedFeaturesChange(event.target.checked)} color="default" />} label="Enable Advanced Features" />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
