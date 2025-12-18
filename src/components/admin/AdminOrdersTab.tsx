import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Package, Clock, Truck, CheckCircle, XCircle, Loader2, Calendar as CalendarIcon, FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";
import JsBarcode from "jsbarcode";
import logo from "@/assets/Gemini_logo_only.png";

interface ShippingAddress {
  fullName: string;
  phone: string;
  streetNumber: string;
  barangay: string;
  city: string;
  province?: string;
  postalCode?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items: any;
  shipping_address: ShippingAddress;
  shipping_fee?: number;
  voucher_discount?: number;
  profiles?: {
    full_name: string;
    email: string;
    phone?: string;
  } | null;
}

interface AdminOrdersTabProps {
  onRefresh?: () => void;
  onNewOrdersCountChange?: (count: number) => void;
}

export const AdminOrdersTab = ({
  onRefresh,
  onNewOrdersCountChange
}: AdminOrdersTabProps) => {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "weekly" | "monthly" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [generatingWaybill, setGeneratingWaybill] = useState<string | null>(null);
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('orders').select(`
          id,
          order_number,
          user_id,
          total_amount,
          status,
          payment_method,
          created_at,
          items,
          shipping_address,
          shipping_fee,
          voucher_discount
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(order => order.user_id))];
        const {
          data: profiles
        } = await supabase.from('profiles').select('id, full_name, email, phone').in('id', userIds);
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const ordersWithProfiles = data.map(order => ({
          ...order,
          profiles: profileMap.get(order.user_id) || null
        }));
        setOrders(ordersWithProfiles as any);
        
        // Calculate new orders (to_pay status) and notify parent
        const newOrdersCount = data.filter(order => order.status === 'to_pay').length;
        onNewOrdersCountChange?.(newOrdersCount);
      } else {
        setOrders([]);
        onNewOrdersCountChange?.(0);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('admin-orders').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, () => {
      fetchOrders();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'to_pay':
        return <Clock className="w-4 h-4" />;
      case 'to_ship':
        return <Package className="w-4 h-4" />;
      case 'to_receive':
        return <Truck className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'pending_cancellation':
      case 'return_refund':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'to_pay': 'Unpaid',
      'to_ship': 'To Ship',
      'to_receive': 'Shipping',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'pending_cancellation': 'Pending Cancellation',
      'return_refund': 'Return & Refund'
    };
    return labels[status] || status;
  };
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'to_pay':
        return 'secondary';
      case 'cancelled':
      case 'pending_cancellation':
      case 'return_refund':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  const filterOrders = (orders: Order[], filter: string) => {
    switch (filter) {
      case 'unpaid':
        return orders.filter(order => order.status === 'to_pay');
      case 'to_ship':
        return orders.filter(order => order.status === 'to_ship');
      case 'shipping':
        return orders.filter(order => order.status === 'to_receive');
      case 'completed':
        return orders.filter(order => order.status === 'completed');
      case 'return_cancel':
        return orders.filter(order => ['cancelled', 'pending_cancellation', 'return_refund'].includes(order.status));
      default:
        return orders;
    }
  };
  const getFilterCount = (filter: string) => {
    const dateFiltered = filterOrdersByDate(orders);
    return filterOrders(dateFiltered, filter).length;
  };
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case "weekly":
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case "monthly":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case "custom":
        if (customStartDate && customEndDate) {
          return {
            start: customStartDate,
            end: customEndDate
          };
        }
        return null;
      default:
        return null;
    }
  };
  const filterOrdersByDate = (orders: Order[]) => {
    const dateRange = getDateRange();
    if (!dateRange) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, {
        start: dateRange.start,
        end: dateRange.end
      });
    });
  };
  const filteredByStatus = filterOrders(orders, activeFilter);
  const filteredOrders = filterOrdersByDate(filteredByStatus);
  const calculateMetrics = () => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
    const totalOrders = filteredOrders.length;
    const totalProductsOrdered = filteredOrders.reduce((sum, order) => {
      if (Array.isArray(order.items)) {
        return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }
      return sum;
    }, 0);
    return {
      totalSales,
      totalOrders,
      totalProductsOrdered
    };
  };
  const resolveDateRangeOrShowError = () => {
    let dateRange = getDateRange();
    if (!dateRange && dateFilter === "all") {
      if (filteredOrders.length === 0) {
        toast({
          title: "No Data",
          description: "There are no orders to include in the report",
          variant: "destructive"
        });
        return null;
      }
      const dates = filteredOrders.map(order => new Date(order.created_at));
      const start = new Date(Math.min(...dates.map(d => d.getTime())));
      const end = new Date(Math.max(...dates.map(d => d.getTime())));
      dateRange = {
        start,
        end
      };
    }
    if (!dateRange) {
      toast({
        title: "Select Date Range",
        description: "Please select a valid date range before exporting",
        variant: "destructive"
      });
      return null;
    }
    return dateRange;
  };
  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "all":
        return "All Time";
      case "today":
        return "Today";
      case "weekly":
        return "This Week";
      case "monthly":
        return "This Month";
      case "custom":
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, "MMM dd, yyyy")} - ${format(customEndDate, "MMM dd, yyyy")}`;
        }
        return "Custom Range";
      default:
        return "All Time";
    }
  };
  const generatePdfReport = async (metrics: {
    totalSales: number;
    totalOrders: number;
    totalProductsOrdered: number;
  }, dateRange: {
    start: Date;
    end: Date;
  }, dateRangeLabel: string) => {
    // Preload logo to maintain its original aspect ratio in the PDF
    const logoImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = event => reject(event);
      img.src = logo;
    });
    const maxLogoHeight = 14;
    const maxLogoWidth = 30;
    let logoDisplayWidth = logoImage.width;
    let logoDisplayHeight = logoImage.height;
    const heightScale = maxLogoHeight / logoDisplayHeight;
    const widthScale = maxLogoWidth / logoDisplayWidth;
    const scale = Math.min(heightScale, widthScale, 1); // never upscale
    logoDisplayWidth *= scale;
    logoDisplayHeight *= scale;

    // Generate PDF report matching on-screen metrics
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const usableWidth = pageWidth - marginLeft - marginRight;

    // Header with logo and title (corporate style)
    const title = "Order Summary Report";
    doc.addImage(logo, "PNG", marginLeft, 14, logoDisplayWidth, logoDisplayHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const titleX = marginLeft + usableWidth / 2;
    doc.text(title, titleX, 22, {
      align: "center"
    });

    // Summary block
    const periodLabel = `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let y = 38;
    doc.text(`Selected Range: ${dateRangeLabel}`, marginLeft, y);
    y += 6;
    doc.text(`Period: ${periodLabel}`, marginLeft, y);
    y += 6;
    doc.text(`Generated At: ${format(new Date(), "MMM dd, yyyy - h:mm a")}`, marginLeft, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total Sales: PHP ${metrics.totalSales.toFixed(2)}`, marginLeft, y);
    y += 6;
    doc.text(`Total Orders: ${metrics.totalOrders}`, marginLeft, y);
    y += 6;
    doc.text(`Products Ordered: ${metrics.totalProductsOrdered}`, marginLeft, y);
    y += 10;

    // Detailed order breakdown table - formal line-item view
    const breakdownOrders = filteredOrders;
    const colOrderNoX = marginLeft;
    const colCustomerX = marginLeft + 30;
    const colProductNameX = marginLeft + 65;
    const colProductPriceX = marginLeft + 120;
    const colQuantityX = marginLeft + 145;
    const colSubtotalX = pageWidth - marginRight;
    const rowHeight = 6;
    const drawTableHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      let headerY = y;
      doc.text("Order No.", colOrderNoX, headerY);
      doc.text("Customer", colCustomerX, headerY);
      doc.text("Product Name", colProductNameX, headerY);
      doc.text("Product Price", colProductPriceX, headerY, {
        align: "right"
      });
      doc.text("Quantity", colQuantityX, headerY, {
        align: "center"
      });
      doc.text("Subtotal", colSubtotalX, headerY, {
        align: "right"
      });
      headerY += 3;
      doc.setDrawColor(220);
      doc.line(marginLeft, headerY, pageWidth - marginRight, headerY);
      y = headerY + 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
    };
    const ensurePageSpace = () => {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = 20;
        drawTableHeader();
      }
    };

    // Draw initial header
    drawTableHeader();
    breakdownOrders.forEach(order => {
      const orderNo = order.order_number || order.id;
      const customerName = order.profiles?.full_name || order.profiles?.email || "N/A";
      if (Array.isArray(order.items) && order.items.length > 0) {
        (order.items as OrderItem[]).forEach(item => {
          ensurePageSpace();
          const productName = item.name;
          const priceText = `PHP ${Number(item.price).toFixed(2)}`;
          const subtotalValue = Number(item.price) * Number(item.quantity || 0);
          const subtotalText = `PHP ${subtotalValue.toFixed(2)}`;
          doc.text(String(orderNo), colOrderNoX, y);
          doc.text(String(customerName), colCustomerX, y);
          doc.text(String(productName), colProductNameX, y);
          doc.text(priceText, colProductPriceX, y, {
            align: "right"
          });
          doc.text(String(item.quantity), colQuantityX, y, {
            align: "center"
          });
          doc.text(subtotalText, colSubtotalX, y, {
            align: "right"
          });
          y += rowHeight;
          doc.setDrawColor(240);
          doc.line(marginLeft, y - 1, pageWidth - marginRight, y - 1);
        });
      } else {
        // Fallback row when no item breakdown is available
        ensurePageSpace();
        const subtotalText = `PHP ${Number(order.total_amount || 0).toFixed(2)}`;
        doc.text(String(orderNo), colOrderNoX, y);
        doc.text(String(customerName), colCustomerX, y);
        doc.text("-", colProductNameX, y);
        doc.text("-", colProductPriceX, y, {
          align: "right"
        });
        doc.text("-", colQuantityX, y, {
          align: "center"
        });
        doc.text(subtotalText, colSubtotalX, y, {
          align: "right"
        });
        y += rowHeight;
        doc.setDrawColor(240);
        doc.line(marginLeft, y - 1, pageWidth - marginRight, y - 1);
      }

      // Extra spacing between different orders for readability
      y += 2;
    });

    // Payment method summary section
    const paymentSummary = new Map<string, {
      orders: number;
      sales: number;
    }>();
    breakdownOrders.forEach(order => {
      const methodKey = order.payment_method || "N/A";
      const current = paymentSummary.get(methodKey) || {
        orders: 0,
        sales: 0
      };
      paymentSummary.set(methodKey, {
        orders: current.orders + 1,
        sales: current.sales + Number(order.total_amount || 0)
      });
    });
    if (paymentSummary.size > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Payment Method Summary", marginLeft, y);
      y += 6;
      const ordersColX = marginLeft + usableWidth * 0.55;
      const salesColX = marginLeft + usableWidth * 0.85;
      doc.setFontSize(9);
      doc.text("Method", marginLeft, y);
      doc.text("Orders", ordersColX, y, {
        align: "right"
      });
      doc.text("Sales", salesColX, y, {
        align: "right"
      });
      y += 4;
      doc.setDrawColor(220);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      paymentSummary.forEach((summary, method) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        const salesText = `PHP ${summary.sales.toFixed(2)}`;
        doc.text(String(method), marginLeft, y);
        doc.text(String(summary.orders), ordersColX, y, {
          align: "right"
        });
        doc.text(String(salesText), salesColX, y, {
          align: "right"
        });
        y += 4;
      });
    }

    // Footer with generation timestamp
    const footerText = `Generated on ${format(new Date(), "MMM dd, yyyy - h:mm a")}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(footerText, marginLeft + usableWidth / 2, pageHeight - 10, {
      align: "center"
    });
    doc.save(`order-summary-${format(new Date(), "yyyyMMdd-HHmmss")}.pdf`);
  };
  const handleSaveData = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save data",
        variant: "destructive"
      });
      return;
    }
    const dateRange = resolveDateRangeOrShowError();
    if (!dateRange) {
      return;
    }
    const dateRangeLabel = getDateFilterLabel();
    const metrics = calculateMetrics();
    try {
      const {
        error
      } = await supabase.from("sales_reports").insert({
        admin_id: user.id,
        date_range_start: dateRange.start.toISOString(),
        date_range_end: dateRange.end.toISOString(),
        total_sales: metrics.totalSales,
        total_orders: metrics.totalOrders,
        total_products_ordered: metrics.totalProductsOrdered
      });
      if (error) throw error;
      await generatePdfReport(metrics, dateRange, dateRangeLabel);
      toast({
        title: "Report Saved",
        description: `PDF downloaded. Total Sales: PHP ${metrics.totalSales.toFixed(2)} | Orders: ${metrics.totalOrders} | Products: ${metrics.totalProductsOrdered}`
      });
    } catch (error) {
      console.error("Error saving sales report:", error);
      toast({
        title: "Error",
        description: "Failed to save sales report",
        variant: "destructive"
      });
    }
  };
  const handleDownloadPdf = async () => {
    const dateRange = resolveDateRangeOrShowError();
    if (!dateRange) {
      return;
    }
    const dateRangeLabel = getDateFilterLabel();
    const metrics = calculateMetrics();
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data",
        description: "There are no orders to include in the PDF report",
        variant: "destructive"
      });
      return;
    }
    try {
      setExportingPdf(true);
      await generatePdfReport(metrics, dateRange, dateRangeLabel);
      toast({
        title: "PDF Exported",
        description: `PDF downloaded. Total Sales: PHP ${metrics.totalSales.toFixed(2)} | Orders: ${metrics.totalOrders} | Products: ${metrics.totalProductsOrdered}`
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF report",
        variant: "destructive"
      });
    } finally {
      setExportingPdf(false);
    }
  };
  const handleDownloadExcel = async () => {
    const dateRange = resolveDateRangeOrShowError();
    if (!dateRange) {
      return;
    }
    const dateRangeLabel = getDateFilterLabel();
    const metrics = calculateMetrics();
    const breakdownOrders = filteredOrders;
    if (breakdownOrders.length === 0) {
      toast({
        title: "No Data",
        description: "There are no orders to include in the Excel export",
        variant: "destructive"
      });
      return;
    }
    try {
      setExportingExcel(true);
      
      // Helper function to convert image to base64 and get dimensions
      const getImageData = async (imgSrc: string): Promise<{ base64: string; width: number; height: number }> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataURL = canvas.toDataURL("image/png");
              resolve({
                base64: dataURL.split(",")[1],
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            } else {
              reject(new Error("Could not get canvas context"));
            }
          };
          img.onerror = reject;
          img.src = imgSrc;
        });
      };
      
      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Gemini Agri Admin";
      workbook.created = new Date();
      workbook.properties.date1904 = true;
      
      const worksheet = workbook.addWorksheet("Order Summary", {
        properties: { tabColor: { argb: "4CAF50" } },
        pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true }
      });
      
      // Define colors - Light green theme
      const darkGreen = "2E7D32";
      const lightGreen = "C8E6C9";
      const mediumGreen = "81C784";
      const white = "FFFFFF";
      const black = "000000";
      const lightGray = "F5F5F5";
      
      // Set column widths
      worksheet.columns = [
        { width: 18 },  // Order No
        { width: 22 },  // Customer
        { width: 32 },  // Product Name
        { width: 14 },  // Unit Price
        { width: 8 },   // Qty
        { width: 14 },  // Subtotal
        { width: 14 },  // Status
        { width: 16 },  // Payment Method
        { width: 20 },  // Order Date
      ];
      
      // Add company logo with proper aspect ratio
      try {
        const logoData = await getImageData(logo);
        const logoImageId = workbook.addImage({
          base64: logoData.base64,
          extension: "png",
        });
        
        // Calculate scaled dimensions maintaining aspect ratio
        const maxHeight = 50; // Target height in pixels
        const aspectRatio = logoData.width / logoData.height;
        const scaledWidth = maxHeight * aspectRatio;
        const scaledHeight = maxHeight;
        
        // Position logo centered in column A, spanning rows 1-2
        // Using margins to center the logo within the cell area
        worksheet.addImage(logoImageId, {
          tl: { col: 0.15, row: 0.1 },
          ext: { width: scaledWidth, height: scaledHeight },
        });
      } catch (logoError) {
        console.warn("Could not add logo to Excel:", logoError);
      }
      
      // Row 1: Company Name (shifted right to accommodate logo)
      worksheet.mergeCells("B1:I1");
      const companyCell = worksheet.getCell("B1");
      companyCell.value = "GEMINI AGRI";
      companyCell.font = { name: "Arial", size: 22, bold: true, color: { argb: white } };
      companyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
      companyCell.alignment = { horizontal: "center", vertical: "middle" };
      // Apply dark green background to column A as well for consistency
      const logoCell = worksheet.getCell("A1");
      logoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
      worksheet.getRow(1).height = 40;
      
      // Row 2: Tagline (shifted right to match logo area)
      worksheet.mergeCells("B2:I2");
      const taglineCell = worksheet.getCell("B2");
      taglineCell.value = "Helping Filipino farmers for a sustainable agriculture";
      taglineCell.font = { name: "Arial", size: 11, italic: true, color: { argb: white } };
      taglineCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
      taglineCell.alignment = { horizontal: "center", vertical: "middle" };
      // Apply dark green background to column A row 2 for consistency
      const logoCell2 = worksheet.getCell("A2");
      logoCell2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
      worksheet.getRow(2).height = 22;
      
      // Row 3: Empty spacer
      worksheet.getRow(3).height = 10;
      
      // Row 4: Report Title
      worksheet.mergeCells("A4:I4");
      const titleCell = worksheet.getCell("A4");
      titleCell.value = "ORDER SUMMARY REPORT";
      titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: darkGreen } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(4).height = 28;
      
      // Row 5: Report Period
      worksheet.mergeCells("A5:I5");
      const periodCell = worksheet.getCell("A5");
      periodCell.value = `Report Period: ${dateRangeLabel}`;
      periodCell.font = { name: "Arial", size: 11, color: { argb: black } };
      periodCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(5).height = 20;
      
      // Row 6: Generated Date
      worksheet.mergeCells("A6:I6");
      const dateCell = worksheet.getCell("A6");
      dateCell.value = `Generated: ${format(new Date(), "MMMM dd, yyyy 'at' hh:mm a")}`;
      dateCell.font = { name: "Arial", size: 10, color: { argb: "666666" } };
      dateCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(6).height = 18;
      
      // Row 7: Empty spacer
      worksheet.getRow(7).height = 12;
      
      // Row 8: Summary Header
      worksheet.mergeCells("A8:I8");
      const summaryHeader = worksheet.getCell("A8");
      summaryHeader.value = "REPORT SUMMARY";
      summaryHeader.font = { name: "Arial", size: 12, bold: true, color: { argb: white } };
      summaryHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: mediumGreen } };
      summaryHeader.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(8).height = 24;
      
      // Row 9-11: Summary metrics with light green background
      const summaryData = [
        ["Total Sales:", `PHP ${metrics.totalSales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ["Total Orders:", metrics.totalOrders.toString()],
        ["Total Products Ordered:", metrics.totalProductsOrdered.toString()]
      ];
      
      summaryData.forEach((row, index) => {
        const rowNum = 9 + index;
        worksheet.getCell(`A${rowNum}`).value = row[0];
        worksheet.getCell(`A${rowNum}`).font = { name: "Arial", size: 11, bold: true };
        worksheet.getCell(`A${rowNum}`).alignment = { horizontal: "left", vertical: "middle" };
        worksheet.getCell(`B${rowNum}`).value = row[1];
        worksheet.getCell(`B${rowNum}`).font = { name: "Arial", size: 11 };
        worksheet.getCell(`B${rowNum}`).alignment = { horizontal: "left", vertical: "middle" };
        
        // Apply light green background to summary rows
        for (let col = 1; col <= 9; col++) {
          worksheet.getCell(rowNum, col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: lightGreen } };
        }
        worksheet.getRow(rowNum).height = 20;
      });
      
      // Row 12: Empty spacer
      worksheet.getRow(12).height = 12;
      
      // Row 13: Table Headers
      const headers = ["Order No", "Customer", "Product Name", "Unit Price (PHP)", "Qty", "Subtotal (PHP)", "Status", "Payment Method", "Order Date"];
      const headerRow = worksheet.getRow(13);
      headerRow.values = headers;
      headerRow.height = 26;
      
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: white } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: darkGreen } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: darkGreen } },
          bottom: { style: "thin", color: { argb: darkGreen } },
          left: { style: "thin", color: { argb: darkGreen } },
          right: { style: "thin", color: { argb: darkGreen } }
        };
      });
      
      // Data rows starting from row 14
      let currentRow = 14;
      breakdownOrders.forEach((order, orderIndex) => {
        const orderNo = order.order_number || order.id;
        const customerName = order.profiles?.full_name || order.profiles?.email || "N/A";
        const orderDate = format(new Date(order.created_at), "MMM dd, yyyy hh:mm a");
        
        if (Array.isArray(order.items) && order.items.length > 0) {
          (order.items as OrderItem[]).forEach((item, itemIndex) => {
            const subtotalValue = Number(item.price) * Number(item.quantity || 0);
            const row = worksheet.getRow(currentRow);
            row.values = [
              orderNo,
              customerName,
              item.name,
              Number(item.price),
              Number(item.quantity || 0),
              subtotalValue,
              getStatusLabel(order.status),
              order.payment_method.replace("_", " ").toUpperCase(),
              orderDate
            ];
            
            // Apply alternating row colors
            const bgColor = (currentRow - 14) % 2 === 0 ? white : lightGray;
            row.eachCell((cell, colNumber) => {
              cell.font = { name: "Arial", size: 10 };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
              cell.border = {
                top: { style: "thin", color: { argb: "E0E0E0" } },
                bottom: { style: "thin", color: { argb: "E0E0E0" } },
                left: { style: "thin", color: { argb: "E0E0E0" } },
                right: { style: "thin", color: { argb: "E0E0E0" } }
              };
              
              // Align numbers to right, text to left
              if (colNumber === 4 || colNumber === 5 || colNumber === 6) {
                cell.alignment = { horizontal: "right", vertical: "middle" };
                if (colNumber === 4 || colNumber === 6) {
                  cell.numFmt = "#,##0.00";
                }
              } else {
                cell.alignment = { horizontal: "left", vertical: "middle" };
              }
            });
            
            row.height = 20;
            currentRow++;
          });
        } else {
          const row = worksheet.getRow(currentRow);
          row.values = [
            orderNo,
            customerName,
            "-",
            "",
            "",
            Number(order.total_amount || 0),
            getStatusLabel(order.status),
            order.payment_method.replace("_", " ").toUpperCase(),
            orderDate
          ];
          
          const bgColor = (currentRow - 14) % 2 === 0 ? white : lightGray;
          row.eachCell((cell, colNumber) => {
            cell.font = { name: "Arial", size: 10 };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
            cell.border = {
              top: { style: "thin", color: { argb: "E0E0E0" } },
              bottom: { style: "thin", color: { argb: "E0E0E0" } },
              left: { style: "thin", color: { argb: "E0E0E0" } },
              right: { style: "thin", color: { argb: "E0E0E0" } }
            };
            cell.alignment = { horizontal: colNumber >= 4 && colNumber <= 6 ? "right" : "left", vertical: "middle" };
          });
          
          row.height = 20;
          currentRow++;
        }
      });
      
      // Add empty row
      currentRow++;
      
      // Footer: End of Report
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const endCell = worksheet.getCell(`A${currentRow}`);
      endCell.value = "--- End of Report ---";
      endCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "999999" } };
      endCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;
      
      // Empty row
      currentRow++;
      
      // Contact info
      worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
      const contactCell = worksheet.getCell(`A${currentRow}`);
      contactCell.value = "For inquiries, contact: geminicares@geminiagri.com";
      contactCell.font = { name: "Arial", size: 10, color: { argb: darkGreen } };
      contactCell.alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getRow(currentRow).height = 20;
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GeminiAgri-OrderReport-${format(new Date(), "yyyyMMdd-HHmmss")}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Excel Exported",
        description: `Professional report downloaded for ${dateRangeLabel}.`
      });
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast({
        title: "Error",
        description: "Failed to export Excel file",
        variant: "destructive"
      });
    } finally {
      setExportingExcel(false);
    }
  };
  const handleUpdateStatus = async (orderId: string, newStatus: string, successMessage: string) => {
    try {
      setUpdatingOrderId(orderId);
      const {
        error
      } = await supabase.from("orders").update({
        status: newStatus
      }).eq("id", orderId);
      if (error) throw error;
      toast({
        title: "Order Updated",
        description: successMessage
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Generate Waybill PDF (5x7 inches)
  const generateWaybillPdf = async (order: Order) => {
    try {
      setGeneratingWaybill(order.id);
      
      // Preload logo
      const logoImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = event => reject(event);
        img.src = logo;
      });

      // 5x7 inches in mm (1 inch = 25.4mm)
      const waybillWidth = 5 * 25.4; // 127mm
      const waybillHeight = 7 * 25.4; // 177.8mm

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [waybillWidth, waybillHeight]
      });

      const marginLeft = 8;
      const marginRight = 8;
      const usableWidth = waybillWidth - marginLeft - marginRight;
      let y = 10;

      // Logo - scaled to fit
      const maxLogoHeight = 12;
      const maxLogoWidth = 20;
      let logoDisplayWidth = logoImage.width;
      let logoDisplayHeight = logoImage.height;
      const heightScale = maxLogoHeight / logoDisplayHeight;
      const widthScale = maxLogoWidth / logoDisplayWidth;
      const scale = Math.min(heightScale, widthScale, 1);
      logoDisplayWidth *= scale;
      logoDisplayHeight *= scale;

      doc.addImage(logo, "PNG", marginLeft, y, logoDisplayWidth, logoDisplayHeight);

      // Company Name beside logo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Gemini Agri", marginLeft + logoDisplayWidth + 4, y + 5);
      
      // Tagline
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text("Helping Filipino farmers for a sustainable agriculture", marginLeft + logoDisplayWidth + 4, y + 9);
      
      // Waybill Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("WAYBILL", waybillWidth - marginRight, y + 4, { align: "right" });
      y += maxLogoHeight + 6;

      // Order Number
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Order #: ${order.order_number}`, marginLeft, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(format(new Date(order.created_at), "MMM dd, yyyy • h:mm a"), waybillWidth - marginRight, y, { align: "right" });
      y += 6;

      // Divider line
      doc.setDrawColor(200);
      doc.line(marginLeft, y, waybillWidth - marginRight, y);
      y += 5;

      // Recipient Information Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("RECIPIENT INFORMATION", marginLeft, y);
      y += 5;

      const shippingAddr = order.shipping_address;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      
      // Name
      doc.setFont("helvetica", "bold");
      doc.text(shippingAddr?.fullName || order.profiles?.full_name || "N/A", marginLeft, y);
      y += 4;
      
      // Phone
      doc.setFont("helvetica", "normal");
      doc.text(`Phone: ${shippingAddr?.phone || order.profiles?.phone || "N/A"}`, marginLeft, y);
      y += 4;
      
      // Address
      const addressParts = [
        shippingAddr?.streetNumber,
        shippingAddr?.barangay,
        shippingAddr?.city,
        shippingAddr?.province,
        shippingAddr?.postalCode
      ].filter(Boolean).join(", ");
      
      const addressLines = doc.splitTextToSize(addressParts || "N/A", usableWidth);
      addressLines.forEach((line: string) => {
        doc.text(line, marginLeft, y);
        y += 4;
      });
      
      y += 2;

      // Divider line
      doc.line(marginLeft, y, waybillWidth - marginRight, y);
      y += 5;

      // Order Items Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("ORDER ITEMS", marginLeft, y);
      y += 5;

      // Table Header
      const colProductX = marginLeft;
      const colQtyX = marginLeft + usableWidth * 0.55;
      const colPriceX = marginLeft + usableWidth * 0.75;
      const colSubtotalX = waybillWidth - marginRight;

      doc.setFontSize(7);
      doc.text("Product", colProductX, y);
      doc.text("Qty", colQtyX, y);
      doc.text("Price", colPriceX, y);
      doc.text("Subtotal", colSubtotalX, y, { align: "right" });
      y += 3;
      
      doc.setDrawColor(220);
      doc.line(marginLeft, y, waybillWidth - marginRight, y);
      y += 3;

      // Items
      doc.setFont("helvetica", "normal");
      let itemsSubtotal = 0;
      
      if (Array.isArray(order.items)) {
        (order.items as OrderItem[]).forEach(item => {
          const subtotal = Number(item.price) * Number(item.quantity);
          itemsSubtotal += subtotal;
          
          // Truncate product name if too long
          const productName = item.name.length > 22 ? item.name.substring(0, 20) + "..." : item.name;
          
          doc.text(productName, colProductX, y);
          doc.text(String(item.quantity), colQtyX, y);
          doc.text(`PHP ${Number(item.price).toFixed(2)}`, colPriceX, y);
          doc.text(`PHP ${subtotal.toFixed(2)}`, colSubtotalX, y, { align: "right" });
          y += 4;
        });
      }

      y += 2;
      doc.line(marginLeft, y, waybillWidth - marginRight, y);
      y += 4;

      // Totals Section
      const labelX = marginLeft + usableWidth * 0.5;
      const valueX = waybillWidth - marginRight;

      doc.setFontSize(7);
      doc.text("Subtotal:", labelX, y);
      doc.text(`PHP ${itemsSubtotal.toFixed(2)}`, valueX, y, { align: "right" });
      y += 4;

      const shippingFee = Number(order.shipping_fee || 50);
      doc.text("Shipping Fee:", labelX, y);
      doc.text(`PHP ${shippingFee.toFixed(2)}`, valueX, y, { align: "right" });
      y += 4;

      if (order.voucher_discount && Number(order.voucher_discount) > 0) {
        doc.text("Discount:", labelX, y);
        doc.text(`PHP ${Number(order.voucher_discount).toFixed(2)}`, valueX, y, { align: "right" });
        y += 4;
      }

      // Total Amount
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      y += 2;
      doc.text("TOTAL AMOUNT:", labelX, y);
      doc.text(`PHP ${Number(order.total_amount).toFixed(2)}`, valueX, y, { align: "right" });
      y += 6;

      // Payment Method
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(`Payment: ${order.payment_method.replace('_', ' ').toUpperCase()}`, marginLeft, y);
      
      y += 6;
      
      // Generate Code128 barcode using JsBarcode
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, order.order_number, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000"
      });
      const barcodeDataUrl = canvas.toDataURL("image/png");
      
      // Add barcode centered - larger size
      const barcodeWidth = 80;
      const barcodeHeight = 22;
      const barcodeX = (waybillWidth - barcodeWidth) / 2;
      doc.addImage(barcodeDataUrl, "PNG", barcodeX, y, barcodeWidth, barcodeHeight);
      
      // Barcode label below
      y += barcodeHeight + 2;
      doc.setFontSize(5);
      doc.setTextColor(100);
      doc.text("Scan to Track Order", waybillWidth / 2, y, { align: "center" });
      
      y += 6;

      // Footer
      doc.setDrawColor(200);
      doc.line(marginLeft, y, waybillWidth - marginRight, y);
      y += 4;
      
      doc.setFontSize(6);
      doc.setTextColor(120);
      doc.text("Thank you for shopping with GeminiAgri!", waybillWidth / 2, y, { align: "center" });
      y += 3;
      doc.text("For inquiries, email us at geminicares@geminiagri.com", waybillWidth / 2, y, { align: "center" });

      // Save PDF
      doc.save(`waybill-${order.order_number}.pdf`);
      
      toast({
        title: "Waybill Generated",
        description: `Waybill for Order #${order.order_number} has been downloaded.`
      });
    } catch (error) {
      console.error("Error generating waybill:", error);
      toast({
        title: "Error",
        description: "Failed to generate waybill",
        variant: "destructive"
      });
    } finally {
      setGeneratingWaybill(null);
    }
  };

  // Handle shipping without waybill generation
  const handleMarkAsShipping = async (order: Order) => {
    await handleUpdateStatus(order.id, 'to_receive', 'Order marked as Shipping.');
  };
  const metrics = calculateMetrics();
  if (loading) {
    return <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold">Order Management</h2>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Time Range Filter</h3>
          
          <div className="flex-wrap gap-2 flex items-center justify-center">
            <Button variant={dateFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("all")} className="text-xs">
              All Time
            </Button>
            <Button variant={dateFilter === "today" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("today")} className="text-xs">
              Today
            </Button>
            <Button variant={dateFilter === "weekly" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("weekly")} className="text-xs">
              This Week
            </Button>
            <Button variant={dateFilter === "monthly" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("monthly")} className="text-xs">
              This Month
            </Button>
            <Button variant={dateFilter === "custom" ? "default" : "outline"} size="sm" onClick={() => setDateFilter("custom")} className="text-xs">
              Custom Range
            </Button>
          </div>

          {dateFilter === "custom" && <div className="flex-wrap gap-2 flex items-center justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs justify-start", !customStartDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {customStartDate ? format(customStartDate, "MMM dd, yyyy") : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">to</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-xs justify-start", !customEndDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {customEndDate ? format(customEndDate, "MMM dd, yyyy") : "End Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>}

          {/* Metrics Display */}
          <div className="pt-3 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                <p className="text-sm font-semibold">₱{metrics.totalSales.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                <p className="text-sm font-semibold">{metrics.totalOrders}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Products Ordered</p>
                <p className="text-sm font-semibold">{metrics.totalProductsOrdered}</p>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleDownloadPdf} disabled={exportingPdf || dateFilter === "custom" && (!customStartDate || !customEndDate)} size="sm" className="w-full">
                <FileDown className="w-4 h-4 mr-2" />
                {exportingPdf ? "Exporting..." : "Download as PDF"}
              </Button>

              <Button variant="outline" onClick={handleDownloadExcel} disabled={exportingExcel || dateFilter === "custom" && (!customStartDate || !customEndDate)} size="sm" className="w-full">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                {exportingExcel ? "Exporting..." : "Download as Excel (XLSX)"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <TabsList className="inline-flex h-auto p-1 gap-1 w-max min-w-full">
              <TabsTrigger value="all" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">
                All ({filterOrdersByDate(orders).length})
              </TabsTrigger>
              <TabsTrigger value="unpaid" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">
                Unpaid ({getFilterCount('unpaid')})
              </TabsTrigger>
              <TabsTrigger value="to_ship" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">
                To Ship ({getFilterCount('to_ship')})
              </TabsTrigger>
              <TabsTrigger value="shipping" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">
                Shipping ({getFilterCount('shipping')})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">
                Completed ({getFilterCount('completed')})
              </TabsTrigger>
              <TabsTrigger value="return_cancel" className="text-xs px-3 py-2 whitespace-nowrap flex-shrink-0">
                Return & Cancel ({getFilterCount('return_cancel')})
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value={activeFilter} className="mt-4 space-y-3">
          {filteredOrders.length === 0 ? <Card className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No orders found</p>
            </Card> : filteredOrders.map(order => <Card key={order.id} className="p-4">
                <div className="space-y-3">
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">#{order.order_number}</span>
                        <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          <span className="text-xs">{getStatusLabel(order.status)}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.profiles?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">₱{order.total_amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-1 pt-2 border-t">
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {item.name} x{item.quantity}
                        </span>
                        <span className="text-muted-foreground">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>)}
                  </div>

                  {/* Admin Actions */}
                  <div className="pt-2 flex flex-wrap gap-2 justify-end">
                    {order.status === 'to_pay' && <>
                        <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'to_ship', 'Order accepted and marked as To Ship.')} disabled={updatingOrderId === order.id}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, 'cancelled', 'Order declined and moved to Return & Cancel.')} disabled={updatingOrderId === order.id}>
                          Decline
                        </Button>
                      </>}
                    {order.status === 'to_ship' && <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => generateWaybillPdf(order)} 
                          disabled={generatingWaybill === order.id}
                        >
                          <Printer className="w-3 h-3 mr-1" />
                          {generatingWaybill === order.id ? "Generating..." : "Print Waybill"}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkAsShipping(order)} 
                          disabled={updatingOrderId === order.id}
                        >
                          Ship Order
                        </Button>
                      </>}
                  </div>

                  {/* Order Date */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>
              </Card>)}
        </TabsContent>
      </Tabs>
    </div>;
};