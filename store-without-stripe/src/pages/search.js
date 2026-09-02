import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FiSearch } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import useFilter from "@hooks/useFilter";
import Loading from "@components/preloader/Loading";
import ProductServices from "@services/ProductServices";
import ProductCard from "@components/product/ProductCard";
import ProductFilters from "@components/product/ProductFilters";
import FilterDropdown from "@components/common/FilterDropdown";
import { SidebarContext } from "@context/SidebarContext";
import AttributeServices from "@services/AttributeServices";
import CategoryServices from "@services/CategoryServices";
import { safe, serverToken } from "@lib/server-token";

const Search = ({ products, attributes, categories }) => {
  const router = useRouter();
  const { isLoading, setIsLoading } = useContext(SidebarContext);
  const [visibleProduct, setVisibleProduct] = useState(18);

  useEffect(() => {
    setIsLoading(false);
  }, [products]);

  const { sortedField, setSortedField, productData } = useFilter(products);
  const queryText = router.query?.query;

  return (
    <Layout title="Recherche" description="Parcourez le catalogue Grossimarché">
      <div className="mx-auto max-w-screen-2xl px-3 py-10 sm:px-10 lg:py-12">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
              {queryText ? `Résultats pour « ${queryText} »` : "Nos produits"}
            </h1>
            {productData?.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {productData.length} produit{productData.length > 1 ? "s" : ""} trouvé
                {productData.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          {productData?.length > 0 && (
            <FilterDropdown
              className="w-full sm:w-44"
              ariaLabel="Trier les produits"
              placeholder="Trier par prix"
              value={sortedField}
              onChange={setSortedField}
              options={[
                { value: "Low", label: "Prix croissant" },
                { value: "High", label: "Prix décroissant" },
              ]}
            />
          )}
        </div>

        {/* Filters column + results */}
        <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
          <ProductFilters categories={categories?.[0]?.children || []} />

          <div>
            {isLoading ? (
              <Loading loading={isLoading} />
            ) : productData?.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-20 text-center">
                <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-gray-400">
                  <FiSearch className="text-2xl" />
                </span>
                <h2 className="font-display text-lg font-semibold text-ink-800">Aucun produit trouvé</h2>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Essayez un autre mot-clé, élargissez la fourchette de prix ou
                  réinitialisez les filtres.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                  {productData?.slice(0, visibleProduct).map((product, i) => (
                    <ProductCard key={i + 1} product={product} attributes={attributes} />
                  ))}
                </div>

                {productData?.length > visibleProduct && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setVisibleProduct((pre) => pre + 12)}
                      className="rounded-full border border-emerald-200 px-8 py-3 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
                    >
                      Voir plus
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;

export const getServerSideProps = async (context) => {
  const { query, _id, min, max, stock } = context.query;

  // See the note in pages/index.js: without the caller's token this server-side fetch asks the
  // API anonymously, and a signed-in shopper gets a catalogue with every price withheld.
  const token = await serverToken(context);

  const [data, categories, attributes] = await Promise.all([
    safe(
      ProductServices.getShowingStoreProducts({
        category: _id ? _id : "",
        title: query ? encodeURIComponent(query) : "",
        minPrice: min || "",
        maxPrice: max || "",
        inStock: stock === "1",
        token,
      }),
      { products: [] },
      "search products"
    ),
    safe(CategoryServices.getShowingCategory(), [], "search categories"),
    safe(AttributeServices.getShowingAttributes({}), [], "search attributes"),
  ]);

  return {
    props: {
      attributes: attributes || [],
      categories: categories || [],
      products: data?.products || [],
    },
  };
};
