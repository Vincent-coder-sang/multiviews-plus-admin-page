/** @format */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import moment from "moment";
import { fetchSingleUser } from "@/features/slices/usersSlice";
import Loader from "@/components/common/Loader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Phone,
  Crown,
  Calendar,
  CreditCard,
  ArrowLeft,
} from "lucide-react";

const AdminViewUser = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, status, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchSingleUser(userId));
  }, [dispatch, userId]);

  if (status === "pending") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader />
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Card className="max-w-md w-full border-red-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <User className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-700">
              Failed to Load User
            </h2>
            <p className="text-gray-600 text-sm mt-1">{error}</p>
            <Button
              onClick={() => dispatch(fetchSingleUser(userId))}
              variant="outline"
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const payments = user?.payments || [];
  const isVip = user?.userType === "vip";

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 w-fit mb-3 sm:mb-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Profile
          </h1>
          <p className="text-gray-500 text-sm">
            View user details and transaction history
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* User Information */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <User className="w-5 h-5 text-gray-600" />
              Profile Information
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <User className="w-5 h-5 text-gray-500" />,
                label: "Full Name",
                value: user?.name || "Not provided",
              },
              {
                icon: <Mail className="w-5 h-5 text-gray-500" />,
                label: "Email",
                value: user?.email || "Not provided",
              },
              {
                icon: <Phone className="w-5 h-5 text-gray-500" />,
                label: "Phone",
                value: user?.phoneNumber || "Not provided",
              },
              {
                icon: <Crown className="w-5 h-5 text-gray-500" />,
                label: "Account Type",
                value: (
                  <Badge
                    variant={isVip ? "default" : "outline"}
                    className={isVip ? "bg-yellow-500 text-white" : ""}
                  >
                    {user?.userType?.toUpperCase() || "CLIENT"}
                  </Badge>
                ),
              },
              {
                icon: <Calendar className="w-5 h-5 text-gray-500" />,
                label: "Member Since",
                value: user?.createdAt
                  ? moment(user.createdAt).format("MMM D, YYYY")
                  : "N/A",
              },
              ...(isVip
                ? [
                    {
                      icon: <Calendar className="w-5 h-5 text-gray-500" />,
                      label: "VIP Expires",
                      value: user?.accessExpiration
                        ? moment(user.accessExpiration).format("MMM D, YYYY")
                        : "N/A",
                    },
                  ]
                : []),
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {item.icon}
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="font-medium text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <CreditCard className="w-5 h-5 text-gray-600" />
              Payment History
            </CardTitle>
            <Badge variant="outline">{payments.length}</Badge>
          </CardHeader>

          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-10">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No payment history available
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-800">
                          Ksh {p.amount || "0"}
                        </p>
                        <Badge
                          variant={
                            p.status === "completed"
                              ? "default"
                              : p.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {p.status?.toUpperCase() || "UNKNOWN"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Ref: {p.reference || "N/A"}
                      </p>
                      {p.mpesaReceiptNumber && (
                        <p className="text-sm text-gray-500">
                          Receipt: {p.mpesaReceiptNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 sm:mt-0 sm:text-right">
                      {moment(p.createdAt).format("MMM D, YYYY • h:mm A")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminViewUser;
