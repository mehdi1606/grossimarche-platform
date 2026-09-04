import { useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { IoBagHandle } from "react-icons/io5";
import ReactPaginate from "react-paginate";
import { useQuery } from "@tanstack/react-query";

//internal import
import Dashboard from "@pages/user/dashboard";
import OrderServices from "@services/OrderServices";
import Loading from "@components/preloader/Loading";
import useUtilsFunction from "@hooks/useUtilsFunction";
import OrderCard from "@components/order/OrderCard";
import { SidebarContext } from "@context/SidebarContext";
import CMSkeletonTwo from "@components/preloader/CMSkeletonTwo";

const PAGE_SIZE = 10;

const MyOrders = () => {
  const { t } = useTranslation();
  const { currentPage, handleChangePage, isLoading, setIsLoading } =
    useContext(SidebarContext);

  const { currency } = useUtilsFunction();

  const {
    data,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ["orders", { currentPage }],
    queryFn: async () =>
      await OrderServices.getOrderCustomer({
        limit: PAGE_SIZE,
        page: currentPage,
      }),
  });

  // Paginate on the page size actually requested - this used to divide by 8 while asking the
  // API for 10, so the last page(s) of a long history were unreachable.
  const pageCount = Math.ceil((data?.totalDoc || 0) / PAGE_SIZE);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loading loading={isLoading} />
      ) : (
        <Dashboard
          title="Mes commandes"
          description="Suivez et retrouvez toutes vos commandes Grossimarché"
        >
          <div className="overflow-hidden">
            <h2 className="mb-6 font-display text-xl font-semibold text-ink-900">
              {t("account.my_orders")}
            </h2>

            {loading ? (
              <CMSkeletonTwo count={20} width={100} error={error} loading={loading} />
            ) : data?.orders?.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
                <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-3xl text-emerald-500">
                  <IoBagHandle />
                </span>
                <h2 className="font-display text-lg font-semibold text-ink-800">
                  {t("account.no_orders_title")}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-ink-500">
                  {t("account.no_orders_text")}
                </p>
                <Link
                  href="/search"
                  className="mt-6 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  {t("account.no_orders_cta")}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.orders?.map((order) => (
                  <OrderCard key={order._id} order={order} currency={currency} />
                ))}
              </div>
            )}

            {pageCount > 1 && (
              <div className="paginationOrder mt-6">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel="Suivant"
                  onPageChange={(e) => handleChangePage(e.selected + 1)}
                  pageRangeDisplayed={3}
                  pageCount={pageCount}
                  previousLabel="Précédent"
                  renderOnZeroPageCount={null}
                  pageClassName="page--item"
                  pageLinkClassName="page--link"
                  previousClassName="page-item"
                  previousLinkClassName="page-previous-link"
                  nextClassName="page-item"
                  nextLinkClassName="page-next-link"
                  breakClassName="page--item"
                  breakLinkClassName="page--link"
                  containerClassName="pagination"
                  activeClassName="activePagination"
                  forcePage={currentPage - 1} // Sync UI with currentPage
                />
              </div>
            )}
          </div>
        </Dashboard>
      )}
    </>
  );
};

export default MyOrders;
