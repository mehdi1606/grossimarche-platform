import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiEye, FiSearch, FiSlash, FiUsers, FiCheckCircle } from "react-icons/fi";
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

  const toggleBlock = async (row) => {
    try {
      await CustomerServices.updateCustomer(row._id, {
        status: row.status === "Active" ? "Inactive" : "Active",
      });
      notifySuccess(row.status === "Active" ? "Customer blocked." : "Customer unblocked.");
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

      <form
        className="relative mb-5 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search);
        }}
      >
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          className="!pl-10 h-11 rounded-lg"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="No customers yet"
          description="Shoppers appear here after their first sign-in on the storefront."
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell>Total spent</TableCell>
                <TableCell>Status</TableCell>
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
                    <div className="text-sm">{row.email || "—"}</div>
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
                        title="View"
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
              Close
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
              <Info label="Email" value={detail.email || "—"} />
              <Info label="Phone" value={detail.phone || "—"} />
              <Info label="Orders" value={detail.orderCount} />
              <Info
                label="Total spent"
                value={`${currency}${Number(detail.totalSpent || 0).toFixed(2)}`}
              />
              <Info
                label="Joined"
                value={detail.createdAt ? dayjs(detail.createdAt).format("DD MMM YYYY") : "—"}
              />
              <Info label="Status" value={detail.status} />
            </div>
            <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400 dark:bg-gray-700/40">
              Customer accounts can be blocked but not deleted — account erasure is handled
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
