import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
  Textarea,
} from "@windmill/react-ui";
import { FiCheck, FiUserCheck, FiX } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import ApprovalServices from "@/services/ApprovalServices";
import ClientTypeServices from "@/services/ClientTypeServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";
import useAutoRefresh from "@/hooks/useAutoRefresh";

/**
 * Customer applications waiting to be recognised.
 *
 * A shop that registers can sign in to nothing and sees no prices until it is approved here -
 * wholesale prices are per segment and confidential, so this queue is what stands between a
 * form submission and the price grid.
 *
 * The segment is editable on the row rather than only in the customer's profile: applicants
 * pick their own trade and get it wrong, and since the segment selects the price list,
 * approving a wrong one sells at the wrong price from the first order.
 */
const Approvals = () => {
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [choice, setChoice] = useState({}); // id -> clientTypeId chosen by the admin
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, allTypes] = await Promise.all([
        ApprovalServices.getPending(),
        ClientTypeServices.getAll(),
      ]);
      setRows(pending);
      setTypes(allTypes.filter((t) => t.active));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Coming back to the tab is the refresh - see the hook.
  useAutoRefresh(load);

  const approve = async (row) => {
    setBusyId(row.id);
    try {
      await ApprovalServices.approve(row.id, choice[row.id] || row.clientTypeId);
      notifySuccess(`${row.businessName} a été validé. Un e-mail lui a été envoyé.`);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      notifyError("Indiquez un motif : il est transmis au demandeur.");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await ApprovalServices.reject(rejectTarget.id, reason.trim());
      notifySuccess("Demande refusée. Le motif a été envoyé au demandeur.");
      setRejectTarget(null);
      setReason("");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setBusyId(null);
    }
  };

  const waitingSince = (createdAt) => {
    if (!createdAt) return "-";
    const days = dayjs().diff(dayjs(createdAt), "day");
    if (days === 0) return "aujourd'hui";
    return days === 1 ? "depuis 1 jour" : `depuis ${days} jours`;
  };

  return (
    <>
      <PageTitle>Demandes de compte</PageTitle>

      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <p className="max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Un commerce inscrit ne peut ni commander ni voir un seul prix tant qu'il n'est pas
          validé ici. Vérifiez le type de client avant d'accepter : c'est lui qui détermine la
          grille tarifaire appliquée dès la première commande.
        </p>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiUserCheck}
          title="Aucune demande en attente"
          description="Les nouvelles inscriptions apparaîtront ici, et vous serez notifié à chaque demande."
        />
      ) : (
        <TableContainer className="mb-8 rounded-2xl">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Commerce</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Ville</TableCell>
                <TableCell>Type de client</TableCell>
                <TableCell>Demande</TableCell>
                <TableCell className="text-right">Décision</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {row.businessName}
                    </span>
                    <span className="text-xs text-gray-400">{row.fullName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block text-sm text-gray-600 dark:text-gray-300">
                      {row.email}
                    </span>
                    <span className="text-xs text-gray-400">{row.phone}</span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{row.city || "-"}</TableCell>
                  <TableCell>
                    <Select
                      className="h-9 w-44 text-sm"
                      value={choice[row.id] ?? row.clientTypeId ?? ""}
                      onChange={(e) =>
                        setChoice({ ...choice, [row.id]: e.target.value })
                      }
                    >
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge type={dayjs().diff(dayjs(row.createdAt), "day") > 2 ? "warning" : "neutral"}>
                      {waitingSince(row.createdAt)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Two decisions of unequal weight. Approving is the expected outcome and
                        leads; refusing is deliberately quieter — the Windmill `outline` variant
                        rendered it as a wide grey slab that outweighed the primary action and
                        read as disabled. */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => approve(row)}
                        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiCheck className="h-4 w-4" />
                        {busyId === row.id ? "…" : "Valider"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => {
                          setRejectTarget(row);
                          setReason("");
                        }}
                        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <FiX className="h-4 w-4" />
                        Refuser
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
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Refuser la demande"
        subtitle={rejectTarget?.businessName}
        icon={FiX}
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="h-11 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={reject}
              disabled={!!busyId}
              className="h-11 whitespace-nowrap rounded-lg bg-red-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refuser et envoyer
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          Le motif est envoyé par e-mail au demandeur. Sans explication, il rappellera.
        </p>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex. : nous ne livrons pas encore votre ville."
          maxLength={500}
        />
      </Modal>
    </>
  );
};

export default Approvals;
