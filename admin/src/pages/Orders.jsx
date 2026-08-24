import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import {
  FiEye,
  FiShoppingBag,
  FiClock,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiCheck,
  FiXCircle,
} from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import OrderServices from "@/services/OrderServices";
import Modal from "@/components/common/Modal";
import FilterDropdown from "@/components/form/selectOption/FilterDropdown";
import Loader from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import TablePagination from "@/components/common/TablePagination";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const STATUS_BADGE = {
  Pending: "warning",
  Processing: "primary",
  "Out for Delivery": "primary",
  Delivered: "success",
  Cancel: "danger",
  Cancelled: "danger",
};
const STATUS_OPTIONS = ["Processing", "Out for Delivery", "Delivered", "Cancel"];

// The happy-path order lifecycle, in order. Rendered as a horizontal progress tracker.
const STATUS_FLOW = [
  { key: "Pending", label: "Pending", Icon: FiClock },
  { key: "Processing", label: "Processing", Icon: FiPackage },
  { key: "Out for Delivery", label: "Shipping", Icon: FiTruck },
  { key: "Delivered", label: "Delivered", Icon: FiCheckCircle },
];
const isCancelledStatus = (s) => s === "Cancel" || s === "Cancelled";

/** Horizontal lifecycle tracker — completed steps filled, current step ringed, rest muted. */
const OrderStatusTracker = ({ status }) => {
  if (isCancelledStatus(status)) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
          <FiXCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Order cancelled</p>
          <p className="text-xs text-red-500/80">This order is no longer being processed.</p>
        </div>
      </div>
    );
  }

  const current = Math.max(
    0,
    STATUS_FLOW.findIndex((s) => s.key === status)
  );

  return (
    <div className="flex items-start">
      {STATUS_FLOW.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = stage.Icon;
        return (
          <div key={stage.key} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-5 -z-0 h-0.5 w-full ${
                  i <= current ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            )}
            <span
              className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border-2 transition ${
                done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : active
                  ? "border-emerald-500 bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-500/20"
                  : "border-gray-200 bg-white text-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              {done ? <FiCheck className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span
              className={`mt-2 text-center text-xs font-medium ${
                i <= current
                  ? "text-gray-800 dark:text-gray-100"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
// Filter entries; the "All statuses" row is added by FilterDropdown itself.
const STATUS_FILTERS = [
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Out for Delivery", label: "Out for Delivery" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancel", label: "Cancelled" },
];
const LIMIT = 10;

const Orders = () => {
  const { currency } = useUtilsFunction();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalDoc, setTotalDoc] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await OrderServices.getAllOrders({ page, limit: LIMIT });
      setRows(res.orders || []);
      setTotalDoc(res.totalDoc || 0);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (row) => {
    setDetail(row);
    setNewStatus("");
    setDetailLoading(true);
    try {
      const full = await OrderServices.getOrderById(row._id);
      setDetail(full);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await OrderServices.updateOrder(detail._id, { status: newStatus });
      notifySuccess("Order status updated.");
      setDetail(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setUpdating(false);
    }
  };

  const visible = statusFilter
    ? rows.filter((r) => r.status === statusFilter)
    : rows;

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Orders</PageTitle>
        <FilterDropdown
          className="w-52"
          ariaLabel="Filter by status"
          allLabel="All statuses"
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTERS}
        />
      </div>

      {loading && rows.length === 0 ? (
        <TableSkeleton rows={8} cols={6} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="No orders yet"
          description="When customers place orders they'll appear here, newest first."
        />
      ) : (
        <TableContainer
          className={`mb-8 transition-opacity duration-200 ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Order</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Details</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold">#{row.invoice}</TableCell>
                  <TableCell className="text-sm">
                    {row.createdAt ? dayjs(row.createdAt).format("DD MMM YYYY, HH:mm") : "—"}
                  </TableCell>
                  <TableCell>{row.user_info?.name || "Client"}</TableCell>
                  <TableCell>
                    <span className="text-sm">{row.paymentMethod === "Cash" ? "COD" : row.paymentMethod}</span>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {currency}
                    {Number(row.total || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge type={STATUS_BADGE[row.status] || "neutral"}>{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
                      onClick={() => openDetail(row)}
                    >
                      <FiEye /> View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TableFooter>
            <TablePagination
              page={page}
              totalDoc={totalDoc}
              limit={LIMIT}
              onChange={setPage}
            />
          </TableFooter>
        </TableContainer>
      )}

      {/* Order detail modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Order #${detail.invoice}` : "Order"}
        subtitle={detail?.createdAt ? dayjs(detail.createdAt).format("DD MMM YYYY, HH:mm") : ""}
        icon={FiShoppingBag}
        size="lg"
        footer={
          <div className="flex w-full flex-col gap-4">
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
                Update status
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const current =
                    detail?.status === s || (s === "Cancel" && isCancelledStatus(detail?.status));
                  const selected = newStatus === s;
                  const danger = s === "Cancel";
                  const label = s === "Cancel" ? "Cancel order" : s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={current || updating}
                      onClick={() => setNewStatus(selected ? "" : s)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                        current
                          ? "cursor-default border-transparent bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                          : selected
                          ? danger
                            ? "border-red-500 bg-red-500 text-white shadow-sm"
                            : "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                          : danger
                          ? "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600 dark:border-gray-600 dark:text-gray-300"
                          : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {current && <FiCheck className="h-3.5 w-3.5" />}
                      {label}
                      {current && <span className="text-xs font-normal">· current</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
              <Button layout="outline" onClick={() => setDetail(null)}>
                Close
              </Button>
              <Button disabled={!newStatus || updating} onClick={updateStatus}>
                {updating ? "Updating…" : "Update status"}
              </Button>
            </div>
          </div>
        }
      >
        {detailLoading ? (
          <Loader label="Loading order…" />
        ) : detail ? (
          <div className="space-y-6">
            {/* Lifecycle tracker */}
            <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge type={STATUS_BADGE[detail.status] || "neutral"}>{detail.status}</Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {detail.paymentMethod === "Cash" ? "Cash on delivery" : detail.paymentMethod}
                </span>
                {detail.couponCode && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-500/10">
                    {detail.couponCode}
                  </span>
                )}
              </div>
              <OrderStatusTracker status={detail.status} />
            </div>

            {/* Delivery */}
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Delivery
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">
                {detail.user_info?.name || "Client"}
              </p>
              <p className="text-sm text-gray-500">
                {[detail.user_info?.address, detail.user_info?.city]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>

            {/* Items */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Items
              </p>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {(detail.cart || []).map((it) => (
                  <div key={it.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-700 dark:text-gray-200">
                      {it.title}
                      <span className="ml-2 text-xs text-gray-400">×{it.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {currency}
                      {Number(it.itemTotal || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal" value={`${currency}${Number(detail.subTotal || 0).toFixed(2)}`} />
              <Row label="Shipping" value={`${currency}${Number(detail.shippingCost || 0).toFixed(2)}`} />
              <Row label="Discount" value={`- ${currency}${Number(detail.discount || 0).toFixed(2)}`} />
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-base font-bold dark:border-gray-700">
                <span>Total</span>
                <span>
                  {currency}
                  {Number(detail.total || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between text-gray-500">
    <span>{label}</span>
    <span className="font-medium text-gray-700 dark:text-gray-200">{value}</span>
  </div>
);

export default Orders;
