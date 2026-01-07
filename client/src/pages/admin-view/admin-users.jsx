import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  deleteUser,
  fetchUsers,
  updateUser,
} from "@/features/slices/usersSlice";
import Loader from "@/components/common/Loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaEdit, FaTrashAlt, FaUserShield, FaUserTie, FaUser } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const users = useSelector((state) => state.users.list) || []; // null check
  const status = useSelector((state) => state.users.status);
  const error = useSelector((state) => state.users.error);

  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    userType: "",
    password: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        name: selectedUser.name,
        email: selectedUser.email,
        phoneNumber: selectedUser.phoneNumber,
        userType: selectedUser.userType,
        password: "",
      });
    }
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.userType) {
      toast.error("Please fill all required fields", { position: "top-center" });
      return;
    }

    try {
      if (selectedUser) {
        const dataToUpdate = { ...formData };
        if (!formData.password) delete dataToUpdate.password;
        await dispatch(updateUser({ userId: selectedUser.id, formData: dataToUpdate })).unwrap();
        setSelectedUser(null);
        dispatch(fetchUsers());
        toast.success("User updated successfully!");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to update user");
    }
  };

  const handleDelete = async () => {
    if (confirmDelete) {
      try {
        await dispatch(deleteUser(confirmDelete.id)).unwrap();
        setConfirmDelete(null);
        dispatch(fetchUsers());
        toast.success("User deleted successfully!");
      } catch (error) {
        toast.error(error?.message || "Failed to delete user");
      }
    }
  };

  const getUserBadge = (userType) => {
    const variantMap = {
      admin: "destructive",
      client: "default",
      vip: "secondary",
    };
    const iconMap = {
      admin: <FaUserShield className="mr-1 text-purple-600" />,
      vip: <FaUserTie className="mr-1 text-yellow-600" />,
      client: <FaUser className="mr-1 text-blue-600" />,
    };
    return (
      <Badge variant={variantMap[userType] || "default"} className="capitalize flex items-center">
        {iconMap[userType] || <FaUser className="mr-1" />}
        {userType}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          User Management
        </h1>
        <Button onClick={() => dispatch(fetchUsers())} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Loader */}
      {status === "pending" && <Loader className="my-12" />}

      {/* Error */}
      {status === "rejected" && (
        <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-4 text-center">
          {error}
        </div>
      )}

      {/* Users Table or No Data */}
      {status === "success" ? (
        users.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/70 transition"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-medium text-gray-600 dark:text-gray-300">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || <span className="text-gray-400">—</span>}</TableCell>
                    <TableCell>{getUserBadge(user.userType)}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Link
                        to={`/admin/view/user/${user.id}`}
                        className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600"
                        title="View"
                      >
                        <AiOutlineEye size={18} />
                      </Link>

                      {/* Edit Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600"
                            onClick={() => setSelectedUser(user)}
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px]">
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>Update user information below.</DialogDescription>
                          </DialogHeader>
                          <form className="space-y-4 mt-4" onSubmit={handleSave}>
                            <div>
                              <Label>Full Name</Label>
                              <Input name="name" value={formData.name} onChange={handleChange} />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input name="email" type="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div>
                              <Label>Phone</Label>
                              <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Select
                                value={formData.userType}
                                onValueChange={(val) => setFormData({ ...formData, userType: val })}
                              >
                                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="client">Client</SelectItem>
                                  <SelectItem value="vip">VIP</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>New Password (Optional)</Label>
                              <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button>
                              <Button type="submit">Save</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      {/* Delete Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600"
                            onClick={() => setConfirmDelete(user)}
                            title="Delete"
                          >
                            <FaTrashAlt size={16} />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <h3 className="text-gray-700 dark:text-gray-300 font-medium">No users found</h3>
            <p className="text-gray-500 text-sm mt-1">Try refreshing or adding new users.</p>
          </div>
        )
      ) : (
        <div className="text-center text-gray-500">Loading data...</div>
      )}
    </div>
  );
};

export default AdminUsers;
