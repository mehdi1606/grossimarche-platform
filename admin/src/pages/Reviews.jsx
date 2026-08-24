import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiCheck, FiMessageSquare, FiStar, FiTrash2 } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import ReviewServices from "@/services/ReviewServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const Stars = ({ value = 0 }) => {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="whitespace-nowrap" title={`${value} / 5`}>
      <span className="text-amber-400">{"★".repeat(full)}</span>
      <span className="text-gray-300">{"★".repeat(5 - full)}</span>
    </span>
  );
};

/**
 * Review moderation.
 *
 * A customer's review is saved unapproved and stays invisible in the shop until it is approved
 * here. The API for this existed from the start; nothing in the back-office ever called it, so
 * every review ever written sat pending and the storefront always showed "soyez le premier à
 * donner votre avis" — the feature looked broken when it was only unattended.
 *
 * Pending reviews lead, because they are the ones costing something by sitting there.
 */
const Reviews = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter, setFilter] = useState("pending"); // pending | approved | all

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ReviewServices.getAll({ limit: 100 });
      setRows(res.reviews);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = useMemo(
    () => rows.filter((r) => !r.approved).length,
    [rows]
  );

  const visible = useMemo(() => {
    if (filter === "pending") return rows.filter((r) => !r.approved);
    if (filter === "approved") return rows.filter((r) => r.approved);
    return rows;
  }, [rows, filter]);

  const approve = async (row) => {
    setBusyId(row.id);
    try {
      await ReviewServices.approve(row.id);
      notifySuccess("Avis publié dans la boutique.");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    try {
      await ReviewServices.remove(deleteTarget.id);
      notifySuccess("Avis supprimé.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const tab = (key, label, count) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        filter === key
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="ml-2 rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <>
      <PageTitle>Avis clients</PageTitle>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Un avis publié par un client reste invisible en boutique tant qu'il n'est pas
          approuvé ici.
        </p>
        <div className="flex items-center gap-1">
          {tab("pending", "En attente", pendingCount)}
          {tab("approved", "Publiés", 0)}
          {tab("all", "Tous", 0)}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FiMessageSquare}
          title={filter === "pending" ? "Aucun avis en attente" : "Aucun avis"}
          description={
            filter === "pending"
              ? "Tous les avis reçus ont été traités."
              : "Les avis laissés par vos clients apparaîtront ici."
          }
        />
      ) : (
        <TableContainer className="mb-8 rounded-2xl">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Produit</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Commentaire</TableCell>
                <TableCell>Date</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {row.productName || "—"}
                    </span>
                    {!row.approved && (
                      <Badge type="warning" className="ml-2">
                        En attente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {row.authorName || "Client"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Stars value={row.rating} />
                  </TableCell>
                  <TableCell>
                    <p className="max-w-md text-sm text-gray-600 dark:text-gray-300">
                      {row.comment || (
                        <span className="text-gray-300">Sans commentaire</span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-400">
                      {row.createdAt ? dayjs(row.createdAt).format("DD MMM YYYY") : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      {!row.approved && (
                        <button
                          className="transition hover:text-emerald-600 disabled:opacity-40"
                          onClick={() => approve(row)}
                          disabled={busyId === row.id}
                          title="Publier cet avis"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        className="transition hover:text-red-500"
                        onClick={() => setDeleteTarget(row)}
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'avis"
        icon={FiStar}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Supprimer définitivement l'avis de{" "}
          <span className="font-semibold">{deleteTarget?.authorName || "ce client"}</span>{" "}
          sur « {deleteTarget?.productName} » ?
        </p>
      </Modal>
    </>
  );
};

export default Reviews;
