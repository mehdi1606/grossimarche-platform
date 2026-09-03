import { Badge } from "@windmill/react-ui";

/**
 * A status badge.
 *
 * The badge used to print the raw value it was given, so English words the API stores
 * ("Pending", "Waiting for Password Reset") landed in a French back-office. The value still
 * drives the colour - it is what the rest of the code compares against - but what is shown is
 * its French label. A status with no entry here is printed as-is rather than hidden.
 */
const LABELS = {
  Pending: "En attente",
  Inactive: "Inactif",
  Active: "Actif",
  Processing: "En préparation",
  Delivered: "Livrée",
  Cancel: "Annulée",
  "Waiting for Password Reset": "Mot de passe à réinitialiser",
  "POS-Completed": "Vendue en magasin",
};

const Status = ({ status }) => {
  const label = LABELS[status] || status;

  return (
    <>
      <span className="font-serif">
        {(status === "Pending" || status === "Inactive") && (
          <Badge type="warning">{label}</Badge>
        )}
        {status === "Waiting for Password Reset" && (
          <Badge type="warning">{label}</Badge>
        )}
        {status === "Processing" && <Badge>{label}</Badge>}
        {(status === "Delivered" || status === "Active") && (
          <Badge type="success">{label}</Badge>
        )}
        {status === "Cancel" && <Badge type="danger">{label}</Badge>}
        {status === `POS-Completed` && (
          <Badge className="dark:bg-teal-900 bg-teal-100">{label}</Badge>
        )}
      </span>
    </>
  );
};

export default Status;
