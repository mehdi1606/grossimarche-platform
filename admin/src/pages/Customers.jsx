import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiEye, FiSearch, FiSlash, FiUsers, FiCheckCircle, FiX } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import CustomerServices from "@/services/CustomerServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const Customers = () => {
  const { currency } = useUtilsFunction();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await CustomerServices.getAllCustomers({ searchText: query }));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced search, like the products list: the table follows what you type (Enter still
  // fires it immediately).
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  // Same control styling as the products list - a plain input, because the Windmill Input
  // theme base forces h-12/px-3/bg-gray-100 and overrides any utility passed in className.
  const controlCls =
    "w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:hover:border-gray-500";

  const clearSearch = () => {
    setSearch("");
    setQuery("");
  };

  const toggleBlock = async (row) => {
    try {
      await CustomerServices.updateCustomer(row._id, {
        status: row.status === "Active" ? "Inactive" : "Active",
      });
      notifySuccess(row.status === "Active" ? "Client bloqué." : "Client débloqué.");
      setDetail(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Customers</PageTitle>
      </div>

      {/* filters - same control as the products list */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim());
          }}
        >
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className={`${controlCls} pl-10 ${search ? "pr-10" : "pr-3"}`}
            placeholder="Rechercher par nom, e-mail ou téléphone…"
            aria-label="Rechercher un client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Effacer la recherche"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="Aucun client"
          description="Les clients apparaissent ici après leur première connexion à la boutique."
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Client</TableCell>
                <TableCell>Type d&apos;activité</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Commandes</TableCell>
                <TableCell>Total dépensé</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="bg-emerald-100 text-emerald-600">
                        <span className="grid h-full w-full place-items-center text-sm font-semibold">
                          {(row.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                      <span className="font-medium">{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* A pill, not plain text: the segment is a category, and it is what
                        selects the price grid the customer is charged. */}
                    {row.clientType ? (
                      <span className="inline-block whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {row.clientType}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Non défini</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{row.email || "-"}</div>
                    <div className="text-xs text-gray-400">{row.phone || ""}</div>
                  </TableCell>
                  <TableCell>{row.orderCount}</TableCell>
                  <TableCell className="font-semibold">
                    {currency}
                    {Number(row.totalSpent || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge type={row.status === "Active" ? "success" : "danger"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button
                        className="transition hover:text-emerald-600"
                        onClick={() => setDetail(row)}
                        title="Voir"
                      >
                        <FiEye />
                      </button>
                      <button
                        className={
                          row.status === "Active"
                            ? "transition hover:text-red-500"
                            : "transition hover:text-emerald-600"
                        }
                        onClick={() => toggleBlock(row)}
                        title={row.status === "Active" ? "Block" : "Unblock"}
                      >
                        {row.status === "Active" ? <FiSlash /> : <FiCheckCircle />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Customer detail modal */}
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name}
        subtitle={detail?.email || detail?.phone}
        icon={FiUsers}
        footer={
          <>
            <Button layout="outline" onClick={() => setDetail(null)}>
              Fermer
            </Button>
            <Button
              className={detail?.status === "Active" ? "!bg-red-500 hover:!bg-red-600" : ""}
              onClick={() => toggleBlock(detail)}
            >
              {detail?.status === "Active" ? "Block customer" : "Unblock"}
            </Button>
          </>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Info label="E-mail" value={detail.email || "-"} />
              <Info label="Téléphone" value={detail.phone || "-"} />
              <Info label="Orders" value={detail.orderCount} />
              <Info
                label="Total dépensé"
                value={`${currency}${Number(detail.totalSpent || 0).toFixed(2)}`}
              />
              <Info
                label="Joined"
                value={detail.createdAt ? dayjs(detail.createdAt).format("DD MMM YYYY") : "-"}
              />
              <Info label="Status" value={detail.status} />
            </div>
            <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400 dark:bg-gray-700/40">
              Customer accounts can be blocked but not deleted - account erasure is handled
              under the right-to-erasure process (loi 09-08).
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-100">{value}</p>
  </div>
);

export default Customers;
