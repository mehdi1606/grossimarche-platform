import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiChevronRight, FiShoppingBag } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import OrderServices from "@/services/OrderServices";
import FilterDropdown from "@/components/form/selectOption/FilterDropdown";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import TablePagination from "@/components/common/TablePagination";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError } from "@/utils/toast";
import { STATUS_FLOW, statusBadge, statusLabel } from "@/utils/orderStatus";

// Filter entries; the "Tous les statuts" row is added by FilterDropdown itself.
const STATUS_FILTERS = [
  ...STATUS_FLOW.map((s) => ({ value: s.key, label: s.label })),
  { value: "Cancel", label: "Annulée" },
];
const LIMIT = 10;

/**
 * The order list.
 *
 * Rows lead to /order/:id rather than opening a dialog. An order carries lines, totals, an
 * address, a payment method and a history - too much for a box floating over the table, and a
 * dialog cannot be linked to, printed, or left open beside anything else. The list's job is to
 * find the order; the page's job is to work on it.
 */
const Orders = () => {
  const { currency } = useUtilsFunction();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalDoc, setTotalDoc] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

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

  const visible = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Commandes</PageTitle>
        <FilterDropdown
          className="w-52"
          ariaLabel="Filtrer par statut"
          allLabel="Tous les statuts"
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
          title="Aucune commande"
          description="Les commandes de vos clients apparaîtront ici, de la plus récente à la plus ancienne."
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
                <TableCell>Commande</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Paiement</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Détails</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    {/* The number is the link: it is what an operator reads and points at. */}
                    <Link
                      to={`/order/${row._id}`}
                      className="font-semibold text-gray-700 transition hover:text-emerald-600 dark:text-gray-200"
                    >
                      #{row.invoice}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.createdAt ? dayjs(row.createdAt).format("DD MMM YYYY, HH:mm") : "-"}
                  </TableCell>
                  <TableCell>{row.user_info?.name || "Client"}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {row.paymentMethod === "Cash" ? "À la livraison" : row.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {currency}
                    {Number(row.total || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge type={statusBadge(row.status)}>{statusLabel(row.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/order/${row._id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition hover:text-emerald-700"
                    >
                      Ouvrir <FiChevronRight className="h-4 w-4" />
                    </Link>
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
    </>
  );
};

export default Orders;
