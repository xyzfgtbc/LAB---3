import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchModel(`/user/${userId}`)
      .then((userData) => {
        if (active) {
          setUser(userData);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <Box className="user-detail-center">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Typography>User not found.</Typography>;
  }

  return (
    <Card className="user-detail-card">
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {user.occupation}
            </Typography>
          </Box>

          <Box className="user-detail-info-grid">
            <Typography variant="body1">
              <strong>Location:</strong> {user.location}
            </Typography>
            <Typography variant="body1">
              <strong>Description:</strong> {user.description}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={`/photos/${user._id}`}
            variant="contained"
          >
            View photos of {user.first_name}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default UserDetail;
