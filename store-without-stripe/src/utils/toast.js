import { ToastContainer, toast } from "react-toastify";
import { FiAlertTriangle, FiCheck, FiInfo, FiX } from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

// Shared behaviour for every toast; the look lives in styles/custom.css (.Toastify__* +
// .gm-toast-chip), so all four variants stay consistent with the rest of the site.
const BASE = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Default toastify icons are solid filled circles; a line icon inside a soft tinted chip
// matches the cards and buttons used everywhere else.
const chip = (Icon, tone) => (
  <span className={`gm-toast-chip gm-toast-chip--${tone}`}>
    <Icon />
  </span>
);

const notifySuccess = (message) =>
  toast.success(message, { ...BASE, icon: chip(FiCheck, "success") });

const notifyError = (message) =>
  toast.error(message, { ...BASE, icon: chip(FiX, "error") });

const notifyWarning = (message) =>
  toast.warning(message, { ...BASE, icon: chip(FiAlertTriangle, "warning") });

const notifyInfo = (message) =>
  toast.info(message, { ...BASE, icon: chip(FiInfo, "info") });

export { ToastContainer, notifySuccess, notifyError, notifyWarning, notifyInfo };
