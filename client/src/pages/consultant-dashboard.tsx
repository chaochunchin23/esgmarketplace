import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Calendar,
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Users,
  TrendingUp,
  Video,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";

type Booking = {
  id: number;
  userId: number;
  sessionDate: string;
  sessionDuration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalAmount: string;
  paymentStatus: "pending" | "paid" | "refunded";
  sessionType: string;
  notes: string | null;
  meetingLink: string | null;
  user?: {
    username: string;
    email: string;
    company: string;
    photoUrl: string;
  };
};

type ConsultantStats = {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  totalClients: number;
  averageRating: number;
};

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const { language } = useTranslations();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [meetingLinkDialog, setMeetingLinkDialog] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");

  const text = {
    consultantDashboard: language === "en" ? "Consultant Dashboard" : "顧問儀表板",
    welcome: language === "en" ? "Welcome back" : "歡迎回來",
    overview: language === "en" ? "Overview" : "概覽",
    bookings: language === "en" ? "Sessions" : "諮詢場次",
    clients: language === "en" ? "Clients" : "客戶",
    earnings: language === "en" ? "Earnings" : "收入",
    upcomingSessions: language === "en" ? "Upcoming Sessions" : "即將進行的場次",
    pendingRequests: language === "en" ? "Pending Requests" : "待確認的請求",
    totalBookings: language === "en" ? "Total Sessions" : "總場次數",
    totalEarnings: language === "en" ? "Total Earnings" : "總收入",
    monthlyEarnings: language === "en" ? "This Month" : "本月收入",
    totalClients: language === "en" ? "Total Clients" : "總客戶數",
    averageRating: language === "en" ? "Avg. Rating" : "平均評分",
    noBookings: language === "en" ? "No sessions scheduled" : "尚無安排的場次",
    pending: language === "en" ? "Pending" : "待確認",
    confirmed: language === "en" ? "Confirmed" : "已確認",
    completed: language === "en" ? "Completed" : "已完成",
    cancelled: language === "en" ? "Cancelled" : "已取消",
    approve: language === "en" ? "Approve" : "批准",
    reject: language === "en" ? "Reject" : "拒絕",
    addMeetingLink: language === "en" ? "Add Meeting Link" : "添加會議連結",
    markComplete: language === "en" ? "Mark Complete" : "標記完成",
    consultation: language === "en" ? "Consultation" : "諮詢",
    reportReview: language === "en" ? "Report Review" : "報告審查",
    strategySession: language === "en" ? "Strategy Session" : "策略會議",
    minutes: language === "en" ? "minutes" : "分鐘",
    loading: language === "en" ? "Loading..." : "載入中...",
    sessionDetails: language === "en" ? "Session Details" : "場次詳情",
    clientInfo: language === "en" ? "Client Information" : "客戶資訊",
    viewProfile: language === "en" ? "View Profile" : "查看個人資料",
    paid: language === "en" ? "Paid" : "已付款",
    unpaid: language === "en" ? "Unpaid" : "未付款",
  };

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/consultant/bookings"],
    enabled: !!user && user.role === "consultant",
  });

  const { data: stats } = useQuery<ConsultantStats>({
    queryKey: ["/api/consultant/stats"],
    enabled: !!user && user.role === "consultant",
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status, meetingLink }: { id: number; status?: string; meetingLink?: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${id}`, { status, meetingLink });
      if (!response.ok) throw new Error("Failed to update booking");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultant/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultant/stats"] });
      toast({
        title: language === "en" ? "Updated" : "已更新",
        description: language === "en" ? "Booking has been updated" : "預約已更新",
      });
    },
  });

  const isLoading = bookingsLoading;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
      confirmed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      completed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      cancelled: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const statusText = text[status as keyof typeof text] || status;

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {statusText}
      </Badge>
    );
  };

  const getSessionTypeText = (type: string) => {
    const types: Record<string, string> = {
      consultation: text.consultation,
      report_review: text.reportReview,
      strategy_session: text.strategySession,
    };
    return types[type] || type;
  };

  const handleApprove = (booking: Booking) => {
    setSelectedBooking(booking);
    setMeetingLinkDialog(true);
  };

  const handleReject = (bookingId: number) => {
    updateBookingMutation.mutate({ id: bookingId, status: "cancelled" });
  };

  const handleConfirmWithLink = () => {
    if (selectedBooking) {
      updateBookingMutation.mutate({ 
        id: selectedBooking.id, 
        status: "confirmed",
        meetingLink 
      });
      setMeetingLinkDialog(false);
      setMeetingLink("");
      setSelectedBooking(null);
    }
  };

  const handleMarkComplete = (bookingId: number) => {
    updateBookingMutation.mutate({ id: bookingId, status: "completed" });
  };

  if (!user || user.role !== "consultant") {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{language === "en" ? "Access Denied" : "訪問被拒絕"}</CardTitle>
            <CardDescription>
              {language === "en" 
                ? "This dashboard is only available to consultants" 
                : "此儀表板僅供顧問使用"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/profile">
              <Button className="w-full">
                {language === "en" ? "Update Your Role" : "更新您的角色"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{text.loading}</span>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const upcomingBookings = [...pendingBookings, ...confirmedBookings].sort(
    (a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
  );

  const consultantStats: ConsultantStats = stats || {
    totalBookings: bookings.length,
    pendingBookings: pendingBookings.length,
    confirmedBookings: confirmedBookings.length,
    completedBookings: bookings.filter(b => b.status === "completed").length,
    totalEarnings: bookings.filter(b => b.paymentStatus === "paid").reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0),
    monthlyEarnings: 0,
    totalClients: new Set(bookings.map(b => b.userId)).size,
    averageRating: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{text.consultantDashboard}</h1>
          <p className="text-muted-foreground">
            {text.welcome}, {user.firstName || user.username}!
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile">
            <Button variant="outline">
              {text.viewProfile}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.totalBookings}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultantStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBookings.length} {text.pending}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.totalEarnings}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${consultantStats.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {language === "en" ? "All time" : "累計"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.totalClients}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consultantStats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {language === "en" ? "Unique clients" : "不重複客戶"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.averageRating}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {consultantStats.averageRating.toFixed(1)}
              <Star className="h-5 w-5 ml-1 text-yellow-500 fill-yellow-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "en" ? "Based on reviews" : "基於評論"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="overview">{text.overview}</TabsTrigger>
          <TabsTrigger value="bookings">{text.bookings}</TabsTrigger>
          <TabsTrigger value="earnings">{text.earnings}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{text.pendingRequests}</CardTitle>
                <CardDescription>
                  {language === "en" ? "Booking requests awaiting your approval" : "等待您批准的預約請求"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "en" ? "No pending requests" : "沒有待處理的請求"}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {pendingBookings.map((booking) => (
                        <div key={booking.id} className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={booking.user?.photoUrl} />
                                <AvatarFallback>
                                  {booking.user?.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{booking.user?.username}</p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.user?.company}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="space-y-2 text-sm mb-4">
                            <p>
                              <strong>{language === "en" ? "Date" : "日期"}:</strong>{" "}
                              {format(new Date(booking.sessionDate), "PPP p")}
                            </p>
                            <p>
                              <strong>{language === "en" ? "Type" : "類型"}:</strong>{" "}
                              {getSessionTypeText(booking.sessionType)}
                            </p>
                            <p>
                              <strong>{language === "en" ? "Duration" : "時長"}:</strong>{" "}
                              {booking.sessionDuration} {text.minutes}
                            </p>
                            <p>
                              <strong>{language === "en" ? "Amount" : "金額"}:</strong>{" "}
                              ${booking.totalAmount}
                            </p>
                            {booking.notes && (
                              <p className="bg-white dark:bg-gray-900 p-2 rounded mt-2">
                                {booking.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(booking)}
                              disabled={updateBookingMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              {text.approve}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(booking.id)}
                              disabled={updateBookingMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {text.reject}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{text.upcomingSessions}</CardTitle>
                <CardDescription>
                  {language === "en" ? "Your confirmed upcoming sessions" : "您已確認的即將進行場次"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {confirmedBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{text.noBookings}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {confirmedBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={booking.user?.photoUrl} />
                                <AvatarFallback>
                                  {booking.user?.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{booking.user?.username}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(booking.sessionDate), "PPP p")}
                                </p>
                              </div>
                            </div>
                            <span className="text-lg font-bold">${booking.totalAmount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{getSessionTypeText(booking.sessionType)}</span>
                              <span>•</span>
                              <span>{booking.sessionDuration} {text.minutes}</span>
                            </div>
                            <div className="flex gap-2">
                              {booking.meetingLink && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                                    <Video className="h-4 w-4 mr-1" />
                                    {language === "en" ? "Join" : "加入"}
                                  </a>
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMarkComplete(booking.id)}
                                disabled={updateBookingMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                {text.markComplete}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{text.bookings}</CardTitle>
              <CardDescription>
                {language === "en" ? "All your consultation sessions" : "您所有的諮詢場次"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{text.noBookings}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={booking.user?.photoUrl} />
                        <AvatarFallback>
                          {booking.user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{booking.user?.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.user?.company}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(booking.status)}
                            <Badge variant={booking.paymentStatus === "paid" ? "default" : "secondary"}>
                              {booking.paymentStatus === "paid" ? text.paid : text.unpaid}
                            </Badge>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{language === "en" ? "Date & Time" : "日期與時間"}</p>
                            <p className="font-medium">{format(new Date(booking.sessionDate), "PPP p")}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === "en" ? "Duration" : "時長"}</p>
                            <p className="font-medium">{booking.sessionDuration} {text.minutes}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === "en" ? "Type" : "類型"}</p>
                            <p className="font-medium">{getSessionTypeText(booking.sessionType)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{language === "en" ? "Amount" : "金額"}</p>
                            <p className="font-medium">${booking.totalAmount}</p>
                          </div>
                        </div>
                        {booking.status === "pending" && (
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(booking)}
                              disabled={updateBookingMutation.isPending}
                            >
                              {text.approve}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(booking.id)}
                              disabled={updateBookingMutation.isPending}
                            >
                              {text.reject}
                            </Button>
                          </div>
                        )}
                        {booking.status === "confirmed" && (
                          <div className="flex gap-2 mt-4">
                            {booking.meetingLink && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Video className="h-4 w-4 mr-1" />
                                  {language === "en" ? "Join Meeting" : "加入會議"}
                                </a>
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => handleMarkComplete(booking.id)}
                              disabled={updateBookingMutation.isPending}
                            >
                              {text.markComplete}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{text.totalEarnings}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${consultantStats.totalEarnings.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === "en" ? "From" : "來自"} {consultantStats.completedBookings} {language === "en" ? "completed sessions" : "已完成場次"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{text.monthlyEarnings}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${consultantStats.monthlyEarnings.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(), "MMMM yyyy")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === "en" ? "Pending Payments" : "待收款項"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  ${bookings
                    .filter(b => b.status === "confirmed" && b.paymentStatus === "pending")
                    .reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0)
                    .toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {bookings.filter(b => b.paymentStatus === "pending").length} {language === "en" ? "pending" : "待處理"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Recent Transactions" : "最近交易"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings
                  .filter(b => b.paymentStatus === "paid")
                  .slice(0, 10)
                  .map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">{booking.user?.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {getSessionTypeText(booking.sessionType)} • {format(new Date(booking.sessionDate), "PP")}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        +${booking.totalAmount}
                      </span>
                    </div>
                  ))}
                {bookings.filter(b => b.paymentStatus === "paid").length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{language === "en" ? "No transactions yet" : "尚無交易記錄"}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={meetingLinkDialog} onOpenChange={setMeetingLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{text.addMeetingLink}</DialogTitle>
            <DialogDescription>
              {language === "en" 
                ? "Add a meeting link for the consultation session" 
                : "為諮詢場次添加會議連結"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meetingLink">{language === "en" ? "Meeting Link" : "會議連結"}</Label>
              <Input
                id="meetingLink"
                placeholder="https://zoom.us/j/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingLinkDialog(false)}>
              {language === "en" ? "Cancel" : "取消"}
            </Button>
            <Button onClick={handleConfirmWithLink} disabled={updateBookingMutation.isPending}>
              {updateBookingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {text.approve}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
