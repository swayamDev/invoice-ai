"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  RiSearchLine,
  RiAddLine,
  RiSparkling2Line,
  RiMoreLine,
  RiPencilLine,
  RiSendPlaneLine,
  RiBellLine,
  RiCheckLine,
  RiFileCopyLine,
  RiDeleteBinLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFileTextLine,
  RiLoaderLine,
  RiDownloadLine,
  RiFilterLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createClient as createSupabase } from "@/lib/supabase/client";
import type { Invoice, InvoiceStatus, Client } from "@/lib/database.types";

type InvoiceWithClient = Invoice & { clients?: Client };

const fmt = (v: number, cur = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(
    v,
  );
const fmtDate = (s: string) =>
  s
    ? new Date(s + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/8 text-white/50",
  unpaid: "bg-red-500/12 text-red-400 border border-red-500/20",
  paid: "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20",
};

const getInitials = (name: string) =>
  name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
const COLORS = [
  "bg-purple-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-emerald-500",
];
const getColor = (name: string) =>
  COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

const PER_PAGE = 10;
const STATUSES: Array<InvoiceStatus | "all"> = [
  "all",
  "unpaid",
  "paid",
  "draft",
];

export default function InvoicesPage() {
  const supabase = createSupabase();

  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAI, setShowAI] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setInvoices(data as InvoiceWithClient[]);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== "all")
      list = list.filter((i) => i.status === statusFilter);
    if (search)
      list = list.filter(
        (i) =>
          i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
          (i.clients?.name || "").toLowerCase().includes(search.toLowerCase()),
      );
    return list;
  }, [invoices, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(
    () => ({
      total: invoices.reduce((s, i) => s + i.total, 0),
      paid: invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.total, 0),
      unpaid: invoices
        .filter((i) => i.status === "unpaid")
        .reduce((s, i) => s + i.total, 0),
      count: invoices.length,
    }),
    [invoices],
  );

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    const { error } = await supabase
      .from("invoices")
      .update({
        status,
        ...(status === "paid" ? { paid_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i)),
    );
    toast.success(`Marked as ${status}`);
  };

  const duplicateInvoice = async (inv: InvoiceWithClient) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const num = String((count || 0) + 1).padStart(3, "0");
    const { data: newInv, error } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        client_id: inv.client_id,
        invoice_number: `INV-${new Date().getFullYear()}-${num}`,
        status: "draft",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: inv.due_date,
        currency: inv.currency,
        subtotal: inv.subtotal,
        tax_rate: inv.tax_rate,
        tax_amount: inv.tax_amount,
        discount: inv.discount,
        total: inv.total,
        notes: inv.notes,
        sender_name: inv.sender_name,
        sender_email: inv.sender_email,
        sender_company: inv.sender_company,
        sender_address: inv.sender_address,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to duplicate");
      return;
    }
    toast.success("Invoice duplicated as draft");
    loadInvoices();
  };

  const deleteInvoice = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", deleteId);
    if (error) {
      toast.error("Failed to delete");
      setDeleteId(null);
      return;
    }
    setInvoices((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
    toast.success("Invoice deleted");
  };

  const downloadPDF = async (inv: InvoiceWithClient) => {
    // Navigate to invoice detail with download trigger
    window.location.href = `/dashboard/invoices/${inv.id}?download=true`;
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Invoiced",
            value: fmt(stats.total),
            color: "text-white",
          },
          { label: "Paid", value: fmt(stats.paid), color: "text-emerald-400" },
          { label: "Unpaid", value: fmt(stats.unpaid), color: "text-red-400" },
          {
            label: "Total Invoices",
            value: stats.count.toString(),
            color: "text-white",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0a0a0a] border border-white/8 rounded-xl p-4"
          >
            <p className="text-white/40 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-[#0a0a0a] border-white/8 text-white placeholder:text-white/25 focus-visible:ring-0 focus:border-[#FF0A54]/40"
            />
          </div>
          {/* Status filters */}
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-[#FF0A54] text-white"
                    : "bg-[#0a0a0a] border border-white/8 text-white/50 hover:text-white hover:border-white/15"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAI(true)}
            className="gap-2 bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 hover:border-[#FF0A54]/30"
          >
            <RiSparkling2Line className="w-4 h-4 text-[#FF0A54]" />
            <span className="hidden sm:inline">Create with AI</span>
          </Button>
          <Link href="/dashboard/invoices/new">
            <Button className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white cherry-glow-sm">
              <RiAddLine className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0a0a0a] border border-white/8 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RiLoaderLine className="w-6 h-6 text-[#FF0A54] animate-spin" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 rounded-full bg-[#FF0A54]/10 flex items-center justify-center mb-4">
              <RiFileTextLine className="w-8 h-8 text-[#FF0A54]/60" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-1">
              {search || statusFilter !== "all"
                ? "No invoices found"
                : "No invoices yet"}
            </h3>
            <p className="text-white/40 text-sm mb-5">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first invoice to get started"}
            </p>
            {!search && statusFilter === "all" && (
              <Link href="/dashboard/invoices/new">
                <Button className="gap-2 bg-[#FF0A54] hover:bg-[#FF0A54]/90 text-white">
                  <RiAddLine className="w-4 h-4" /> New Invoice
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Invoice",
                    "Client",
                    "Date",
                    "Due",
                    "Amount",
                    "Status",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left py-3 px-5 text-xs text-white/30 uppercase tracking-wider font-medium"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="font-mono text-xs text-white/70 hover:text-[#FF0A54] transition-colors"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-7 h-7">
                          <AvatarFallback
                            className={`${getColor(inv.clients?.name || "")} text-white text-xs font-bold`}
                          >
                            {getInitials(inv.clients?.name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white/80 text-sm truncate max-w-28">
                          {inv.clients?.name || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-white/50 text-sm">
                      {fmtDate(inv.issue_date)}
                    </td>
                    <td className="py-4 px-5 text-white/50 text-sm">
                      {fmtDate(inv.due_date)}
                    </td>
                    <td className="py-4 px-5 text-white font-medium">
                      {fmt(inv.total, inv.currency)}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[inv.status]}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/30 hover:text-white hover:bg-white/5"
                          >
                            <RiMoreLine className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#0d0d0d] border-white/10"
                        >
                          <DropdownMenuItem
                            asChild
                            className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer"
                          >
                            <Link href={`/dashboard/invoices/${inv.id}`}>
                              <RiPencilLine className="w-4 h-4" /> View / Edit
                            </Link>
                          </DropdownMenuItem>
                          {inv.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(inv.id, "unpaid")}
                              className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer"
                            >
                              <RiSendPlaneLine className="w-4 h-4" /> Mark as
                              Sent
                            </DropdownMenuItem>
                          )}
                          {inv.status === "unpaid" && (
                            <>
                              <DropdownMenuItem className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer">
                                <RiBellLine className="w-4 h-4" /> Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(inv.id, "paid")}
                                className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer"
                              >
                                <RiCheckLine className="w-4 h-4" /> Mark as Paid
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => downloadPDF(inv)}
                            className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer"
                          >
                            <RiDownloadLine className="w-4 h-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateInvoice(inv)}
                            className="text-white/60 hover:text-white focus:text-white focus:bg-white/5 gap-2 cursor-pointer"
                          >
                            <RiFileCopyLine className="w-4 h-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/8" />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(inv.id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2 cursor-pointer"
                          >
                            <RiDeleteBinLine className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>
            Showing {(page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 gap-1"
            >
              <RiArrowLeftSLine className="w-4 h-4" /> Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm ${n === page ? "bg-[#FF0A54] text-white" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              >
                {n}
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 gap-1"
            >
              Next <RiArrowRightSLine className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-[#0a0a0a] border-red-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Invoice
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/50">
              This action cannot be undone. The invoice and all its line items
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white/60 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteInvoice}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
