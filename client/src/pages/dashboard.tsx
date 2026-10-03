import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslations } from "@/hooks/use-translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  Loader2,
  BookOpen,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Bell,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";

type Booking = {
  id: number;
  consultantId: number;
  sessionDate: string;
  sessionDuration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalAmount: string;
  paymentStatus: "pending" | "paid" | "refunded";
  sessionType: string;
  notes: string | null;
  consultant?: {
    fullName: string;
    photoUrl: string;
    expertise: string;
  };
};

type Enrollment = {
  id: number;
  courseId: number;
  enrolledAt: string;
  status: "active" | "completed" | "cancelled";
  paymentStatus: string;
  course?: {
    title: string;
    level: string;
    duration: string;
    provider?: {
      name: string;
    };
  };
};

type Message = {
  id: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    username: string;
    photoUrl: string;
  };
};

type DashboardStats = {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  unreadMessages: number;
  totalSpent: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { language } = useTranslations();
  const [activeTab, setActiveTab] = useState("overview");

  const text = {
    dashboard: language === "en" ? "Dashboard" : "儀表板",
    welcome: language === "en" ? "Welcome back" : "歡迎回來",
    overview: language === "en" ? "Overview" : "概覽",
    bookings: language === "en" ? "Consultations" : "諮詢預約",
    enrollments: language === "en" ? "My Courses" : "我的課程",
    messages: language === "en" ? "Messages" : "訊息",
    stats: language === "en" ? "Statistics" : "統計",
    recentActivity: language === "en" ? "Recent Activity" : "最近活動",
    upcomingBookings: language === "en" ? "Upcoming Consultations" : "即將進行的諮詢",
    activeEnrollments: language === "en" ? "Active Enrollments" : "進行中的課程",
    totalBookings: language === "en" ? "Total Consultations" : "總諮詢數",
    pendingBookings: language === "en" ? "Pending" : "待確認",
    completedBookings: language === "en" ? "Completed" : "已完成",
    totalEnrollments: language === "en" ? "Total Enrollments" : "總報名數",
    unreadMessages: language === "en" ? "Unread Messages" : "未讀訊息",
    totalSpent: language === "en" ? "Total Spent" : "總支出",
    noBookings: language === "en" ? "No consultations yet" : "尚無諮詢預約",
    noEnrollments: language === "en" ? "No course enrollments yet" : "尚無課程報名",
    noMessages: language === "en" ? "No messages yet" : "尚無訊息",
    viewAll: language === "en" ? "View All" : "查看全部",
    bookConsultant: language === "en" ? "Book a Consultant" : "預約顧問",
    browseCourses: language === "en" ? "Browse Courses" : "瀏覽課程",
    pending: language === "en" ? "Pending" : "待確認",
    confirmed: language === "en" ? "Confirmed" : "已確認",
    completed: language === "en" ? "Completed" : "已完成",
    cancelled: language === "en" ? "Cancelled" : "已取消",
    active: language === "en" ? "Active" : "進行中",
    paid: language === "en" ? "Paid" : "已付款",
    unpaid: language === "en" ? "Unpaid" : "未付款",
    consultation: language === "en" ? "Consultation" : "諮詢",
    reportReview: language === "en" ? "Report Review" : "報告審查",
    strategySession: language === "en" ? "Strategy Session" : "策略會議",
    minutes: language === "en" ? "minutes" : "分鐘",
    loading: language === "en" ? "Loading..." : "載入中...",
    quickActions: language === "en" ? "Quick Actions" : "快速操作",
    viewProfile: language === "en" ? "View Profile" : "查看個人資料",
    settings: language === "en" ? "Settings" : "設定",
    notifications: language === "en" ? "Notifications" : "通知",
    learningProgress: language === "en" ? "Learning Progress" : "學習進度",
    courseProgress: language === "en" ? "Course Progress" : "課程進度",
  };

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/user/bookings"],
    enabled: !!user,
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery<Enrollment[]>({
    queryKey: ["/api/user/enrollments"],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/user/messages"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/user/dashboard-stats"],
    enabled: !!user,
  });

  const isLoading = bookingsLoading || enrollmentsLoading || messagesLoading;

  const getStatusBadge = (status: string, type: "booking" | "enrollment" | "payment") => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
      confirmed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      completed: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      cancelled: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
      active: { variant: "default", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      paid: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      unpaid: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{language === "en" ? "Authentication Required" : "需要登入"}</CardTitle>
            <CardDescription>
              {language === "en" ? "Please sign in to access your dashboard" : "請登入以訪問您的儀表板"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth">
              <Button className="w-full">{language === "en" ? "Sign In" : "登入"}</Button>
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

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const unreadMessages = messages.filter(m => !m.isRead);

  const dashboardStats: DashboardStats = stats || {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === "pending").length,
    completedBookings: bookings.filter(b => b.status === "completed").length,
    totalEnrollments: enrollments.length,
    activeEnrollments: enrollments.filter(e => e.status === "active").length,
    completedEnrollments: enrollments.filter(e => e.status === "completed").length,
    unreadMessages: unreadMessages.length,
    totalSpent: bookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || "0"), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{text.dashboard}</h1>
          <p className="text-muted-foreground">
            {text.welcome}, {user.firstName || user.username}!
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {text.settings}
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadMessages.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.totalBookings}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.pendingBookings} {text.pending}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.totalEnrollments}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.activeEnrollments} {text.active}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.unreadMessages}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              {messages.length} {language === "en" ? "total" : "總共"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{text.totalSpent}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardStats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "en" ? "All time" : "累計"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">{text.overview}</TabsTrigger>
          <TabsTrigger value="bookings">{text.bookings}</TabsTrigger>
          <TabsTrigger value="enrollments">{text.enrollments}</TabsTrigger>
          <TabsTrigger value="messages">{text.messages}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{text.upcomingBookings}</CardTitle>
                  <CardDescription>
                    {language === "en" ? "Your scheduled consultations" : "您已排定的諮詢"}
                  </CardDescription>
                </div>
                <Link href="/consultants">
                  <Button variant="outline" size="sm">
                    {text.bookConsultant}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{text.noBookings}</p>
                    <Link href="/consultants">
                      <Button variant="link" className="mt-2">
                        {text.bookConsultant}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {upcomingBookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-start gap-4 p-3 border rounded-lg">
                          <Avatar>
                            <AvatarImage src={booking.consultant?.photoUrl} />
                            <AvatarFallback>
                              <Briefcase className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {booking.consultant?.fullName || "Consultant"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getSessionTypeText(booking.sessionType)} • {booking.sessionDuration} {text.minutes}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(booking.sessionDate), "PPP p")}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(booking.status, "booking")}
                            <span className="text-sm font-medium">${booking.totalAmount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{text.activeEnrollments}</CardTitle>
                  <CardDescription>
                    {language === "en" ? "Your current courses" : "您目前的課程"}
                  </CardDescription>
                </div>
                <Link href="/courses">
                  <Button variant="outline" size="sm">
                    {text.browseCourses}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {activeEnrollments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{text.noEnrollments}</p>
                    <Link href="/courses">
                      <Button variant="link" className="mt-2">
                        {text.browseCourses}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {activeEnrollments.slice(0, 5).map((enrollment) => (
                        <div key={enrollment.id} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{enrollment.course?.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.course?.provider?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.course?.level} • {enrollment.course?.duration}
                              </p>
                            </div>
                            {getStatusBadge(enrollment.status, "enrollment")}
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{text.courseProgress}</span>
                              <span>0%</span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{text.quickActions}</CardTitle>
              <CardDescription>
                {language === "en" ? "Common actions and shortcuts" : "常用操作和快捷方式"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/consultants">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span>{language === "en" ? "Find Consultant" : "尋找顧問"}</span>
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <BookOpen className="h-6 w-6" />
                    <span>{language === "en" ? "Browse Courses" : "瀏覽課程"}</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    <span>{text.viewProfile}</span>
                  </Button>
                </Link>
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>{language === "en" ? "ESG Reports" : "ESG 報告"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{text.bookings}</CardTitle>
                <CardDescription>
                  {language === "en" ? "All your consultation bookings" : "您所有的諮詢預約"}
                </CardDescription>
              </div>
              <Link href="/consultants">
                <Button>
                  {text.bookConsultant}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{text.noBookings}</p>
                  <p className="text-sm mt-2">
                    {language === "en" 
                      ? "Book your first consultation with an ESG expert" 
                      : "與 ESG 專家預約您的第一次諮詢"}
                  </p>
                  <Link href="/consultants">
                    <Button className="mt-4">{text.bookConsultant}</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={booking.consultant?.photoUrl} />
                        <AvatarFallback>
                          <Briefcase className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{booking.consultant?.fullName || "Consultant"}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {booking.consultant?.expertise} Expert
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getStatusBadge(booking.status, "booking")}
                            {getStatusBadge(booking.paymentStatus, "payment")}
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
                        {booking.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <p className="text-sm">{booking.notes}</p>
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

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{text.enrollments}</CardTitle>
                <CardDescription>
                  {language === "en" ? "Your enrolled courses" : "您已報名的課程"}
                </CardDescription>
              </div>
              <Link href="/courses">
                <Button>
                  {text.browseCourses}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{text.noEnrollments}</p>
                  <p className="text-sm mt-2">
                    {language === "en" 
                      ? "Enroll in ESG courses to enhance your knowledge" 
                      : "報名 ESG 課程以提升您的專業知識"}
                  </p>
                  <Link href="/courses">
                    <Button className="mt-4">{text.browseCourses}</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment.id} className="overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold truncate">{enrollment.course?.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.course?.provider?.name}
                            </p>
                          </div>
                          {getStatusBadge(enrollment.status, "enrollment")}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="capitalize">{enrollment.course?.level}</span>
                          <span>•</span>
                          <span>{enrollment.course?.duration}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{text.learningProgress}</span>
                            <span className="font-medium">0%</span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-sm text-muted-foreground">
                            {language === "en" ? "Enrolled" : "報名於"}: {format(new Date(enrollment.enrolledAt), "PP")}
                          </span>
                          <Button variant="outline" size="sm">
                            {language === "en" ? "Continue" : "繼續學習"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{text.messages}</CardTitle>
              <CardDescription>
                {language === "en" ? "Your conversations with consultants and providers" : "您與顧問和培訓機構的對話"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">{text.noMessages}</p>
                  <p className="text-sm mt-2">
                    {language === "en" 
                      ? "Start a conversation by booking a consultation" 
                      : "透過預約諮詢開始對話"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          !message.isRead ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-accent"
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={message.sender?.photoUrl} />
                          <AvatarFallback>
                            {message.sender?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{message.sender?.username}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.createdAt), "PP p")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                        </div>
                        {!message.isRead && (
                          <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
