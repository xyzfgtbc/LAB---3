import React, { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
import fetchModel from "../../lib/fetchModelData";

function LoginRegister({ onLogin }) {
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [register, setRegister] = useState({ login_name: "", password: "", password2: "", first_name: "", last_name: "", location: "", description: "", occupation: "" });
  const [message, setMessage] = useState(null);

  const handleLogin = async () => {
    try {
      const user = await fetchModel("/admin/login", { method: "POST", body: JSON.stringify({ login_name: loginName, password: loginPassword }) });
      setMessage(null);
      onLogin(user);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Login failed" });
    }
  };

  const handleRegister = async () => {
    if (register.password !== register.password2) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    try {
      const payload = { ...register };
      delete payload.password2;
      await fetchModel("/user", { method: "POST", body: JSON.stringify(payload) });
      setRegister({ login_name: "", password: "", password2: "", first_name: "", last_name: "", location: "", description: "", occupation: "" });
      setMessage({ type: "success", text: "Registration successful. You can log in now." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Registration failed" });
    }
  };

  const updateRegister = (field) => (event) => setRegister({ ...register, [field]: event.target.value });

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom>Please Login</Typography>
      {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card><CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Login</Typography>
              <TextField label="Login name" value={loginName} onChange={(e) => setLoginName(e.target.value)} />
              <TextField label="Password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              <Button variant="contained" onClick={handleLogin}>Login</Button>
              <Typography variant="body2" color="text.secondary">Initial seeded users use login names like <b>ian</b>, <b>ellen</b>, <b>john</b> with password <b>pass</b>.</Typography>
            </Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card><CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Register</Typography>
              <TextField label="Login name" value={register.login_name} onChange={updateRegister("login_name")} />
              <TextField label="Password" type="password" value={register.password} onChange={updateRegister("password")} />
              <TextField label="Confirm password" type="password" value={register.password2} onChange={updateRegister("password2")} />
              <TextField label="First name" value={register.first_name} onChange={updateRegister("first_name")} />
              <TextField label="Last name" value={register.last_name} onChange={updateRegister("last_name")} />
              <TextField label="Location" value={register.location} onChange={updateRegister("location")} />
              <TextField label="Description" value={register.description} onChange={updateRegister("description")} />
              <TextField label="Occupation" value={register.occupation} onChange={updateRegister("occupation")} />
              <Button variant="contained" onClick={handleRegister}>Register Me</Button>
            </Stack>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default LoginRegister;
