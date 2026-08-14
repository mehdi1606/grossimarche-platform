import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiEye, FiShoppingBag } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import OrderServices from "@/services/OrderServices";
import Modal from "@/components/common/Modal";
import Loader from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
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
        <div className="w-48">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancel">Cancelled</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FiShoppingBag}
          title="No orders yet"
          description="When customers place orders they'll appear here, newest first."
        />
      ) : (
        <TableContainer className="mb-8">
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
            <Pagination
              totalResults={totalDoc}
              resultsPerPage={LIMIT}
              onChange={setPage}
              label="Orders navigation"
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
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Select
                className="h-11"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Change status…</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "Cancel" ? "Cancel order" : s}
                  </option>
                ))}
              </Select>
              <Button disabled={!newStatus || updating} onClick={updateStatus}>
                {updating ? "Updating…" : "Update"}
              </Button>
            </div>
            <Button layout="outline" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        }
      >
        {detailLoading ? (
          <Loader label="Loading order…" />
        ) : detail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge type={STATUS_BADGE[detail.status] || "neutral"}>{detail.status}</Badge>
              <span className="text-sm text-gray-500">
                {detail.paymentMethod === "Cash" ? "Cash on delivery" : detail.paymentMethod}
              </span>
              {detail.couponCode && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  {detail.couponCode}
                </span>
              )}
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
