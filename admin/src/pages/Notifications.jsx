import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiBell, FiCheck, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import NotificationServices from "@/services/NotificationServices";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const TYPE_BADGE = {
  NEW_ORDER: "success",
  NEW_CUSTOMER: "primary",
  LOW_STOCK: "warning",
  SYSTEM: "neutral",
};

// The raw enum is a database value, not a label for a human reading a feed.
const TYPE_LABEL = {
  NEW_ORDER: "Commande",
  NEW_CUSTOMER: "Client",
  LOW_STOCK: "Stock",
  SYSTEM: "Système",
};

const Notifications = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await NotificationServices.getAllNotifications(0, 50);
      setRows(res.notifications || []);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (row) => {
    try {
      await NotificationServices.updateStatusNotification(row._id);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const markAll = async () => {
    try {
      await NotificationServices.markAllRead();
      notifySuccess("Toutes les notifications ont été marquées comme lues.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const remove = async (row) => {
    try {
      await NotificationServices.deleteNotification(row._id);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const linkFor = (row) => {
    if (row.type === "NEW_ORDER" && row.orderId) return `/order/${row.orderId}`;
    if (row.type === "LOW_STOCK" && row.productId) return `/product/${row.productId}`;
    // A sign-up is actionable in the approvals queue, so the row leads there rather than to
    // a customer record with no decision on it.
    if (row.type === "NEW_CUSTOMER") return "/approvals";
    return null;
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <PageTitle>Notifications</PageTitle>
        {/* Plain button: the Windmill theme's `outline` variant carries w-full/h-12/mr-3
            (myTheme.js), which stretched this across the whole row. */}
        <button
          type="button"
          onClick={markAll}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:text-white"
        >
          <FiCheck className="h-4 w-4" />
          Tout marquer comme lu
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiBell}
          title="Aucune notification"
          description="Les nouvelles commandes et les alertes de stock apparaissent ici, en temps réel."
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Type</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const link = linkFor(row);
                return (
                  <TableRow key={row._id} className={row.read ? "opacity-60" : ""}>
                    <TableCell>
                      <Badge type={TYPE_BADGE[row.type] || "neutral"}>
                        {TYPE_LABEL[row.type] || row.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{row.title}</div>
                      <div className="text-xs text-gray-500">
                        {link ? (
                          <Link to={link} className="hover:underline text-emerald-600">
                            {row.message}
                          </Link>
                        ) : (
                          row.message
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.createdAt ? dayjs(row.createdAt).format("DD MMM, HH:mm") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge type={row.read ? "neutral" : "success"}>
                        {row.read ? "Lue" : "Non lue"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-3">
                        {!row.read && (
                          <button
                            className="text-emerald-600"
                            title="Marquer comme lue"
                            onClick={() => markRead(row)}
                          >
                            <FiCheck />
                          </button>
                        )}
                        <button
                          className="text-red-500"
                          title="Supprimer"
                          onClick={() => remove(row)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default Notifications;
