import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, CardMedia, CircularProgress, Divider, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import "./styles.css";
import fetchModel, { API_BASE } from "../../lib/fetchModelData";

function formatDate(dateTime) {
  return new Date(dateTime).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function photoSource(fileName) { return `${API_BASE}/images/${fileName}`; }

function PhotoComments({ comments = [] }) {
  if (comments.length === 0) return <Typography variant="body2" color="text.secondary">No comments yet.</Typography>;
  return <Stack spacing={1.5} className="photo-comments">{comments.map((comment) => (
    <Box key={comment._id} className="photo-comment">
      <Typography variant="caption" color="text.secondary">{formatDate(comment.date_time)} by {comment.user ? <Link component={RouterLink} to={`/users/${comment.user._id}`}>{comment.user.first_name} {comment.user.last_name}</Link> : "Unknown"}</Typography>
      <Typography variant="body2">{comment.comment}</Typography>
    </Box>
  ))}</Stack>;
}

function PhotoCard({ photo, onCommentAdded }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const submitComment = async () => {
    try {
      await fetchModel(`/commentsOfPhoto/${photo._id}`, { method: "POST", body: JSON.stringify({ comment }) });
      setComment(""); setError(""); onCommentAdded();
    } catch (e) { setError(e.message || "Unable to add comment"); }
  };
  return <Card className="photo-card">
    <CardMedia component="img" image={photoSource(photo.file_name)} alt={photo.file_name} className="photo-image" />
    <CardContent>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Uploaded {formatDate(photo.date_time)}</Typography>
      <Divider className="photo-divider" />
      <Typography variant="h6" gutterBottom>Comments</Typography>
      <PhotoComments comments={photo.comments} />
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <TextField size="small" fullWidth label="Add a comment" value={comment} onChange={(e) => setComment(e.target.value)} error={Boolean(error)} helperText={error} />
        <Button variant="contained" onClick={submitComment}>Post</Button>
      </Stack>
    </CardContent>
  </Card>;
}

function UserPhotos({ advancedFeatures = false, uploadVersion = 0 }) {
  const { userId, photoId } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchModel(`/photosOfUser/${userId}`), fetchModel(`/user/${userId}`)])
      .then(([photoData, userData]) => { if (active) { setPhotos(photoData || []); setUser(userData); } })
      .catch(() => { if (active) { setPhotos([]); setUser(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, reload, uploadVersion]);

  const currentIndex = useMemo(() => {
    const index = photos.findIndex((photo) => photo._id === photoId);
    return index >= 0 ? index : 0;
  }, [photos, photoId]);

  useEffect(() => {
    if (advancedFeatures && photos.length > 0 && !photoId) navigate(`/photos/${userId}/${photos[0]._id}`, { replace: true });
  }, [advancedFeatures, navigate, photoId, photos, userId]);

  if (loading) return <Box className="photos-center"><CircularProgress /></Box>;
  if (!user) return <Typography>User not found.</Typography>;
  if (photos.length === 0) return <Typography>{user.first_name} {user.last_name} has no photos.</Typography>;

  const refresh = () => setReload((x) => x + 1);
  if (advancedFeatures) {
    const currentPhoto = photos[currentIndex];
    const atFirstPhoto = currentIndex === 0;
    const atLastPhoto = currentIndex === photos.length - 1;
    return <Stack spacing={2}>
      <Typography variant="h4">Photos of {user.first_name} {user.last_name}</Typography>
      <Box className="photo-stepper-controls">
        <Button variant="outlined" disabled={atFirstPhoto} onClick={() => navigate(`/photos/${userId}/${photos[currentIndex - 1]._id}`)}>Previous</Button>
        <Typography variant="body2" color="text.secondary">Photo {currentIndex + 1} of {photos.length}</Typography>
        <Button variant="outlined" disabled={atLastPhoto} onClick={() => navigate(`/photos/${userId}/${photos[currentIndex + 1]._id}`)}>Next</Button>
      </Box>
      <PhotoCard photo={currentPhoto} onCommentAdded={refresh} />
    </Stack>;
  }
  return <Stack spacing={2}><Typography variant="h4">Photos of {user.first_name} {user.last_name}</Typography>{photos.map((photo) => <PhotoCard key={photo._id} photo={photo} onCommentAdded={refresh} />)}</Stack>;
}
export default UserPhotos;
