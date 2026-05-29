import React, { useEffect, useState } from "react";
import {
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import "./styles.css";
import fetchModel from "../../lib/fetchModelData";

function UserList() {
  const { userId } = useParams();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    let active = true;

    fetchModel("/user/list")
      .then((userList) => {
        if (active) {
          setUsers(userList);
        }
      })
      .catch(() => {
        if (active) {
          setUsers([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="user-list-container">
      <Typography variant="h6" className="user-list-title">
        Users
      </Typography>
      <List component="nav" aria-label="Photo sharing users">
        {users.map((user) => (
          <React.Fragment key={user._id}>
            <ListItemButton
              component={RouterLink}
              to={`/users/${user._id}`}
              selected={userId === user._id}
            >
              <ListItemText
                primary={`${user.first_name} ${user.last_name}`}
                secondary={user.occupation}
              />
            </ListItemButton>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </div>
  );
}

export default UserList;
