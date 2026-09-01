import requests from "./httpService";

/**
 * The customer validation queue.
 *
 * A shop that registers cannot buy - or see a single price - until someone here recognises the
 * business. Approving is therefore a commercial act, not an administrative formality.
 */
const ApprovalServices = {
  /** Pending applications, oldest first: the longest wait is the one costing goodwill. */
  getPending: async () => requests.get("/admin/customer-approvals"),

  /** Badge count, without pulling the whole queue. */
  getCount: async () => requests.get("/admin/customer-approvals/count"),

  /**
   * Let a shop in. `clientTypeId` corrects the segment the applicant picked - it selects their
   * price list, so a wrong one sells at the wrong price from the first order.
   */
  approve: async (id, clientTypeId) =>
    requests.post(`/admin/customer-approvals/${id}/approve`, { clientTypeId }),

  /** The reason is mandatory: it is e-mailed to the applicant. */
  reject: async (id, reason) =>
    requests.post(`/admin/customer-approvals/${id}/reject`, { reason }),
};

export default ApprovalServices;
