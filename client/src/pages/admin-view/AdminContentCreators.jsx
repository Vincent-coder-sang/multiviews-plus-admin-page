// pages/AdminContentCreators.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Video, 
  Users, 
  DollarSign, 
  TrendingUp 
} from "lucide-react";
import { toast } from "sonner";

import {
  fetchContentCreators,
  fetchCreatorById,
  createContentCreator,
  updateContentCreator,
  deleteContentCreator,
  clearError,
} from "@/features/slices/contentCreatorsSlice";

const AdminContentCreators = () => {
  const dispatch = useDispatch();
  const { 
    list: creators, 
    status, 
    error,
    pagination 
  } = useSelector((state) => state.contentCreators);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    paymentDetails: "",
    royaltyPercentage: 0.6
  });

  // Safe values with proper fallbacks
  const safePagination = pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCreators: 0,
    hasNext: false,
    hasPrev: false
  };

  const safeCreators = Array.isArray(creators) ? creators : [];

  // Calculate stats safely
  const totalVideos = safeCreators.reduce((total, creator) => 
    total + (creator?.stats?.videoCount || 0), 0
  );
  
  const totalViews = safeCreators.reduce((total, creator) => 
    total + (creator?.stats?.totalViews || 0), 0
  );
  
  const totalRevenue = safeCreators.reduce((total, creator) => 
    total + (creator?.stats?.totalRevenue || 0), 0
  );

  // Fetch creators on mount and when page/search changes
  useEffect(() => {
    dispatch(fetchContentCreators({ 
      page: currentPage, 
      limit: 10, 
      search: searchTerm 
    }));
  }, [dispatch, currentPage, searchTerm]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      paymentDetails: "",
      royaltyPercentage: 0.6
    });
    setEditingCreator(null);
  };

  // Open create/edit dialog
  const handleOpenDialog = (creator = null) => {
    if (creator) {
      setEditingCreator(creator);
      setFormData({
        name: creator.name || "",
        email: creator.email || "",
        paymentDetails: creator.paymentDetails 
          ? JSON.stringify(creator.paymentDetails, null, 2)
          : "",
        royaltyPercentage: creator.royaltyPercentage || 0.6
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name?.trim() || !formData.email?.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        royaltyPercentage: parseFloat(formData.royaltyPercentage) || 0.6
      };

      // Parse paymentDetails if provided
      if (formData.paymentDetails?.trim()) {
        try {
          submitData.paymentDetails = JSON.parse(formData.paymentDetails);
        } catch (error) {
          toast.error("Invalid JSON in payment details");
          return;
        }
      }

      if (editingCreator) {
        await dispatch(updateContentCreator({ 
          creatorId: editingCreator.id, 
          data: submitData 
        })).unwrap();
        toast.success("Creator updated successfully");
      } else {
        await dispatch(createContentCreator(submitData)).unwrap();
        toast.success("Creator created successfully");
      }

      setOpenDialog(false);
      resetForm();
      // Refresh the list
      dispatch(fetchContentCreators({ 
        page: currentPage, 
        limit: 10, 
        search: searchTerm 
      }));
    } catch (error) {
      toast.error(error.message || "Operation failed");
    }
  };

  // Handle delete creator
  const handleDelete = async (creatorId) => {
    if (!creatorId) {
      toast.error("Invalid creator ID");
      return;
    }

    if (window.confirm("Are you sure you want to delete this creator?")) {
      try {
        await dispatch(deleteContentCreator(creatorId)).unwrap();
        toast.success("Creator deleted successfully");
        // Refresh the list
        dispatch(fetchContentCreators({ 
          page: currentPage, 
          limit: 10, 
          search: searchTerm 
        }));
      } catch (error) {
        toast.error(error.message || "Delete failed");
      }
    }
  };

  // View creator details
  const handleViewCreator = async (creatorId) => {
    if (!creatorId) {
      toast.error("Invalid creator ID");
      return;
    }

    try {
      await dispatch(fetchCreatorById(creatorId)).unwrap();
      toast.success("Creator details loaded");
      // You could navigate to a detail page or show a modal here
    } catch (error) {
      toast.error(error.message || "Failed to load creator details");
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num || 0);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    resetForm();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">👨‍💼 Content Creators</h1>
          <p className="text-gray-600 mt-2">Manage your content creators and their analytics</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="flex items-center gap-2"
          disabled={status === "pending"}
        >
          <Plus className="w-4 h-4" /> Add Creator
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{safePagination.totalCreators}</div>
              <div className="text-gray-600">Total Creators</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Video className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalVideos}</div>
              <div className="text-gray-600">Total Videos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
              <div className="text-gray-600">Total Views</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-gray-600">Total Revenue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search creators by name or email..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
                disabled={status === "pending"}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Page {safePagination.currentPage} of {safePagination.totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={!safePagination.hasPrev || status === "pending"}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!safePagination.hasNext || status === "pending"}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Creators</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "pending" && safeCreators.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading creators...</p>
            </div>
          ) : safeCreators.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No creators found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Try a different search term" : "Get started by adding your first content creator"}
              </p>
              <Button 
                onClick={() => handleOpenDialog()}
                disabled={status === "pending"}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Creator
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Videos</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeCreators.map((creator) => (
                    <TableRow key={creator.id || Math.random()}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{creator.name || "Unnamed Creator"}</div>
                          <div className="text-sm text-gray-500">
                            Royalty: {((creator.royaltyPercentage || 0.6) * 100)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{creator.email || "No email"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4 text-gray-400" />
                          <span>{creator.stats?.videoCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatNumber(creator.stats?.totalViews || 0)}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(creator.stats?.totalRevenue || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={creator.isActive !== false ? "default" : "secondary"}
                          className={creator.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {creator.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewCreator(creator.id)}
                            disabled={status === "pending"}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(creator)}
                            disabled={status === "pending"}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(creator.id)}
                            disabled={status === "pending"}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Creator Dialog */}
      <Dialog open={openDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCreator ? "Edit Content Creator" : "Add New Content Creator"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter creator name"
                  required
                  disabled={status === "pending"}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                  disabled={status === "pending"}
                />
              </div>

              <div>
                <Label htmlFor="royaltyPercentage">Royalty Percentage</Label>
                <Input
                  id="royaltyPercentage"
                  name="royaltyPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.royaltyPercentage}
                  onChange={handleChange}
                  placeholder="0.60"
                  disabled={status === "pending"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Percentage of revenue the creator receives (0.6 = 60%)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="paymentDetails">Payment Details (JSON)</Label>
              <Textarea
                id="paymentDetails"
                name="paymentDetails"
                value={formData.paymentDetails}
                onChange={handleChange}
                placeholder='{"bank": "Bank Name", "accountNumber": "1234567890", "accountName": "John Doe"}'
                rows={4}
                disabled={status === "pending"}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter payment details as JSON format (optional)
              </p>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleDialogClose}
                disabled={status === "pending"}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={status === "pending"}
              >
                {status === "pending" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingCreator ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingCreator ? "Update Creator" : "Create Creator"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContentCreators;