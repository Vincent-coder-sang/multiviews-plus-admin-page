import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Textarea
} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createVideo,
  deleteVideo,
  fetchVideos,
  updateVideo,
} from "@/features/slices/videoSlice";
import { fetchContentCreators } from "@/features/slices/contentCreatorsSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Play, Clock, User } from "lucide-react";
import { toast } from "sonner";

const AdminVideos = () => {
  const dispatch = useDispatch();
  const { list: videosList, status, error } = useSelector((state) => state.videos);
  const { list: creators } = useSelector((state) => state.contentCreators);
  const { id: currentUserId } = useSelector((state) => state.auth);

  const videos = videosList || [];
  const contentCreators = creators || [];
  
  const categories = [
    "Korean Series",
    "Documentaries", 
    "Nollywood Movies",
    "Hollywood Movies",
    "Animations",
    "Family",
    "TV Shows"
  ];

  const [open, setOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    category: "",
    creatorId: ""
  });

  // Fetch videos and creators on mount
  useEffect(() => {
    dispatch(fetchVideos());
    dispatch(fetchContentCreators());
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, category: value });
  };

  const handleCreatorChange = (value) => {
    setFormData({ ...formData, creatorId: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast.error("Please select a video file");
        return;
      }
      
      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video file must be less than 100MB");
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.desc || !formData.category || !formData.creatorId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!editingVideo && !selectedFile) {
      toast.error("Please select a video file");
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('desc', formData.desc);
      submitData.append('category', formData.category);
      submitData.append('creatorId', formData.creatorId);
      
      if (selectedFile) {
        submitData.append('video', selectedFile);
      }

      if (editingVideo) {
        await dispatch(updateVideo({ id: editingVideo.id, data: submitData })).unwrap();
        toast.success("Video updated successfully");
      } else {
        await dispatch(createVideo(submitData)).unwrap();
        toast.success("Video uploaded successfully");
      }

      resetForm();
      setOpen(false);
      // Refresh the videos list
      dispatch(fetchVideos());
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      desc: "", 
      category: "",
      creatorId: "" 
    });
    setSelectedFile(null);
    setEditingVideo(null);
  };

  const handleEdit = (video) => {
    if (!video) return;
    setEditingVideo(video);
    setFormData({
      name: video.name || "",
      desc: video.desc || "",
      category: video.category || "",
      creatorId: video.creatorId || ""
    });
    setSelectedFile(null);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await dispatch(deleteVideo(id)).unwrap();
        toast.success("Video deleted successfully");
        // Refresh the videos list
        dispatch(fetchVideos());
      } catch (error) {
        toast.error(error.message || "Delete failed");
      }
    }
  };

  // Get creator name for display
  const getCreatorName = (creatorId) => {
    const creator = contentCreators.find(c => c.id === creatorId);
    return creator ? creator.name : "Unknown Creator";
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Safe date formatting
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎬 Video Management</h1>
          <p className="text-gray-600 mt-2">Upload and manage your video content</p>
        </div>
        <Button 
          onClick={() => setOpen(true)} 
          className="flex items-center gap-2"
          disabled={contentCreators.length === 0}
        >
          <Plus className="w-4 h-4" /> Upload Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{videos.length}</div>
            <div className="text-gray-600">Total Videos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {categories.reduce((count, category) => 
                count + (videos.filter(v => v.category === category).length > 0 ? 1 : 0), 0)
              }
            </div>
            <div className="text-gray-600">Active Categories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contentCreators.length}</div>
            <div className="text-gray-600">Content Creators</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(videos.map(v => v.creatorId)).size}
            </div>
            <div className="text-gray-600">Creators with Videos</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert if no creators */}
      {contentCreators.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">No Content Creators Found</h3>
                <p className="text-yellow-700 text-sm">
                  You need to create content creators before uploading videos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {status === "pending" ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading videos...</p>
          </div>
        ) : status === "rejected" ? (
          <div className="col-span-full text-center py-8">
            <p className="text-red-500">Error loading videos: {error}</p>
            <Button 
              onClick={() => dispatch(fetchVideos())} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        ) : videos.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No videos uploaded</h3>
            <p className="text-gray-600 mb-4">
              {contentCreators.length === 0 
                ? "Create content creators first, then upload videos"
                : "Get started by uploading your first video"
              }
            </p>
            <Button 
              onClick={() => setOpen(true)} 
              disabled={contentCreators.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" /> Upload Video
            </Button>
          </div>
        ) : (
          videos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Video Thumbnail/Player */}
              <div className="aspect-video bg-gray-200 relative">
                {video.videoUrl ? (
                  <video
                    src={video.videoUrl}
                    className="w-full h-full object-cover"
                    controls
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                  {video.format?.toUpperCase() || 'VID'}
                </Badge>
              </div>

              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2 line-clamp-1">
                  {video.name}
                </CardTitle>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {video.desc}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                  <Badge variant="outline">{video.category}</Badge>
                </div>

                {/* Creator Info */}
                <div className="flex items-center gap-1 text-xs text-blue-600 mb-3">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{getCreatorName(video.creatorId)}</span>
                </div>

                {/* Video Metadata - Only show if available */}
                <div className="space-y-1 text-xs text-gray-500 mb-4">
                  {video.fileSize && <div>Size: {formatFileSize(video.fileSize)}</div>}
                  <div>Uploaded: {formatDate(video.createdAt)}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(video)}
                    className="flex-1"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Video Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        setOpen(isOpen);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? "Edit Video" : "Upload New Video"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Video Title *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="desc">Description *</Label>
                <Textarea
                  id="desc"
                  name="desc"
                  value={formData.desc}
                  onChange={handleChange}
                  placeholder="Enter video description"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="creator">Content Creator *</Label>
                <Select value={formData.creatorId} onValueChange={handleCreatorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a content creator" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentCreators.map((creator) => (
                      <SelectItem key={creator.id} value={creator.id.toString()}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{creator.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {(creator.royaltyPercentage * 100)}%
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contentCreators.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No content creators available. Please create creators first.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="videoFile">
                  {editingVideo ? "Replace Video File (Optional)" : "Video File *"}
                </Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: MP4, MOV, AVI, etc. Max size: 100MB
                </p>
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={status === "pending" || contentCreators.length === 0}
              >
                {status === "pending" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingVideo ? "Updating..." : "Uploading..."}
                  </>
                ) : (
                  editingVideo ? "Update Video" : "Upload Video"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVideos;